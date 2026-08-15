import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';

/* A working slice of the layered e-commerce platform. The original is
   ASP.NET Core over SQL Server with EF Core and Dapper side by side; this
   rebuild runs on the portfolio's PostgreSQL instance so the order lifecycle
   can be clicked through rather than only read about.

   Cart and orders hang off a browser-generated sessionId — a visitor should be
   able to reach checkout without creating an account. */

@Entity('shop_categories')
export class ShopCategory {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index({ unique: true })
  @Column()                      slug: string;

  @Column()                      name: string;
  @Column({ type: 'int', default: 0 }) sortOrder: number;
}

@Entity('shop_products')
export class ShopProduct {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index({ unique: true })
  @Column()                       slug: string;

  @Index()
  @Column()                       categoryId: string;
  @ManyToOne(() => ShopCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: ShopCategory;

  @Column()                       name: string;
  @Column('text')                 description: string;

  /* Money is stored in the minor unit as an integer. Floating point cannot
     represent 0.10 exactly, and rounding drift shows up the moment totals are
     summed across a cart. */
  @Column({ type: 'int' })        pricePaise: number;

  @Column({ type: 'int', default: 0 })   stock: number;
  @Column({ default: '' })               imageEmoji: string;
  @Column({ type: 'real', default: 4.5 })rating: number;
  @Column({ type: 'int', default: 0 })   sortOrder: number;
}

@Entity('shop_cart_items')
@Index(['sessionId', 'productId'], { unique: true })
export class ShopCartItem {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column()                       sessionId: string;
  @Column()                       productId: string;
  @Column({ type: 'int', default: 1 }) quantity: number;

  @CreateDateColumn()             addedAt: Date;
}

@Entity('shop_orders')
export class ShopOrder {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column()                       sessionId: string;

  @Index({ unique: true })
  @Column()                       reference: string;

  /* Line items are copied onto the order rather than joined back to products:
     an order has to keep showing what was actually bought at the price paid,
     even after the catalogue changes. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  lines: { productId: string; name: string; unitPricePaise: number; quantity: number }[];

  @Column({ type: 'int' })        totalPaise: number;
  @Column({ default: 'pending' }) status: string;   // pending | approved | shipped | cancelled
  @Column({ default: '' })        customerName: string;

  @CreateDateColumn()             placedAt: Date;
}
