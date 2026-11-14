import { BadRequestException, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, IsNull, Repository } from 'typeorm';
import { createHash, randomBytes, randomInt } from 'crypto';
import { NewsletterSubscriber } from './newsletter.entity';
import { EmailService } from '../ai-tools/email.service';

export const CREW_TOPICS = ['projects', 'blog', 'kits'] as const;
const CODE_TTL_MS = 10 * 60_000;
const MAX_TRIES = 5;

const sha = (v: string) => createHash('sha256').update(v).digest('hex');
const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * "Mission crew": visitors sign in with a 6-digit code sent to their email,
 * pick which updates they want, and receive broadcasts Karan sends from the
 * admin panel. Built on the existing newsletter_subscribers table.
 */
@Injectable()
export class CrewService implements OnModuleInit {
  private readonly log = new Logger(CrewService.name);
  private sending = false;

  constructor(
    @InjectRepository(NewsletterSubscriber) private readonly repo: Repository<NewsletterSubscriber>,
    private readonly ds: DataSource,
    private readonly mail: EmailService,
    private readonly cfg: ConfigService,
  ) {}

  /* Production runs without TypeORM synchronize, so the crew columns are
     added here, idempotently, the first time this build boots. */
  async onModuleInit() {
    const cols = [
      `"name" varchar(80)`, `"verified" boolean NOT NULL DEFAULT false`, `"codeHash" varchar(64)`, `"codeExpires" timestamptz`,
      `"codeTries" integer NOT NULL DEFAULT 0`, `"sessionHash" varchar(64)`, `"unsubToken" varchar(64)`,
      `"topics" varchar(120) NOT NULL DEFAULT 'projects,blog,kits'`, `"unsubscribedAt" timestamptz`, `"lastLoginAt" timestamptz`,
    ];
    try {
      for (const c of cols) await this.ds.query(`ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS ${c}`);
    } catch (e) {
      this.log.warn(`Could not ensure crew columns: ${(e as Error).message}`);
    }
  }

  private get site() { return this.cfg.get<string>('FRONTEND_URL') ?? 'https://karan-portfolio-six-sigma.vercel.app'; }
  private get api() { return this.cfg.get<string>('PUBLIC_API_URL') ?? 'https://karan-portfolio-api.onrender.com/api'; }

  /** Step 1: create or find the member and email them a sign-in code. */
  async start(emailRaw: string, name?: string) {
    const email = emailRaw.trim().toLowerCase();
    let m = await this.repo.findOne({ where: { email } });
    if (!m) m = this.repo.create({ email, source: 'crew' });
    if (name?.trim()) m.name = name.trim().slice(0, 80);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    m.codeHash = sha(code);
    m.codeExpires = new Date(Date.now() + CODE_TTL_MS);
    m.codeTries = 0;
    await this.repo.save(m);
    await this.mail.sendHtml(email, `${code} — your Mission Control sign-in code`, this.codeHtml(code, m.name), true);
    return { ok: true };
  }

  /** Step 2: check the code; on success return a session token for the browser. */
  async verify(emailRaw: string, code: string) {
    const email = emailRaw.trim().toLowerCase();
    const m = await this.repo.createQueryBuilder('m').addSelect(['m.codeHash', 'm.codeExpires', 'm.codeTries', 'm.unsubToken'])
      .where('m.email = :email', { email }).getOne();
    if (!m?.codeHash || !m.codeExpires) throw new BadRequestException('Request a new code first.');
    if (m.codeTries >= MAX_TRIES) throw new BadRequestException('Too many attempts. Request a new code.');
    if (m.codeExpires.getTime() < Date.now()) throw new BadRequestException('That code expired. Request a new one.');
    if (sha(code.trim()) !== m.codeHash) {
      await this.repo.update(m.id, { codeTries: m.codeTries + 1 });
      throw new BadRequestException('That code is not right.');
    }
    const token = randomBytes(32).toString('hex');
    await this.repo.update(m.id, {
      verified: true, codeHash: null, codeExpires: null, codeTries: 0, sessionHash: sha(token),
      unsubToken: m.unsubToken ?? randomBytes(24).toString('hex'), unsubscribedAt: null, lastLoginAt: new Date(),
    });
    return { token, member: await this.public(m.id) };
  }

  async me(token?: string) { return this.public((await this.byToken(token)).id); }

  async update(token: string | undefined, patch: { name?: string; topics?: string[]; subscribed?: boolean }) {
    const m = await this.byToken(token);
    const next: Partial<NewsletterSubscriber> = {};
    if (patch.name !== undefined) next.name = patch.name.trim().slice(0, 80) || null;
    if (patch.topics) next.topics = patch.topics.filter(t => (CREW_TOPICS as readonly string[]).includes(t)).join(',');
    if (patch.subscribed !== undefined) next.unsubscribedAt = patch.subscribed ? null : new Date();
    await this.repo.update(m.id, next);
    return this.public(m.id);
  }

  async logout(token?: string) {
    const m = await this.byToken(token);
    await this.repo.update(m.id, { sessionHash: null });
    return { ok: true };
  }

  /** Deletes the member entirely. */
  async remove(token?: string) {
    const m = await this.byToken(token);
    await this.repo.delete(m.id);
    return { ok: true };
  }

