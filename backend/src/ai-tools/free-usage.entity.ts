import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('free_usage')
@Unique(['email', 'serviceType'])
export class FreeUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  serviceType: string;

  @Column({ default: 0 })
  count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
