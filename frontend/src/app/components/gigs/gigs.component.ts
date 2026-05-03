// gigs.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({ selector:'app-gigs', standalone: true, imports: [CommonModule], templateUrl:'./gigs.component.html', styleUrls:['./gigs.component.scss'] })
export class GigsComponent {
  gigs = [
    { icon:'✍️', name:'Blog Writing',            desc:'Tech blogs, how-to articles, product write-ups delivered fast with clear and engaging writing. Great for SaaS, IT companies, and developers.',                         time:'⚡ Ready in 5 minutes',   wa:'I need a blog written' },
    { icon:'📊', name:'PowerPoint Presentations', desc:'Professional slide decks for business proposals, tech demos, and project reports. Clean design, well-structured content, impressive output every time.',             time:'⚡ Same-day delivery',     wa:'I need a PowerPoint presentation' },
    { icon:'📄', name:'Word Reports & Documents', desc:'Business reports, technical documentation, SRS documents, and project proposals — well-formatted and professional Word documents.',                                   time:'⚡ Same-day delivery',     wa:'I need a Word document' },
    { icon:'🗒️', name:'Resume / CV Development',  desc:'ATS-friendly, visually polished resumes for developers and professionals. Tailored to your role and experience level to help you land interviews.',                  time:'⚡ Within 24 hours',       wa:'I need a resume built' },
    { icon:'🐛', name:'Bug Fixes & Refactoring',  desc:'Got a broken Angular or .NET app? I will dig in, find the root cause, fix bugs, improve performance, and clean up the codebase — no mess left behind.',           time:'⚡ Quick turnaround',      wa:'I need bug fixes' },
    { icon:'🌐', name:'Full Web Applications',    desc:'Complete web applications — Angular frontend, .NET or NestJS backend, PostgreSQL or SQL Server database. From idea all the way to deployment.',                    time:'⚡ Timeline by scope',     wa:'I need a web app built' },
  ];

  whatsapp(msg: string): string {
    return `https://wa.me/918360426467?text=${encodeURIComponent(msg)}`;
  }
}