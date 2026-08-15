import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { LmsCourse, LmsChapter, LmsTopic, LmsEnrollment } from './lms.entity';
import { EnrollDto, ProgressDto } from './lms.dto';

@Injectable()
export class LmsService implements OnModuleInit {
  private readonly log = new Logger(LmsService.name);

  constructor(
    @InjectRepository(LmsCourse)     private courses: Repository<LmsCourse>,
    @InjectRepository(LmsChapter)    private chapters: Repository<LmsChapter>,
    @InjectRepository(LmsTopic)      private topics: Repository<LmsTopic>,
    @InjectRepository(LmsEnrollment) private enrollments: Repository<LmsEnrollment>,
  ) {}

  /* Catalogue content is fixture data, not user data, so it is seeded on boot
     and skipped entirely once present — a redeploy must not duplicate it. */
  async onModuleInit() {
    if (await this.courses.count()) return;
    await this.seed();
    this.log.log('LMS demo catalogue seeded');
  }

  // ── reads ─────────────────────────────────────────────────────────────────

  /* Counts come from two grouped queries rather than loading every topic, so
     the catalogue costs the same three round trips whatever its size. */
  async listCourses() {
    const courses = await this.courses.find({ order: { sortOrder: 'ASC' } });
    if (!courses.length) return [];

    const ids = courses.map(c => c.id);
    const chapters = await this.chapters.find({ where: { courseId: In(ids) } });
    const topics = chapters.length
      ? await this.topics.find({ where: { chapterId: In(chapters.map(c => c.id)) } })
      : [];

    const chaptersByCourse = new Map<string, number>();
    const topicsByCourse   = new Map<string, number>();
    const courseOfChapter  = new Map(chapters.map(c => [c.id, c.courseId]));

    for (const ch of chapters) {
      chaptersByCourse.set(ch.courseId, (chaptersByCourse.get(ch.courseId) ?? 0) + 1);
    }
    for (const t of topics) {
      const courseId = courseOfChapter.get(t.chapterId);
      if (courseId) topicsByCourse.set(courseId, (topicsByCourse.get(courseId) ?? 0) + 1);
    }

    return courses.map(c => ({
      ...c,
      chapterCount: chaptersByCourse.get(c.id) ?? 0,
      topicCount:   topicsByCourse.get(c.id) ?? 0,
    }));
  }

  async getCourse(slug: string, sessionId?: string) {
    const course = await this.courses.findOne({ where: { slug } });
    if (!course) throw new NotFoundException('Course not found.');

    const chapters = await this.chapters.find({
      where: { courseId: course.id }, order: { sortOrder: 'ASC' },
    });
    const topics = chapters.length
      ? await this.topics.find({
          where: { chapterId: In(chapters.map(c => c.id)) }, order: { sortOrder: 'ASC' },
        })
      : [];

    const enrollment = sessionId
      ? await this.enrollments.findOne({ where: { sessionId, courseId: course.id } })
      : null;
    const done = new Set(enrollment?.completedTopicIds ?? []);

    return {
      ...course,
      enrolled: !!enrollment,
      completedCount: done.size,
      totalTopics: topics.length,
      chapters: chapters.map(ch => ({
        ...ch,
        topics: topics
          .filter(t => t.chapterId === ch.id)
          .map(t => ({ ...t, completed: done.has(t.id) })),
      })),
    };
  }

  async myEnrollments(sessionId: string) {
    const rows = await this.enrollments.find({ where: { sessionId } });
    if (!rows.length) return [];

    const courses = await this.courses.find({ where: { id: In(rows.map(r => r.courseId)) } });
    const byId = new Map(courses.map(c => [c.id, c]));

    return rows
      .filter(r => byId.has(r.courseId))
      .map(r => ({
        courseId: r.courseId,
        course: byId.get(r.courseId),
        completedCount: r.completedTopicIds.length,
        enrolledAt: r.enrolledAt,
      }));
  }

  // ── writes ────────────────────────────────────────────────────────────────

  /* Idempotent: enrolling twice returns the existing row rather than failing,
     which keeps a double-clicked button from surfacing an error. */
  async enroll(dto: EnrollDto) {
    const course = await this.courses.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found.');

    const existing = await this.enrollments.findOne({
      where: { sessionId: dto.sessionId, courseId: dto.courseId },
    });
    if (existing) return { ok: true, alreadyEnrolled: true };

    await this.enrollments.save(
      this.enrollments.create({ sessionId: dto.sessionId, courseId: dto.courseId, completedTopicIds: [] }),
    );
    return { ok: true, alreadyEnrolled: false };
  }

  /* Toggles, so the same endpoint serves ticking and un-ticking a topic. */
  async toggleProgress(dto: ProgressDto) {
    const topic = await this.topics.findOne({ where: { id: dto.topicId } });
    if (!topic) throw new NotFoundException('Topic not found.');

    const chapter = await this.chapters.findOne({ where: { id: topic.chapterId } });
    if (!chapter) throw new NotFoundException('Topic is not attached to a course.');

    let enrollment = await this.enrollments.findOne({
      where: { sessionId: dto.sessionId, courseId: chapter.courseId },
    });

    /* Ticking a topic without enrolling first is a reasonable thing for a
       visitor to do, so treat it as an implicit enrol. */
    if (!enrollment) {
      enrollment = this.enrollments.create({
        sessionId: dto.sessionId, courseId: chapter.courseId, completedTopicIds: [],
      });
    }

    const done = new Set(enrollment.completedTopicIds ?? []);
    done.has(dto.topicId) ? done.delete(dto.topicId) : done.add(dto.topicId);
    enrollment.completedTopicIds = [...done];

    await this.enrollments.save(enrollment);
    return { ok: true, completed: done.has(dto.topicId), completedCount: done.size };
  }

