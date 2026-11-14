import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { PortfolioClient, PortfolioRequest } from './portfolio-request.entity';
import { EmailService } from '../ai-tools/email.service';

const sha = (v: string) => createHash('sha256').update(v).digest('hex');
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const SETUP_TTL = 48 * 3_600_000;   // first-time link from the credentials email
const RESET_TTL = 60 * 60_000;      // "forgot password" link
const OTP_TTL = 10 * 60_000;
const SESSION_TTL = 7 * 86_400_000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;
/** Compared against when the account does not exist, so both paths take the same time. */
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

/**
 * Sign-in for paid portfolio clients. Nothing secret is ever emailed in the
 * clear: clients get a single-use link to choose their own password, every
 * sign-in needs that password plus a one-time code sent to their email, and
 * tokens are stored only as hashes.
 */
@Injectable()
export class ClientAuthService {
  private readonly log = new Logger(ClientAuthService.name);

  constructor(
    @InjectRepository(PortfolioClient) private readonly clients: Repository<PortfolioClient>,
    @InjectRepository(PortfolioRequest) private readonly requests: Repository<PortfolioRequest>,
    private readonly mail: EmailService,
    private readonly cfg: ConfigService,
  ) {}

  private get site() { return this.cfg.get<string>('FRONTEND_URL') ?? 'https://karan-portfolio-six-sigma.vercel.app'; }

  /** Creates (or re-arms) the client account for a paid request and emails a set-password link. */
  async issueCredentials(req: PortfolioRequest, reset = false) {
    let c = await this.clients.findOneBy({ email: req.email });
    if (!c) c = this.clients.create({ email: req.email, requestId: req.id });
    c.requestId = req.id; c.active = true;
    const token = randomBytes(32).toString('hex');
    c.setupHash = sha(token);
    c.setupExpires = new Date(Date.now() + (reset ? RESET_TTL : SETUP_TTL));
    c.sessionHash = null; c.sessionExpires = null; // any old session ends
    await this.clients.save(c);
    const link = `${this.site}/client/setup?t=${token}`;
    await this.send(req.email, reset ? 'Reset your portfolio password' : 'Your portfolio account is ready',
      `<p>Hi ${esc(req.name)},</p>
       <p>${reset ? 'Use this link to choose a new password.' : 'Your payment is confirmed. Use this link to choose a password for your client dashboard.'}
       It works once and expires in ${reset ? '1 hour' : '48 hours'}.</p>
       <p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#14110a;color:#f5d27a;border-radius:8px;text-decoration:none">Set my password</a></p>
       <p style="color:#6b7280;font-size:13px">Your sign-in is your email address, ${esc(req.email)}. Each sign-in also asks for a code we email you.
       Nobody from this site will ever ask you for your password.</p>`);
  }

  async setup(token: string, password: string) {
    const c = await this.clients.findOneBy({ setupHash: sha(token) });
    if (!c || !c.setupExpires || c.setupExpires < new Date()) throw new BadRequestException('This link has expired or was already used. Ask for a new one.');
    c.passwordHash = await bcrypt.hash(password, 12);
    c.setupHash = null; c.setupExpires = null; c.failedLogins = 0; c.lockedUntil = null;
    await this.clients.save(c);
    return { ok: true };
  }

  /** Step 1: password. On success a one-time code goes to the email address. */
  async login(email: string, password: string) {
    const c = await this.clients.findOneBy({ email: email.trim().toLowerCase() });
    const generic = new UnauthorizedException('Email or password is incorrect.');
    if (!c || !c.active || !c.passwordHash) { await bcrypt.compare(password, DUMMY_HASH); throw generic; }
    if (c.lockedUntil && c.lockedUntil > new Date()) throw new UnauthorizedException('Too many attempts. Try again in 15 minutes.');
    if (!(await bcrypt.compare(password, c.passwordHash))) {
      c.failedLogins++;
      if (c.failedLogins >= MAX_FAILS) { c.lockedUntil = new Date(Date.now() + LOCK_MS); c.failedLogins = 0; }
      await this.clients.save(c);
      throw generic;
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    c.failedLogins = 0; c.otpHash = sha(code); c.otpExpires = new Date(Date.now() + OTP_TTL); c.otpTries = 0;
    await this.clients.save(c);
    await this.send(c.email, `Your sign-in code: ${code}`,
      `<p>Your one-time sign-in code is</p><p style="font:600 28px monospace;letter-spacing:6px">${code}</p>
       <p style="color:#6b7280;font-size:13px">It expires in 10 minutes. If you did not just try to sign in, change your password.</p>`);
    return { otpSent: true };
  }

  /** Step 2: the emailed code. Returns a session token valid for 7 days. */
  async verify(email: string, code: string) {
    const c = await this.clients.findOneBy({ email: email.trim().toLowerCase() });
    if (!c || !c.otpHash || !c.otpExpires || c.otpExpires < new Date()) throw new UnauthorizedException('The code expired. Sign in again.');
    if (++c.otpTries > 5) { c.otpHash = null; await this.clients.save(c); throw new UnauthorizedException('Too many wrong codes. Sign in again.'); }
    if (!same(c.otpHash, sha(code))) { await this.clients.save(c); throw new UnauthorizedException('That code is not right.'); }
    const token = randomBytes(32).toString('hex');
    c.otpHash = null; c.otpExpires = null; c.sessionHash = sha(token);
    c.sessionExpires = new Date(Date.now() + SESSION_TTL); c.lastLoginAt = new Date();
    await this.clients.save(c);
    return { token, expires: c.sessionExpires };
  }

  /** Always answers the same way, so it cannot be used to find out who is a client. */
  async forgot(email: string) {
    const c = await this.clients.findOneBy({ email: email.trim().toLowerCase() });
    if (c?.active) {
      const req = await this.requests.findOneBy({ id: c.requestId });
      if (req) await this.issueCredentials(req, true);
    }
    return { ok: true };
  }

  async me(token?: string) {
    const c = await this.bySession(token);
    const req = await this.requests.findOneByOrFail({ id: c.requestId });
    const { adminNotes, paymentLinkId, ...request } = req;
    return { email: c.email, lastLoginAt: c.lastLoginAt, sessionExpires: c.sessionExpires, request };
  }

  async logout(token?: string) {
    const c = await this.bySession(token).catch(() => null);
    if (c) { c.sessionHash = null; c.sessionExpires = null; await this.clients.save(c); }
    return { ok: true };
  }

  async revoke(email: string) {
    await this.clients.update({ email }, { active: false, sessionHash: null, sessionExpires: null, setupHash: null });
  }

  /** Resolves a client session token, or throws 401. Other services gate on this. */
  async bySession(token?: string) {
    if (!token || token.length !== 64) throw new UnauthorizedException('Sign in again.');
    const c = await this.clients.findOneBy({ sessionHash: sha(token) });
    if (!c || !c.active || !c.sessionExpires || c.sessionExpires < new Date()) throw new UnauthorizedException('Sign in again.');
    return c;
  }

  private async send(to: string, subject: string, inner: string) {
    try {
      await this.mail.sendHtml(to, subject,
        `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1b1d21;max-width:560px">${inner}<p style="color:#6b7280;font-size:13px">Karan Kapoor · ${this.site}</p></div>`, true);
    } catch (e) {
      this.log.warn(`Email to ${to} failed: ${(e as Error).message}`);
      throw new BadRequestException('Could not send the email. Try again in a minute.');
    }
  }
}
