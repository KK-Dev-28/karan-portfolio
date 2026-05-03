// services.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({ 
  selector: 'app-services', 
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.component.html', 
  styleUrls: ['./services.component.scss'] 
})
export class ServicesComponent {
  services = [
    { icon:'🅰️', name:'Angular Apps',       color:'green',  desc:'Dashboards, admin panels, portals & SPAs with clean component architecture and responsive design.' },
    { icon:'⚙️', name:'REST API Dev',        color:'purple', desc:'Scalable APIs using ASP.NET Web API or NestJS with auth, guards, validation and Swagger docs.' },
    { icon:'🗄️', name:'Database Design',     color:'orange', desc:'Relational schema design, Entity Framework migrations, stored procedures, SQL Server & PostgreSQL.' },
    { icon:'🏢', name:'ERP / Inventory',     color:'blue',   desc:'Multi-branch inventory, HR portals, ATS platforms and enterprise management systems.' },
    { icon:'🔄', name:'Apache Kafka',        color:'green',  desc:'Real-time data messaging between services and branches using Apache Kafka event streaming.' },
    { icon:'🚀', name:'Full Deployment',     color:'purple', desc:'Complete CI/CD setup, Docker containers, deployment to Railway, Vercel, or Azure.' },
  ];
}