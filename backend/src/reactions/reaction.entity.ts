import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reactions')
export class Reaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 60 })
  section: string;

  @Column({ default: 'like' })
  type: 'like' | 'comment';

  @Column({ length: 60, nullable: true })
  ip: string;

  @Column({ length: 100, nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ default: true })
  visible: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
