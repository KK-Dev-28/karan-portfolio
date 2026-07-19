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

  filterIcons: Record<string, string> = {
    all:    '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',
    web:    '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16A8 8 0 0010 2zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd"/></svg>',
    design: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clip-rule="evenodd"/></svg>',
    report: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>',
    mobile: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>',
    other:  '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>',
  };

  typeIcons: Record<string, string> = {
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    file:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    link:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
  };

  typeLabels: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    file:  'Document',
    link:  'Live Link',
  };

  catColors: Record<string, string> = {
    web:    '#3b82f6',
    design: '#a855f7',
    report: '#10b981',
    mobile: '#f59e0b',
    other:  '#64748b',
  };

  constructor(private demosService: DemosService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.demosService.getAll().subscribe({
      next: d => { this.demos = d; this.loading = false; this.verifyThumbnails(); },
      error: () => { this.loading = false; },
    });
  }

  /* Dead thumbnail URLs render as an empty dark card (CSS background-image
     has no error event) — preload each and fall back to the placeholder icon */
  private verifyThumbnails() {
    this.demos.forEach(demo => {
      if (!demo.thumbnailUrl) return;
      const img = new Image();
      img.onerror = () => { demo.thumbnailUrl = undefined; };
      img.src = demo.thumbnailUrl;
    });
  }

  get filtered() {
    if (this.activeFilter === 'all') return this.demos;
    return this.demos.filter(d => d.category === this.activeFilter);
  }

  countFor(key: string) {
    return this.demos.filter(d => d.category === key).length;
  }

  // ── 3D card tilt ──────────────────────────────────────
  onCardMove(e: MouseEvent, card: HTMLElement) {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top)  / r.height;
    const rx = (y - 0.5) * -14;
    const ry = (x - 0.5) *  14;
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-10px) scale(1.02)`;
    card.style.transition = 'transform 0.05s ease';
  }

  onCardLeave(card: HTMLElement) {
    card.style.transform = '';
    card.style.transition = 'transform 0.45s cubic-bezier(.23,1,.32,1)';
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
