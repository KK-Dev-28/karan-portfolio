import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Step { key: string; label: string; multi?: boolean; options: { value: string; label: string; paise: number }[]; }

@Component({
  selector: 'app-estimator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estimator.component.html',
  styleUrls: ['./estimator.component.scss'],
})
export class EstimatorComponent {
  step = 0;
  answers: Record<string, string[]> = { type: [], features: [], timeline: [], pages: [] };
  showResult = false;

  steps: Step[] = [
    {
      key: 'type', label: 'What do you need built?',
      options: [
        { value: 'landing',    label: 'Landing Page',          paise: 500_000  },
        { value: 'portfolio',  label: 'Portfolio / Blog',       paise: 800_000  },
        { value: 'webapp',     label: 'Full-Stack Web App',     paise: 2_000_000 },
        { value: 'api',        label: 'REST API / Backend Only',paise: 1_200_000 },
        { value: 'ecommerce',  label: 'E-Commerce Store',       paise: 2_500_000 },
        { value: 'dashboard',  label: 'Admin / Dashboard',      paise: 1_500_000 },
      ],
    },
    {
      key: 'features', label: 'Which features do you need?', multi: true,
      options: [
        { value: 'auth',     label: 'Login / Auth',        paise: 300_000 },
        { value: 'payment',  label: 'Payments (Razorpay)', paise: 400_000 },
        { value: 'cms',      label: 'CMS / Admin panel',   paise: 500_000 },
        { value: 'api',      label: 'Third-party APIs',    paise: 300_000 },
        { value: 'realtime', label: 'Real-time / Chat',    paise: 600_000 },
        { value: 'ai',       label: 'AI Integration',      paise: 700_000 },
      ],
    },
    {
      key: 'timeline', label: 'When do you need it?',
      options: [
        { value: 'asap',    label: 'ASAP (rush)',    paise: 500_000 },
        { value: '1month',  label: 'Within 1 month', paise: 0       },
        { value: '3months', label: '1–3 months',     paise: -200_000 },
        { value: 'flexible',label: 'Flexible',       paise: -300_000 },
      ],
    },
    {
      key: 'pages', label: 'Roughly how many screens / pages?',
      options: [
        { value: '1-5',   label: '1–5 screens',   paise: 0        },
        { value: '6-10',  label: '6–10 screens',   paise: 400_000  },
        { value: '11-20', label: '11–20 screens',  paise: 900_000  },
        { value: '20+',   label: '20+ screens',    paise: 1_500_000 },
      ],
    },
  ];

  get currentStep() { return this.steps[this.step]; }
  get progress() { return Math.round((this.step / this.steps.length) * 100); }

  isSelected(key: string, value: string) { return this.answers[key]?.includes(value); }

  toggle(key: string, value: string, multi = false) {
    if (!this.answers[key]) this.answers[key] = [];
    if (multi) {
      const idx = this.answers[key].indexOf(value);
      if (idx > -1) this.answers[key].splice(idx, 1); else this.answers[key].push(value);
    } else {
      this.answers[key] = [value];
      if (this.step < this.steps.length - 1) setTimeout(() => this.step++, 180);
      else this.showResult = true;
    }
  }

  nextStep() {
    if (this.step < this.steps.length - 1) this.step++;
    else this.showResult = true;
  }

  get estimate(): { low: string; high: string } {
    let base = 0;
    for (const s of this.steps) {
      const vals = this.answers[s.key] ?? [];
      for (const v of vals) {
        const opt = s.options.find(o => o.value === v);
        if (opt) base += opt.paise;
      }
    }
    base = Math.max(base, 500_000);
    const low  = base * 0.8;
    const high = base * 1.3;
    const fmt  = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n / 100);
    return { low: fmt(low), high: fmt(high) };
  }

  get waMessage() {
    const type     = this.answers['type']?.[0]     ?? 'project';
    const features = this.answers['features']?.join(', ') || 'TBD';
    const timeline = this.answers['timeline']?.[0] ?? 'flexible';
    const pages    = this.answers['pages']?.[0]    ?? 'TBD';
    return encodeURIComponent(
      `Hi Karan, I used your estimator and got an estimate of ${this.estimate.low}–${this.estimate.high}.\nProject type: ${type}\nFeatures: ${features}\nTimeline: ${timeline}\nScreens: ${pages}\nLet's discuss further.`
    );
  }

  restart() { this.step = 0; this.answers = { type: [], features: [], timeline: [], pages: [] }; this.showResult = false; }
}
