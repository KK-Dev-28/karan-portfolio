import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Demo } from './demo.entity';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Demo])],
  providers: [DemoService],
  controllers: [DemoController],
  exports: [DemoService],
})
export class DemoModule {}
