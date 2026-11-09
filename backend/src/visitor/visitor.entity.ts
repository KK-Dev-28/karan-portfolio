import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('visitors')
export class Visitor {
  @PrimaryGeneratedColumn()             id: number;
  @Index() @Column({ nullable: true })  ip: string;
  @Column({ nullable: true })           country: string;
  @Column({ nullable: true })           city: string;
  @Column({ nullable: true })           region: string;
  @Column({ nullable: true })           flag: string;
  @Column({ nullable: true })           device: string;
  @Column({ nullable: true })           browser: string;
  @Column({ nullable: true })           os: string;
  @Column({ nullable: true })           referrer: string;
  @Column({ nullable: true })           page: string;
  @Column({ default: false })           isReturning: boolean;
  @Column({ nullable: true, length: 500 }) userAgent: string;
  @Column({ nullable: true })           sessionId: string;
  // v2.0 — consent-based, optional fields (only stored after the visitor opts in)
  @Column({ nullable: true })           ipHash: string;
  @Column({ nullable: true })           visitorName: string;
  @Column({ nullable: true })           timezone: string;
  @Column({ nullable: true })           language: string;
  @Column({ nullable: true })           screen: string;
  @Column({ default: false })           consent: boolean;
  @CreateDateColumn()                   visitedAt: Date;
}
