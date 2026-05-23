import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
  private stars: { x: number; y: number; r: number; speed: number; opacity: number }[] = [];

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    this.cms.getAll().subscribe(c => (this.hero = c['hero']));
  }

  ngAfterViewInit() {
    this.initCanvas();
  }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Create stars
    this.stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.7 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gold gradient radial glow in center
      const grd = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.55);
      grd.addColorStop(0, 'rgba(245,158,11,0.07)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      this.stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,158,11,${s.opacity})`;
        ctx.fill();
        s.y -= s.speed;
        if (s.y < -5) { s.y = canvas.height + 5; s.x = Math.random() * canvas.width; }
      });

      // Draw connecting lines between close stars
      for (let i = 0; i < this.stars.length; i++) {
        for (let j = i + 1; j < this.stars.length; j++) {
          const dx = this.stars[i].x - this.stars[j].x;
          const dy = this.stars[i].y - this.stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(this.stars[i].x, this.stars[i].y);
            ctx.lineTo(this.stars[j].x, this.stars[j].y);
            ctx.strokeStyle = `rgba(245,158,11,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      this.animId = requestAnimationFrame(draw);
    };
    draw();
  }

  go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  get waUrl(): string {
    return `https://wa.me/${this.hero?.whatsappNumber ?? '918360426467'}`;
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
  }
}
