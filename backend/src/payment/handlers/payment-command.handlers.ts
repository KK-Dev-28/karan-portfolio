import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentService } from '../payment.service';
import {
  CreateCheckoutCommand,
  CreateInsightsCheckoutCommand,
  ProcessWebhookCommand,
  VerifyPaymentCommand,
  VerifyInsightsPaymentCommand,
} from '../commands/payment.commands';

@CommandHandler(CreateCheckoutCommand)
export class CreateCheckoutHandler implements ICommandHandler<CreateCheckoutCommand> {
  constructor(private readonly payment: PaymentService) {}
  execute(command: CreateCheckoutCommand) {
    return this.payment.createCheckoutSession(command.dto);
  }
}

@CommandHandler(CreateInsightsCheckoutCommand)
export class CreateInsightsCheckoutHandler implements ICommandHandler<CreateInsightsCheckoutCommand> {
  constructor(private readonly payment: PaymentService) {}
  execute(command: CreateInsightsCheckoutCommand) {
    return this.payment.createInsightsCheckoutSession(command.dto);
  }
}

@CommandHandler(ProcessWebhookCommand)
export class ProcessWebhookHandler implements ICommandHandler<ProcessWebhookCommand> {
  constructor(private readonly payment: PaymentService) {}
  execute(command: ProcessWebhookCommand) {
    return this.payment.handleWebhook(command.signature, command.rawBody);
  }
}

@CommandHandler(VerifyPaymentCommand)
export class VerifyPaymentHandler implements ICommandHandler<VerifyPaymentCommand> {
  constructor(private readonly payment: PaymentService) {}
  execute(command: VerifyPaymentCommand) {
    return this.payment.verifyPayment(command.orderId, command.paymentId, command.signature, command.customerName, command.customerPhone);
  }
}

@CommandHandler(VerifyInsightsPaymentCommand)
export class VerifyInsightsPaymentHandler implements ICommandHandler<VerifyInsightsPaymentCommand> {
  constructor(private readonly payment: PaymentService) {}
  execute(command: VerifyInsightsPaymentCommand) {
    return this.payment.verifyInsightsPayment(command.orderId, command.paymentId, command.signature, command.email);
  }
}
