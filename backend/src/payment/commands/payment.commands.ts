import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { CreateInsightsCheckoutDto } from '../dto/create-insights-checkout.dto';

export class CreateCheckoutCommand {
  constructor(public readonly dto: CreateCheckoutDto) {}
}

export class CreateInsightsCheckoutCommand {
  constructor(public readonly dto: CreateInsightsCheckoutDto) {}
}

export class ProcessWebhookCommand {
  constructor(
    public readonly signature: string | undefined,
    public readonly rawBody: Buffer,
  ) {}
}

export class VerifyPaymentCommand {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly signature: string,
    public readonly customerName?: string,
    public readonly customerPhone?: string,
  ) {}
}

export class VerifyInsightsPaymentCommand {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly signature: string,
    public readonly email: string,
  ) {}
}
