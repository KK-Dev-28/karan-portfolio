import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * submitted → approved → quoted → accepted → paid → building → live
 * (or rejected / cancelled). Only the admin moves a request to approved or
 * paid; client credentials are issued only once it is paid.
 */
export const REQUEST_STATUSES = ['submitted', 'approved', 'rejected', 'quoted', 'accepted', 'paid', 'building', 'live', 'cancelled'] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];

/**
 * What a signed-in client is allowed to do in their dashboard. The admin grants
 * these one by one; anything not granted is refused by the server, not just
 * hidden in the UI. Every client can always see their own request.
 */
export const CLIENT_PERMISSIONS = [
  'request_features', 'edit_content', 'view_analytics', 'download_data', 'manage_blog', 'manage_domain', 'invite_team',
] as const;
export type ClientPermission = typeof CLIENT_PERMISSIONS[number];

/** Granted to every client the moment their payment is confirmed. */
export const DEFAULT_PERMISSIONS: ClientPermission[] = ['request_features', 'download_data'];

export const FEATURE_STATUSES = ['pending', 'approved', 'rejected', 'done'] as const;
export type FeatureStatus = typeof FEATURE_STATUSES[number];

/** A visitor's request for a portfolio of their own, built and hosted by Karan. */
@Entity('portfolio_requests')
export class PortfolioRequest {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column({ length: 320 }) email: string;
  @Column({ length: 80 }) name: string;
  @Column({ type: 'varchar', length: 30, nullable: true }) phone: string | null;
  @Column({ type: 'varchar', length: 80, nullable: true }) profession: string | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) headline: string | null;
  @Column({ type: 'text', nullable: true }) about: string | null;
  @Column({ type: 'jsonb', default: () => "'[]'" }) links: { label: string; url: string }[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) skills: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) projects: { name: string; summary: string; url?: string }[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) modules: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) approvedModules: string[];
  /** Dashboard permissions the admin has granted this client. */
  @Column({ type: 'jsonb', default: () => "'[]'" }) permissions: string[];
  @Column({ type: 'varchar', length: 40, nullable: true }) style: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) domain: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'varchar', length: 20, default: 'submitted' }) status: RequestStatus;
  /** One-time price in whole rupees, set by the admin. */
  @Column({ type: 'integer', nullable: true }) quoteAmount: number | null;
  @Column({ type: 'text', nullable: true }) quoteNote: string | null;
  @Column({ type: 'varchar', length: 300, nullable: true }) paymentUrl: string | null;
  @Column({ type: 'varchar', length: 60, nullable: true }) paymentLinkId: string | null;
  /** Razorpay payment id, or the admin's reference for a payment confirmed by hand. */
  @Column({ type: 'varchar', length: 120, nullable: true }) paymentRef: string | null;
  @Column({ type: 'timestamptz', nullable: true }) approvedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) paidAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) credentialsSentAt: Date | null;
  @Column({ type: 'varchar', length: 300, nullable: true }) liveUrl: string | null;
  @Column({ type: 'text', nullable: true }) adminNotes: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

/**
 * A paid client's sign-in. Passwords are bcrypt hashes; setup links, sign-in
 * codes and sessions are stored only as SHA-256 hashes and all expire.
 */
@Entity('portfolio_clients')
export class PortfolioClient {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ length: 320 }) email: string;
  @Column() requestId: number;
  @Column({ type: 'varchar', length: 100, nullable: true }) passwordHash: string | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) setupHash: string | null;
  @Column({ type: 'timestamptz', nullable: true }) setupExpires: Date | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) otpHash: string | null;
  @Column({ type: 'timestamptz', nullable: true }) otpExpires: Date | null;
  @Column({ type: 'integer', default: 0 }) otpTries: number;
  @Column({ type: 'integer', default: 0 }) failedLogins: number;
  @Column({ type: 'timestamptz', nullable: true }) lockedUntil: Date | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) sessionHash: string | null;
  @Column({ type: 'timestamptz', nullable: true }) sessionExpires: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) lastLoginAt: Date | null;
  @Column({ type: 'boolean', default: true }) active: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

/**
 * A change a client has asked for from their dashboard. It does nothing until
 * the admin approves it; approving a module request also grants that module.
 */
