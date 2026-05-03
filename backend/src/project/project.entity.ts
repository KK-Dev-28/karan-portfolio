import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()           id: number;
  @Column()                           title: string;
  @Column('text')                     description: string;
  @Column('simple-array')             techStack: string[];
  @Column({ nullable: true })         period: string;
  @Column({ nullable: true })         githubUrl: string;
  @Column({ nullable: true })         liveUrl: string;
  @Column({ default: false })         isFeatured: boolean;
  @Column({ default: 0 })            sortOrder: number;
  @Column({ nullable: true })         award: string;
  @CreateDateColumn()                 createdAt: Date;
}
