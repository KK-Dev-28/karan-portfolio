import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { FreeUsage } from './free-usage.entity';
import { EmailVerification } from './email-verification.entity';
import { EmailService } from './email.service';

const FREE_LIMIT = 3;
const ENGINE_UNAVAILABLE = 'Smart engine is not available at this time. Please try again later.';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class AiToolsService {
  private client: Anthropic | null = null;

  constructor(
    @InjectRepository(FreeUsage) private usageRepo: Repository<FreeUsage>,
    @InjectRepository(EmailVerification) private verifyRepo: Repository<EmailVerification>,
    private emailSvc: EmailService,
    cfg: ConfigService,
  ) {
    const key = cfg.get<string>('ANTHROPIC_API_KEY');
    if (key) this.client = new Anthropic({ apiKey: key });
  }

  async sendCode(email: string): Promise<{ sent: boolean }> {
    const code = Math.floor(100_000 + Math.random() * 900_000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const existing = await this.verifyRepo.findOneBy({ email });
    if (existing) {
      await this.verifyRepo.update(existing.id, { code, expiresAt, verifiedAt: null as any });
    } else {
      await this.verifyRepo.save(this.verifyRepo.create({ email, code, expiresAt }));
    }

    await this.emailSvc.sendOtp(email, code);
    return { sent: true };
  }

  async verifyCode(email: string, code: string): Promise<{ verified: boolean }> {
    const row = await this.verifyRepo.findOneBy({ email });
    if (!row || !row.code || !row.expiresAt) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }
    if (new Date() > row.expiresAt) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }
    if (row.code !== code) {
      throw new BadRequestException('Incorrect verification code. Please try again.');
    }
    await this.verifyRepo.update(row.id, { code: null as any, expiresAt: null as any, verifiedAt: new Date() });
    return { verified: true };
  }

  async isVerified(email: string): Promise<boolean> {
    const row = await this.verifyRepo.findOneBy({ email });
    return !!(row?.verifiedAt);
  }

  async getRemainingUses(email: string, serviceType: string): Promise<number> {
    const row = await this.usageRepo.findOneBy({ email, serviceType });
    return Math.max(0, FREE_LIMIT - (row?.count ?? 0));
  }

  async generateIdeas(email: string, topic: string): Promise<{ ideas: any[]; remaining: number }> {
    if (!this.client) throw new BadRequestException(ENGINE_UNAVAILABLE);

    const verified = await this.isVerified(email);
    if (!verified) {
      throw new BadRequestException('Please verify your email before using this service.');
    }

    const existing = await this.usageRepo.findOneBy({ email, serviceType: 'ideas' });
    const used = existing?.count ?? 0;

    if (used >= FREE_LIMIT) {
      throw new BadRequestException(
        `You have used all ${FREE_LIMIT} free idea generations. Upgrade to Blog Writer Access for unlimited AI writing.`,
      );
    }

    try {
      const response = await this.client.messages.create({
        model:      'claude-opus-4-7',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Generate 5 compelling blog post ideas for the topic/niche: "${topic}"

Return ONLY a valid JSON array — no markdown, no extra text:
[
  {
    "title": "catchy post title",
    "hook": "one-sentence hook that makes someone want to read it",
    "outline": ["point 1", "point 2", "point 3"],
    "tags": ["tag1", "tag2"]
  }
]`,
        }],
      });

      const raw = (response.content[0] as any).text?.trim() ?? '';
      let ideas: any[];
      try {
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        ideas = JSON.parse(cleaned);
        if (!Array.isArray(ideas)) throw new Error('Not an array');
      } catch {
        throw new BadRequestException('Smart engine returned unexpected format. Please try again.');
      }

      if (existing) {
        await this.usageRepo.update(existing.id, { count: existing.count + 1 });
      } else {
        await this.usageRepo.save(this.usageRepo.create({ email, serviceType: 'ideas', count: 1 }));
      }

      return { ideas, remaining: FREE_LIMIT - (used + 1) };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(ENGINE_UNAVAILABLE);
    }
  }
}
