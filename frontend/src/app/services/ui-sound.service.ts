import { Injectable, signal } from '@angular/core';

const KEY = 'kk_sound';

/**
 * Opt-in UI sound design. Every sound is synthesized with the Web Audio API
 * (no audio files): radar blips, soft ticks on controls, a squash pop, a
 * firework thump and an achievement chime. Off by default; the choice is
 * remembered per browser.
 */
@Injectable({ providedIn: 'root' })
export class UiSoundService {
  readonly on = signal(read());
  private ctx?: AudioContext;
  private master?: GainNode;

  constructor() {
    if (typeof window === 'undefined') return;
    // A light tick for the site's main controls, delegated once.
    addEventListener('click', e => {
      const t = (e.target as Element | null)?.closest?.('.mc-btn, .chip, .vote, .filter, .tier, .mc-link, .nav-cta');
      if (t) this.tick();
    }, { capture: true, passive: true });
  }

  toggle() {
    this.on.update(v => !v);
    try { localStorage.setItem(KEY, this.on() ? '1' : '0'); } catch {}
    if (this.on()) this.chime();
  }

  /** Short sine blip; pitch varies so repeated pings don't drone. */
  blip(freq = 880) { this.tone(freq, .09, 'sine', .05); }

  tick() { this.tone(1600, .03, 'triangle', .025); }

  pop() { this.tone(520, .06, 'square', .03, 180); }

  thump() { this.noise(.35, .09, 900); this.tone(90, .3, 'sine', .08, 40); }

  /** Rising major arpeggio. */
  chime() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => this.tone(f, .22, 'sine', .05), i * 80)); }

  private audio(): AudioContext | null {
    if (!this.on() || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = .8;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, endFreq?: number) {
    const ctx = this.audio(); if (!ctx || !this.master) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + .02);
  }

  private noise(dur: number, vol: number, cutoff: number) {
    const ctx = this.audio(); if (!ctx || !this.master) return;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = cutoff; g.gain.value = vol;
    src.buffer = buf; src.connect(f).connect(g).connect(this.master);
    src.start();
  }
}

function read(): boolean { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } }
