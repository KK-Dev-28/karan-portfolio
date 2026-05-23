import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(private jwt: JwtService, private cfg: ConfigService) {}

  async login(password: string, ip = 'unknown') {
    const expected = (this.cfg.get<string>('ADMIN_PASSWORD') ?? '').trim();
    const attempt  = (password ?? '').trim();

    if (!attempt || !expected || attempt !== expected) {
      this.log.warn(`[AUTH] Failed login attempt from IP ${ip}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.log.log(`[AUTH] Successful admin login from IP ${ip}`);
    return {
      access_token: this.jwt.sign({
        sub:  'admin',
        role: 'admin',
        jti:  randomUUID(),
      }),
    };
  }
}
