import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LmsCourse, LmsChapter, LmsTopic, LmsEnrollment } from './lms.entity';
import { LmsService } from './lms.service';
import { LmsController } from './lms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LmsCourse, LmsChapter, LmsTopic, LmsEnrollment])],
  controllers: [LmsController],
  providers: [LmsService],
})
export class LmsModule {}
