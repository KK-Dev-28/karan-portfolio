import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';
import { Booking } from './booking.entity';

const SESSION_CONFIG = {
  'quick-call':  { label: 'Quick Call (30 min)',       duration: 30,  amountEnv: 'BOOKING_QUICK_AMOUNT',    default: 49900  },
  'strategy':    { label: 'Strategy Session (60 min)', duration: 60,  amountEnv: 'BOOKING_STRATEGY_AMOUNT', default: 99900  },
  'deep-dive':   { label: 'Project Deep Dive (90 min)',duration: 90,  amountEnv: 'BOOKING_DEEP_AMOUNT',     default: 199900 },
} as const;

type SessionType = keyof typeof SESSION_CONFIG;

@Injectable()
export class BookingService {
  private rzp: Razorpay | null = null;

  constructor(
    @InjectRepository(Booking) private repo: Repository<Booking>,
    private cfg: ConfigService,
  ) {
    const keyId     = cfg.get<string>('RAZORPAY_KEY_ID');
    const keySecret = cfg.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) this.rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  private get currency() { return (this.cfg.get<string>('RAZORPAY_CURRENCY') || 'INR').toUpperCase(); }
  private get keyId()    { return this.cfg.get<string>('RAZORPAY_KEY_ID') ?? ''; }
  private get keySecret(){ return this.cfg.get<string>('RAZORPAY_KEY_SECRET') ?? ''; }

  private getAmount(type: SessionType): number {
    const { amountEnv, default: def } = SESSION_CONFIG[type];
    const raw = this.cfg.get<string>(amountEnv);
    const n = raw ? parseInt(raw, 10) : def;
    return Number.isFinite(n) && n >= 100 ? n : def;
  }

  getSessions() {
    return (Object.keys(SESSION_CONFIG) as SessionType[]).map(key => ({
      id:       key,
      label:    SESSION_CONFIG[key].label,
      duration: SESSION_CONFIG[key].duration,
      amount:   this.getAmount(key),
      currency: this.currency,
      keyId:    this.keyId,
    }));
  }

  async createOrder(dto: { sessionType: string; name: string; email: string; phone?: string; message?: string }) {
    if (!this.rzp) throw new BadRequestException('Payments not configured.');
    const type = dto.sessionType as SessionType;
    if (!SESSION_CONFIG[type]) throw new BadRequestException('Invalid session type');

    const amount   = this.getAmount(type);
    const currency = this.currency;
    const { label } = SESSION_CONFIG[type];

    const order = await this.rzp.orders.create({
      amount,
      currency,
      receipt: `book_${Date.now()}`,
      notes: { type, name: dto.name, email: dto.email },
    });

    const booking = await this.repo.save(this.repo.create({
      sessionType:    type,
      name:           dto.name,
      email:          dto.email,
      phone:          dto.phone ?? null,
      message:        dto.message ?? null,
      amount,
      currency,
      status:         'pending',
      razorpayOrderId: order.id,
    }));

    return { orderId: order.id, amount: order.amount as number, currency, keyId: this.keyId, name: label, email: dto.email };
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    const valid = validatePaymentVerification({ order_id: orderId, payment_id: paymentId }, signature, this.keySecret);
    if (!valid) throw new BadRequestException('Invalid payment signature');
    await this.repo.update({ razorpayOrderId: orderId }, { status: 'paid', razorpayPaymentId: paymentId });
    const booking = await this.repo.findOneBy({ razorpayOrderId: orderId });
    return { success: true, booking };
  }

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  async updateStatus(id: number, status: string, scheduledAt?: string, adminNotes?: string) {
    const b = await this.repo.findOneBy({ id });
    if (!b) throw new NotFoundException('Booking not found');
    Object.assign(b, { status, ...(scheduledAt ? { scheduledAt } : {}), ...(adminNotes ? { adminNotes } : {}) });
    return this.repo.save(b);
  }
}
