import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ShopService } from './shop.service';
import { AddToCartDto, UpdateCartDto, CheckoutDto } from './shop.dto';

/* Namespaced under /api/shop. Public by design: the catalogue is fixture data
   and every cart or order is scoped to a session id the browser generates. */
@ApiTags('E-Commerce demo')
@Controller('shop')
export class ShopController {
  constructor(private svc: ShopService) {}

  @Get('categories')
  categories() {
    return this.svc.listCategories();
  }

  @Get('products')
  products(@Query('category') category?: string) {
    return this.svc.listProducts(category);
  }

  @Get('products/:slug')
  product(@Param('slug') slug: string) {
    return this.svc.getProduct(slug);
  }

  @Get('cart')
  cart(@Query('sessionId') sessionId: string) {
    return this.svc.getCart(sessionId ?? '');
  }

  @Post('cart')
  addToCart(@Body() dto: AddToCartDto) {
    return this.svc.addToCart(dto);
  }

  @Put('cart/:productId')
  updateCartItem(@Param('productId') productId: string, @Body() dto: UpdateCartDto) {
    return this.svc.updateCartItem(productId, dto);
  }

  @Delete('cart')
  clearCart(@Query('sessionId') sessionId: string) {
    return this.svc.clearCart(sessionId ?? '');
  }

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto) {
    return this.svc.checkout(dto);
  }

  @Get('orders')
  orders(@Query('sessionId') sessionId: string) {
    return this.svc.listOrders(sessionId ?? '');
  }

  @Get('orders/:reference')
  order(@Param('reference') reference: string) {
    return this.svc.getOrder(reference);
  }

  /* Drives the back-office queues from the original app so a visitor can walk
     an order through pending → approved → shipped. */
  @Post('orders/:reference/advance')
  advance(@Param('reference') reference: string) {
    return this.svc.advanceOrder(reference);
  }
}
