import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('surveys')
export class SurveyController {
  constructor(private readonly svc: SurveyService) {}

  @Get('active')
  getActive() {
    return this.svc.findActive();
  }

  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Post(':id/respond')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  respond(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { answers: Record<string, any>; respondentEmail?: string; respondentName?: string },
  ) {
    return this.svc.submitResponse(id, body.answers, body.respondentEmail, body.respondentName);
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.svc.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  @Get(':id/responses')
  @UseGuards(JwtAuthGuard)
  getResponses(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getResponses(id);
  }
}
