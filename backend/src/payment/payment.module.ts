import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { InsightsAccess } from './insights-access.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { InsightsAccessGuard } from './insights-access.guard';
import {
  CreateCheckoutHandler,
  CreateInsightsCheckoutHandler,
  ProcessStripeWebhookHandler,
} from './handlers/payment-command.handlers';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, InsightsAccess])],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    InsightsAccessGuard,
    CreateCheckoutHandler,
    CreateInsightsCheckoutHandler,
    ProcessStripeWebhookHandler,
  ],
  exports: [PaymentService, InsightsAccessGuard],
})
export class PaymentModule {}
