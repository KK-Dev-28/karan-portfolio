import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly svc: ReviewService) {}

  @Get()
  getApproved() {
    return this.svc.findApproved();
  }

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  submit(@Body() dto: CreateReviewDto) {
    return this.svc.create(dto);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.svc.findAll();
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard)
  moderate(@Param('id', ParseIntPipe) id: number, @Body() body: { status: 'approved' | 'rejected' }) {
    return this.svc.moderate(id, body.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
