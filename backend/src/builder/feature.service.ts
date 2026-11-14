import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  ClientPermission, PortfolioAudit, PortfolioClient, PortfolioFeatureRequest, PortfolioRequest,
} from './portfolio-request.entity';
import { FeatureDecisionDto, FeatureRequestDto } from './builder.dto';
import { ClientAuthService } from './client-auth.service';
import { EmailService } from '../ai-tools/email.service';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const FEATURE_LABEL: Record<string, string> = {
  pending: 'Waiting for review', approved: 'Approved', rejected: 'Not taken on', done: 'Built and live',
};
/** A client may have this many requests still waiting, so the queue stays usable. */
const MAX_OPEN = 8;

/**
 * Client-side features behind the admin's permission grants, plus the
 * request-a-feature queue. Nothing here trusts the browser: every call
 * resolves the session server-side and checks the stored permission list.
 */
@Injectable()
export class FeatureService {
  private readonly log = new Logger(FeatureService.name);

  constructor(
    @InjectRepository(PortfolioFeatureRequest) private readonly features: Repository<PortfolioFeatureRequest>,
    @InjectRepository(PortfolioRequest) private readonly requests: Repository<PortfolioRequest>,
    @InjectRepository(PortfolioClient) private readonly clients: Repository<PortfolioClient>,
    @InjectRepository(PortfolioAudit) private readonly audits: Repository<PortfolioAudit>,
    private readonly auth: ClientAuthService,
    private readonly mail: EmailService,
    private readonly cfg: ConfigService,
  ) {}

  private get site() { return this.cfg.get<string>('FRONTEND_URL') ?? 'https://karan-portfolio-six-sigma.vercel.app'; }
  private get adminEmail() { return this.cfg.get<string>('SMTP_USER') ?? 'kk0888176@gmail.com'; }

  /** Resolves the session, loads its one request and checks a permission. */
  private async gate(token: string | undefined, need?: ClientPermission) {
    const client = await this.auth.bySession(token);
    const req = await this.requests.findOneBy({ id: client.requestId });
    if (!req) throw new NotFoundException('No portfolio is attached to this account.');
    if (need && !(req.permissions ?? []).includes(need)) {
      throw new ForbiddenException('Karan has not switched this on for your account yet. Ask for it under "Request a feature".');
    }
    return { client, req };
  }

  /* ── Client ─────────────────────────────────────────────── */

  /** The client's own feature requests, newest first. */
  async mine(token?: string) {
    const { req } = await this.gate(token);
    const items = await this.features.find({ where: { requestId: req.id }, order: { createdAt: 'DESC' }, take: 50 });
    return { permissions: req.permissions ?? [], items };
  }

  async create(token: string | undefined, dto: FeatureRequestDto) {
    const { req } = await this.gate(token, 'request_features');
    const open = await this.features.countBy({ requestId: req.id, status: 'pending' });
    if (open >= MAX_OPEN) throw new BadRequestException(`You already have ${MAX_OPEN} requests waiting. Karan will work through those first.`);
    const saved = await this.features.save(this.features.create({
      requestId: req.id, email: req.email, title: dto.title.trim(),
      details: dto.details?.trim() || null, moduleId: dto.moduleId?.trim() || null, status: 'pending',
    }));
    await this.record(req.id, 'client', 'feature.requested', `#${saved.id} ${saved.title}`);
    await this.notifyAdmin(req, saved);
    return saved;
  }

  /** Withdraws a request that has not been decided yet. */
  async cancel(token: string | undefined, id: number) {
    const { req } = await this.gate(token, 'request_features');
    const f = await this.features.findOneBy({ id, requestId: req.id });
    if (!f) throw new NotFoundException('No such request.');
    if (f.status !== 'pending') throw new BadRequestException('This one has already been decided.');
    await this.features.delete({ id: f.id, requestId: req.id });
    await this.record(req.id, 'client', 'feature.withdrawn', `#${id} ${f.title}`);
    return { ok: true };
  }

  /** Everything this client's portfolio holds, as JSON they can keep. */
  async exportData(token?: string) {
    const { client, req } = await this.gate(token, 'download_data');
    const items = await this.features.find({ where: { requestId: req.id }, order: { createdAt: 'ASC' } });
    const { adminNotes, paymentLinkId, ...request } = req;
    await this.record(req.id, 'client', 'data.exported', null);
    return {
      exportedAt: new Date().toISOString(),
      account: { email: client.email, lastLoginAt: client.lastLoginAt },
      request,
      featureRequests: items.map(({ adminNote, ...f }) => ({ ...f, adminNote })),
    };
  }

