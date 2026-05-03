import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  HttpCode,
  UseGuards,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateInsightsCheckoutDto } from './dto/create-insights-checkout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateCheckoutCommand,
  CreateInsightsCheckoutCommand,
  ProcessStripeWebhookCommand,
} from './commands/payment.commands';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly svc: PaymentService,
  ) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Public engagement tiers and amounts (from server config)' })
  catalog() {
    return this.svc.getPublicCatalog();
  }

  @Post('checkout')
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @ApiOperation({ summary: 'Create Stripe Checkout session (redirect URL)' })
  createCheckout(@Body() dto: CreateCheckoutDto) {
    return this.commandBus.execute(new CreateCheckoutCommand(dto));
  }

  @Get('insights/catalog')
  @ApiOperation({ summary: 'Public pricing for paid visitor logs access' })
  insightsCatalog() {
    return this.svc.getInsightsCatalog();
  }

  @Post('insights/checkout')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Create checkout for visitor logs subscription access' })
  createInsightsCheckout(@Body() dto: CreateInsightsCheckoutDto) {
    return this.commandBus.execute(new CreateInsightsCheckoutCommand(dto));
  }

  @Post('insights/activate')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Exchange completed checkout session for access token' })
  activateInsights(@Body() dto: { sessionId: string; email?: string }) {
    return this.svc.activateInsightsAccess(dto.sessionId, dto.email);
  }

  @Post('webhook')
  @SkipThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook (raw body + stripe-signature)' })
  async webhook(
    @Headers('stripe-signature') sig: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const raw = req.rawBody;
    if (!raw) throw new BadRequestException('rawBody missing — enable rawBody in NestFactory.create');
    return this.commandBus.execute(new ProcessStripeWebhookCommand(sig, raw));
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List recent payments (admin)' })
  listAdmin() {
    return this.svc.findAllForAdmin();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payment aggregates (admin)' })
  stats() {
    return this.svc.paymentStats();
  }
}
