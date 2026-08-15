import {
  Injectable, ConflictException, UnauthorizedException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { TaskflowUser, TaskflowTodo } from './taskflow.entity';
import { RegisterDto, LoginDto, TodoBody } from './taskflow.dto';

/* The client treats 'pending'/'completed' as legacy spellings and normalises
   them on the way in; we store the canonical three so both ends agree. */
const STATUSES   = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['work', 'personal', 'shopping', 'health', 'other'];

const canonicalStatus = (s: unknown) =>
  s === 'pending' ? 'todo'
    : s === 'completed' ? 'done'
    : STATUSES.includes(s as string) ? (s as string)
    : 'todo';

const str  = (v: unknown, max: number) => String(v ?? '').slice(0, max);
const bool = (v: unknown) => v === true || v === 'true';
const arr  = (v: unknown) => (Array.isArray(v) ? v : []);
const int  = (v: unknown, min: number, max: number) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};

@Injectable()
export class TaskflowService {
  constructor(
    @InjectRepository(TaskflowUser) private users: Repository<TaskflowUser>,
    @InjectRepository(TaskflowTodo) private todos: Repository<TaskflowTodo>,
    private jwt: JwtService,
  ) {}

  // ── auth ──────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException('That email is already registered.');
    }

    const user = await this.users.save(
      this.users.create({
        email,
        name: dto.name.trim(),
        passwordHash: await bcrypt.hash(dto.password, 12),
      }),
    );

    /* A brand-new account with an empty board makes the Kanban, calendar and
       stats views all look broken. Seed a realistic spread instead. */
    await this.seedStarterTodos(user.id);
    return this.session(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });

    /* Compare against a dummy hash when the user is missing so a wrong email
       and a wrong password take the same time to answer. */
    const hash = user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const ok = await bcrypt.compare(dto.password, hash);

    if (!user || !ok) throw new UnauthorizedException('Invalid email or password.');
    return this.session(user);
  }

  private session(user: TaskflowUser) {
    return {
      token: this.jwt.sign({ sub: user.id, email: user.email, typ: 'taskflow' }),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  // ── todos ─────────────────────────────────────────────────────────────────

  async list(userId: string) {
    const rows = await this.todos.find({
      where: { userId },
      order: { lastActivityAt: 'DESC' },
    });
    return rows.map(TaskflowService.toClient);
  }

  async create(userId: string, body: TodoBody) {
    const patch = TaskflowService.sanitize(body);
    const row = await this.todos.save(
      this.todos.create({
        ...patch,
        userId,
        text: (patch.text ?? '').trim() || 'Untitled task',
        lastActivityAt: new Date(),
      }),
    );
    return TaskflowService.toClient(row);
  }

  async update(userId: string, id: string, body: TodoBody) {
    const row = await this.todos.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Task not found.');

    Object.assign(row, TaskflowService.sanitize(body), { lastActivityAt: new Date() });
    return TaskflowService.toClient(await this.todos.save(row));
  }

  async remove(userId: string, id: string) {
    const row = await this.todos.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Task not found.');
    await this.todos.remove(row);
    return { ok: true };
  }

  // ── mapping ───────────────────────────────────────────────────────────────

  /* Copies an explicit allowlist, coercing each value to what the column can
     hold. Keys the client invented are ignored rather than rejected, and id,
     userId and the timestamps are absent by construction so no request can
     reassign a task to another account. Only keys actually present are
     emitted, so a partial update never blanks a stored column. */
  private static sanitize(body: TodoBody): Partial<TaskflowTodo> {
    const out: Record<string, any> = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
    const set = (k: string, v: any) => { if (has(k)) out[k] = v; };

    set('text',        str(body.text, 300));
    set('description', str(body.description, 5000));

    set('completed',  bool(body.completed));
    set('isStarred',  bool(body.isStarred));
    set('isArchived', bool(body.isArchived));

    set('status',   canonicalStatus(body.status));
    set('priority', PRIORITIES.includes(body.priority as string) ? body.priority : 'medium');
    set('category', CATEGORIES.includes(body.category as string) ? body.category : 'other');

    set('progress',      int(body.progress, 0, 100) ?? 0);
    set('estimatedTime', int(body.estimatedTime, 0, 1_000_000));
    set('actualTime',    int(body.actualTime, 0, 1_000_000));

    set('assignedTo', body.assignedTo ? str(body.assignedTo, 120) : null);

    if (has('dueDate')) {
      const d = body.dueDate ? new Date(body.dueDate as string) : null;
      out.dueDate = d && !isNaN(d.getTime()) ? d : null;
    }

    for (const k of ['tags', 'subTasks', 'comments', 'attachments', 'timeEntries', 'dependencies', 'customFields']) {
      set(k, arr(body[k]));
    }

    if (has('recurrence') && body.recurrence && typeof body.recurrence === 'object') {
      out.recurrence = body.recurrence;
    }
    if (has('notificationSettings') && body.notificationSettings && typeof body.notificationSettings === 'object') {
      out.notificationSettings = body.notificationSettings;
    }

    return out as Partial<TaskflowTodo>;
  }

  /* The client's Todo type wants ISO strings and a plain `id`. */
  private static toClient(row: TaskflowTodo) {
    const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
    return {
      ...row,
      id: String(row.id),
      dueDate: iso(row.dueDate),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
      lastActivityAt: iso(row.lastActivityAt),
    };
  }

  // ── demo data ─────────────────────────────────────────────────────────────

  private async seedStarterTodos(userId: string) {
    const day = (n: number) => new Date(Date.now() + n * 86_400_000);

    const starters: Partial<TaskflowTodo>[] = [
      { text: 'Review the quarterly roadmap', description: 'Read through the draft and leave comments before the planning call.', status: 'in-progress', priority: 'high',   category: 'work',     progress: 60, dueDate: day(2),  isStarred: true, tags: ['planning', 'q3'], estimatedTime: 120 },
      { text: 'Refactor the auth middleware', description: 'Split token verification out of the request handler and add tests.',   status: 'todo',        priority: 'high',   category: 'work',     progress: 0,  dueDate: day(5),  tags: ['code', 'backend'], estimatedTime: 240 },
      { text: 'Write release notes for v2.1', description: 'Summarise the shipped changes for the changelog.',                     status: 'todo',        priority: 'medium', category: 'work',     progress: 0,  dueDate: day(7),  tags: ['docs'] },
      { text: 'Book the dentist appointment', description: 'Six-month check-up.',                                                  status: 'todo',        priority: 'low',    category: 'health',   progress: 0,  dueDate: day(12), tags: ['admin'] },
      { text: 'Groceries for the week',       description: 'Coffee, oats, olive oil, vegetables.',                                 status: 'todo',        priority: 'low',    category: 'shopping', progress: 0,  dueDate: day(1),  tags: ['errands'] },
      { text: 'Ship the portfolio redesign',  description: 'Final pass on spacing and dark-mode contrast, then deploy.',           status: 'done',        priority: 'medium', category: 'personal', progress: 100, completed: true, dueDate: day(-3), tags: ['design'], actualTime: 300 },
      { text: 'Set up CI for the API',        description: 'Run the test suite and a build on every pull request.',                status: 'done',        priority: 'medium', category: 'work',     progress: 100, completed: true, dueDate: day(-6), tags: ['devops'], actualTime: 180 },
    ];

    await this.todos.save(
      starters.map(t => this.todos.create({ ...t, userId, lastActivityAt: new Date() })),
    );
  }
}
