import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('portfolio_updates')
export class PortfolioUpdate {
  @PrimaryGeneratedColumn()
  id: number;

  /** achievement | learning | milestone | note */
  @Column({ type: 'varchar', length: 32 })
  kind: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkUrl: string | null;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
