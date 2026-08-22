import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DemoTasksService, DemoTask, TaskStatus } from '../../services/demo-tasks.service';

interface Column { key: TaskStatus; label: string; }

@Component({
  selector: 'app-demo-tasks-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demo-tasks.page.html',
  styleUrls: ['./demo-tasks.page.scss'],
})
export class DemoTasksPageComponent implements OnInit {
  readonly columns: Column[] = [
    { key: 'todo',        label: 'To do' },
    { key: 'in-progress', label: 'In progress' },
    { key: 'done',        label: 'Done' },
  ];

  tasks: DemoTask[] = [];
  loading = true;
  error = '';

  newText = '';
  newPriority: 'low' | 'medium' | 'high' = 'medium';
  adding = false;

  /* Set while a card is mid-flight so its own column shows the pending state
     rather than the whole board flickering. */
  busyId = '';
  draggingId = '';

  constructor(private api: DemoTasksService) {}

  ngOnInit(): void { this.reload(); }

  private reload(): void {
    this.api.list().subscribe({
      next: t => { this.tasks = t; this.loading = false; },
      error: e => this.fail(e),
    });
  }

  column(status: TaskStatus): DemoTask[] {
    return this.tasks.filter(t => t.status === status);
  }

  countFor(status: TaskStatus): number {
    return this.column(status).length;
  }

  add(): void {
    const text = this.newText.trim();
    if (!text || this.adding) return;

    this.error = '';
    this.adding = true;
    this.api.create({ text, priority: this.newPriority, status: 'todo', category: 'work' }).subscribe({
      next: created => {
        /* Prepend rather than refetch: the list is ordered by activity, and a
           brand-new task is the most recent thing on the board. */
        this.tasks = [created, ...this.tasks];
        this.newText = '';
        this.adding = false;
      },
      error: e => { this.adding = false; this.fail(e); },
    });
  }

  move(task: DemoTask, status: TaskStatus): void {
    if (task.status === status) return;
    this.error = '';
    this.busyId = task.id;

    /* Moving into Done implies the work is finished, and out of it implies the
       opposite — keeping completed and progress in step means the card never
       reads as 100% while sitting in To do. */
    const patch: Partial<DemoTask> = {
      status,
      completed: status === 'done',
      progress: status === 'done' ? 100 : (status === 'in-progress' ? 50 : 0),
    };

    this.api.update(task.id, patch).subscribe({
      next: updated => {
        this.tasks = this.tasks.map(t => (t.id === updated.id ? updated : t));
        this.busyId = '';
      },
      error: e => { this.busyId = ''; this.fail(e); },
    });
  }

  star(task: DemoTask): void {
    this.error = '';
    this.api.update(task.id, { isStarred: !task.isStarred }).subscribe({
      next: updated => (this.tasks = this.tasks.map(t => (t.id === updated.id ? updated : t))),
      error: e => this.fail(e),
    });
  }

  remove(task: DemoTask): void {
    this.error = '';
    this.busyId = task.id;
    this.api.remove(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.busyId = '';
      },
      error: e => { this.busyId = ''; this.fail(e); },
    });
  }

  // ── drag and drop ─────────────────────────────────────────────────────────

  onDragStart(task: DemoTask): void { this.draggingId = task.id; }
  onDragEnd(): void { this.draggingId = ''; }

  /* Without preventDefault the browser refuses the drop outright — the default
     for a dragover is "not a valid target". */
  onDragOver(event: DragEvent): void { event.preventDefault(); }

  onDrop(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    const task = this.tasks.find(t => t.id === this.draggingId);
    this.draggingId = '';
    if (task) this.move(task, status);
  }

  nextStatus(status: TaskStatus): TaskStatus {
    return status === 'todo' ? 'in-progress' : status === 'in-progress' ? 'done' : 'todo';
  }

  dueLabel(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  isOverdue(task: DemoTask): boolean {
    if (!task.dueDate || task.status === 'done') return false;
    const d = new Date(task.dueDate);
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
  }

  private fail(e: any): void {
    this.loading = false;
    const msg = e?.error?.message;
    this.error = Array.isArray(msg) ? msg.join(', ') : (msg || 'Something went wrong. Is the API running?');
  }
}
