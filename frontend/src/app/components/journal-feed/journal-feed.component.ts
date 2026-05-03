import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioJournalService, PortfolioJournalEntry } from '../../services/portfolio-journal.service';

@Component({
  selector: 'app-journal-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './journal-feed.component.html',
  styleUrls: ['./journal-feed.component.scss'],
})
export class JournalFeedComponent implements OnInit {
  items: PortfolioJournalEntry[] = [];
  loading = true;
  error = false;

  constructor(private journal: PortfolioJournalService) {}

  ngOnInit() {
    this.journal.getPublished().subscribe({
      next: (rows) => {
        this.items = rows;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  kindLabel(k: string): string {
    const map: Record<string, string> = {
      achievement: 'Achievement',
      learning: 'Learning',
      milestone: 'Milestone',
      note: 'Note',
    };
    return map[k] || k;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }
}
