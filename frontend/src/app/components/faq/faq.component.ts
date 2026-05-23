import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent implements OnInit {
  openIndex: number | null = 0;
  faqs: any[] = [];

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => (this.faqs = c['faqs'] ?? []));
  }

  toggle(i: number) {
    this.openIndex = this.openIndex === i ? null : i;
  }
}
