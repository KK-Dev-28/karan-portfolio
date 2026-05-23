import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrder } from './service-order.entity';
import { ServiceOrderService } from './service-order.service';
import { ServiceOrderController } from './service-order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder])],
  providers: [ServiceOrderService],
  controllers: [ServiceOrderController],
  exports: [ServiceOrderService],
})
export class ServiceOrderModule {}
