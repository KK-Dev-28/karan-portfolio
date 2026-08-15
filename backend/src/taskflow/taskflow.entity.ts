import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

/* Accounts for the TaskFlow demo only. Deliberately a separate table from any
   portfolio auth: anyone can sign up here, so these rows must never be able to
   reach admin data. Tokens minted for them carry typ:'taskflow', which the
   portfolio's admin JwtStrategy rejects (it requires role:'admin'). */
@Entity('taskflow_users')
export class TaskflowUser {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index({ unique: true })
  @Column()                       email: string;

  @Column()                       name: string;
  @Column()                       passwordHash: string;

  /* Seeded sample accounts are recycled, not accumulated — see cleanup in the
     service. Flagging them keeps real sign-ups out of that sweep. */
  @Column({ default: false })     isSeed: boolean;

  @CreateDateColumn()             createdAt: Date;
}

/* One row per task. The rich nested pieces (subtasks, comments, time entries…)
   are jsonb rather than child tables: the demo only ever reads and writes a
   whole task at a time, so normalising them would buy nothing and cost joins. */
@Entity('taskflow_todos')
export class TaskflowTodo {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column()                       userId: string;

  @Column()                       text: string;
  @Column({ type: 'text', default: '' })       description: string;

  @Column({ default: false })     completed: boolean;
  @Column({ default: 'medium' })  priority: string;   // low | medium | high
  @Column({ default: 'other' })   category: string;   // work | personal | shopping | health | other
  @Column({ default: 'todo' })    status: string;     // todo | in-progress | done

  @Column({ type: 'int', default: 0 })         progress: number;
  @Column({ default: false })     isStarred: boolean;
  @Column({ default: false })     isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true }) dueDate: Date | null;
  @Column({ type: 'int', nullable: true })         estimatedTime: number | null;
  @Column({ type: 'int', nullable: true })         actualTime: number | null;
  @Column({ type: 'varchar', nullable: true })     assignedTo: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" }) tags: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) subTasks: any[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) comments: any[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) attachments: any[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) timeEntries: any[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) dependencies: string[];
  @Column({ type: 'jsonb', default: () => "'[]'" }) customFields: any[];

  @Column({ type: 'jsonb', default: () => `'{"type":"none","interval":1,"endDate":null}'` })
  recurrence: { type: string; interval: number; endDate: string | null };

  @Column({ type: 'jsonb', default: () => `'{"email":false,"push":false,"reminder":false,"reminderTime":null}'` })
  notificationSettings: { email: boolean; push: boolean; reminder: boolean; reminderTime: string | null };

  @CreateDateColumn()             createdAt: Date;
  @UpdateDateColumn()             updatedAt: Date;
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }) lastActivityAt: Date;
}
