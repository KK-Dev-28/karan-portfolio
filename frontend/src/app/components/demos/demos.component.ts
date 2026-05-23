import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemosService, Demo } from '../../services/demos.service';

@Component({
  selector: 'app-demos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.scss'],
})
export class DemosComponent implements OnInit {
  demos: Demo[] = [];
  activeFilter = 'all';
  loading = true;

  filters = [
    { key: 'all', label: 'All Work' },
    { key: 'web', label: 'Web Apps' },
    { key: 'design', label: 'Design' },
    { key: 'report', label: 'Reports' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'other', label: 'Other' },
  ];

  typeIcon: Record<string, string> = {
    image: '🖼️',
    video: '🎬',
    file: '📄',
    link: '🔗',
  };

  constructor(private demosService: DemosService) {}

  ngOnInit() {
    this.demosService.getAll().subscribe({
      next: d => { this.demos = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  get filtered() {
    if (this.activeFilter === 'all') return this.demos;
    return this.demos.filter(d => d.category === this.activeFilter);
  }

  openDemo(demo: Demo) {
    const target = demo.liveUrl || demo.url;
    window.open(target, '_blank', 'noopener,noreferrer');
  }
}
