// visitor.controller.ts
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { VisitorService } from './visitor.service';
import { LogVisitDto } from './dto/log-visit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InsightsAccessGuard } from '../payment/insights-access.guard';

@ApiTags('Visitors')
@Controller('visitors')
export class VisitorController {
  constructor(private svc: VisitorService) {}

  @Post('log')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Log a page visit (public, rate-limited)' })
  log(@Body() dto: LogVisitDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
              || req.socket.remoteAddress || '0.0.0.0';
    return this.svc.log(dto, ip);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Full analytics — admin only' })
  analytics() { return this.svc.analytics(); }

  @Get('premium-analytics')
  @UseGuards(InsightsAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paid analytics access (Bearer subscription token)' })
  premiumAnalytics() { return this.svc.analytics(); }
}
