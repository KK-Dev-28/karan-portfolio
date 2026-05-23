import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Razorpay from 'razorpay';
import { validateWebhookSignature, validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';
import { randomBytes } from 'crypto';
import { Payment } from './payment.entity';
import { InsightsAccess } from './insights-access.entity';
import { CheckoutTier, CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateInsightsCheckoutDto } from './dto/create-insights-checkout.dto';

@Injectable()
export class PaymentService {
  private readonly log = new Logger(PaymentService.name);
  private rzp: Razorpay | null = null;

  constructor(
    @InjectRepository(Payment)       private readonly repo:         Repository<Payment>,
    @InjectRepository(InsightsAccess) private readonly insightsRepo: Repository<InsightsAccess>,
    private readonly cfg: ConfigService,
  ) {
    const keyId     = this.cfg.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.cfg.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) {
      this.rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      this.log.log('Razorpay client initialised');
    } else {
      this.log.warn('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payments disabled');
    }
  }

  private get keyId()     { return this.cfg.get<string>('RAZORPAY_KEY_ID')     ?? ''; }
  private get keySecret() { return this.cfg.get<string>('RAZORPAY_KEY_SECRET') ?? ''; }
  private get currency()  { return (this.cfg.get<string>('RAZORPAY_CURRENCY') || 'INR').toUpperCase(); }

  private tierAmountPaise(tier: CheckoutTier): number {
    const envMap: Record<CheckoutTier, string> = {
      starter:    'RAZORPAY_STARTER_AMOUNT',
      standard:   'RAZORPAY_STANDARD_AMOUNT',
      enterprise: 'RAZORPAY_ENTERPRISE_AMOUNT',
    };
    const defaults: Record<CheckoutTier, number> = {
      starter:    99_900,
      standard:   249_900,
      enterprise: 499_900,
    };
    const raw = this.cfg.get<string>(envMap[tier]);
    const n   = raw ? parseInt(raw, 10) : defaults[tier];
    if (!Number.isFinite(n) || n < 100) throw new BadRequestException('Invalid amount configuration');
    return n;
  }

  private tierLabel(tier: CheckoutTier): string {
    const labels: Record<CheckoutTier, string> = {
      starter:    'Project Kickstart',
      standard:   'Growth Build',
      enterprise: 'Ongoing Partner',
    };
    return labels[tier];
  }

  private insightsAmountPaise(): number {
    const raw = this.cfg.get<string>('RAZORPAY_INSIGHTS_AMOUNT');
    const n   = raw ? parseInt(raw, 10) : 49_900;
    if (!Number.isFinite(n) || n < 100) throw new BadRequestException('Invalid insights amount');
    return n;
  }

  private insightsDays(): number {
    const raw = this.cfg.get<string>('INSIGHTS_ACCESS_DAYS');
    const n   = raw ? parseInt(raw, 10) : 30;
    return Number.isFinite(n) && n >= 1 ? n : 30;
  }

  // ── Checkout ──────────────────────────────────────────────────────────────

  async createCheckoutSession(dto: CreateCheckoutDto) {
    if (!this.rzp) throw new BadRequestException('Payments not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    const amount   = this.tierAmountPaise(dto.tier);
    const currency = this.currency;

    const order = await this.rzp.orders.create({
      amount,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes:   { tier: dto.tier, email: dto.customerEmail ?? '' },
    });

    await this.repo.save(
      this.repo.create({
        razorpayOrderId: order.id,
        amount,
        currency,
        status:        'pending',
        tier:          dto.tier,
        customerEmail: dto.customerEmail ?? null,
      }),
    );

    return {
      orderId:  order.id,
      amount:   order.amount as number,
      currency: order.currency,
      keyId:    this.keyId,
      name:     this.tierLabel(dto.tier),
      email:    dto.customerEmail ?? '',
    };
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    const valid = validatePaymentVerification(
      { order_id: orderId, payment_id: paymentId },
      signature,
      this.keySecret,
    );
    if (!valid) throw new BadRequestException('Invalid payment signature');

    await this.repo.update(
      { razorpayOrderId: orderId },
      { status: 'completed', razorpayPaymentId: paymentId },
    );
    return { success: true };
  }

  // ── Insights ──────────────────────────────────────────────────────────────

  async createInsightsCheckoutSession(dto: CreateInsightsCheckoutDto) {
    if (!this.rzp) throw new BadRequestException('Payments not configured.');
    const amount   = this.insightsAmountPaise();
    const currency = this.currency;
    const email    = dto.email.trim().toLowerCase();

    const order = await this.rzp.orders.create({
      amount,
      currency,
      receipt: `ins_${Date.now()}`,
      notes:   { type: 'insights_access', email },
    });

    await this.insightsRepo.save(
      this.insightsRepo.create({
        email,
        razorpayOrderId: order.id,
        status:      'pending',
        accessToken: null,
        expiresAt:   null,
      }),
    );

    return {
      orderId:  order.id,
      amount:   order.amount as number,
      currency: order.currency,
      keyId:    this.keyId,
      name:     'Portfolio Visitor Logs Access',
      email,
    };
  }

  async verifyInsightsPayment(orderId: string, paymentId: string, signature: string, email: string) {
    const valid = validatePaymentVerification(
      { order_id: orderId, payment_id: paymentId },
      signature,
      this.keySecret,
    );
    if (!valid) throw new BadRequestException('Invalid payment signature');

    const expires     = new Date(Date.now() + this.insightsDays() * 86_400_000);
    const accessToken = `ins_${randomBytes(24).toString('hex')}`;

    await this.insightsRepo.update(
      { razorpayOrderId: orderId },
      { status: 'active', accessToken, expiresAt: expires, email: email.toLowerCase() },
    );
    return { accessToken, expiresAt: expires };
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  async handleWebhook(signature: string | undefined, rawBody: Buffer) {
    const whSecret = this.cfg.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!whSecret || !signature) {
      this.log.warn('Webhook secret or signature missing');
      return { received: false };
    }

    const bodyStr = rawBody.toString();
    if (!validateWebhookSignature(bodyStr, signature, whSecret)) {
      this.log.warn('Razorpay webhook signature mismatch');
      throw new BadRequestException('Invalid webhook signature');
    }

    let event: any;
    try { event = JSON.parse(bodyStr); } catch { throw new BadRequestException('Invalid JSON body'); }

    const paymentEntity = event?.payload?.payment?.entity;

    if (event.event === 'payment.captured' && paymentEntity) {
      const orderId   = paymentEntity.order_id  as string;
      const paymentId = paymentEntity.id        as string;
      const notes     = paymentEntity.notes     as Record<string, string> | undefined;

      if (notes?.type === 'insights_access') {
        const expires     = new Date(Date.now() + this.insightsDays() * 86_400_000);
        const accessToken = `ins_${randomBytes(24).toString('hex')}`;
        await this.insightsRepo.update(
          { razorpayOrderId: orderId },
          { status: 'active', accessToken, expiresAt: expires, email: (notes.email ?? '').toLowerCase() },
        );
        this.log.log(`Insights access activated for order ${orderId}`);
      } else {
        await this.repo.update(
          { razorpayOrderId: orderId },
          { status: 'completed', razorpayPaymentId: paymentId },
        );
        this.log.log(`Payment completed for order ${orderId}`);
      }
    }

    if (event.event === 'payment.failed' && paymentEntity?.order_id) {
      await this.repo.update({ razorpayOrderId: paymentEntity.order_id }, { status: 'failed' });
    }

    return { received: true };
  }

  // ── Catalog & Admin ───────────────────────────────────────────────────────

  getPublicCatalog() {
    const currency = this.currency;
    const tiers = (['starter', 'standard', 'enterprise'] as CheckoutTier[]).map(id => ({
      id,
      label:       this.tierLabel(id),
      amountPaise: this.tierAmountPaise(id),
      description:
        id === 'starter'    ? 'Quick tasks, bug fixes, and standalone features.' :
        id === 'standard'   ? 'Full-stack project builds with deployment.' :
                              'Ongoing retainer — sprints, reviews, and support.',
    }));
    return { currency, tiers };
  }

  getInsightsCatalog() {
    return {
      currency:     this.currency,
      amountPaise:  this.insightsAmountPaise(),
      durationDays: this.insightsDays(),
      keyId:        this.keyId,
      name:         'Portfolio Visitor Logs Access',
    };
  }

  async activateInsightsAccess(orderId: string, email?: string) {
    const where = email
      ? { razorpayOrderId: orderId, email: email.trim().toLowerCase() }
      : { razorpayOrderId: orderId };
    const row = await this.insightsRepo.findOne({ where });
    if (!row || row.status !== 'active' || !row.accessToken) {
      throw new BadRequestException('Access not yet active. Complete payment first.');
    }
    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Access token expired.');
    }
    return { accessToken: row.accessToken, expiresAt: row.expiresAt, email: row.email };
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
      total:           parseInt(raw?.total          ?? '0', 10) || 0,
      completedCount:  parseInt(raw?.completedCount  ?? '0', 10) || 0,
      completedAmount: parseInt(raw?.completedAmount ?? '0', 10) || 0,
    };
  }
}
