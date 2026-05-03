import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Injectable()
export class InsightsAccessGuard implements CanActivate {
  constructor(private readonly payments: PaymentService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing subscription token');
    }
    const token = auth.slice('Bearer '.length).trim();
    const valid = await this.payments.validateInsightsToken(token);
    if (!valid) throw new UnauthorizedException('Subscription token is invalid or expired');
    return true;
  }
}
