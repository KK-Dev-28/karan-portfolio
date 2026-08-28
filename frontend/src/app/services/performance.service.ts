import { Injectable, NgZone, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type QualityTier = 'ULTRA' | 'HIGH' | 'MID' | 'LOW' | 'FALLBACK_2D';

export interface PerformanceSnapshot {
  tier: QualityTier;
  fps: number;
  dpr: number;
  particleBudget: number;
  reducedMotion: boolean;
  isMobile: boolean;
  hardwareConcurrency: number;
}

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private readonly doc = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);

  private readonly tierSubject = new BehaviorSubject<QualityTier>('HIGH');
  public readonly qualityTier$: Observable<QualityTier> = this.tierSubject.asObservable();

  private fpsHistory: number[] = [];
  private currentFps = 60;
  private isReducedMotion = false;
  private isMobileDevice = false;
  private rafId = 0;
  private monitoring = false;

  constructor() {
    this.detectEnvironment();
  }

  public get currentTier(): QualityTier {
    return this.tierSubject.value;
  }

  public get snapshot(): PerformanceSnapshot {
    return {
      tier: this.currentTier,
      fps: Math.round(this.currentFps),
      dpr: this.getRecommendedDpr(),
      particleBudget: this.getParticleBudget(),
      reducedMotion: this.isReducedMotion,
      isMobile: this.isMobileDevice,
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
    };
  }

  private detectEnvironment(): void {
    const win = this.doc.defaultView;
    if (!win) {
      this.tierSubject.next('FALLBACK_2D');
      return;
    }

    const reduceMotionMedia = win.matchMedia('(prefers-reduced-motion: reduce)');
    this.isReducedMotion = reduceMotionMedia.matches;
    reduceMotionMedia.addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
      this.recalculateTier();
    });

    const mobileMedia = win.matchMedia('(max-width: 768px)');
    this.isMobileDevice = mobileMedia.matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    this.recalculateTier();
    this.startFpsSampler();
  }

  private recalculateTier(): void {
    if (this.isReducedMotion) {
      this.tierSubject.next('FALLBACK_2D');
      return;
    }

    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const isHighEnd = !this.isMobileDevice && cores >= 8 && (window.devicePixelRatio || 1) >= 1.5;

    if (isHighEnd) {
      this.tierSubject.next('ULTRA');
    } else if (!this.isMobileDevice && cores >= 4) {
      this.tierSubject.next('HIGH');
    } else if (this.isMobileDevice && cores >= 4) {
      this.tierSubject.next('MID');
    } else {
      this.tierSubject.next('LOW');
    }
  }

  private startFpsSampler(): void {
    const win = this.doc.defaultView;
    if (!win || this.monitoring || this.isReducedMotion) return;
    this.monitoring = true;

    this.ngZone.runOutsideAngular(() => {
      let frames = 0;
      let lastCheck = performance.now();

      const sample = (now: number) => {
        frames++;
        if (now - lastCheck >= 1000) {
          this.currentFps = (frames * 1000) / (now - lastCheck);
          this.fpsHistory.push(this.currentFps);
          if (this.fpsHistory.length > 5) this.fpsHistory.shift();

          const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
          this.adjustTierOnPerformance(avgFps);

          frames = 0;
          lastCheck = now;
        }
        this.rafId = win.requestAnimationFrame(sample);
      };
      this.rafId = win.requestAnimationFrame(sample);
    });
  }

  private adjustTierOnPerformance(avgFps: number): void {
    if (this.isReducedMotion) return;

    const current = this.tierSubject.value;
    if (avgFps < 32 && current === 'ULTRA') {
      this.tierSubject.next('HIGH');
    } else if (avgFps < 30 && current === 'HIGH') {
      this.tierSubject.next('MID');
    } else if (avgFps < 24 && current === 'MID') {
      this.tierSubject.next('LOW');
    } else if (avgFps < 18 && current === 'LOW') {
      this.tierSubject.next('FALLBACK_2D');
    }
  }

  public getRecommendedDpr(): number {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    switch (this.currentTier) {
      case 'ULTRA': return Math.min(dpr, 2.0);
      case 'HIGH':  return Math.min(dpr, 1.5);
      case 'MID':   return 1.0;
      case 'LOW':   return 0.85;
      case 'FALLBACK_2D': return 1.0;
    }
  }

  public getParticleBudget(): number {
    switch (this.currentTier) {
      case 'ULTRA': return this.isMobileDevice ? 140 : 320;
      case 'HIGH':  return this.isMobileDevice ? 100 : 240;
      case 'MID':   return this.isMobileDevice ? 60 : 130;
      case 'LOW':   return 40;
      case 'FALLBACK_2D': return 0;
    }
  }
}
