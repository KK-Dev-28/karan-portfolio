import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedLayout } from './layout.entity';
import { LayoutService } from './layout.service';
import { LayoutController } from './layout.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GeneratedLayout])],
  providers: [LayoutService],
  controllers: [LayoutController],
})
export class LayoutModule {}
