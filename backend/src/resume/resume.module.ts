import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 20_000,
      maxRedirects: 0,
    }),
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
