import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  questions: {
    id: string;
    type: 'text' | 'single_choice' | 'multiple_choice' | 'rating' | 'yes_no';
    question: string;
    options?: string[];
    required: boolean;
  }[];

  @Column({ default: 'draft' })
  status: string; // draft | active | closed

  @Column({ nullable: true, unique: true })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
