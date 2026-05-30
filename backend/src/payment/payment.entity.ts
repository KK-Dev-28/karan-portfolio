import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type PaymentStatus   = 'pending' | 'completed' | 'failed' | 'expired';
export type ApprovalStatus  = 'pending_approval' | 'approved' | 'rejected' | 'info_requested' | 'snoozed';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  razorpayOrderId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpayPaymentId: string | null;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'varchar', length: 32 })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 64 })
  tier: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  customerEmail: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  customerPhone: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true, default: null })
  approvalStatus: ApprovalStatus | null;

  @Column({ type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  snoozeUntil: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
