import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BlogPost } from './blog-post.entity';

@Entity('blog_users')
export class BlogUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  twitter: string;

  @Column({ nullable: true })
  linkedin: string;

  @Column({ nullable: true })
  github: string;

  // Visibility settings
  @Column({ default: true })
  showBio: boolean;

  @Column({ default: true })
  showSocials: boolean;

  @Column({ default: true })
  showPostCount: boolean;

  @Column({ default: true })
  publicProfile: boolean;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => BlogPost, p => p.author)
  posts: BlogPost[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
