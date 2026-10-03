import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TaskflowUser, TaskflowTodo } from './taskflow.entity';
import { CreateTodoDto, UpdateTodoDto, SubTaskDto, CommentDto, TimeEntryDto, RegisterDto, LoginDto } from './taskflow.dto';

/* The TaskFlow client was written against a Mongo API and reads _id everywhere,
   so responses are shaped to match rather than editing the client in dozens of
   places. */
function present(t: TaskflowTodo) {
  return {
    _id: t.id,
    id: t.id,
    text: t.text,
    status: t.status,
    priority: t.priority,
    category: t.category ?? '',
    tags: t.tags ?? [],
    dueDate: t.dueDate ? t.dueDate.toISOString() : '',
    actualTime: t.actualTime ?? 0,
    isStarred: t.isStarred,
    isArchived: t.isArchived,
    completed: t.completed || t.status === 'completed' || t.status === 'done',
    user: t.userId,
    dependencies: (t.dependencies ?? []) as string[],
    subTasks: t.subTasks ?? [],
    comments: t.comments ?? [],
    timeEntries: t.timeEntries ?? [],
    lastActivityAt: t.lastActivityAt?.toISOString?.() ?? new Date().toISOString(),
    createdAt: t.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: t.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    __v: 0,
  };
}

@Injectable()
export class TaskflowService {
  constructor(
    @InjectRepository(TaskflowUser) private readonly users: Repository<TaskflowUser>,
    @InjectRepository(TaskflowTodo) private readonly todos: Repository<TaskflowTodo>,
    private readonly jwt: JwtService,
  ) {}

  // ── Accounts ──────────────────────────────────────────────────────────────

  private async issue(user: TaskflowUser) {
    const token = await this.jwt.signAsync({ sub: user.id, scope: 'taskflow' });
    return {
      token,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        /* No updatedAt column on this table; the client only displays it. */
        updatedAt: user.createdAt.toISOString(),
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException('That email is already registered');
    }
    const user = await this.users.save(
      this.users.create({ email, name: dto.name.trim(), passwordHash: await bcrypt.hash(dto.password, 12) }),
    );
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email.trim().toLowerCase() } });
    /* Same message and a hash comparison either way, so the response cannot be
       used to discover which emails exist. */
    const ok = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await bcrypt.compare(dto.password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin');
    if (!user || !ok) throw new UnauthorizedException('Incorrect email or password');
    return this.issue(user);
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  async list(userId: string) {
    const rows = await this.todos.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map(present);
  }

  async create(userId: string, dto: CreateTodoDto) {
    const row = await this.todos.save(
      this.todos.create({
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        userId,
        lastActivityAt: new Date(),
      }),
    );
    return present(row);
  }

  /* Every mutation loads through this, so ownership is enforced in exactly one
     place: a task belonging to someone else is indistinguishable from one that
     does not exist. */
  private async owned(userId: string, id: string) {
    const row = await this.todos.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Task not found');
    return row;
  }

  async update(userId: string, id: string, dto: UpdateTodoDto) {
    const row = await this.owned(userId, id);
    /* The two views disagree on how "finished" is expressed, so a status change
       from either one keeps the boolean in step and they stay consistent. */
    const completed =
      dto.status !== undefined
        ? dto.status === 'completed' || dto.status === 'done'
        : row.completed;
    Object.assign(row, dto, {
      completed,
      dueDate: dto.dueDate === undefined ? row.dueDate : dto.dueDate ? new Date(dto.dueDate) : null,
      lastActivityAt: new Date(),
    });
    return present(await this.todos.save(row));
  }

  async remove(userId: string, id: string) {
    await this.todos.remove(await this.owned(userId, id));
    return { ok: true };
  }

  async addSubTask(userId: string, id: string, dto: SubTaskDto) {
    const row = await this.owned(userId, id);
    row.subTasks = [...(row.subTasks ?? []), { text: dto.text, completed: dto.completed ?? false }];
    row.lastActivityAt = new Date();
    return present(await this.todos.save(row));
  }

  async addComment(userId: string, id: string, dto: CommentDto) {
    const row = await this.owned(userId, id);
    row.comments = [
      ...(row.comments ?? []),
      { text: dto.text, author: dto.author ?? 'User', createdAt: new Date().toISOString() },
    ];
    row.lastActivityAt = new Date();
    return present(await this.todos.save(row));
  }

  async addTimeEntry(userId: string, id: string, dto: TimeEntryDto) {
    const row = await this.owned(userId, id);
    const minutes =
      dto.duration ??
      Math.max(0, Math.round((Date.parse(dto.endTime) - Date.parse(dto.startTime)) / 60000));
    row.timeEntries = [...(row.timeEntries ?? []), { startTime: dto.startTime, endTime: dto.endTime, duration: minutes }];
    /* actualTime is the figure the dashboard totals, so it tracks the entries. */
    row.actualTime = (row.actualTime ?? 0) + minutes;
    row.lastActivityAt = new Date();
    return present(await this.todos.save(row));
  }

  /* The dashboard expects Mongo aggregation output: each distribution is a list
     of { _id, count }, where _id is the bucket name. */
  async stats(userId: string) {
    const rows = await this.todos.find({ where: { userId } });

    const tally = (pick: (t: TaskflowTodo) => string[]) => {
      const counts = new Map<string, number>();
      for (const row of rows) {
        for (const key of pick(row)) {
          if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      return [...counts].map(([_id, count]) => ({ _id, count })).sort((a, b) => b.count - a.count);
    };

    /* Both view vocabularies count as finished, plus the standalone flag the
       list view toggles, or the Kanban's 'done' column reads as 0% complete. */
    const isDone = (r: TaskflowTodo) =>
      r.completed || r.status === 'completed' || r.status === 'done';
    const completed = rows.filter(isDone).length;
    const actual = rows.reduce((sum, r) => sum + (r.actualTime ?? 0), 0);

    return {
      totalTodos: rows.length,
      completedTodos: completed,
      pendingTodos: rows.length - completed,
      statusDistribution:   tally(r => [r.status]),
      priorityDistribution: tally(r => [r.priority]),
      categoryDistribution: tally(r => [r.category]),
      tagUsage:             tally(r => r.tags ?? []),
      estimatedTotalTime: actual,
      actualTotalTime: actual,
      completionRate: rows.length ? Math.round((completed / rows.length) * 100) : 0,
    };
  }
}
