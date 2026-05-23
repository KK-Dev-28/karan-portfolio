import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('wa')
export class WaRedirectController {
  constructor(private readonly cfg: ConfigService) {}

  @Get()
  @SkipThrottle()
  redirect(@Query('text') text: string = '', @Res() res: Response) {
    const number = this.cfg.get<string>('WHATSAPP_NUMBER') ?? '';
    const encoded = text ? encodeURIComponent(text) : '';
    const url = `https://wa.me/${number}${encoded ? `?text=${encoded}` : ''}`;
    res.redirect(302, url);
  }
}
