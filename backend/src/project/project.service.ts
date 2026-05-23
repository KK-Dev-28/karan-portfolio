// project.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(@InjectRepository(Project) private repo: Repository<Project>) {}

  findAll()     { return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } }); }
  findFeatured(){ return this.repo.find({ where: { isFeatured: true }, order: { sortOrder: 'ASC' } }); }

  async create(data: Partial<Project>) {
    return this.repo.save(this.repo.create(data));
  }
  async update(id: number, data: Partial<Project>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
  async remove(id: number) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException();
    await this.repo.remove(p);
    return { ok: true };
  }

  /* Seed Karan's real projects on first run */
  async seed() {
    const count = await this.repo.count();
    if (count > 0) return;
    const projects = [
      { title: 'Enterprise Inventory Management System', description: 'Multi-branch inventory platform covering Head Office, Back Office, and HHT/POS Android devices. Apache Kafka integration for real-time data messaging between branches. Modules include stock management, order requests, inter-store transfers, and supplier price lists.', techStack: ['Angular', 'ASP.NET Web API', 'C#', 'Entity Framework', 'SQL Server', 'Apache Kafka'], period: 'Sep 2025 – Present', isFeatured: true, sortOrder: 1, },
      { title: 'Talent Arbor — Applicant Tracking System', description: 'End-to-end recruitment platform for job posting, candidate tracking, and recruiter management. Candidate pipeline with status updates, CV management, and job application workflows.', techStack: ['Angular', 'ASP.NET Web API'], period: 'Aug 2025 – Present', isFeatured: false, sortOrder: 2 },
      { title: 'Swaraj Mahindra — Enterprise Dept Management', description: 'Enterprise-level admin web app for department and organizational activity management. Scalable architecture for large organizations with multiple admin roles.', techStack: ['Angular', 'ASP.NET Web API'], period: 'Mar 2025 – Sep 2025', isFeatured: false, sortOrder: 3 },
      { title: '3T – Task Time Tracking', description: 'Internal productivity tool where employees log tasks, time spent, and project contributions. Enables managers to monitor team output and project-level resource utilization.', techStack: ['Angular', 'ASP.NET Web API'], period: 'Aug 2024 – Dec 2024', isFeatured: false, sortOrder: 4 },
      { title: 'Mastermind Duo Tax — Property App', description: 'Property management app with depreciation tracking, capital loss management, and detailed property records.', techStack: ['Angular 11', 'ASP.NET Web API'], period: 'Feb 2025', isFeatured: false, sortOrder: 5 },
      { title: 'GeoData — Property Management Portal', description: 'End-to-end property lifecycle tracking covering ownership, tenancy, rentals, and map location integration.', techStack: ['VB.NET', 'C#', '.NET', 'SQL Server'], period: '2023 – 2024', isFeatured: false, sortOrder: 6 },
    ];
    await this.repo.save(projects.map(p => this.repo.create(p)));
    console.log('✅ Projects seeded to PostgreSQL');
  }
}
