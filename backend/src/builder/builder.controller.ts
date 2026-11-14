import { Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BuilderService } from './builder.service';
import {
  AdminUpdateDto, FeatureDecisionDto, FeatureRequestDto, ForgotDto, LoginDto, MarkPaidDto, OtpDto, RequestDto, SetupDto,
} from './builder.dto';
import { ClientAuthService } from './client-auth.service';
import { FeatureService } from './feature.service';
import { CLIENT_PERMISSIONS } from './portfolio-request.entity';

/** Portfolio-as-a-service requests: clients use a crew token, the admin a JWT. */
@ApiTags('Portfolio builder')
@Controller('builder')
export class BuilderController {
  constructor(
    private readonly svc: BuilderService,
    private readonly auth: ClientAuthService,
    private readonly features: FeatureService,
  ) {}

  @Get('permissions')
  @ApiOperation({ summary: 'The permission ids the admin can grant a client' })
  permissionCatalog() { return CLIENT_PERMISSIONS; }

  @Get('mine')
  @ApiOperation({ summary: 'My portfolio requests (crew token)' })
  mine(@Headers('x-crew-token') t?: string) { return this.svc.mine(t); }

  @Post('requests')
  @Throttle({ default: { ttl: 3_600_000, limit: 6 } })
  @ApiOperation({ summary: 'Request a portfolio (crew token)' })
  create(@Headers('x-crew-token') t: string | undefined, @Body() dto: RequestDto) { return this.svc.create(t, dto); }

  @Patch('requests/:id')
  update(@Headers('x-crew-token') t: string | undefined, @Param('id', ParseIntPipe) id: number, @Body() dto: RequestDto) {
    return this.svc.update(t, id, dto);
  }

  @Post('requests/:id/accept')
  accept(@Headers('x-crew-token') t: string | undefined, @Param('id', ParseIntPipe) id: number) { return this.svc.accept(t, id); }

  @Post('requests/:id/cancel')
  cancel(@Headers('x-crew-token') t: string | undefined, @Param('id', ParseIntPipe) id: number) { return this.svc.cancel(t, id); }

  @Get('admin/requests')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  all() { return this.svc.findAll(); }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  stats() { return this.svc.stats(); }

  @Patch('admin/requests/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  adminUpdate(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateDto) { return this.svc.adminUpdate(id, dto); }

  @Post('admin/requests/:id/payment-link')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  paymentLink(@Param('id', ParseIntPipe) id: number) { return this.svc.paymentLink(id); }

  @Post('admin/requests/:id/verify-payment')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Check the Razorpay link; if paid, confirm it and email the client a setup link' })
  verifyPayment(@Param('id', ParseIntPipe) id: number) { return this.svc.verifyPayment(id); }

  @Post('admin/requests/:id/mark-paid')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a payment received outside Razorpay, with a reference' })
  markPaid(@Param('id', ParseIntPipe) id: number, @Body() dto: MarkPaidDto) { return this.svc.markPaid(id, dto.reference); }

  @Post('admin/requests/:id/resend-credentials')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  resend(@Param('id', ParseIntPipe) id: number) { return this.svc.resendCredentials(id); }

  /* ── Client sign-in (issued only after a confirmed payment) ── */

  @Post('client/setup')
  @Throttle({ default: { ttl: 600_000, limit: 10 } })
  setup(@Body() dto: SetupDto) { return this.auth.setup(dto.token, dto.password); }

  @Post('client/login')
  @Throttle({ default: { ttl: 600_000, limit: 10 } })
  login(@Body() dto: LoginDto) { return this.auth.login(dto.email, dto.password); }

  @Post('client/verify')
  @Throttle({ default: { ttl: 600_000, limit: 10 } })
  verify(@Body() dto: OtpDto) { return this.auth.verify(dto.email, dto.code); }

  @Post('client/forgot')
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  forgot(@Body() dto: ForgotDto) { return this.auth.forgot(dto.email); }

  @Get('client/me')
  clientMe(@Headers('x-client-token') t?: string) { return this.auth.me(t); }

  @Post('client/logout')
  clientLogout(@Headers('x-client-token') t?: string) { return this.auth.logout(t); }

  /* ── Client features, each gated on a permission the admin granted ── */

  @Get('client/features')
  @ApiOperation({ summary: 'My feature requests and the permissions I hold' })
  myFeatures(@Headers('x-client-token') t?: string) { return this.features.mine(t); }

  @Post('client/features')
  @Throttle({ default: { ttl: 3_600_000, limit: 12 } })
  @ApiOperation({ summary: 'Ask for a new feature; it stays pending until the admin approves it' })
  askFeature(@Headers('x-client-token') t: string | undefined, @Body() dto: FeatureRequestDto) { return this.features.create(t, dto); }

  @Delete('client/features/:id')
  dropFeature(@Headers('x-client-token') t: string | undefined, @Param('id', ParseIntPipe) id: number) { return this.features.cancel(t, id); }

  @Get('client/export')
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  @ApiOperation({ summary: 'Download everything stored about my portfolio (needs download_data)' })
  exportMine(@Headers('x-client-token') t?: string) { return this.features.exportData(t); }

  @Patch('client/content')
  @Throttle({ default: { ttl: 600_000, limit: 20 } })
  @ApiOperation({ summary: 'Edit my own headline, about, links and skills (needs edit_content)' })
  editContent(@Headers('x-client-token') t: string | undefined, @Body() body: any) { return this.features.editContent(t, body ?? {}); }

  @Post('client/sign-out-everywhere')
  signOutAll(@Headers('x-client-token') t?: string) { return this.features.signOutEverywhere(t); }

  /* ── Admin: permissions, the feature queue and the audit trail ── */

  @Get('admin/features')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  allFeatures(@Query('status') status?: string) { return this.features.adminList(status); }

  @Get('admin/features/stats')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  featureStats() { return this.features.stats(); }

  @Patch('admin/features/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve, price or reject a client feature request' })
  decideFeature(@Param('id', ParseIntPipe) id: number, @Body() dto: FeatureDecisionDto) { return this.features.decide(id, dto); }

  @Get('admin/audit')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  audit(@Query('requestId') requestId?: string) {
    const id = Number(requestId);
    return this.features.auditTrail(Number.isFinite(id) && id > 0 ? id : undefined);
  }
}
