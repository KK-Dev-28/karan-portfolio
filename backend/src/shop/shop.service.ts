import {
  Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { randomInt } from 'crypto';

import { ShopCategory, ShopProduct, ShopCartItem, ShopOrder } from './shop.entity';
import { AddToCartDto, UpdateCartDto, CheckoutDto } from './shop.dto';

@Injectable()
export class ShopService implements OnModuleInit {
  private readonly log = new Logger(ShopService.name);

  constructor(
    @InjectRepository(ShopCategory) private categories: Repository<ShopCategory>,
    @InjectRepository(ShopProduct)  private products: Repository<ShopProduct>,
    @InjectRepository(ShopCartItem) private cart: Repository<ShopCartItem>,
    @InjectRepository(ShopOrder)    private orders: Repository<ShopOrder>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    if (await this.categories.count()) return;
    await this.seed();
    this.log.log('Shop demo catalogue seeded');
  }

  // ── catalogue ─────────────────────────────────────────────────────────────

  listCategories() {
    return this.categories.find({ order: { sortOrder: 'ASC' } });
  }

  async listProducts(categorySlug?: string) {
    let categoryId: string | undefined;

    if (categorySlug && categorySlug !== 'all') {
      const cat = await this.categories.findOne({ where: { slug: categorySlug } });
      if (!cat) throw new NotFoundException('Category not found.');
      categoryId = cat.id;
    }

    const rows = await this.products.find({
      where: categoryId ? { categoryId } : {},
      order: { sortOrder: 'ASC' },
      relations: ['category'],
    });
    return rows.map(ShopService.toClient);
  }

  async getProduct(slug: string) {
    const row = await this.products.findOne({ where: { slug }, relations: ['category'] });
    if (!row) throw new NotFoundException('Product not found.');
    return ShopService.toClient(row);
  }

  // ── cart ──────────────────────────────────────────────────────────────────

  async getCart(sessionId: string) {
    const items = await this.cart.find({ where: { sessionId } });
    if (!items.length) return { items: [], totalPaise: 0, count: 0 };

    const products = await this.products.find({
      where: { id: In(items.map(i => i.productId)) },
      relations: ['category'],
    });
    const byId = new Map(products.map(p => [p.id, p]));

    /* A product removed from the catalogue leaves an orphan line; drop it from
       the view rather than rendering a blank row or throwing. */
    const lines = items
      .filter(i => byId.has(i.productId))
      .map(i => {
        const p = byId.get(i.productId)!;
        return {
          productId: p.id,
          quantity: i.quantity,
          product: ShopService.toClient(p),
          lineTotalPaise: p.pricePaise * i.quantity,
        };
      });

    return {
      items: lines,
      totalPaise: lines.reduce((sum, l) => sum + l.lineTotalPaise, 0),
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
    };
  }

  async addToCart(dto: AddToCartDto) {
    const product = await this.products.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found.');

    const qty = dto.quantity ?? 1;
    const existing = await this.cart.findOne({
      where: { sessionId: dto.sessionId, productId: dto.productId },
    });

    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + qty);
      await this.cart.save(existing);
    } else {
      await this.cart.save(
        this.cart.create({ sessionId: dto.sessionId, productId: dto.productId, quantity: qty }),
      );
    }
    return this.getCart(dto.sessionId);
  }

  async updateCartItem(productId: string, dto: UpdateCartDto) {
    const existing = await this.cart.findOne({
      where: { sessionId: dto.sessionId, productId },
    });
    if (!existing) throw new NotFoundException('That item is not in the cart.');

    if (dto.quantity === 0) await this.cart.remove(existing);
    else { existing.quantity = dto.quantity; await this.cart.save(existing); }

    return this.getCart(dto.sessionId);
  }

  async clearCart(sessionId: string) {
    await this.cart.delete({ sessionId });
    return { ok: true };
  }

  // ── checkout ──────────────────────────────────────────────────────────────

  /* Runs in a transaction: the order insert, the stock decrements and the cart
     clear have to land together, otherwise a failure halfway through bills a
     visitor for an order that was never recorded. */
  async checkout(dto: CheckoutDto) {
    const cart = await this.getCart(dto.sessionId);
    if (!cart.items.length) throw new BadRequestException('Your cart is empty.');

    const short = cart.items.find(l => l.product.stock < l.quantity);
    if (short) throw new BadRequestException(`Only ${short.product.stock} left of ${short.product.name}.`);

    return this.dataSource.transaction(async manager => {
      const order = await manager.save(
        manager.create(ShopOrder, {
          sessionId: dto.sessionId,
          reference: `ORD-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 9999)}`,
          customerName: dto.customerName?.trim() || 'Guest',
          totalPaise: cart.totalPaise,
          status: 'pending',
          lines: cart.items.map(l => ({
            productId: l.productId,
            name: l.product.name,
            unitPricePaise: l.product.pricePaise,
            quantity: l.quantity,
          })),
        }),
      );

      for (const line of cart.items) {
        await manager.decrement(ShopProduct, { id: line.productId }, 'stock', line.quantity);
      }
      await manager.delete(ShopCartItem, { sessionId: dto.sessionId });

      return ShopService.orderToClient(order);
    });
  }

  async listOrders(sessionId: string) {
    const rows = await this.orders.find({ where: { sessionId }, order: { placedAt: 'DESC' } });
    return rows.map(ShopService.orderToClient);
  }

  async getOrder(reference: string) {
    const row = await this.orders.findOne({ where: { reference } });
    if (!row) throw new NotFoundException('Order not found.');
    return ShopService.orderToClient(row);
  }

  /* Mirrors the back-office queues in the original: pending → approved →
     shipped, with cancel available until it ships. */
  async advanceOrder(reference: string) {
    const row = await this.orders.findOne({ where: { reference } });
    if (!row) throw new NotFoundException('Order not found.');

    const next: Record<string, string> = { pending: 'approved', approved: 'shipped' };
    const to = next[row.status];
    if (!to) throw new BadRequestException(`An order that is ${row.status} cannot be advanced.`);

    row.status = to;
    await this.orders.save(row);
    return ShopService.orderToClient(row);
  }

  // ── mapping ───────────────────────────────────────────────────────────────

  /* Prices cross the wire in both units: paise stays authoritative for any
     arithmetic, while the formatted string keeps rounding rules in one place
     instead of in every component that renders a price. */
  private static toClient(p: ShopProduct) {
    return {
      ...p,
      priceInr: p.pricePaise / 100,
      priceLabel: `₹${(p.pricePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      inStock: p.stock > 0,
    };
  }

  private static orderToClient(o: ShopOrder) {
    return {
      ...o,
      totalInr: o.totalPaise / 100,
      totalLabel: `₹${(o.totalPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      itemCount: o.lines.reduce((sum, l) => sum + l.quantity, 0),
    };
  }

  // ── fixture data ──────────────────────────────────────────────────────────

  private async seed() {
    const cats = await this.categories.save([
      this.categories.create({ slug: 'audio',       name: 'Audio',       sortOrder: 1 }),
      this.categories.create({ slug: 'workspace',   name: 'Workspace',   sortOrder: 2 }),
      this.categories.create({ slug: 'accessories', name: 'Accessories', sortOrder: 3 }),
    ]);
    const id = (slug: string) => cats.find(c => c.slug === slug)!.id;

    await this.products.save([
      { slug: 'studio-headphones',  name: 'Studio Over-Ear Headphones', categoryId: id('audio'),       pricePaise: 899000, stock: 14, imageEmoji: '🎧', rating: 4.7, sortOrder: 1, description: 'Closed-back monitors with a flat response, made for long mixing sessions rather than flattering playback.' },
      { slug: 'wireless-earbuds',   name: 'Wireless Earbuds Pro',       categoryId: id('audio'),       pricePaise: 549000, stock: 27, imageEmoji: '🎵', rating: 4.4, sortOrder: 2, description: 'Active noise cancelling with a transparency mode, and about six hours a charge.' },
      { slug: 'desk-microphone',    name: 'Cardioid Desk Microphone',   categoryId: id('audio'),       pricePaise: 729000, stock: 9,  imageEmoji: '🎙️', rating: 4.6, sortOrder: 3, description: 'USB condenser with a cardioid pattern that keeps room noise out of calls and recordings.' },
      { slug: 'standing-desk',      name: 'Electric Standing Desk',     categoryId: id('workspace'),   pricePaise: 2499000, stock: 5, imageEmoji: '🪑', rating: 4.8, sortOrder: 4, description: 'Dual-motor frame with four height presets and a 100 kg load rating.' },
      { slug: 'monitor-arm',        name: 'Single Monitor Arm',         categoryId: id('workspace'),   pricePaise: 419000, stock: 22, imageEmoji: '🖥️', rating: 4.3, sortOrder: 5, description: 'Gas-spring arm for panels up to 32 inches, clamp or grommet mount.' },
      { slug: 'desk-lamp',          name: 'Adjustable Desk Lamp',       categoryId: id('workspace'),   pricePaise: 259000, stock: 31, imageEmoji: '💡', rating: 4.2, sortOrder: 6, description: 'Stepless dimming across a warm-to-cool range, with a very high CRI.' },
      { slug: 'mechanical-keyboard',name: '75% Mechanical Keyboard',    categoryId: id('accessories'), pricePaise: 689000, stock: 18, imageEmoji: '⌨️', rating: 4.9, sortOrder: 7, description: 'Hot-swappable switches, gasket mount, and QMK-compatible firmware.' },
      { slug: 'ergonomic-mouse',    name: 'Vertical Ergonomic Mouse',   categoryId: id('accessories'), pricePaise: 329000, stock: 25, imageEmoji: '🖱️', rating: 4.1, sortOrder: 8, description: 'A vertical grip that keeps the forearm neutral, with six programmable buttons.' },
      { slug: 'usb-c-hub',          name: '8-in-1 USB-C Hub',           categoryId: id('accessories'), pricePaise: 379000, stock: 0,  imageEmoji: '🔌', rating: 4.0, sortOrder: 9, description: 'HDMI, ethernet, card reader and 100 W pass-through charging. Currently out of stock.' },
    ].map(p => this.products.create(p)));
  }
}
