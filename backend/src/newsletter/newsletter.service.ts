import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriber } from './newsletter.entity';
import { SubscribeNewsletterDto } from './dto/subscribe.dto';

@Injectable()
export class NewsletterService {
  constructor(@InjectRepository(NewsletterSubscriber) private readonly repo: Repository<NewsletterSubscriber>) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.repo.findOne({ where: { email } });
    if (existing) return { ok: true, message: 'You are already subscribed.' };
    try {
      await this.repo.save(this.repo.create({ email, source: dto.source || 'footer' }));
    } catch {
      throw new ConflictException('Could not save subscription');
    }
    return { ok: true, message: 'Thanks — you are on the list.' };
  }

  findAllForAdmin() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 500 });
  }

  findRecentForDashboard(limit = 120) {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async count() {
    return { count: await this.repo.count() };
  }
}
