import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(cfg: ConfigService) {
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

  async sendOtp(to: string, code: string): Promise<void> {
    const from = process.env.EMAIL_FROM ?? 'noreply@karankapoor.dev';
    const subject = `Your verification code — ${code}`;
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;color:#111">Verify your email</h2>
        <p style="color:#555;margin:0 0 24px">Use the code below to verify your email and access the free AI service.</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#111">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;margin:20px 0 0">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`;

    if (this.transporter) {
      await this.transporter.sendMail({ from, to, subject, html });
    } else {
      this.logger.log(`[DEV] OTP for ${to}: ${code}`);
    }
  }
}
