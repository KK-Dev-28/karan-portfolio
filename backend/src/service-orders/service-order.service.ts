import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder } from './service-order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class ServiceOrderService {
  constructor(@InjectRepository(ServiceOrder) private repo: Repository<ServiceOrder>) {}

  async createOrder(dto: CreateOrderDto): Promise<ServiceOrder> {
    return this.repo.save(
      this.repo.create({
        serviceType:   dto.serviceType,
        requirements:  dto.requirements,
        customerName:  dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        status:        'pending',
      }),
    );
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: number, status: string, adminNotes?: string) {
    await this.repo.update(id, { status, ...(adminNotes ? { adminNotes } : {}) });
    return this.repo.findOne({ where: { id } });
  }
}
