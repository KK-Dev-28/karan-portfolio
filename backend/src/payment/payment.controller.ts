import {
  Controller, Post, Get, Body, Req, Headers,
  HttpCode, UseGuards, RawBodyRequest, BadRequestException,
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
  ProcessWebhookCommand,
  VerifyPaymentCommand,
  VerifyInsightsPaymentCommand,
} from './commands/payment.commands';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly svc: PaymentService,
  ) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Public engagement tiers and amounts' })
  catalog() { return this.svc.getPublicCatalog(); }

  @Post('checkout')
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @ApiOperation({ summary: 'Create Razorpay order (returns orderId + keyId for frontend modal)' })
  createCheckout(@Body() dto: CreateCheckoutDto) {
    return this.commandBus.execute(new CreateCheckoutCommand(dto));
  }

  @Post('verify')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Verify Razorpay payment signature after modal success' })
  verifyPayment(@Body() body: { orderId: string; paymentId: string; signature: string }) {
    return this.commandBus.execute(new VerifyPaymentCommand(body.orderId, body.paymentId, body.signature));
  }

  @Get('insights/catalog')
  @ApiOperation({ summary: 'Pricing for paid visitor logs access' })
  insightsCatalog() { return this.svc.getInsightsCatalog(); }

  @Post('insights/checkout')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Create Razorpay order for insights access' })
  createInsightsCheckout(@Body() dto: CreateInsightsCheckoutDto) {
    return this.commandBus.execute(new CreateInsightsCheckoutCommand(dto));
  }

  @Post('insights/verify')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Verify insights payment and activate access' })
  verifyInsights(@Body() body: { orderId: string; paymentId: string; signature: string; email: string }) {
    return this.commandBus.execute(
      new VerifyInsightsPaymentCommand(body.orderId, body.paymentId, body.signature, body.email),
    );
  }

  @Post('insights/activate')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Legacy: exchange orderId for access token (after webhook confirms)' })
  activateInsights(@Body() dto: { orderId: string; email?: string }) {
    return this.svc.activateInsightsAccess(dto.orderId, dto.email);
  }

  @Post('webhook')
  @SkipThrottle()
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay webhook (raw body + x-razorpay-signature)' })
  async webhook(
    @Headers('x-razorpay-signature') sig: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const raw = req.rawBody;
    if (!raw) throw new BadRequestException('rawBody missing');
    return this.commandBus.execute(new ProcessWebhookCommand(sig, raw));
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List recent payments (admin)' })
  listAdmin() { return this.svc.findAllForAdmin(); }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payment aggregates (admin)' })
  stats() { return this.svc.paymentStats(); }
}
