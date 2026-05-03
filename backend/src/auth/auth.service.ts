// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private cfg: ConfigService) {}
  async login(password: string) {
    if (password !== this.cfg.get('ADMIN_PASSWORD', 'Karan@Admin2025'))
      throw new UnauthorizedException('Invalid password');
    return { access_token: this.jwt.sign({ sub: 'admin', role: 'admin' }) };
  }
}
