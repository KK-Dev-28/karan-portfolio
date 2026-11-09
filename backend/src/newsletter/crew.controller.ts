import { Body, Controller, Delete, Get, Headers, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { CrewService, CREW_TOPICS } from './crew.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class StartDto {
  @IsEmail() @MaxLength(320) email: string;
  @IsOptional() @IsString() @MaxLength(80) name?: string;
}
class VerifyDto {
  @IsEmail() @MaxLength(320) email: string;
  @IsString() @Length(6, 6) code: string;
}
class UpdateDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(3) @IsIn(CREW_TOPICS as unknown as string[], { each: true }) topics?: string[];
  @IsOptional() @IsBoolean() subscribed?: boolean;
}
class BroadcastDto {
  @IsString() @Length(3, 140) subject: string;
  @IsString() @Length(10, 8000) body: string;
  @IsOptional() @IsIn(CREW_TOPICS as unknown as string[]) topic?: string;
}

/** Visitor accounts ("mission crew") with email-code sign-in, and admin broadcasts. */
@ApiTags('Crew')
@Controller('crew')
export class CrewController {
  constructor(private readonly svc: CrewService) {}

  @Post('start')
  @Throttle({ default: { ttl: 600_000, limit: 5 } })
  @ApiOperation({ summary: 'Email a 6-digit sign-in code (public)' })
  start(@Body() dto: StartDto) { return this.svc.start(dto.email, dto.name); }

  @Post('verify')
  @Throttle({ default: { ttl: 600_000, limit: 10 } })
  @ApiOperation({ summary: 'Exchange the code for a session token (public)' })
  verify(@Body() dto: VerifyDto) { return this.svc.verify(dto.email, dto.code); }

  @Get('me')
  me(@Headers('x-crew-token') t?: string) { return this.svc.me(t); }

  @Patch('me')
  update(@Headers('x-crew-token') t: string | undefined, @Body() dto: UpdateDto) { return this.svc.update(t, dto); }

  @Post('logout')
  logout(@Headers('x-crew-token') t?: string) { return this.svc.logout(t); }

  @Delete('me')
  @ApiOperation({ summary: 'Delete my crew account and email address' })
  remove(@Headers('x-crew-token') t?: string) { return this.svc.remove(t); }

  @Get('unsubscribe')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async unsubscribe(@Query('u') u: string, @Res() res: Response) {
    const ok = await this.svc.unsubscribe(u);
    res.type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
      <title>Unsubscribed</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0b0c;color:#f1ede3;font-family:Georgia,serif;text-align:center;padding:24px">
      <div><h1 style="font-weight:400">${ok ? "You're unsubscribed." : 'That link is not valid any more.'}</h1>
      <p style="color:#a19d90;font-family:sans-serif">${ok ? 'No more emails. You can rejoin from the portfolio anytime.' : 'You may already be unsubscribed.'}</p></div></body>`);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  stats() { return this.svc.stats(); }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Email all subscribers who want this topic (admin)' })
  broadcast(@Body() dto: BroadcastDto) { return this.svc.broadcast(dto.subject, dto.body, dto.topic); }
}