  /** Details the client is allowed to change themselves, when granted. */
  async editContent(token: string | undefined, patch: { headline?: string; about?: string; links?: { label: string; url: string }[]; skills?: string[] }) {
    const { req } = await this.gate(token, 'edit_content');
    if (patch.headline !== undefined) req.headline = patch.headline.slice(0, 160) || null;
    if (patch.about !== undefined) req.about = patch.about.slice(0, 4000) || null;
    if (Array.isArray(patch.links)) {
      req.links = patch.links.slice(0, 10)
        .filter(l => l && typeof l.url === 'string' && /^https?:\/\//i.test(l.url))
        .map(l => ({ label: String(l.label ?? '').slice(0, 40), url: l.url.slice(0, 300) }));
    }
    if (Array.isArray(patch.skills)) req.skills = patch.skills.slice(0, 40).map(s => String(s).slice(0, 40)).filter(Boolean);
    const saved = await this.requests.save(req);
    await this.record(req.id, 'client', 'content.edited', Object.keys(patch).join(', '));
    const { adminNotes, paymentLinkId, ...view } = saved;
    return view;
  }

  /** Ends every session for this client, on every device. */
  async signOutEverywhere(token?: string) {
    const { client, req } = await this.gate(token);
    client.sessionHash = null; client.sessionExpires = null;
    await this.clients.save(client);
    await this.record(req.id, 'client', 'sessions.cleared', null);
    return { ok: true };
  }

  /* ── Admin ──────────────────────────────────────────────── */

  adminList(status?: string) {
    return this.features.find({
      where: status ? { status: status as PortfolioFeatureRequest['status'] } : {},
      order: { status: 'ASC', createdAt: 'DESC' }, take: 300,
    });
  }

  /** Approves, rejects or closes a request; approving a module request grants that module. */
  async decide(id: number, dto: FeatureDecisionDto) {
    const f = await this.features.findOneBy({ id });
    if (!f) throw new NotFoundException('No such request.');
    f.status = dto.status as PortfolioFeatureRequest['status'];
    if (dto.price !== undefined) f.price = dto.price;
    if (dto.adminNote !== undefined) f.adminNote = dto.adminNote || null;
    f.decidedAt = new Date();
    const saved = await this.features.save(f);

    const req = await this.requests.findOneBy({ id: f.requestId });
    if (req && f.moduleId && (dto.status === 'approved' || dto.status === 'done')) {
      const mods = new Set([...(req.approvedModules ?? []), f.moduleId]);
      req.approvedModules = [...mods];
      await this.requests.save(req);
    }
    await this.record(f.requestId, 'admin', `feature.${dto.status}`, `#${f.id} ${f.title}`);
    if (dto.notify && req) await this.notifyClient(req, saved);
    return saved;
  }

  /** The audit trail, newest first; the admin's record of who changed what. */
  auditTrail(requestId?: number) {
    return this.audits.find({ where: requestId ? { requestId } : {}, order: { createdAt: 'DESC' }, take: 200 });
  }

  /** Counts for the admin dashboard. */
  async stats() {
    const rows = await this.features.createQueryBuilder('f')
      .select('f.status', 'status').addSelect('COUNT(*)', 'n').groupBy('f.status').getRawMany<{ status: string; n: string }>();
    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = Number(r.n);
    return { total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus, pending: byStatus['pending'] ?? 0 };
  }

  async record(requestId: number | null, actor: 'admin' | 'client' | 'system', action: string, detail: string | null) {
    try { await this.audits.save(this.audits.create({ requestId, actor, action, detail })); }
    catch (e) { this.log.warn(`Audit write failed: ${(e as Error).message}`); }
  }

  /* ── Email ──────────────────────────────────────────────── */

  private async notifyAdmin(req: PortfolioRequest, f: PortfolioFeatureRequest) {
    await this.send(this.adminEmail, `Feature request from ${req.name}: ${f.title}`,
      `<p><strong>${esc(req.name)}</strong> (${esc(req.email)}, request #${req.id}) asked for:</p>
       <p style="font-weight:600">${esc(f.title)}</p>
       ${f.details ? `<p>${esc(f.details)}</p>` : ''}
       ${f.moduleId ? `<p style="color:#6b7280;font-size:13px">Module: ${esc(f.moduleId)}</p>` : ''}
       <p><a href="${this.site}/admin">Review it in Admin →</a></p>`);
  }

  private async notifyClient(req: PortfolioRequest, f: PortfolioFeatureRequest) {
    await this.send(req.email, `Your request "${f.title}" is ${FEATURE_LABEL[f.status].toLowerCase()}`,
      `<p>Hi ${esc(req.name)},</p>
       <p>Your request <strong>${esc(f.title)}</strong> is now: <strong>${esc(FEATURE_LABEL[f.status])}</strong>.</p>
       ${f.price ? `<p>One-time cost for this change: <strong>₹${f.price.toLocaleString('en-IN')}</strong>.</p>` : ''}
       ${f.adminNote ? `<p>${esc(f.adminNote)}</p>` : ''}
       <p><a href="${this.site}/client">Open your dashboard →</a></p>`);
  }

  private async send(to: string, subject: string, inner: string) {
    try {
      await this.mail.sendHtml(to, subject,
        `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1b1d21;max-width:560px">${inner}<p style="color:#6b7280;font-size:13px">Karan Kapoor · ${this.site}</p></div>`);
    } catch (e) {
      this.log.warn(`Email to ${to} failed: ${(e as Error).message}`);
    }
  }
}
