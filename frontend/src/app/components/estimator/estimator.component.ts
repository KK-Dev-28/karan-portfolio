import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Step { key: string; label: string; multi?: boolean; options: { value: string; label: string }[]; }

@Component({
  selector: 'app-estimator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estimator.component.html',
  styleUrls: ['./estimator.component.scss'],
})
export class EstimatorComponent {
  step = 0;
  answers: Record<string, string[]> = {};
  phase: 'quiz' | 'contact' | 'done' = 'quiz';
  submitting = false;
  submitErr = '';

  contact = { name: '', email: '', phone: '', notes: '' };

  steps: Step[] = [
    {
      key: 'type', label: 'What do you need?',
      options: [
        { value: 'landing',    label: 'Landing / Portfolio Page'   },
        { value: 'webapp',     label: 'Full-Stack Web App'          },
        { value: 'api',        label: 'REST API / Backend Only'     },
        { value: 'ecommerce',  label: 'E-Commerce Store'            },
        { value: 'dashboard',  label: 'Admin / Dashboard'           },
        { value: 'ppt',        label: 'Presentation / PPT'         },
        { value: 'report',     label: 'Report / Document'           },
        { value: 'desktop',    label: 'Desktop Application'         },
        { value: 'other',      label: 'Something else'              },
      ],
    },
    {
      key: 'features', label: 'Which features are important?', multi: true,
      options: [
        { value: 'auth',     label: 'Login / User Accounts' },
        { value: 'payment',  label: 'Payments Integration'  },
        { value: 'cms',      label: 'Content Management'    },
        { value: 'api',      label: 'Third-party APIs'      },
        { value: 'realtime', label: 'Real-time / Chat'      },
        { value: 'ai',       label: 'AI / Automation'       },
        { value: 'mobile',   label: 'Mobile Responsive'     },
        { value: 'analytics',label: 'Analytics / Reports'   },
      ],
    },
    {
      key: 'timeline', label: 'When do you need it ready?',
      options: [
        { value: 'urgent',   label: 'Urgent — within a week' },
        { value: '1month',   label: 'Within 1 month'         },
        { value: '3months',  label: '1–3 months'             },
        { value: 'flexible', label: 'Flexible / No rush'     },
      ],
    },
    {
      key: 'budget', label: 'Roughly what budget do you have in mind?',
      options: [
        { value: 'discuss', label: 'Discuss after scoping' },
        { value: 'small',   label: 'Small project'         },
        { value: 'medium',  label: 'Medium project'        },
        { value: 'large',   label: 'Large / Long-term'     },
      ],
    },
  ];

  constructor(private http: HttpClient) {}

  get currentStep() { return this.steps[this.step]; }
  get progress()    { return Math.round(((this.step + 1) / (this.steps.length + 1)) * 100); }

  isSelected(key: string, value: string) { return this.answers[key]?.includes(value) ?? false; }

  toggle(key: string, value: string, multi = false) {
    if (!this.answers[key]) this.answers[key] = [];
    if (multi) {
      const idx = this.answers[key].indexOf(value);
      if (idx > -1) this.answers[key].splice(idx, 1); else this.answers[key].push(value);
    } else {
      this.answers[key] = [value];
      if (this.step < this.steps.length - 1) setTimeout(() => this.step++, 180);
      else this.phase = 'contact';
    }
  }

  nextStep() {
    if (this.step < this.steps.length - 1) this.step++;
    else this.phase = 'contact';
  }

  get waMessage() {
    const type     = this.answers['type']?.[0]      ?? 'project';
    const features = this.answers['features']?.join(', ') || 'TBD';
    const timeline = this.answers['timeline']?.[0]  ?? 'flexible';
    const budget   = this.answers['budget']?.[0]    ?? 'TBD';
    const notes    = this.contact.notes ? `\nNotes: ${this.contact.notes}` : '';
    return encodeURIComponent(
      `Hi Karan, I submitted a project inquiry.\nName: ${this.contact.name}\nType: ${type}\nFeatures: ${features}\nTimeline: ${timeline}\nBudget: ${budget}${notes}\nPlease reach out to discuss further.`,
    );
  }

  submit() {
    if (!this.contact.name.trim() || !this.contact.email.trim()) {
      this.submitErr = 'Name and email are required.'; return;
    }
    this.submitting = true; this.submitErr = '';

    const requirements = {
      type:     this.answers['type'],
      features: this.answers['features'],
      timeline: this.answers['timeline'],
      budget:   this.answers['budget'],
      notes:    this.contact.notes,
    };

    this.http.post(`${environment.apiUrl}/service-orders`, {
      serviceType:   this.answers['type']?.[0] ?? 'general',
      customerName:  this.contact.name.trim(),
      customerEmail: this.contact.email.trim(),
      customerPhone: this.contact.phone.trim() || undefined,
      requirements,
      status: 'inquiry',
    }).subscribe({
      next: () => { this.submitting = false; this.phase = 'done'; },
      error: () => {
        // Still show done — save to WA as fallback
        this.submitting = false; this.phase = 'done';
      },
    });
  }

  restart() {
    this.step = 0;
    this.answers = {};
    this.contact = { name: '', email: '', phone: '', notes: '' };
    this.phase = 'quiz';
    this.submitErr = '';
  }
}
