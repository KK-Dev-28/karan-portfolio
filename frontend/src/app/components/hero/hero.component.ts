import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteContentService } from '../../services/site-content.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  hero: any = null;
  private animId = 0;
  private mouse = { x: -9999, y: -9999 };
  private particles: {
    x: number; y: number; vx: number; vy: number;
    r: number; opacity: number; color: string;
  }[] = [];

  nameLetters: string[] = [];
  lastLetters: string[] = [];

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => {
      this.hero = c['hero'];
      if (this.hero?.name)     this.nameLetters = this.hero.name.split('');
      if (this.hero?.lastName) this.lastLetters = this.hero.lastName.split('');
    });
  }

  ngAfterViewInit() { this.initCanvas(); }

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent) { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }

  @HostListener('mouseleave')
  onLeave() { this.mouse.x = -9999; this.mouse.y = -9999; }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const colors = ['rgba(245,158,11,', 'rgba(251,191,36,', 'rgba(217,119,6,', 'rgba(139,92,246,', 'rgba(59,130,246,'];

    // Render at native device resolution (capped at 2x) so particles stay crisp on HiDPI
    let vw = 0, vh = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width  = vw * dpr;
      canvas.height = vh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.particles = Array.from({ length: vw < 768 ? 110 : 280 }, () => ({
        x:       Math.random() * vw,
        y:       Math.random() * vh,
        vx:      (Math.random() - 0.5) * 0.4,
        vy:      -(Math.random() * 0.5 + 0.1),
        r:       Math.random() * 2 + 0.4,
        opacity: Math.random() * 0.6 + 0.15,
        color:   colors[Math.floor(Math.random() * colors.length)],
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, vw, vh);

      // Central aurora glow
      const grd = ctx.createRadialGradient(vw / 2, vh * 0.45, 0, vw / 2, vh * 0.45, vw * 0.55);
      grd.addColorStop(0, 'rgba(245,158,11,0.06)');
      grd.addColorStop(0.5, 'rgba(139,92,246,0.03)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, vw, vh);

      this.particles.forEach(p => {
        // Mouse attraction
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (1 - dist / 180) * 0.015;
          p.vx += dx * force * 0.1;
          p.vy += dy * force * 0.1;
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;
        if (Math.abs(p.vy) < 0.05 && dist > 180) p.vy = -(Math.random() * 0.3 + 0.1);

        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) { p.y = vh + 10; p.x = Math.random() * vw; }
        if (p.x < -10) p.x = vw + 10;
        if (p.x > vw + 10) p.x = -10;

        // Glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        glow.addColorStop(0, `${p.color}${p.opacity})`);
        glow.addColorStop(1, `${p.color}0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      });

      // Connecting lines
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(this.particles[i].x, this.particles[i].y);
            ctx.lineTo(this.particles[j].x, this.particles[j].y);
            ctx.strokeStyle = `rgba(245,158,11,${0.12 * (1 - d / 90)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      this.animId = requestAnimationFrame(draw);
    };
    draw();
  }

  go(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
  get waUrl() { return `/api/wa?text=Hi Karan, I saw your portfolio and want to discuss a project.`; }
  ngOnDestroy() { cancelAnimationFrame(this.animId); }
}
