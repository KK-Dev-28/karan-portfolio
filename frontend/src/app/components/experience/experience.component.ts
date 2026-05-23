import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss'],
})
export class ExperienceComponent implements OnInit {
  items: any[] = [];

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => (this.items = c['experience'] ?? []));
  }
}
