import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit,
  HostListener, NgZone, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { SiteContentService } from '../../services/site-content.service';
import { PerformanceService, QualityTier } from '../../services/performance.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly cms = inject(SiteContentService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly perf = inject(PerformanceService);
  private readonly analytics = inject(AnalyticsService);
  private readonly ngZone = inject(NgZone);
  private readonly hostEl = inject(ElementRef);

  hero: any = null;
  nameLetters: string[] = [];
  lastLetters: string[] = [];

  tourOpen = false;
  tourUrl: SafeResourceUrl | null = null;
  currentTier: QualityTier = 'HIGH';

  private animId = 0;
  private isVisible = true;
  private themeObs?: MutationObserver;
  private intersectionObs?: IntersectionObserver;
  private perfSub?: Subscription;
  private mouse = { x: -9999, y: -9999, active: false };

  private particles: {
    x: number; y: number; vx: number; vy: number;
    r: number; opacity: number; color: string;
  }[] = [];

  openTour() {
    const embed = toEmbedUrl(this.hero?.tourVideoUrl);
    if (!embed) return;
    this.tourUrl  = this.sanitizer.bypassSecurityTrustResourceUrl(embed);
    this.tourOpen = true;
    this.analytics.trackInteraction('open_video_tour', 'hero');
  }

  closeTour() {
    this.tourOpen = false;
    this.tourUrl  = null;
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.tourOpen) this.closeTour(); }

  taglines = [
    'Full Stack Software Developer',
    'Angular & .NET C# Web API Architect',
    'Entity Framework Core & NestJS Specialist',
    'MSSQL, PostgreSQL & SymmetricDS Engineer',
    'Python NLP & AI Systems Integrator',
  ];
  currentTagline = 'Full Stack Software Developer';
  private taglineIdx = 0;
  private taglineInterval?: any;

  ngOnInit() {
    this.cms.getAll().subscribe(c => {
      this.hero = c['hero'];
      if (this.hero?.name)     this.nameLetters = this.hero.name.split('');
      if (this.hero?.lastName) this.lastLetters = this.hero.lastName.split('');
    });

    this.startTaglineCycle();

    this.perfSub = this.perf.qualityTier$.subscribe(tier => {
      this.currentTier = tier;
      if (this.canvasRef?.nativeElement) {
        this.rebuildParticles();
      }
    });
  }

  private startTaglineCycle() {
    this.taglineInterval = setInterval(() => {
      this.taglineIdx = (this.taglineIdx + 1) % this.taglines.length;
      this.currentTagline = this.taglines[this.taglineIdx];
    }, 3200);
  }

  ngAfterViewInit() {
    this.setupViewportObserver();
    this.initCanvas();
  }

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.active = true;
  }

  @HostListener('mouseleave')
  onLeave() {
    this.mouse.x = -9999;
    this.mouse.y = -9999;
    this.mouse.active = false;
  }

  private setupViewportObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    this.intersectionObs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.animId && this.currentTier !== 'FALLBACK_2D') {
          this.startAnimationLoop();
        }
      },
      { threshold: 0.05 }
    );

    this.intersectionObs.observe(this.hostEl.nativeElement);
  }

  private rebuildParticles() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const count = this.perf.getParticleBudget();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const colors = this.readPaletteColors();

    this.particles = Array.from({ length: count }, () => ({
      x:       Math.random() * vw,
      y:       Math.random() * vh,
      vx:      (Math.random() - 0.5) * 0.4,
      vy:      -(Math.random() * 0.5 + 0.1),
      r:       Math.random() * 2 + 0.4,
      opacity: Math.random() * 0.6 + 0.15,
      color:   colors[Math.floor(Math.random() * colors.length)],
    }));
  }

  private readPaletteColors(): string[] {
    const cs = getComputedStyle(document.documentElement);
    const rgb = (name: string, fallback: string) =>
      `rgba(${(cs.getPropertyValue(name).trim() || fallback)},`;

    return [
      rgb('--accent-rgb',   '245,158,11'),
      rgb('--accent-2-rgb', '251,191,36'),
      rgb('--violet-rgb',   '139,92,246'),
      rgb('--electric-rgb', '59,130,246'),
    ];
  }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const onResize = () => {
      if (this.currentTier === 'FALLBACK_2D') return;
      const dpr = this.perf.getRecommendedDpr();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.width  = vw * dpr;
      canvas.height = vh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.rebuildParticles();
    };

    onResize();
    window.addEventListener('resize', onResize, { passive: true });

    this.themeObs = new MutationObserver(() => {
      const colors = this.readPaletteColors();
      for (const p of this.particles) {
        p.color = colors[Math.floor(Math.random() * colors.length)];
      }
    });
    this.themeObs.observe(document.documentElement, { attributeFilter: ['data-theme'] });

    this.startAnimationLoop();
  }

  private startAnimationLoop() {
    if (this.animId || this.currentTier === 'FALLBACK_2D') return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.ngZone.runOutsideAngular(() => {
      const draw = () => {
        if (!this.isVisible || this.currentTier === 'FALLBACK_2D') {
          this.animId = 0;
          return;
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const colors = this.readPaletteColors();
        const cs = getComputedStyle(document.documentElement);
        const light = isLightHex(cs.getPropertyValue('--bg').trim());
        const alphaScale = light ? 2.1 : 1;
        const lineAlpha  = light ? 0.25 : 0.12;

        ctx.clearRect(0, 0, vw, vh);

        // Volumetric aurora glow
        if (this.currentTier !== 'LOW') {
          const grd = ctx.createRadialGradient(vw / 2, vh * 0.45, 0, vw / 2, vh * 0.45, vw * 0.55);
          grd.addColorStop(0, `${colors[0]}0.07)`);
          grd.addColorStop(0.5, `${colors[2]}0.03)`);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, vw, vh);
        }

        // Particles physics
        for (let idx = 0; idx < this.particles.length; idx++) {
          const p = this.particles[idx];

          if (this.mouse.active) {
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160) {
              const force = (1 - dist / 160) * 0.02;
              p.vx += dx * force * 0.12;
              p.vy += dy * force * 0.12;
            }
          }

          p.vx *= 0.98;
          p.vy *= 0.98;
          if (Math.abs(p.vy) < 0.05) p.vy = -(Math.random() * 0.3 + 0.1);

          p.x += p.vx;
          p.y += p.vy;

          if (p.y < -10) { p.y = vh + 10; p.x = Math.random() * vw; }
          if (p.x < -10) p.x = vw + 10;
          if (p.x > vw + 10) p.x = -10;

          // Render particle dot & halo
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${Math.min(1, p.opacity * alphaScale)})`;
          ctx.fill();
        }

        // Connection arcs (active for MID, HIGH, ULTRA)
        if (this.currentTier !== 'LOW' && this.particles.length > 0) {
          const maxDist = vw < 768 ? 70 : 90;
          for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
              const dx = this.particles[i].x - this.particles[j].x;
              const dy = this.particles[i].y - this.particles[j].y;
              const d  = Math.sqrt(dx * dx + dy * dy);
              if (d < maxDist) {
                ctx.beginPath();
                ctx.moveTo(this.particles[i].x, this.particles[i].y);
                ctx.lineTo(this.particles[j].x, this.particles[j].y);
                ctx.strokeStyle = `${colors[0]}${lineAlpha * (1 - d / maxDist)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }

        this.animId = requestAnimationFrame(draw);
      };

      this.animId = requestAnimationFrame(draw);
    });
  }

  go(id: string) {
    this.analytics.trackCta(id, 'hero');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  get waUrl() {
    return `/api/wa?text=Hi Karan, I saw your portfolio and want to discuss a project.`;
  }

  ngOnDestroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.themeObs?.disconnect();
    this.intersectionObs?.disconnect();
    this.perfSub?.unsubscribe();
  }
}

function isLightHex(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5;
}

function toEmbedUrl(raw: string | undefined | null): string | null {
  const url = (raw ?? '').trim();
  if (!url) return null;

  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;

  return /^https:\/\//.test(url) ? url : null;
}
