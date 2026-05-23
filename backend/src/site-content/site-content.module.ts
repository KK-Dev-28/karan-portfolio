import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteContent } from './site-content.entity';
import { SiteContentService } from './site-content.service';
import { SiteContentController } from './site-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContent])],
  providers: [SiteContentService],
  controllers: [SiteContentController],
  exports: [SiteContentService],
})
export class SiteContentModule {}
