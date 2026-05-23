import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlogJwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private cfg: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] ?? '';
    if (!auth.startsWith('Bearer ')) throw new UnauthorizedException('Blog token required.');
    const token = auth.slice(7);
    try {
      const payload = this.jwt.verify(token, { secret: this.cfg.get('BLOG_JWT_SECRET') || this.cfg.get('JWT_SECRET') });
      if (payload.type !== 'blog') throw new Error();
      req.blogUser = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired blog token.');
    }
  }
}
