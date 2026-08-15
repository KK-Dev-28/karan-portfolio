import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ShopCategory, ShopProduct, ShopCartItem, ShopOrder } from './shop.entity';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShopCategory, ShopProduct, ShopCartItem, ShopOrder])],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
