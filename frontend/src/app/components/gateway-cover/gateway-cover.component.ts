import { Component, OnInit, HostListener, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoundService } from '../../services/sound.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-gateway-cover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gateway-cover.component.html',
  styleUrls: ['./gateway-cover.component.scss'],
})
export class GatewayCoverComponent implements OnInit {
  @Output() enter = new EventEmitter<void>();

  private readonly sound = inject(SoundService);
  private readonly analytics = inject(AnalyticsService);

  isDismissed = false;
  isClosing = false;

  techStack = [
    { name: 'Angular 19', icon: '🅰️', color: '#dd0031' },
    { name: 'NestJS', icon: '🦁', color: '#ea2845' },
    { name: '.NET Core', icon: '⚡', color: '#512bd4' },
    { name: 'PostgreSQL', icon: '🐘', color: '#336791' },
    { name: 'Python NLP', icon: '🐍', color: '#3776ab' },
    { name: 'Docker', icon: '🐳', color: '#2496ed' },
    { name: 'Three.js / 5D', icon: '🌌', color: '#00f0ff' },
  ];

  socialLinks = [
    { name: 'GitHub', url: 'https://github.com/KK-Dev-28', icon: '🐙' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/karan-dev28', icon: '💼' },
    { name: 'WhatsApp', url: 'https://wa.me/918360210214?text=Hi%20Karan,%20I%20saw%20your%20portfolio', icon: '💬' },
    { name: 'Email', url: 'mailto:contact@karan.dev', icon: '✉️' },
  ];

  ngOnInit() {
    // Check if user has already entered in this session
    try {
      if (sessionStorage.getItem('kk_gateway_entered')) {
        this.isDismissed = true;
      }
    } catch {}
  }

  @HostListener('window:wheel', ['$event'])
  onWheel(e: WheelEvent) {
    if (!this.isDismissed && !this.isClosing && e.deltaY > 20) {
      this.dismissCover();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (!this.isDismissed && !this.isClosing && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      this.dismissCover();
    }
  }

  dismissCover() {
    if (this.isClosing || this.isDismissed) return;
    this.isClosing = true;
    this.sound.playSwoosh();
    this.analytics.trackInteraction('dismiss_gateway_cover', 'gateway_cover');

    setTimeout(() => {
      this.isDismissed = true;
      this.isClosing = false;
      this.enter.emit();
      try { sessionStorage.setItem('kk_gateway_entered', 'true'); } catch {}
    }, 650);
  }

  reopenCover() {
    this.isDismissed = false;
    this.isClosing = false;
    this.sound.playPowerUp();
    try { sessionStorage.removeItem('kk_gateway_entered'); } catch {}
  }
}
