import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHash, timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison. Hashing first normalizes both inputs to a
 * fixed 32-byte length so timingSafeEqual never short-circuits on a length
 * mismatch — that would otherwise leak the expected password's length via
 * response timing.
 */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(private jwt: JwtService, private cfg: ConfigService) {}

  async login(password: string, ip = 'unknown') {
    const expected = (this.cfg.get<string>('ADMIN_PASSWORD') ?? '').trim();
    const attempt  = (password ?? '').trim();

    if (!attempt || !expected || !safeEqual(attempt, expected)) {
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
