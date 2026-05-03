// marquee.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({ 
  selector: 'app-marquee', 
  standalone: true,
  imports: [CommonModule],
  template:`
<div class="marq"><div class="track">
  <span class="mi" *ngFor="let t of items"><b>●</b>{{ t }}</span>
  <span class="mi" *ngFor="let t of items"><b>●</b>{{ t }}</span>
</div></div>`,
  styleUrls: ['./marquee.component.scss'] 
})
export class MarqueeComponent {
  items = ['Angular 11+','ASP.NET Web API','NestJS','PostgreSQL','SQL Server',
           'Entity Framework','Apache Kafka','TypeScript','C#','REST APIs','Azure DevOps','JWT Auth'];
}