import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentService } from '../payment.service';
import {
  CreateCheckoutCommand,
  CreateInsightsCheckoutCommand,
  ProcessStripeWebhookCommand,
} from '../commands/payment.commands';

@CommandHandler(CreateCheckoutCommand)
export class CreateCheckoutHandler implements ICommandHandler<CreateCheckoutCommand> {
  constructor(private readonly payment: PaymentService) {}

  execute(command: CreateCheckoutCommand) {
    return this.payment.createCheckoutSession(command.dto);
  }
}

@CommandHandler(CreateInsightsCheckoutCommand)
export class CreateInsightsCheckoutHandler
  implements ICommandHandler<CreateInsightsCheckoutCommand>
{
  constructor(private readonly payment: PaymentService) {}

  execute(command: CreateInsightsCheckoutCommand) {
    return this.payment.createInsightsCheckoutSession(command.dto);
  }
}

@CommandHandler(ProcessStripeWebhookCommand)
export class ProcessStripeWebhookHandler
  implements ICommandHandler<ProcessStripeWebhookCommand>
{
  constructor(private readonly payment: PaymentService) {}

  execute(command: ProcessStripeWebhookCommand) {
    return this.payment.handleWebhook(command.signature, command.rawBody);
  }
}
