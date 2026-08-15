import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';

/* A browsable slice of the multi-tenant learning platform, rebuilt here so the
   portfolio can show the domain working rather than describe it. The original
   is ASP.NET Core against SQL Server; this runs on the same PostgreSQL
   instance as everything else on the site.

   Progress and enrolment are keyed by a client-generated sessionId rather than
   an account. A visitor should be able to try the demo without handing over an
   email, and it keeps the table free of personal data. */

@Entity('lms_courses')
export class LmsCourse {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index({ unique: true })
  @Column()                      slug: string;

  @Column()                      title: string;
  @Column('text')                summary: string;
  @Column()                      level: string;      // beginner | intermediate | advanced
  @Column()                      instructor: string;
  @Column({ default: 'General' })category: string;
  @Column({ type: 'int', default: 0 })  durationMinutes: number;
  @Column({ type: 'int', default: 0 })  sortOrder: number;

  @CreateDateColumn()            createdAt: Date;
}

@Entity('lms_chapters')
export class LmsChapter {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column()                       courseId: string;
  @ManyToOne(() => LmsCourse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: LmsCourse;

  @Column()                       title: string;
  @Column({ type: 'int', default: 0 }) sortOrder: number;
}

@Entity('lms_topics')
export class LmsTopic {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column()                       chapterId: string;
  @ManyToOne(() => LmsChapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapterId' })
  chapter: LmsChapter;

  @Column()                       title: string;
  @Column('text')                 body: string;
  @Column({ type: 'int', default: 5 }) minutes: number;
  @Column({ type: 'int', default: 0 }) sortOrder: number;
}

/* One row per (session, course). The unique index is what makes a repeated
   enrol idempotent instead of stacking duplicates. */
@Entity('lms_enrollments')
@Index(['sessionId', 'courseId'], { unique: true })
export class LmsEnrollment {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column()                       sessionId: string;
  @Column()                       courseId: string;

  /* Completed topic ids. Held as jsonb because progress is always read and
     written for the whole course at once — a join table would add nothing. */
  @Column({ type: 'jsonb', default: () => "'[]'" }) completedTopicIds: string[];

  @CreateDateColumn()             enrolledAt: Date;
}
