import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  year = new Date().getFullYear();
  contactInfo: any = null;
  hero: any = null;

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => {
      this.contactInfo = c['contact-info'];
      this.hero = c['hero'];
    });
  }

  go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
