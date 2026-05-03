import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioUpdate } from './portfolio-update.entity';
import { CreatePortfolioUpdateDto } from './dto/create-portfolio-update.dto';
import { UpdatePortfolioUpdateDto } from './dto/update-portfolio-update.dto';

@Injectable()
export class PortfolioUpdateService {
  constructor(
    @InjectRepository(PortfolioUpdate) private readonly repo: Repository<PortfolioUpdate>,
  ) {}

  findPublished() {
    return this.repo.find({
      where: { isPublished: true },
      order: { publishedAt: 'DESC', id: 'DESC' },
      take: 100,
    });
  }

  findAllForAdmin() {
    return this.repo.find({
      order: { updatedAt: 'DESC' },
      take: 200,
    });
  }

  async create(dto: CreatePortfolioUpdateDto) {
    const published = dto.isPublished !== false;
    const row = this.repo.create({
      kind: dto.kind,
      title: dto.title.trim(),
      body: dto.body.trim(),
      linkUrl: dto.linkUrl?.trim() || null,
      isPublished: published,
      publishedAt: published ? new Date() : null,
    });
    return this.repo.save(row);
  }

  async update(id: number, dto: UpdatePortfolioUpdateDto) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Update not found');
    if (dto.kind !== undefined) row.kind = dto.kind;
    if (dto.title !== undefined) row.title = dto.title.trim();
    if (dto.body !== undefined) row.body = dto.body.trim();
    if (dto.linkUrl !== undefined) row.linkUrl = dto.linkUrl?.trim() || null;
    if (dto.isPublished !== undefined) {
      row.isPublished = dto.isPublished;
      if (dto.isPublished && !row.publishedAt) row.publishedAt = new Date();
      if (!dto.isPublished) row.publishedAt = null;
    }
    return this.repo.save(row);
  }

  async remove(id: number) {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Update not found');
    return { ok: true };
  }
}
