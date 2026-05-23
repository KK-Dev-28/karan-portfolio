import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('insights_access')
export class InsightsAccess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 320 })
  email: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  razorpayOrderId: string;

  @Column({ type: 'varchar', length: 128, unique: true, nullable: true })
  accessToken: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'active' | 'expired';

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
