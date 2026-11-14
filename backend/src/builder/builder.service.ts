import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { PortfolioAudit, PortfolioRequest, BUILDER_DDL, DEFAULT_PERMISSIONS } from './portfolio-request.entity';
import { ClientAuthService } from './client-auth.service';
import { AdminUpdateDto, RequestDto } from './builder.dto';
import { CrewService } from '../newsletter/crew.service';
import { EmailService } from '../ai-tools/email.service';
import { PaymentService } from '../payment/payment.service';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const EDITABLE = ['submitted', 'approved', 'quoted'];
const STATUS_COPY: Record<string, string> = {
  approved: 'Your portfolio request is approved',
  rejected: 'About your portfolio request',
  quoted: 'Your quote is ready',
  paid: 'Payment received, thank you',
  building: 'Your portfolio is being built',
  live: 'Your portfolio is live',
  cancelled: 'Your portfolio request was closed',
};

/**
 * "Get a portfolio like this": visitors sign in with a crew email code,
 * describe themselves and pick modules; the admin reviews, sets a one-time
 * price, sends a payment link, and moves the request through to live.
 */
@Injectable()
export class BuilderService implements OnModuleInit {
  private readonly log = new Logger(BuilderService.name);

  constructor(
    @InjectRepository(PortfolioRequest) private readonly repo: Repository<PortfolioRequest>,
    @InjectRepository(PortfolioAudit) private readonly audits: Repository<PortfolioAudit>,
    private readonly ds: DataSource,
    private readonly crew: CrewService,
    private readonly mail: EmailService,
    private readonly payments: PaymentService,
    private readonly cfg: ConfigService,
    private readonly clientAuth: ClientAuthService,
  ) {}

  /* Production runs without TypeORM synchronize, so the table is created here. */
  async onModuleInit() {
    try { for (const q of BUILDER_DDL) await this.ds.query(q); }
    catch (e) { this.log.warn(`Could not ensure portfolio_requests: ${(e as Error).message}`); }
  }

  private get site() { return this.cfg.get<string>('FRONTEND_URL') ?? 'https://karan-portfolio-six-sigma.vercel.app'; }
  private get adminEmail() { return this.cfg.get<string>('SMTP_USER') ?? 'kk0888176@gmail.com'; }

  /* ── Client side ─────────────────────────────────────── */

  async mine(token?: string) {
    const me = await this.crew.identify(token);
    const rows = await this.repo.find({ where: { email: me.email }, order: { createdAt: 'DESC' } });
    return rows.map(r => this.clientView(r));
  }

  async create(token: string | undefined, dto: RequestDto) {
    const me = await this.crew.identify(token);
    const open = await this.repo.count({ where: { email: me.email } });
    if (open >= 5) throw new BadRequestException('You already have five requests. Edit one of those instead.');
    const row = await this.repo.save(this.repo.create({ ...this.clean(dto), email: me.email, status: 'submitted' }));
    void this.notifyAdmin(row);
    void this.send(row.email, 'We got your portfolio request',
      `<p>Hi ${esc(row.name)},</p><p>Thanks for asking for a portfolio. Karan will look at what you sent and reply with a one-time price for the modules you need. Hosting and deployment are included.</p>`);
    return this.clientView(row);
  }

  async update(token: string | undefined, id: number, dto: RequestDto) {
    const row = await this.own(token, id);
    if (!EDITABLE.includes(row.status)) throw new BadRequestException('This request is already being worked on, so it can no longer be edited.');
    Object.assign(row, this.clean(dto));
    if (row.status === 'quoted') { row.status = 'approved'; row.quoteAmount = null; } // a changed scope needs a fresh quote
    return this.clientView(await this.repo.save(row));
  }

  async accept(token: string | undefined, id: number) {
    const row = await this.own(token, id);
    if (row.status !== 'quoted') throw new BadRequestException('There is no quote to accept yet.');
    row.status = 'accepted';
    await this.repo.save(row);
    void this.send(this.adminEmail, `Quote accepted: ${row.name}`,
      `<p>${esc(row.name)} (${esc(row.email)}) accepted the ₹${row.quoteAmount} quote. Send a payment link from Admin → Portfolio builder.</p>`);
    return this.clientView(row);
  }