@Entity('portfolio_feature_requests')
export class PortfolioFeatureRequest {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column() requestId: number;
  @Index() @Column({ length: 320 }) email: string;
  @Column({ length: 120 }) title: string;
  @Column({ type: 'text', nullable: true }) details: string | null;
  /** Catalog module id when the client picked one from the list, else null. */
  @Column({ type: 'varchar', length: 40, nullable: true }) moduleId: string | null;
  @Column({ type: 'varchar', length: 20, default: 'pending' }) status: FeatureStatus;
  /** Extra one-time price the admin quotes for this change, in whole rupees. */
  @Column({ type: 'integer', nullable: true }) price: number | null;
  @Column({ type: 'text', nullable: true }) adminNote: string | null;
  @Column({ type: 'timestamptz', nullable: true }) decidedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

/** Who did what, so permission and payment changes can be traced afterwards. */
@Entity('portfolio_audit')
export class PortfolioAudit {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column({ type: 'integer', nullable: true }) requestId: number | null;
  @Column({ length: 20 }) actor: 'admin' | 'client' | 'system';
  @Column({ length: 60 }) action: string;
  @Column({ type: 'text', nullable: true }) detail: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

/** Same tables as the entities, for production boots where synchronize is off. */
export const BUILDER_DDL = [
  `CREATE TABLE IF NOT EXISTS "portfolio_requests" (
    "id" SERIAL PRIMARY KEY, "email" varchar(320) NOT NULL, "name" varchar(80) NOT NULL,
    "phone" varchar(30), "profession" varchar(80), "headline" varchar(160), "about" text,
    "links" jsonb NOT NULL DEFAULT '[]', "skills" jsonb NOT NULL DEFAULT '[]', "projects" jsonb NOT NULL DEFAULT '[]',
    "modules" jsonb NOT NULL DEFAULT '[]', "approvedModules" jsonb NOT NULL DEFAULT '[]',
    "style" varchar(40), "domain" varchar(120), "notes" text, "status" varchar(20) NOT NULL DEFAULT 'submitted',
    "quoteAmount" integer, "quoteNote" text, "paymentUrl" varchar(300), "liveUrl" varchar(300), "adminNotes" text,
    "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now())`,
  ...['"paymentLinkId" varchar(60)', '"paymentRef" varchar(120)', '"approvedAt" timestamptz', '"paidAt" timestamptz',
    '"credentialsSentAt" timestamptz', `"permissions" jsonb NOT NULL DEFAULT '[]'`]
    .map(c => `ALTER TABLE "portfolio_requests" ADD COLUMN IF NOT EXISTS ${c}`),
  `CREATE INDEX IF NOT EXISTS "IDX_portfolio_requests_email" ON "portfolio_requests" ("email")`,
  `CREATE TABLE IF NOT EXISTS "portfolio_clients" (
    "id" SERIAL PRIMARY KEY, "email" varchar(320) NOT NULL, "requestId" integer NOT NULL,
    "passwordHash" varchar(100), "setupHash" varchar(64), "setupExpires" timestamptz,
    "otpHash" varchar(64), "otpExpires" timestamptz, "otpTries" integer NOT NULL DEFAULT 0,
    "failedLogins" integer NOT NULL DEFAULT 0, "lockedUntil" timestamptz,
    "sessionHash" varchar(64), "sessionExpires" timestamptz, "lastLoginAt" timestamptz,
    "active" boolean NOT NULL DEFAULT true, "createdAt" timestamptz NOT NULL DEFAULT now())`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_portfolio_clients_email" ON "portfolio_clients" ("email")`,
  `CREATE TABLE IF NOT EXISTS "portfolio_feature_requests" (
    "id" SERIAL PRIMARY KEY, "requestId" integer NOT NULL, "email" varchar(320) NOT NULL,
    "title" varchar(120) NOT NULL, "details" text, "moduleId" varchar(40),
    "status" varchar(20) NOT NULL DEFAULT 'pending', "price" integer, "adminNote" text,
    "decidedAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS "IDX_portfolio_feature_requests_request" ON "portfolio_feature_requests" ("requestId")`,
  `CREATE INDEX IF NOT EXISTS "IDX_portfolio_feature_requests_email" ON "portfolio_feature_requests" ("email")`,
  `CREATE TABLE IF NOT EXISTS "portfolio_audit" (
    "id" SERIAL PRIMARY KEY, "requestId" integer, "actor" varchar(20) NOT NULL,
    "action" varchar(60) NOT NULL, "detail" text, "createdAt" timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS "IDX_portfolio_audit_request" ON "portfolio_audit" ("requestId")`,
];
