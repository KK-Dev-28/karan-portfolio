import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AiToolsService } from './ai-tools.service';
import { FreeIdeasDto, SendCodeDto, VerifyCodeDto } from './ai-tools.dto';

@Controller('ai-tools')
@UseGuards(ThrottlerGuard)
export class AiToolsController {
  constructor(private readonly svc: AiToolsService) {}

  @Get('remaining')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async getRemaining(@Query('email') email: string, @Query('service') service = 'ideas') {
    if (!email) return { remaining: 3 };
    const remaining = await this.svc.getRemainingUses(email, service);
    return { remaining };
  }

  @Post('send-code')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  sendCode(@Body() body: SendCodeDto) {
    return this.svc.sendCode(body.email);
  }

  @Post('verify-code')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verifyCode(@Body() body: VerifyCodeDto) {
    return this.svc.verifyCode(body.email, body.code);
  }

  @Post('ideas')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  generateIdeas(@Body() body: FreeIdeasDto) {
    return this.svc.generateIdeas(body.email, body.topic);
  }
}
