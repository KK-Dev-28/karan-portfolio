import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService, Project } from '../../services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  projects: Project[] = [];
  loading = true;
  private cleanups: (() => void)[] = [];

  constructor(private svc: ProjectService) {}

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: p => { this.projects = p; this.loading = false; setTimeout(() => this.initCards(), 80); },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit() { this.initCards(); }

  private initCards() {
    document.querySelectorAll<HTMLElement>('.bento-card').forEach((card, i) => {
      card.style.setProperty('--card-i', String(i));
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
        const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
        card.style.setProperty('--rx', `${-dy * 8}deg`);
        card.style.setProperty('--ry', `${dx * 8}deg`);
        card.style.setProperty('--sx', `${(dx + 1) * 50}%`);
        card.style.setProperty('--sy', `${(dy + 1) * 50}%`);
      };
      const onLeave = () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      this.cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });
  }

  ngOnDestroy() { this.cleanups.forEach(fn => fn()); }

  stackColor(i: number): string {
    const c = ['green','purple','orange','blue'];
    return c[i % c.length];
  }
}