  /** One-click unsubscribe from an email link. */
  async unsubscribe(unsubToken: string) {
    if (!unsubToken || unsubToken.length < 20) return false;
    const m = await this.repo.createQueryBuilder('m').where('m.unsubToken = :t', { t: unsubToken }).getOne();
    if (!m) return false;
    await this.repo.update(m.id, { unsubscribedAt: new Date() });
    return true;
  }

  async stats() {
    const total = await this.repo.count();
    const crew = await this.repo.count({ where: { verified: true } });
    const reachable = (await this.recipients()).length;
    return { total, crew, reachable, sending: this.sending };
  }

  /**
   * Emails everyone who wants the topic: verified crew plus earlier footer
   * subscribers (who opted in before accounts existed), minus anyone who
   * unsubscribed. Sent one by one in the background to respect rate limits.
   */
  async broadcast(subject: string, body: string, topic?: string) {
    if (this.sending) throw new BadRequestException('A broadcast is already being sent.');
    const list = await this.recipients(topic);
    if (!list.length) return { queued: 0 };
    this.sending = true;
    void (async () => {
      let sent = 0;
      for (const r of list) {
        try {
          await this.mail.sendHtml(r.email, subject, this.broadcastHtml(subject, body, r.name, r.unsubToken));
          sent++;
        } catch (e) { this.log.warn(`Broadcast to ${r.email} failed: ${(e as Error).message}`); }
        await new Promise(res => setTimeout(res, 600));
      }
      this.sending = false;
      this.log.log(`Broadcast "${subject}" sent to ${sent}/${list.length}`);
    })();
    return { queued: list.length };
  }

  private async recipients(topic?: string) {
    const rows = await this.repo.createQueryBuilder('m').addSelect('m.unsubToken')
      .where('m.unsubscribedAt IS NULL').andWhere("(m.verified = true OR m.source <> 'crew')").getMany();
    // Older footer subscribers have no unsubscribe token yet; give them one.
    for (const r of rows.filter(r => !r.unsubToken)) {
      r.unsubToken = randomBytes(24).toString('hex');
      await this.repo.update(r.id, { unsubToken: r.unsubToken });
    }
    return rows.filter(r => !topic || r.topics.split(',').includes(topic));
  }

  /** Who a crew token belongs to, for other modules that reuse crew sign-in. */
  async identify(token?: string) {
    const m = await this.byToken(token);
    return { id: m.id, email: m.email, name: m.name ?? '' };
  }

  private async byToken(token?: string) {
    if (!token || token.length < 32) throw new UnauthorizedException('Sign in again.');
    const m = await this.repo.findOne({ where: { sessionHash: sha(token) } as any });
    if (!m) throw new UnauthorizedException('Sign in again.');
    return m;
  }

  private async public(id: number) {
    const m = await this.repo.findOneByOrFail({ id });
    return { email: m.email, name: m.name, topics: m.topics.split(',').filter(Boolean), subscribed: !m.unsubscribedAt, since: m.createdAt };
  }

  private shell(inner: string, foot = '') {
    return `<div style="background:#0a0b0c;padding:32px 12px;font-family:Segoe UI,Helvetica,Arial,sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#17181c;border:1px solid #2a2c33;border-radius:20px;padding:32px;color:#f1ede3">
        <p style="margin:0 0 18px;font:12px monospace;letter-spacing:2px;color:#e3b341">● MISSION CONTROL · KARAN KAPOOR</p>
        ${inner}
        <hr style="border:none;border-top:1px solid #2a2c33;margin:28px 0 16px">
        <p style="margin:0;color:#77746b;font-size:12px;line-height:1.6">${foot}<a href="${this.site}" style="color:#a19d90">${this.site.replace(/^https?:\/\//, '')}</a></p>
      </div></div>`;
  }

  private codeHtml(code: string, name: string | null) {
    return this.shell(`
      <h1 style="margin:0 0 10px;font:400 30px Georgia,serif;color:#f1ede3">${name ? `Hi ${esc(name)},` : 'Welcome aboard.'}</h1>
      <p style="margin:0 0 22px;color:#a19d90;line-height:1.6">Here's your code to join the crew and sign in. It expires in 10 minutes.</p>
      <div style="background:#0a0b0c;border:1px solid #e3b341;border-radius:14px;padding:22px;text-align:center">
        <span style="font:700 38px monospace;letter-spacing:10px;color:#e3b341">${code}</span></div>
      <p style="margin:20px 0 0;color:#77746b;font-size:13px">Didn't ask for this? You can ignore it.</p>`);
  }

  private broadcastHtml(subject: string, body: string, name: string | null, unsub: string | null) {
    const paras = esc(body).split(/\n{2,}/).map(p => `<p style="margin:0 0 14px;color:#d8d3c6;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`).join('');
    const link = `${this.api}/crew/unsubscribe?u=${unsub}`;
    return this.shell(`
      <h1 style="margin:0 0 16px;font:400 30px Georgia,serif;color:#f1ede3">${esc(subject)}</h1>
      ${name ? `<p style="margin:0 0 14px;color:#a19d90">Hi ${esc(name)},</p>` : ''}${paras}
      <a href="${this.site}" style="display:inline-block;margin-top:8px;padding:12px 22px;border-radius:99px;background:#e3b341;color:#14110a;text-decoration:none;font:600 13px monospace;letter-spacing:1px">VISIT THE PORTFOLIO ↗</a>`,
      `You're getting this because you joined Karan's mission crew. <a href="${link}" style="color:#a19d90">Unsubscribe</a> · `);
  }
}
