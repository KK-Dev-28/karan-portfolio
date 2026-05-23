import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

@Component({
  selector: 'app-gigs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gigs.component.html',
  styleUrls: ['./gigs.component.scss'],
})
export class GigsComponent implements OnInit {
  gigs: any[] = [];
  contactInfo: any = null;

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => {
      this.gigs = c['gigs'] ?? [];
      this.contactInfo = c['contact-info'];
    });
  }

  waUrl(msg: string): string {
    return `/api/wa?text=${encodeURIComponent(msg)}`;
  }
}
