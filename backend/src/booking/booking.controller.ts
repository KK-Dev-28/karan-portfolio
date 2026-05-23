import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
export class BookingController {
  constructor(private readonly svc: BookingService) {}

  @Get('sessions')
  getSessions() { return this.svc.getSessions(); }

  @Post('checkout')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  createOrder(@Body() body: { sessionType: string; name: string; email: string; phone?: string; message?: string }) {
    return this.svc.createOrder(body);
  }

  @Post('verify')
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  verifyPayment(@Body() body: { orderId: string; paymentId: string; signature: string }) {
    return this.svc.verifyPayment(body.orderId, body.paymentId, body.signature);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() { return this.svc.findAll(); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string; scheduledAt?: string; adminNotes?: string }) {
    return this.svc.updateStatus(id, body.status, body.scheduledAt, body.adminNotes);
  }
}
