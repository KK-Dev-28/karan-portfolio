// contact.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(@InjectRepository(ContactMessage) private repo: Repository<ContactMessage>) {}
  async create(dto: CreateContactDto, ip: string) {
    return this.repo.save(this.repo.create({ ...dto, ip }));
  }
  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async markRead(id: number) { await this.repo.update(id, { isRead: true }); return { ok: true }; }
  async unreadCount() { return { count: await this.repo.count({ where: { isRead: false } }) }; }
}
