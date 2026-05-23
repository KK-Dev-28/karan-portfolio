import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Demo } from './demo.entity';

@Injectable()
export class DemoService {
  constructor(@InjectRepository(Demo) private repo: Repository<Demo>) {}

  findAll() {
    return this.repo.find({ where: { visible: true }, order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  findAllAdmin() {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  create(dto: Partial<Demo>) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: Partial<Demo>) {
    const demo = await this.repo.findOneBy({ id });
    if (!demo) throw new NotFoundException('Demo not found');
    Object.assign(demo, dto);
    return this.repo.save(demo);
  }

  async remove(id: number) {
    const demo = await this.repo.findOneBy({ id });
    if (!demo) throw new NotFoundException('Demo not found');
    return this.repo.remove(demo);
  }
}
