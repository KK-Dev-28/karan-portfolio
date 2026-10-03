import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/* TaskFlow signs its own tokens with its own secret, so a token minted by
   self-service registration can never be presented to an admin endpoint even
   if that endpoint's checks were ever loosened. The scope claim is a second
   guard on the same idea. */
@Injectable()
export class TaskflowAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers?.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwt.verifyAsync(token);
      if (payload?.scope !== 'taskflow') throw new Error('wrong scope');
      req.taskflowUserId = String(payload.sub);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