  async cancel(token: string | undefined, id: number) {
    const row = await this.own(token, id);
    if (['paid', 'building', 'live'].includes(row.status)) throw new BadRequestException('Paid requests can only be cancelled by email.');
    row.status = 'cancelled';
    return this.clientView(await this.repo.save(row));
  }

  /* ── Admin side ──────────────────────────────────────── */

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  async adminUpdate(id: number, dto: AdminUpdateDto) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException();
    const before = row.status;
    const { notify, ...patch } = dto;
    if (patch.quoteAmount !== undefined && before === 'submitted' && patch.status !== 'approved')
      throw new BadRequestException('Approve the request before sending a quote.');
    if (patch.status && ['building', 'live'].includes(patch.status) && !row.paidAt)
      throw new BadRequestException('Confirm the payment before starting the build.');
    const permsBefore = (row.permissions ?? []).join(',');
    Object.assign(row, patch);
    if (patch.permissions) row.permissions = [...new Set(patch.permissions)];
    if (patch.status === 'approved' && !row.approvedAt) row.approvedAt = new Date();
    // Pricing an approved request is what "sending a quote" means.
    if (patch.quoteAmount !== undefined && row.status === 'approved' && !patch.status) row.status = 'quoted';
    const saved = await this.repo.save(row);
    if (['rejected', 'cancelled'].includes(saved.status)) await this.clientAuth.revoke(saved.email);
    if (saved.status !== before) void this.audit(saved.id, `status.${saved.status}`, `from ${before}`);
    if ((saved.permissions ?? []).join(',') !== permsBefore) void this.audit(saved.id, 'permissions.set', (saved.permissions ?? []).join(', ') || 'none');
    if (notify !== false && saved.status !== before && STATUS_COPY[saved.status]) void this.statusEmail(saved);
    return saved;
  }

  async paymentLink(id: number) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException();
    if (!row.quoteAmount) throw new BadRequestException('Set a quote amount first.');
    if (!row.approvedAt) throw new BadRequestException('Approve the request first.');
    const link = await this.payments.createPaymentLink({
      amount: row.quoteAmount * 100,
      description: `Portfolio build (${row.approvedModules.length || row.modules.length} modules, one-time)`,
      customerName: row.name, customerEmail: row.email, customerPhone: row.phone ?? undefined,
    });
    row.paymentUrl = link.url; row.paymentLinkId = link.id;
    if (row.status === 'quoted') row.status = 'accepted';
    return this.repo.save(row);
  }

  /** Confirms the payment against Razorpay itself; only a paid link for the full quote counts. */
  async verifyPayment(id: number) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException();
    if (!row.paymentLinkId) throw new BadRequestException('No Razorpay link was sent for this request.');
    const st = await this.payments.fetchPaymentLink(row.paymentLinkId);
    if (st.status !== 'paid' || st.amountPaid < (row.quoteAmount ?? 0) * 100)
      return { confirmed: false, razorpayStatus: st.status, request: row };
    return { confirmed: true, razorpayStatus: st.status, request: await this.confirmPaid(row, st.paymentId ?? row.paymentLinkId) };
  }

  /** For a payment received outside Razorpay (UPI, bank): the admin confirms it with a reference. */
  async markPaid(id: number, reference: string) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException();
    if (!row.approvedAt || !row.quoteAmount) throw new BadRequestException('Approve and quote the request first.');
    return this.confirmPaid(row, `manual: ${reference.trim()}`);
  }

  async resendCredentials(id: number) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException();
    if (!row.paidAt) throw new BadRequestException('Credentials are only issued after the payment is confirmed.');
    await this.clientAuth.issueCredentials(row);
    row.credentialsSentAt = new Date();
    return this.repo.save(row);
  }

  /** The only way a request becomes paid; it is also what issues the client's sign-in. */
  private async confirmPaid(row: PortfolioRequest, ref: string) {
    if (row.paidAt) return row;
    row.status = 'paid'; row.paidAt = new Date(); row.paymentRef = ref.slice(0, 120);
    // A paying client starts with the safe basics; the admin opens up the rest.
    if (!(row.permissions ?? []).length) row.permissions = [...DEFAULT_PERMISSIONS];
    await this.repo.save(row);
    void this.audit(row.id, 'payment.confirmed', row.paymentRef);
    void this.statusEmail(row);
    await this.clientAuth.issueCredentials(row);
    row.credentialsSentAt = new Date();
    return this.repo.save(row);
  }

  async stats() {
    const rows = await this.repo.find({ select: { status: true, quoteAmount: true } });
    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const sum = (states: string[]) => rows.filter(r => states.includes(r.status)).reduce((s, r) => s + (r.quoteAmount ?? 0), 0);
    return { total: rows.length, byStatus, bookedInr: sum(['paid', 'building', 'live']), pipelineInr: sum(['quoted', 'accepted']) };
  }

  /* ── Helpers ─────────────────────────────────────────── */

  private async audit(requestId: number, action: string, detail: string | null) {
    try { await this.audits.save(this.audits.create({ requestId, actor: 'admin', action, detail })); }
    catch (e) { this.log.warn(`Audit write failed: ${(e as Error).message}`); }
  }

  private async own(token: string | undefined, id: number) {
    const me = await this.crew.identify(token);
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException();
    if (row.email !== me.email) throw new ForbiddenException();
    return row;
  }

  private clean(dto: RequestDto): Partial<PortfolioRequest> {
    return {
      name: dto.name.trim(), phone: dto.phone?.trim() || null, profession: dto.profession?.trim() || null,
      headline: dto.headline?.trim() || null, about: dto.about?.trim() || null,
      links: dto.links ?? [], skills: (dto.skills ?? []).map(s => s.trim()).filter(Boolean),
      projects: dto.projects ?? [], modules: [...new Set(dto.modules)],
      style: dto.style || null, domain: dto.domain?.trim() || null, notes: dto.notes?.trim() || null,
    };
  }

  /** What the client may see: everything except the admin's private notes. */
  private clientView(r: PortfolioRequest) {
    const { adminNotes, paymentLinkId, ...rest } = r;
    return rest;
  }

  private notifyAdmin(r: PortfolioRequest) {
    return this.send(this.adminEmail, `New portfolio request: ${r.name}`,
      `<p><b>${esc(r.name)}</b> (${esc(r.email)}${r.phone ? ', ' + esc(r.phone) : ''}) wants a portfolio.</p>
       <p>${esc(r.profession ?? '')}${r.headline ? ' · ' + esc(r.headline) : ''}</p>
       <p>Modules: ${r.modules.map(esc).join(', ') || 'none picked'}</p>
       <p><a href="${this.site}/admin">Open Admin → Portfolio builder</a></p>`);
  }

  private statusEmail(r: PortfolioRequest) {
    const lines: Record<string, string> = {
      approved: 'Karan has approved your request and is working out the price for the modules you picked. The quote will follow by email.',
      rejected: `Karan cannot take this request on right now.${r.quoteNote ? `</p><p>${esc(r.quoteNote)}` : ''}`,
      quoted: `Karan has reviewed your request. The one-time price is <b>₹${r.quoteAmount ?? '-'}</b>, covering the build, hosting and deployment.${r.quoteNote ? `</p><p>${esc(r.quoteNote)}` : ''}`,
      paid: 'Your payment is confirmed and work on your portfolio starts now. A separate email has a secure link to set up your client sign-in.',
      building: 'Your portfolio is in progress. You will get another email when it goes live.',
      live: `Your portfolio is live${r.liveUrl ? `: <a href="${esc(r.liveUrl)}">${esc(r.liveUrl)}</a>` : '.'}`,
      cancelled: 'This request has been closed. Reply to this email if that is a mistake.',
    };
    return this.send(r.email, STATUS_COPY[r.status],
      `<p>Hi ${esc(r.name)},</p><p>${lines[r.status]}</p><p><a href="${this.site}/build">See your request</a></p>`);
  }

  private async send(to: string, subject: string, inner: string) {
    try {
      await this.mail.sendHtml(to, subject,
        `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1b1d21;max-width:560px">${inner}<p style="color:#6b7280;font-size:13px">Karan Kapoor · ${this.site}</p></div>`);
    } catch (e) { this.log.warn(`Email to ${to} failed: ${(e as Error).message}`); }
  }
}
