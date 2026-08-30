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
  /* Why a card has no repo/live link — proprietary client work, private
     source, and so on. Renders in place of the link row so an absent link
     reads as deliberate rather than as a missing feature. */
  @Column({ nullable: true })         sourceNote: string;
  @CreateDateColumn()                 createdAt: Date;
}
