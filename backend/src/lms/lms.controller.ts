import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { LmsService } from './lms.service';
import { EnrollDto, ProgressDto } from './lms.dto';

/* Namespaced under /api/lms so the demo can never shadow a portfolio route.
   Everything is public — the catalogue is fixture data, and progress is scoped
   to a session id the visitor's own browser generates. */
@ApiTags('LMS demo')
@Controller('lms')
export class LmsController {
  constructor(private svc: LmsService) {}

  @Get('courses')
  listCourses() {
    return this.svc.listCourses();
  }

  @Get('courses/:slug')
  getCourse(@Param('slug') slug: string, @Query('sessionId') sessionId?: string) {
    return this.svc.getCourse(slug, sessionId);
  }

  @Get('enrollments')
  myEnrollments(@Query('sessionId') sessionId: string) {
    return this.svc.myEnrollments(sessionId ?? '');
  }

  @Post('enrollments')
  enroll(@Body() dto: EnrollDto) {
    return this.svc.enroll(dto);
  }

  @Post('progress')
  toggleProgress(@Body() dto: ProgressDto) {
    return this.svc.toggleProgress(dto);
  }
}
