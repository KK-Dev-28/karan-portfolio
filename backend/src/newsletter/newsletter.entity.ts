import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  email: string;

  @Column({ type: 'varchar', length: 64, default: 'footer' })
  source: string;

  @CreateDateColumn()
  createdAt: Date;

  /* "Mission crew" accounts (crew.service.ts). Footer-only subscribers keep
     these empty. Columns are added on boot by CrewService if missing. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  name: string | null;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  /** sha256 of the current 6-digit sign-in code. */
  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  codeHash: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  codeExpires: Date | null;

  @Column({ type: 'int', default: 0, select: false })
  codeTries: number;

  /** sha256 of the signed-in session token held by the browser. */
  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  sessionHash: string | null;

  /** Random token for one-click unsubscribe links. */
  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  unsubToken: string | null;

  /** Comma list of topics they want mail about. */
  @Column({ type: 'varchar', length: 120, default: 'projects,blog,kits' })
  topics: string;

  @Column({ type: 'timestamptz', nullable: true })
  unsubscribedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;
}
