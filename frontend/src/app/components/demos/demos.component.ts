import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DemosService, Demo } from '../../services/demos.service';
import { ReactionBarComponent } from '../reaction-bar/reaction-bar.component';

@Component({
  selector: 'app-demos',
  standalone: true,
  imports: [CommonModule, ReactionBarComponent],
  templateUrl: './demos.component.html',
  styleUrls: ['./demos.component.scss'],
})
export class DemosComponent implements OnInit {
  demos: Demo[] = [];
  activeFilter = 'all';
  loading = true;

  modalOpen    = false;
  modalDemo: Demo | null = null;
  safeUrl: SafeResourceUrl | null = null;

  filters = [
    { key: 'all',    label: 'All Work'  },
    { key: 'web',    label: 'Web Apps'  },
    { key: 'design', label: 'Design'    },
    { key: 'report', label: 'Reports'   },
    { key: 'mobile', label: 'Mobile'    },
    { key: 'other',  label: 'Other'     },
  ];

  typeIcon: Record<string, string> = {
    image: '🖼️', video: '🎬', file: '📄', link: '🔗',
  };

  constructor(private demosService: DemosService, private sanitizer: DomSanitizer) {}

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
    if (demo.type === 'link') {
      window.open(demo.liveUrl || demo.url, '_blank', 'noopener,noreferrer');
      return;
    }
    this.modalDemo = demo;
    this.safeUrl   = demo.type === 'file'
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(demo.url)}&embedded=true`)
      : this.sanitizer.bypassSecurityTrustResourceUrl(demo.url);
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modalOpen = false;
    this.modalDemo = null;
    this.safeUrl   = null;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.modalOpen) this.closeModal(); }

  @HostListener('contextmenu', ['$event'])
  onRightClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.demo-card') || target.closest('.demo-modal-inner')) {
      e.preventDefault();
      return false;
    }
    return true;
  }
}
