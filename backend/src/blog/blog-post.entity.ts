import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BlogUser } from './blog-user.entity';

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column('text')
  body: string;

  @Column({ nullable: true })
  excerpt: string;

  @Column()
  authorName: string;

  @Column()
  authorEmail: string;

  @Column({ nullable: true })
  authorUsername: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: false })
  published: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  publishedAt: Date;

  @ManyToOne(() => BlogUser, u => u.posts, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author: BlogUser;

  @Column({ nullable: true })
  authorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
