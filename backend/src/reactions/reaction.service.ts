import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction } from './reaction.entity';

@Injectable()
export class ReactionService {
  constructor(@InjectRepository(Reaction) private repo: Repository<Reaction>) {}

  async getSectionReactions(section: string, ip?: string) {
    const [likes, comments] = await Promise.all([
      this.repo.count({ where: { section, type: 'like' } }),
      this.repo.find({
        where: { section, type: 'comment', visible: true },
        order: { createdAt: 'DESC' },
        take: 20,
        select: ['id', 'name', 'content', 'createdAt'],
      }),
    ]);
    const hasLiked = ip
      ? !!(await this.repo.findOneBy({ section, type: 'like', ip }))
      : false;
    return { likes, comments, hasLiked, commentCount: comments.length };
  }

  async getAllCounts() {
    const rows = await this.repo
      .createQueryBuilder('r')
      .select('r.section', 'section')
      .addSelect('r.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('r.visible = true')
      .groupBy('r.section')
      .addGroupBy('r.type')
      .getRawMany();

    const out: Record<string, { likes: number; comments: number }> = {};
    for (const r of rows) {
      if (!out[r.section]) out[r.section] = { likes: 0, comments: 0 };
      if (r.type === 'like') out[r.section].likes = Number(r.count);
      if (r.type === 'comment') out[r.section].comments = Number(r.count);
    }
    return out;
  }

  async toggleLike(section: string, ip: string): Promise<{ liked: boolean; likes: number }> {
    const existing = await this.repo.findOneBy({ section, type: 'like', ip });
    if (existing) {
      await this.repo.remove(existing);
    } else {
      await this.repo.save(this.repo.create({ section, type: 'like', ip }));
    }
    const likes = await this.repo.count({ where: { section, type: 'like' } });
    return { liked: !existing, likes };
  }

  async addComment(section: string, ip: string, content: string, name?: string) {
    const trimmed = (content ?? '').trim().slice(0, 500);
    if (!trimmed) return;
    const reaction = this.repo.create({
      section, type: 'comment', ip,
      name: (name ?? '').trim().slice(0, 80) || 'Anonymous',
      content: trimmed,
    });
    return this.repo.save(reaction);
  }

  async getAllAdmin() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 500 });
  }

  async removeReaction(id: number) {
    await this.repo.delete(id);
    return { ok: true };
  }
}
