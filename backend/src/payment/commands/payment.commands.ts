import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { CreateInsightsCheckoutDto } from '../dto/create-insights-checkout.dto';

export class CreateCheckoutCommand {
  constructor(public readonly dto: CreateCheckoutDto) {}
}

export class CreateInsightsCheckoutCommand {
  constructor(public readonly dto: CreateInsightsCheckoutDto) {}
}

export class ProcessStripeWebhookCommand {
  constructor(
    public readonly signature: string | undefined,
    public readonly rawBody: Buffer,
  ) {}
}
