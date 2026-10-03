import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteContentService } from '../../services/site-content.service';

interface Link      { label: string; url: string }
interface Role      { role: string; company: string; location: string; period: string; bullets: string[] }
interface Education { degree: string; institution: string; period: string; score: string; note: string }
interface Award     { title: string; issuer: string; date: string }
interface Project   { name: string; stack: string; summary: string; link?: string }
interface Cert      { title: string; issuer: string; date: string; note: string }

interface Resume {
  name: string; title: string; tagline: string; location: string;
  email: string; phone: string; availability: string;
  links: Link[]; summary: string;
  experience: Role[]; education: Education[];
  skills: Record<string, string[]>;
  projects?: Project[];
  certifications?: Cert[];
  awards: Award[];
}

@Component({
  selector: 'app-resume-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resume.page.html',
  styleUrls: ['./resume.page.scss'],
})
export class ResumePageComponent implements OnInit {
  cv: Resume | null = null;
  loading = true;

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getSection('resume').subscribe({
      next: (data: any) => { this.cv = data ?? null; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  /* The browser's own print dialog is the download: it produces a correctly
     paginated PDF with selectable text, which a client-side image or canvas
     export would not. It also needs no file storage, which this backend has
     none of. */
  download() { window.print(); }

  skillGroups(): { name: string; items: string[] }[] {
    const s = this.cv?.skills ?? {};
    return Object.keys(s).map(name => ({ name, items: s[name] }));
  }

  /** Tel/mailto need the raw value; the page shows the formatted one. */
  telHref(phone: string) { return 'tel:' + (phone || '').replace(/[^\d+]/g, ''); }
}
