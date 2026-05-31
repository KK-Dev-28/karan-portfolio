import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly cfg: ConfigService) {
    const host = cfg.get<string>('SMTP_HOST');
    const user = cfg.get<string>('SMTP_USER');
    const pass = cfg.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port:   cfg.get<number>('SMTP_PORT', 587),
        secure: cfg.get<string>('SMTP_SECURE') === 'true',
        auth:   { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console only.');
    }
  }

  private get from(): string {
    return this.cfg.get<string>('EMAIL_FROM') ?? 'noreply@karankapoor.dev';
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

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({ from: this.from, to, subject, html });
        this.logger.log(`[EMAIL] Sent to ${to} — Message-ID: ${info.messageId}`);
      } catch (err: any) {
        this.logger.error(`[EMAIL] Failed to send to ${to}: ${err?.message ?? err}`);
        // Do NOT rethrow — email failure must never break the HTTP response
      }
    } else {
      this.logger.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    }
  }

  // ── OTP ─────────────────────────────────────────────────────────────────────

  async sendOtp(to: string, code: string): Promise<void> {
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;color:#111">Verify your email</h2>
        <p style="color:#555;margin:0 0 24px">Use the code below to verify your email and access the free AI service.</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#111">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;margin:20px 0 0">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`;
    await this.send(to, `Your verification code — ${code}`, html);
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
    const tier   = opts.tier;
    const panel  = this.adminPanel;

    const waText  = encodeURIComponent(`Hi ${name}, I received your payment of ${amount} for the "${tier}" plan. I'm reviewing your subscription and will approve it shortly.`);
    const waLink  = phone !== '—'
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${waText}`
      : `https://wa.me/${this.waNumber}?text=${encodeURIComponent(`New payment received from ${name} (${email}) for ${tier} - ${amount}`)}`;

    const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0e0e0e;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#f59e0b,#fde68a);padding:24px 28px">
        <h1 style="margin:0;color:#000;font-size:20px;font-weight:800">💰 New Subscription Payment</h1>
        <p style="margin:6px 0 0;color:#000;font-size:13px;opacity:.75">Needs your approval before access is granted</p>
      </div>
      <div style="padding:28px;background:#161616">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid #282828">Customer</td><td style="color:#f5f5f5;padding:8px 0;border-bottom:1px solid #282828;text-align:right"><strong>${name}</strong></td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid #282828">Email</td><td style="color:#f5f5f5;padding:8px 0;border-bottom:1px solid #282828;text-align:right">${email}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid #282828">Phone</td><td style="color:#f5f5f5;padding:8px 0;border-bottom:1px solid #282828;text-align:right">${phone}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid #282828">Plan</td><td style="color:#f59e0b;padding:8px 0;border-bottom:1px solid #282828;text-align:right;font-weight:700">${tier}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0">Amount Paid</td><td style="color:#f5f5f5;padding:8px 0;text-align:right;font-size:18px;font-weight:800">${amount}</td></tr>
        </table>
        <div style="margin-top:24px;display:flex;gap:12px">
          <a href="${panel}#approvals" style="flex:1;display:inline-block;padding:12px;background:linear-gradient(135deg,#f59e0b,#fde68a);color:#000;text-align:center;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
            ✅ Review in Admin Panel
          </a>
        </div>
        <div style="margin-top:12px">
          <a href="${waLink}" style="display:inline-block;width:100%;padding:12px;background:rgba(37,211,102,.15);border:1px solid rgba(37,211,102,.3);color:#25d366;text-align:center;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;box-sizing:border-box">
            💬 Message ${name} on WhatsApp
          </a>
        </div>
        <p style="color:#64748b;font-size:11px;margin-top:20px;text-align:center">Payment ID: ${opts.paymentId || '—'} | Order: ${opts.orderId || '—'}</p>
      </div>
    </div>`;

    await this.send(this.adminEmail, `💰 New Payment ${amount} — ${name} (${tier}) · Needs Approval`, html);
  }

  // ── Client: subscription approved ───────────────────────────────────────────

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
        <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">
          Thank you for your payment of <strong style="color:#f59e0b">${amount}</strong> for the <strong style="color:#f5f5f5">${opts.tier}</strong> plan. Your subscription has been reviewed and approved. I will be in touch shortly to get started.
        </p>
        ${opts.adminNote ? `<div style="background:#1d1d1d;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px"><p style="color:#94a3b8;font-size:13px;margin:0"><strong style="color:#f59e0b">Note from Karan:</strong> ${opts.adminNote}</p></div>` : ''}
        <a href="${fe}#contact" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b,#fde68a);color:#000;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
          Get in Touch →
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:24px">
          — Karan Kapoor<br>Full Stack Developer &amp; Consultant
        </p>
      </div>
    </div>`;

    await this.send(opts.customerEmail, `Your subscription to ${opts.tier} has been approved — Karan Kapoor`, html);
  }

  // ── Client: subscription rejected ───────────────────────────────────────────

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
      <div style="background:#1d1d1d;border-top:2px solid #ef4444;padding:24px 28px">
        <h1 style="margin:0;color:#f5f5f5;font-size:20px;font-weight:800">Subscription Update</h1>
      </div>
      <div style="padding:28px;background:#161616">
        <p style="color:#f5f5f5;font-size:15px;margin:0 0 16px">Dear ${name},</p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">
          Thank you for your interest in the <strong style="color:#f5f5f5">${opts.tier}</strong> plan (${amount}). Unfortunately, I am unable to accept this subscription at this time.
        </p>
        <div style="background:#1d1d1d;border-left:3px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px">
          <p style="color:#94a3b8;font-size:13px;margin:0"><strong style="color:#ef4444">Reason:</strong> ${opts.reason}</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.7">A full refund will be processed to your original payment method within 5–7 business days. Please contact me on WhatsApp if you have any questions.</p>
        <p style="color:#64748b;font-size:12px;margin-top:24px">— Karan Kapoor</p>
      </div>
    </div>`;

    await this.send(opts.customerEmail, `Regarding your subscription — Karan Kapoor`, html);
  }

  // ── Client: more info requested ──────────────────────────────────────────────

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
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800">📋 Additional Information Needed</h1>
        <p style="margin:6px 0 0;color:#fff;font-size:13px;opacity:.75">Regarding your ${opts.tier} subscription</p>
      </div>
      <div style="padding:28px;background:#161616">
        <p style="color:#f5f5f5;font-size:15px;margin:0 0 16px">Dear ${name},</p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">
          Thank you for subscribing to the <strong style="color:#f5f5f5">${opts.tier}</strong> plan. Before I can activate your subscription, I need a little more information:
        </p>
        <div style="background:#1d1d1d;border-left:3px solid #6366f1;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px">
          <p style="color:#f5f5f5;font-size:14px;margin:0;line-height:1.7">${opts.message}</p>
        </div>
        <p style="color:#94a3b8;font-size:13px">Please reply to this email or message me on WhatsApp with the details. Your subscription will be activated once I receive the information.</p>
        <p style="color:#64748b;font-size:12px;margin-top:24px">— Karan Kapoor<br>Full Stack Developer &amp; Consultant</p>
      </div>
    </div>`;

    await this.send(opts.customerEmail, `Information needed for your ${opts.tier} subscription — Karan Kapoor`, html);
  }
}
