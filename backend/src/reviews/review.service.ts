import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(@InjectRepository(Review) private repo: Repository<Review>) {}

  create(dto: CreateReviewDto) {
    return this.repo.save(this.repo.create({ ...dto, status: 'pending' }));
  }

  findApproved() {
    return this.repo.find({ where: { status: 'approved' }, order: { createdAt: 'DESC' } });
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async moderate(id: number, status: 'approved' | 'rejected') {
    await this.repo.update(id, { status });
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { ok: true };
  }
}
