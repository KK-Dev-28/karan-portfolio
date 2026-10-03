import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/* These two tables already exist in the database, left behind by an earlier
   version of this demo. The columns below mirror that live schema exactly —
   including ones this API never reads, such as attachments and recurrence.
   synchronize is enabled, so any column omitted here would be DROPPED on the
   next boot along with its data. Do not remove a field without first
   confirming the column is gone from the database. */

@Entity('taskflow_users')
export class TaskflowUser {
  @PrimaryGeneratedColumn('uuid')                              id: string;
  @Index({ unique: true }) @Column({ type: 'varchar' })        email: string;
  @Column({ type: 'varchar' })                                 name: string;
  /* bcrypt hash — the plain password is never stored or logged. */
  @Column({ type: 'varchar' })                                 passwordHash: string;
  @Column({ type: 'boolean', default: false })                 isSeed: boolean;
  @CreateDateColumn({ type: 'timestamp' })                     createdAt: Date;
}

export interface SubTask   { text: string; completed: boolean }
export interface TodoNote  { text: string; author: string; createdAt: string }
export interface TimeEntry { startTime: string; endTime: string; duration: number }

@Entity('taskflow_todos')
export class TaskflowTodo {
  @PrimaryGeneratedColumn('uuid')                              id: string;
  /* Owner, stored as the user's uuid. Every query filters on it, so one
     account can never read or modify another's tasks. */
  @Index() @Column({ type: 'varchar' })                        userId: string;

  @Column({ type: 'varchar' })                                 text: string;
  @Column({ type: 'text', default: '' })                       description: string;
  @Column({ type: 'boolean', default: false })                 completed: boolean;
  @Column({ type: 'varchar', default: 'medium' })              priority: string;
  @Column({ type: 'varchar', default: 'other' })               category: string;
  @Column({ type: 'varchar', default: 'todo' })                status: string;
  @Column({ type: 'int', default: 0 })                         progress: number;
  @Column({ type: 'boolean', default: false })                 isStarred: boolean;
  @Column({ type: 'boolean', default: false })                 isArchived: boolean;
  @Column({ type: 'timestamptz', nullable: true })             dueDate: Date | null;
  @Column({ type: 'int', nullable: true })                     estimatedTime: number | null;
  @Column({ type: 'int', nullable: true })                     actualTime: number | null;
  @Column({ type: 'varchar', nullable: true })                 assignedTo: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })            tags: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" })            subTasks: SubTask[];
  @Column({ type: 'jsonb', default: () => "'[]'" })            comments: TodoNote[];
  @Column({ type: 'jsonb', default: () => "'[]'" })            attachments: unknown[];
  @Column({ type: 'jsonb', default: () => "'[]'" })            timeEntries: TimeEntry[];
  @Column({ type: 'jsonb', default: () => "'[]'" })            dependencies: unknown[];
  @Column({ type: 'jsonb', default: () => "'[]'" })            customFields: unknown[];
  @Column({ type: 'jsonb', default: () => `'{"type": "none", "endDate": null, "interval": 1}'` })
  recurrence: unknown;
  @Column({ type: 'jsonb', default: () => `'{"push": false, "email": false, "reminder": false, "reminderTime": null}'` })
  notificationSettings: unknown;

  @CreateDateColumn({ type: 'timestamp' })                     createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })                     updatedAt: Date;
  @Column({ type: 'timestamptz', default: () => 'now()' })     lastActivityAt: Date;
}
