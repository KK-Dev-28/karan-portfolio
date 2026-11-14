import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BlogUser } from './blog-user.entity';

export const BLOG_FORMATS = ['text', 'html'] as const;
export type BlogPostFormat = typeof BLOG_FORMATS[number];

/** Production boots without TypeORM synchronize, so new columns are added here. */
export const BLOG_DDL = [
  `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "format" varchar(10) NOT NULL DEFAULT 'text'`,
];

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

  /**
   * 'text' is plain prose split into paragraphs. 'html' means the body is a
   * web design the reader can see rendered in a sandboxed frame, with the
   * source shown alongside it.
   */
  @Column({ type: 'varchar', length: 10, default: 'text' })
  format: BlogPostFormat;

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
