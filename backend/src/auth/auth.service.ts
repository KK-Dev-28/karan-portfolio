import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(private jwt: JwtService, private cfg: ConfigService) {}

  async login(password: string) {
    const raw = this.cfg.get<string>('ADMIN_PASSWORD') ?? 'Karan@Admin2025';
    const expected = raw.trim();
    const attempt = (password ?? '').trim();
    const configured = !!this.cfg.get<string>('ADMIN_PASSWORD');

    if (attempt.length === 0 || attempt !== expected) {
      this.log.warn(
        `Admin login rejected (ADMIN_PASSWORD ${configured ? 'loaded from env' : 'using fallback default'})`,
      );
      throw new UnauthorizedException('Invalid password');
    }

    this.log.log('Admin login OK');
    return { access_token: this.jwt.sign({ sub: 'admin', role: 'admin' }) };
  }
}
