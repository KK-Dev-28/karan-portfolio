import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly cfg: ConfigService) {
    const key = cfg.get<string>('RESEND_API_KEY');
    if (key) {
      this.resend = new Resend(key);
      this.logger.log('Email provider: Resend');
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails logged to console only.');
    }
  }

  private get from(): string {
    return this.cfg.get<string>('RESEND_FROM') ?? 'Karan Kapoor <onboarding@resend.dev>';
  }

  private get adminEmail(): string {
    return this.cfg.get<string>('SMTP_USER') ?? 'kk0888176@gmail.com';
  }

  private get adminPanel(): string {
    const fe = this.cfg.get<string>('FRONTEND_URL') ?? 'https://karan-portfolio-six-sigma.vercel.app';
    return `${fe}/admin`;
  }

  private get waNumber(): string {
    return this.cfg.get<string>('WHATSAPP_NUMBER') ?? '916239589464';
  }

  /**
   * Core send method.
   * throwOnRateLimit = true  → used for OTP (user must know they can't get the code)
   * throwOnRateLimit = false → used for admin/client emails (never break payment flow)
   */
  private async send(to: string, subject: string, html: string, throwOnRateLimit = false): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from:    this.from,
        to:      [to],
        subject,
        html,
      });

      if (error) {
        // Resend returns structured errors instead of throwing
        const isRateLimit = (error as any).statusCode === 429 ||
                            (error.name ?? '').toLowerCase().includes('rate') ||
                            (error.message ?? '').toLowerCase().includes('daily');

        if (isRateLimit) {
          this.logger.warn(`[EMAIL] Daily limit reached — could not send to ${to}`);
          if (throwOnRateLimit) {
            throw new BadRequestException(
              'Email delivery is at its daily limit. Please try again tomorrow, or reach me directly on WhatsApp.',
            );
          }
          return;
        }

        this.logger.error(`[EMAIL] Resend error for ${to}: ${JSON.stringify(error)}`);
        if (throwOnRateLimit) {
          throw new BadRequestException('Could not send verification email. Please try again in a few minutes.');
        }
        return;
      }

      this.logger.log(`[EMAIL] Sent to ${to} — id: ${data?.id}`);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;

      const msg: string = err?.message ?? String(err);
      const isRateLimit = msg.toLowerCase().includes('rate') ||
                          msg.toLowerCase().includes('daily') ||
                          err?.statusCode === 429;

      if (isRateLimit) {
        this.logger.warn(`[EMAIL] Daily limit hit for ${to}`);
        if (throwOnRateLimit) {
          throw new BadRequestException(
            'Email delivery is at its daily limit (100/day on free plan). Please try again tomorrow or contact me directly on WhatsApp.',
          );
        }
        return;
      }

      this.logger.error(`[EMAIL] Unexpected error for ${to}: ${msg}`);
      if (throwOnRateLimit) {
        throw new BadRequestException('Could not send verification email. Please try again in a few minutes.');
      }
    }
  }

  // ── OTP ─────────────────────────────────────────────────────────────────────
  // throwOnRateLimit=true so the user sees a helpful message instead of silently failing

  async sendOtp(to: string, code: string): Promise<void> {
    const html = `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px">
        <h2 style="margin:0 0 8px;color:#111;font-size:22px">Verify your email</h2>
        <p style="color:#555;margin:0 0 24px;font-size:14px;line-height:1.6">
          Use the code below to verify your email and access the free AI service.
        </p>
        <div style="background:#f5f5f5;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
          <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#111;font-family:monospace">${code}</span>
        </div>
        <p style="color:#888;font-size:12px;margin:0">
          This code expires in <strong>10 minutes</strong>. If you didn't request it, ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="color:#aaa;font-size:11px;margin:0">Sent by Karan Kapoor · Portfolio AI Tools</p>
      </div>`;
    await this.send(to, `${code} — Your verification code`, html, true);
  }

  // ── Admin: new payment alert ─────────────────────────────────────────────────

  async sendAdminPaymentAlert(opts: {
    customerName:  string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    tier:          string;
    amountPaise:   number;
    paymentId:     string | null;
    orderId:       string | null;
    paymentDbId:   number;
  }): Promise<void> {
    const name   = opts.customerName  || 'Unknown';
    const email  = opts.customerEmail || '—';
    const phone  = opts.customerPhone || '—';
    const amount = `₹${(opts.amountPaise / 100).toLocaleString('en-IN')}`;
    const panel  = this.adminPanel;

    const waText = encodeURIComponent(
      `Hi ${name}, I received your payment of ${amount} for the "${opts.tier}" plan. I'm reviewing it and will approve shortly.`,
    );
    const waLink = phone !== '—'
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${waText}`
      : `https://wa.me/${this.waNumber}?text=${encodeURIComponent(`New payment: ${name} (${email}) — ${opts.tier} ${amount}`)}`;

    const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0e0e0e;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#f59e0b,#fde68a);padding:24px 28px">
        <h1 style="margin:0;color:#000;font-size:20px;font-weight:800">💰 New Payment — Needs Approval</h1>
        <p style="margin:6px 0 0;color:#000;font-size:13px;opacity:.75">Review in admin panel before access is granted</p>
      </div>
      <div style="padding:28px;background:#161616">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid #282828">Customer</td><td style="color:#f5f5f5;padding:8px 0;border-bottom:1px solid #282828;text-align:right"><strong>${name}</strong></td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid #282828">Email</td><td style="color:#f5f5f5;padding:8px 0;border-bottom:1px solid #282828;text-align:right">${email}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid #282828">Phone</td><td style="color:#f5f5f5;padding:8px 0;border-bottom:1px solid #282828;text-align:right">${phone}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid #282828">Plan</td><td style="color:#f59e0b;padding:8px 0;border-bottom:1px solid #282828;text-align:right;font-weight:700">${opts.tier}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0">Amount</td><td style="color:#22c55e;padding:8px 0;text-align:right;font-size:20px;font-weight:800">${amount}</td></tr>
        </table>
        <a href="${panel}#approvals" style="display:block;margin-top:20px;padding:14px;background:linear-gradient(135deg,#f59e0b,#fde68a);color:#000;text-align:center;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
          ✅ Open Admin Panel → Approvals
        </a>
        <a href="${waLink}" style="display:block;margin-top:10px;padding:12px;background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.3);color:#25d366;text-align:center;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
          💬 WhatsApp ${name}
        </a>
        <p style="color:#64748b;font-size:11px;margin-top:16px;text-align:center">
          Payment ID: ${opts.paymentId || '—'} · Order: ${opts.orderId || '—'} · DB #${opts.paymentDbId}
        </p>
      </div>
    </div>`;

    await this.send(this.adminEmail, `💰 ${amount} from ${name} (${opts.tier}) — Approve now`, html);
  }

  // ── Client: approved ─────────────────────────────────────────────────────────

  async sendClientApprovalEmail(opts: {
    customerName:  string | null;
    customerEmail: string;
    tier:          string;
    amountPaise:   number;
    adminNote?:    string | null;
  }): Promise<void> {
    const name   = opts.customerName || 'Valued Client';
    const amount = `₹${(opts.amountPaise / 100).toLocaleString('en-IN')}`;
    const fe     = this.cfg.get<string>('FRONTEND_URL') ?? 'https://karan-portfolio-six-sigma.vercel.app';

    const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0e0e0e;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#f59e0b,#fde68a);padding:24px 28px">
        <h1 style="margin:0;color:#000;font-size:20px;font-weight:800">✅ Subscription Approved</h1>
        <p style="margin:6px 0 0;color:#000;font-size:13px;opacity:.75">Your access has been confirmed</p>
      </div>
      <div style="padding:28px;background:#161616">
        <p style="color:#f5f5f5;font-size:15px;margin:0 0 16px">Dear ${name},</p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0 0 20px">
          Thank you for your payment of <strong style="color:#f59e0b">${amount}</strong> for the
          <strong style="color:#f5f5f5">${opts.tier}</strong> plan. Your subscription has been reviewed and
          <strong style="color:#22c55e">approved</strong>. I will be in touch shortly to begin work.
        </p>
        ${opts.adminNote ? `
        <div style="background:#1e1e1e;border-left:3px solid #f59e0b;padding:14px 16px;border-radius:0 8px 8px 0;margin:0 0 20px">
          <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6">
            <strong style="color:#f59e0b">Note from Karan:</strong> ${opts.adminNote}
          </p>
        </div>` : ''}
        <a href="${fe}#contact" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b,#fde68a);color:#000;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
          Get in Touch →
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:28px;border-top:1px solid #282828;padding-top:16px">
          Karan Kapoor · Full Stack Developer &amp; Consultant<br>
          <a href="${fe}" style="color:#f59e0b;text-decoration:none">${fe.replace('https://','')}</a>
        </p>
      </div>
    </div>`;

    await this.send(opts.customerEmail, `Your ${opts.tier} subscription is approved — Karan Kapoor`, html);
  }

  // ── Client: rejected ─────────────────────────────────────────────────────────

  async sendClientRejectionEmail(opts: {
    customerName:  string | null;
    customerEmail: string;
    tier:          string;
    amountPaise:   number;
    reason:        string;
  }): Promise<void> {
    const name   = opts.customerName || 'Valued Client';
    const amount = `₹${(opts.amountPaise / 100).toLocaleString('en-IN')}`;

    const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0e0e0e;border-radius:16px;overflow:hidden">
      <div style="background:#1a1a1a;border-top:3px solid #ef4444;padding:24px 28px">
        <h1 style="margin:0;color:#f5f5f5;font-size:20px;font-weight:800">Subscription Update</h1>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">Regarding your ${opts.tier} plan payment</p>
      </div>
      <div style="padding:28px;background:#161616">
        <p style="color:#f5f5f5;font-size:15px;margin:0 0 16px">Dear ${name},</p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0 0 20px">
          Thank you for your interest in the <strong style="color:#f5f5f5">${opts.tier}</strong> plan (${amount}).
          After review, I am unable to accept this subscription at this time.
        </p>
        <div style="background:#1e1e1e;border-left:3px solid #ef4444;padding:14px 16px;border-radius:0 8px 8px 0;margin:0 0 20px">
          <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6">
            <strong style="color:#ef4444">Reason:</strong> ${opts.reason}
          </p>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.8">
          A full refund of <strong>${amount}</strong> will be processed to your original payment method
          within 5–7 business days. Please contact me on WhatsApp if you have any questions.
        </p>
        <p style="color:#64748b;font-size:12px;margin-top:24px;border-top:1px solid #282828;padding-top:16px">
          Karan Kapoor · Full Stack Developer &amp; Consultant
        </p>
      </div>
    </div>`;

    await this.send(opts.customerEmail, `Regarding your subscription — Karan Kapoor`, html);
  }

  // ── Client: info requested ────────────────────────────────────────────────────

  async sendClientInfoRequestEmail(opts: {
    customerName:  string | null;
    customerEmail: string;
    tier:          string;
    message:       string;
  }): Promise<void> {
    const name = opts.customerName || 'Valued Client';

    const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0e0e0e;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 28px">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800">📋 Information Needed</h1>
        <p style="margin:6px 0 0;color:#fff;font-size:13px;opacity:.8">Regarding your ${opts.tier} subscription</p>
      </div>
      <div style="padding:28px;background:#161616">
        <p style="color:#f5f5f5;font-size:15px;margin:0 0 16px">Dear ${name},</p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0 0 20px">
          Thank you for subscribing to the <strong style="color:#f5f5f5">${opts.tier}</strong> plan.
          Before I activate your subscription, I need some additional information:
        </p>
        <div style="background:#1e1e1e;border-left:3px solid #6366f1;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px">
          <p style="color:#f5f5f5;font-size:14px;margin:0;line-height:1.8">${opts.message}</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.8">
          Please reply to this email or message me on WhatsApp with the details.
          Your subscription will be activated as soon as I receive the information.
        </p>
        <p style="color:#64748b;font-size:12px;margin-top:24px;border-top:1px solid #282828;padding-top:16px">
          Karan Kapoor · Full Stack Developer &amp; Consultant
        </p>
      </div>
    </div>`;

    await this.send(opts.customerEmail, `Information needed for your ${opts.tier} subscription — Karan Kapoor`, html);
  }
}
