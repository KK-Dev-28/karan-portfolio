import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

@Component({
  selector: 'app-marquee',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="marq"><div class="track">
  <span class="mi" *ngFor="let t of items"><b>●</b>{{ t }}</span>
  <span class="mi" *ngFor="let t of items"><b>●</b>{{ t }}</span>
</div></div>`,
  styleUrls: ['./marquee.component.scss'],
})
export class MarqueeComponent implements OnInit {
  items: string[] = [];

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => (this.items = c['marquee'] ?? []));
  }
}
