import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { Payment } from './payment.entity';
import { InsightsAccess } from './insights-access.entity';
import { CheckoutTier, CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateInsightsCheckoutDto } from './dto/create-insights-checkout.dto';

type StripeClient = InstanceType<typeof Stripe>;

@Injectable()
export class PaymentService {
  private readonly log = new Logger(PaymentService.name);
  private stripe: StripeClient | null = null;

  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    @InjectRepository(InsightsAccess) private readonly insightsRepo: Repository<InsightsAccess>,
    private readonly cfg: ConfigService,
  ) {
    const key = this.cfg.get<string>('STRIPE_SECRET_KEY');
    if (key) this.stripe = new Stripe(key, { apiVersion: Stripe.API_VERSION });
  }

  private tierAmountCents(tier: CheckoutTier): number {
    const map: Record<CheckoutTier, string> = {
      starter: 'STRIPE_STARTER_AMOUNT',
      standard: 'STRIPE_STANDARD_AMOUNT',
      enterprise: 'STRIPE_ENTERPRISE_AMOUNT',
    };
    const defaults: Record<CheckoutTier, number> = {
      starter: 19_900,
      standard: 49_900,
      enterprise: 99_900,
    };
    const envKey = map[tier];
    const raw = this.cfg.get<string>(envKey);
    const n = raw ? parseInt(raw, 10) : defaults[tier];
    if (!Number.isFinite(n) || n < 50) throw new BadRequestException('Invalid amount configuration');
    return n;
  }

  private tierLabel(tier: CheckoutTier): string {
    const labels: Record<CheckoutTier, string> = {
      starter: 'Project kickoff deposit',
      standard: 'Sprint engagement deposit',
      enterprise: 'Enterprise engagement deposit',
    };
    return labels[tier];
  }

  async createCheckoutSession(dto: CreateCheckoutDto) {
    if (!this.stripe) {
      throw new BadRequestException(
        'Payments are not configured. Set STRIPE_SECRET_KEY in the server environment.',
      );
    }
    const currency = (this.cfg.get<string>('STRIPE_CURRENCY') || 'usd').toLowerCase();
    const amount = this.tierAmountCents(dto.tier);
    const frontend = this.cfg.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: this.tierLabel(dto.tier),
              description: `Portfolio engagement — ${dto.tier} tier`,
            },
          },
        },
      ],
      customer_email: dto.customerEmail || undefined,
      success_url: `${frontend}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontend}/payment/cancel`,
      metadata: { tier: dto.tier },
    });

    const row = this.repo.create({
      stripeCheckoutSessionId: session.id,
      amount,
      currency,
      status: 'pending',
      tier: dto.tier,
      customerEmail: dto.customerEmail ?? null,
    });
    await this.repo.save(row);

    return { url: session.url, sessionId: session.id };
  }

  private insightsAmountCents(): number {
    const raw = this.cfg.get<string>('STRIPE_INSIGHTS_AMOUNT');
    const n = raw ? parseInt(raw, 10) : 9900;
    if (!Number.isFinite(n) || n < 50) throw new BadRequestException('Invalid insights amount configuration');
    return n;
  }

  private insightsDurationDays(): number {
    const raw = this.cfg.get<string>('INSIGHTS_ACCESS_DAYS');
    const n = raw ? parseInt(raw, 10) : 30;
    if (!Number.isFinite(n) || n < 1) throw new BadRequestException('Invalid insights duration configuration');
    return n;
  }

  async createInsightsCheckoutSession(dto: CreateInsightsCheckoutDto) {
    if (!this.stripe) {
      throw new BadRequestException(
        'Payments are not configured. Set STRIPE_SECRET_KEY in the server environment.',
      );
    }
    const currency = (this.cfg.get<string>('STRIPE_CURRENCY') || 'usd').toLowerCase();
    const frontend = this.cfg.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const amount = this.insightsAmountCents();
    const email = dto.email.trim().toLowerCase();

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: 'Portfolio visitor logs access',
              description: `Read-only analytics access for ${this.insightsDurationDays()} days`,
            },
          },
        },
      ],
      customer_email: email,
      success_url: `${frontend}/insights?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`,
      cancel_url: `${frontend}/insights`,
      metadata: { type: 'insights_access', email },
    });

    const row = this.insightsRepo.create({
      email,
      stripeCheckoutSessionId: session.id,
      status: 'pending',
      accessToken: null,
      expiresAt: null,
    });
    await this.insightsRepo.save(row);
    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(signature: string | undefined, rawBody: Buffer) {
    if (!this.stripe) return { received: false };
    const whSecret = this.cfg.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!whSecret || !signature) {
      this.log.warn('Webhook secret or signature missing');
      return { received: false };
    }
    let event: ReturnType<StripeClient['webhooks']['constructEvent']>;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, whSecret);
    } catch (e) {
      this.log.warn(`Webhook signature failed: ${(e as Error).message}`);
      throw new BadRequestException('Invalid signature');
    }

    if (event.type === 'checkout.session.completed') {
      const sess = event.data.object as {
        id: string;
        payment_intent?: string | { id?: string } | null;
        customer_details?: { email?: string | null } | null;
        customer_email?: string | null;
        metadata?: { type?: string; email?: string };
      };
      const sessionId = sess.id;
      const pi = typeof sess.payment_intent === 'string' ? sess.payment_intent : sess.payment_intent?.id;
      const email = sess.customer_details?.email || sess.customer_email || null;
      if (sess.metadata?.type === 'insights_access') {
        const expires = new Date(Date.now() + this.insightsDurationDays() * 86_400_000);
        const token = `ins_${randomBytes(24).toString('hex')}`;
        await this.insightsRepo.update(
          { stripeCheckoutSessionId: sessionId },
          {
            status: 'active',
            accessToken: token,
            expiresAt: expires,
            email: (email || sess.metadata?.email || '').toLowerCase(),
          },
        );
      } else {
        await this.repo.update(
          { stripeCheckoutSessionId: sessionId },
          {
            status: 'completed',
            stripePaymentIntentId: pi ?? null,
            customerEmail: email,
          },
        );
      }
    }
    if (event.type === 'checkout.session.expired') {
      const sess = event.data.object as { id: string };
      await this.repo.update({ stripeCheckoutSessionId: sess.id }, { status: 'expired' });
    }

    return { received: true };
  }

  getPublicCatalog() {
    const currency = (this.cfg.get<string>('STRIPE_CURRENCY') || 'usd').toLowerCase();
    const tiers = (['starter', 'standard', 'enterprise'] as CheckoutTier[]).map((id) => ({
      id,
      label: this.tierLabel(id),
      amountCents: this.tierAmountCents(id),
      description:
        id === 'starter'
          ? 'Discovery, scope, and starter delivery — ideal for MVPs.'
          : id === 'standard'
            ? 'Dedicated sprint with weekly demos and production hardening.'
            : 'Multi-team alignment, SLAs, and long-term roadmap support.',
    }));
    return { currency, tiers };
  }

  getInsightsCatalog() {
    const currency = (this.cfg.get<string>('STRIPE_CURRENCY') || 'usd').toLowerCase();
    return {
      currency,
      amountCents: this.insightsAmountCents(),
      durationDays: this.insightsDurationDays(),
      name: 'Portfolio visitor logs access',
    };
  }

  async activateInsightsAccess(sessionId: string, email?: string) {
    const where = email
      ? { stripeCheckoutSessionId: sessionId, email: email.trim().toLowerCase() }
      : { stripeCheckoutSessionId: sessionId };
    const row = await this.insightsRepo.findOne({ where });
    if (!row || row.status !== 'active' || !row.accessToken) {
      throw new BadRequestException('Access is not active yet. Complete payment first.');
    }
    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Access token expired.');
    }
    return {
      accessToken: row.accessToken,
      expiresAt: row.expiresAt,
      email: row.email,
    };
  }

  async validateInsightsToken(token: string): Promise<boolean> {
    if (!token) return false;
    const row = await this.insightsRepo.findOne({ where: { accessToken: token, status: 'active' } });
    if (!row) return false;
    return !row.expiresAt || row.expiresAt.getTime() > Date.now();
  }

  findAllForAdmin() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  async paymentStats() {
    const raw = await this.repo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END)`, 'completedAmount')
      .addSelect(`SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END)`, 'completedCount')
      .getRawOne<{ total: string; completedAmount: string | null; completedCount: string }>();
    return {
      total: parseInt(raw?.total ?? '0', 10) || 0,
      completedCount: parseInt(raw?.completedCount ?? '0', 10) || 0,
      completedAmount: parseInt(raw?.completedAmount ?? '0', 10) || 0,
    };
  }
}
