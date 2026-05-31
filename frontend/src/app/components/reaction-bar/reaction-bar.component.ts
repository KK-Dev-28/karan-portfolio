import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactionsService, SectionReactions } from '../../services/reactions.service';

@Component({
  selector: 'app-reaction-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reaction-bar.component.html',
  styleUrls: ['./reaction-bar.component.scss'],
})
export class ReactionBarComponent implements OnInit {
  @Input() section = '';

  data: SectionReactions = { likes: 0, comments: [], hasLiked: false, commentCount: 0 };
  showComments = false;
  commentText  = '';
  commentName  = '';
  submitting   = false;
  submitted    = false;
  liking       = false;

  constructor(private svc: ReactionsService) {}

  ngOnInit() {
    if (this.section) {
      this.svc.getSection(this.section).subscribe({
        next: d => (this.data = d),
        error: () => {},
      });
    }
  }

  toggleLike() {
    if (this.liking) return;
    this.liking = true;
    this.svc.toggleLike(this.section).subscribe({
      next: r => {
        this.data.hasLiked = r.liked;
        this.data.likes    = r.likes;
        this.liking        = false;
      },
      error: () => { this.liking = false; },
    });
  }

  toggleComments() { this.showComments = !this.showComments; }

  submitComment() {
    if (!this.commentText.trim() || this.submitting) return;
    this.submitting = true;
    this.svc.addComment(this.section, this.commentText.trim(), this.commentName.trim()).subscribe({
      next: comment => {
        if (comment) {
          this.data.comments.unshift(comment);
          this.data.commentCount++;
        }
        this.commentText = '';
        this.commentName = '';
        this.submitting  = false;
        this.submitted   = true;
        setTimeout(() => (this.submitted = false), 3000);
      },
      error: () => { this.submitting = false; },
    });
  }
}
