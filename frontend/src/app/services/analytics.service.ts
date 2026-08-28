import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TelemetryEvent {
  eventName: string;
  category: 'interaction' | 'conversion' | 'performance' | 'system' | 'navigation';
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private eventQueue: TelemetryEvent[] = [];
  private flushTimer: any = null;

  getDashboard(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/admin/dashboard`);
  }

  /**
   * Track a structured user or system event with automatic batching/throttling.
   */
  trackEvent(event: TelemetryEvent): void {
    const enrichedEvent: TelemetryEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      metadata: {
        ...event.metadata,
        url: typeof window !== 'undefined' ? window.location.pathname : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
    };

    this.eventQueue.push(enrichedEvent);
    this.scheduleFlush();
  }

  trackCta(ctaLabel: string, section: string, destination?: string): void {
    this.trackEvent({
      eventName: 'cta_click',
      category: 'conversion',
      label: ctaLabel,
      metadata: { section, destination },
    });
  }

  trackInteraction(action: string, component: string, details?: Record<string, any>): void {
    this.trackEvent({
      eventName: action,
      category: 'interaction',
      label: component,
      metadata: details,
    });
  }

  trackPerformanceTier(tier: string, fps: number, isReducedMotion: boolean): void {
    this.trackEvent({
      eventName: 'performance_tier_applied',
      category: 'performance',
      label: tier,
      value: fps,
      metadata: { isReducedMotion },
    });
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushQueue();
      this.flushTimer = null;
    }, 2000);
  }

  private flushQueue(): void {
    if (this.eventQueue.length === 0) return;
    const batch = [...this.eventQueue];
    this.eventQueue = [];

    // Safely send events without disrupting application state
    this.http
      .post(`${environment.apiUrl}/visitors/events`, { events: batch })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }
}
