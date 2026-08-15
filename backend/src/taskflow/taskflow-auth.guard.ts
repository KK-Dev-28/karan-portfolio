import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/* Verifies TaskFlow's own tokens. Written against JwtService rather than a
   Passport strategy on purpose: the portfolio already registers a strategy
   named 'jwt' for admin sessions, and a second one would have to either share
   that name or be wired in everywhere it is used. Checking typ here also means
   an admin token cannot be replayed against demo data, and the admin guard
   already rejects these (it demands role:'admin'). */
@Injectable()
export class TaskflowAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    try {
      const payload = this.jwt.verify(token);
      if (payload?.typ !== 'taskflow') throw new Error('wrong token type');
      req.taskflowUserId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
