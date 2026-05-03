// skills.component.ts
import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({ 
  selector: 'app-skills', 
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html', 
  styleUrls: ['./skills.component.scss'] 
})
export class SkillsComponent implements AfterViewInit {
  skills = [
    { name:'Angular / TypeScript', pct:90, color:'green' },
    { name:'ASP.NET Web API / C#', pct:88, color:'green' },
    { name:'SQL Server / EF Core',  pct:82, color:'purple' },
    { name:'NestJS / Node.js',      pct:75, color:'orange' },
    { name:'Apache Kafka',          pct:68, color:'blue' },
    { name:'PostgreSQL',            pct:72, color:'purple' },
    { name:'Next.js / React',       pct:60, color:'green' },
    { name:'Docker / DevOps',       pct:55, color:'orange' },
  ];
  tags = ['VB.NET','.NET MVC','Postman','Git','Jira Cloud','Azure DevOps',
          'CI/CD','JWT Auth','Swagger','RxJS','HTML5/CSS3','REST Design','TypeORM','Entity Framework'];
  animated = false;

  ngAfterViewInit() {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { this.animated = true; obs.disconnect(); }
    }, { threshold: 0.25 });
    const el = document.querySelector('.skills-sec');
    if (el) obs.observe(el);
  }
}