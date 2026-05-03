// projects.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService, Project } from '../../services/project.service';

@Component({ 
  selector: 'app-projects', 
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html', 
  styleUrls: ['./projects.component.scss'] 
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  loading = true;

  constructor(private svc: ProjectService) {}
  ngOnInit() {
    this.svc.getAll().subscribe({ next: p => { this.projects = p; this.loading = false; }, error: () => { this.loading = false; } });
  }

  stackColor(i: number): string {
    const c = ['green','purple','orange','blue'];
    return c[i % c.length];
  }
}