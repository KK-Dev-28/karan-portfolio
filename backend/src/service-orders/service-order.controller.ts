import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ServiceOrderService } from './service-order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('service-orders')
export class ServiceOrderController {
  constructor(private readonly svc: ServiceOrderService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  create(@Body() dto: CreateOrderDto) {
    return this.svc.createOrder(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.svc.findAll();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; adminNotes?: string },
  ) {
    return this.svc.updateStatus(id, body.status, body.adminNotes);
  }
}
