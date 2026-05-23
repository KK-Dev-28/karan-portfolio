import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('site_content')
export class SiteContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  section: string;

  @Column({ type: 'jsonb' })
  data: any;

  @UpdateDateColumn()
  updatedAt: Date;
}