  // ── fixture data ──────────────────────────────────────────────────────────

  private async seed() {
    const spec = [
      {
        slug: 'angular-for-production', title: 'Angular for Production',
        summary: 'Take an Angular app past the tutorial stage: standalone components, typed reactive forms, lazy routes, and a build you can actually ship.',
        level: 'intermediate', instructor: 'Karan Kapoor', category: 'Frontend',
        durationMinutes: 240, sortOrder: 1,
        chapters: [
          { title: 'Project Foundations', topics: [
            { title: 'Standalone components', minutes: 12, body: 'Standalone components drop the NgModule ceremony. A component declares its own imports, which makes the dependency graph readable and lazy loading far less fiddly.' },
            { title: 'Typed reactive forms', minutes: 15, body: 'Typed forms turn a whole class of runtime template errors into compile errors. The value of a FormGroup is inferred from its controls.' },
            { title: 'Routing and lazy loading', minutes: 18, body: 'loadComponent defers a route until it is visited, which keeps the initial bundle small as the app grows.' },
          ]},
          { title: 'State and Data', topics: [
            { title: 'Signals versus RxJS', minutes: 20, body: 'Signals suit synchronous derived state; RxJS still wins for streams and cancellation. Most apps want both, used for what each is good at.' },
            { title: 'HTTP interceptors', minutes: 14, body: 'Interceptors are the right seam for auth headers, retries and error normalisation, so components never repeat that plumbing.' },
          ]},
          { title: 'Shipping', topics: [
            { title: 'Bundle budgets', minutes: 10, body: 'Budgets fail the build when a bundle grows past a threshold, which catches an accidental heavy import at review time rather than in production.' },
            { title: 'Server-side rendering', minutes: 16, body: 'SSR improves first paint and gives crawlers real HTML. The cost is that browser-only globals must be guarded.' },
          ]},
        ],
      },
      {
        slug: 'dotnet-api-design', title: 'ASP.NET Core API Design',
        summary: 'Build an API that survives contact with real clients: layering, EF Core that does not surprise you, auth, and multi-tenancy.',
        level: 'advanced', instructor: 'Karan Kapoor', category: 'Backend',
        durationMinutes: 300, sortOrder: 2,
        chapters: [
          { title: 'Structure', topics: [
            { title: 'Layering that earns its keep', minutes: 15, body: 'Separate projects for web, domain and data keep the dependency arrows pointing one way. The moment data access reaches back into the web layer, the boundary has stopped meaning anything.' },
            { title: 'Dependency injection lifetimes', minutes: 12, body: 'Scoped is the default for a DbContext. Injecting a scoped service into a singleton is the classic way to leak a context across requests.' },
          ]},
          { title: 'Data Access', topics: [
            { title: 'Tracking versus no-tracking', minutes: 14, body: 'AsNoTracking is the right default for reads. Change tracking costs memory and time you only need when you intend to save.' },
            { title: 'The N+1 trap', minutes: 16, body: 'A lazy-loaded navigation inside a loop turns one query into hundreds. Include or a projection fixes it; profiling is how you notice.' },
            { title: 'Migrations in a team', minutes: 13, body: 'Migrations are code and belong in review. Two developers generating migrations from different branches is the usual source of a broken main.' },
          ]},
          { title: 'Multi-Tenancy', topics: [
            { title: 'Tenant resolution', minutes: 18, body: 'Resolve the tenant once per request from the host or a claim, then let a global query filter apply it. Threading a tenant id through every method by hand is how rows leak between customers.' },
            { title: 'Isolating tenant data', minutes: 20, body: 'A shared schema with a filtered tenant column is cheapest to run; a database per tenant isolates best. The decision is commercial as much as technical.' },
          ]},
        ],
      },
      {
        slug: 'sql-you-actually-need', title: 'The SQL You Actually Need',
        summary: 'The queries and indexes that come up daily in application work, and how to tell why one is slow.',
        level: 'beginner', instructor: 'Karan Kapoor', category: 'Data',
        durationMinutes: 180, sortOrder: 3,
        chapters: [
          { title: 'Querying', topics: [
            { title: 'Joins without the fear', minutes: 14, body: 'An inner join keeps matches; a left join keeps every row on the left and nulls the rest. Most reporting bugs are one of these picked wrongly.' },
            { title: 'Grouping and aggregates', minutes: 12, body: 'WHERE filters rows before grouping and HAVING filters groups after. Using HAVING for row filters quietly scans far more than it needs to.' },
            { title: 'Window functions', minutes: 18, body: 'Window functions rank and total without collapsing rows, which replaces a surprising number of self-joins.' },
          ]},
          { title: 'Performance', topics: [
            { title: 'How indexes actually help', minutes: 16, body: 'An index is a sorted structure the planner can seek. Column order in a composite index decides which queries it can serve.' },
            { title: 'Reading a query plan', minutes: 15, body: 'Start at the deepest node and look for a scan where you expected a seek, or an estimate far from the actual row count.' },
          ]},
        ],
      },
    ];

    for (const c of spec) {
      const { chapters, ...courseFields } = c;
      const course = await this.courses.save(this.courses.create(courseFields));

      for (const [ci, ch] of chapters.entries()) {
        const chapter = await this.chapters.save(
          this.chapters.create({ courseId: course.id, title: ch.title, sortOrder: ci }),
        );
        await this.topics.save(
          ch.topics.map((t, ti) =>
            this.topics.create({ chapterId: chapter.id, sortOrder: ti, ...t }),
          ),
        );
      }
    }
  }
}
