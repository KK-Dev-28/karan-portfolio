import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogApiService } from '../../services/blog.service';

type DashTab = 'posts' | 'editor' | 'profile' | 'settings';

@Component({
  selector: 'app-blog-write-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './blog-write.page.html',
  styleUrls: ['./blog-write.page.scss'],
})
export class BlogWritePageComponent implements OnInit, AfterViewInit {
  @ViewChild('editor') editorRef!: ElementRef<HTMLDivElement>;

  me: any = null;
  myPosts: any[] = [];
  postsLoading = false;
  tab: DashTab = 'posts';

  editingId: number | null = null;
  editorForm = { title: '', body: '', excerpt: '', coverImage: '', tags: '', published: false };
  saving = false;
  saveErr = '';
  saveOk = false;

  // Profile
  profileForm: any = {};
  profileSaving = false;
  profileOk = false;
  profileErr = '';

  settingsForm: any = {};
  settingsSaving = false;
  settingsOk = false;

  pwForm = { currentPassword: '', newPassword: '', confirm: '' };
  pwSaving = false;
  pwErr = '';
  pwOk = false;

  showLinkDialog = false;
  linkUrl = '';
  linkText = '';
  savedRange: Range | null = null;

  constructor(private blog: BlogApiService, private router: Router, private san: DomSanitizer) {}

  ngOnInit() {
    if (!this.blog.isLoggedIn()) { this.router.navigate(['/blog']); return; }
    this.loadMe();
    this.loadMyPosts();
  }

  ngAfterViewInit() {}

  loadMe() {
    this.blog.getMe().subscribe({
      next: u => {
        this.me = u;
        this.profileForm = { name: u.name, bio: u.bio || '', avatar: u.avatar || '', website: u.website || '', twitter: u.twitter || '', linkedin: u.linkedin || '', github: u.github || '' };
        this.settingsForm = { showBio: u.showBio, showSocials: u.showSocials, showPostCount: u.showPostCount, publicProfile: u.publicProfile };
      },
      error: () => { this.blog.clearToken(); this.router.navigate(['/blog']); },
    });
  }

  loadMyPosts() {
    this.postsLoading = true;
    this.blog.getMyPosts().subscribe({ next: p => { this.myPosts = p; this.postsLoading = false; }, error: () => { this.postsLoading = false; } });
  }

  logout() { this.blog.clearToken(); this.router.navigate(['/blog']); }

  // ── Editor ───────────────────────────────────────────
  newPost() {
    this.editingId = null;
    this.editorForm = { title: '', body: '', excerpt: '', coverImage: '', tags: '', published: false };
    this.saveErr = ''; this.saveOk = false;
    this.tab = 'editor';
    setTimeout(() => {
      if (this.editorRef?.nativeElement) this.editorRef.nativeElement.innerHTML = '';
    }, 0);
  }

  editPost(p: any) {
    this.editingId = p.id;
    this.editorForm = { title: p.title, body: p.body, excerpt: p.excerpt || '', coverImage: p.coverImage || '', tags: (p.tags || []).join(', '), published: p.published };
    this.saveErr = ''; this.saveOk = false;
    this.tab = 'editor';
    setTimeout(() => {
      if (this.editorRef?.nativeElement) this.editorRef.nativeElement.innerHTML = p.body || '';
    }, 0);
  }

  // ── Toolbar commands ─────────────────────────────────
  cmd(command: string, value?: string) {
    document.execCommand(command, false, value);
    this.editorRef?.nativeElement?.focus();
  }

  insertHeading(tag: string) {
    document.execCommand('formatBlock', false, tag);
    this.editorRef?.nativeElement?.focus();
  }

  openLinkDialog() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) this.savedRange = sel.getRangeAt(0);
    this.linkText = sel?.toString() || '';
    this.linkUrl  = 'https://';
    this.showLinkDialog = true;
  }

  insertLink() {
    if (!this.linkUrl.trim()) { this.showLinkDialog = false; return; }
    if (this.savedRange) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(this.savedRange);
    }
    document.execCommand('createLink', false, this.linkUrl.trim());
    this.showLinkDialog = false;
    this.editorRef?.nativeElement?.focus();
  }

  onEditorInput() {
    this.editorForm.body = this.editorRef?.nativeElement?.innerHTML || '';
  }

  get wordCount(): number {
    const text = this.editorRef?.nativeElement?.innerText?.trim() || this.editorForm.body?.trim() || '';
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }
  get readingMins(): number { return Math.max(1, Math.ceil(this.wordCount / 200)); }

  save(publish?: boolean) {
    if (publish !== undefined) this.editorForm.published = publish;
    const body = this.editorRef?.nativeElement?.innerHTML?.trim() || this.editorForm.body.trim();
    if (!this.editorForm.title.trim() || !body) { this.saveErr = 'Title and content are required.'; return; }
    this.saving = true; this.saveErr = ''; this.saveOk = false;
    const dto = {
      title:      this.editorForm.title.trim(),
      body,
      excerpt:    this.editorForm.excerpt.trim() || undefined,
      coverImage: this.editorForm.coverImage.trim() || undefined,
      tags:       this.editorForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      published:  this.editorForm.published,
    };
    const obs = this.editingId ? this.blog.updatePost(this.editingId, dto) : this.blog.createPost(dto);
    obs.subscribe({
      next: () => { this.saving = false; this.saveOk = true; this.loadMyPosts(); setTimeout(() => { this.saveOk = false; this.tab = 'posts'; }, 1500); },
      error: (e: any) => { this.saving = false; this.saveErr = e?.error?.message || 'Could not save post.'; },
    });
  }

  togglePublish(p: any) { this.blog.updatePost(p.id, { published: !p.published }).subscribe(() => this.loadMyPosts()); }
  deletePost(p: any)    { if (!confirm(`Delete "${p.title}"?`)) return; this.blog.deletePost(p.id).subscribe(() => this.loadMyPosts()); }

  // ── Profile ──────────────────────────────────────────
  saveProfile() {
    this.profileSaving = true; this.profileOk = false; this.profileErr = '';
    this.blog.updateMe(this.profileForm).subscribe({
      next: u => { this.me = u; this.profileSaving = false; this.profileOk = true; setTimeout(() => this.profileOk = false, 2000); },
      error: (e: any) => { this.profileSaving = false; this.profileErr = e?.error?.message || 'Could not save profile.'; },
    });
  }

  saveSettings() {
    this.settingsSaving = true; this.settingsOk = false;
    this.blog.updateMe(this.settingsForm).subscribe({
      next: () => { this.settingsSaving = false; this.settingsOk = true; setTimeout(() => this.settingsOk = false, 2000); },
      error: () => { this.settingsSaving = false; },
    });
  }

  changePassword() {
    if (this.pwForm.newPassword !== this.pwForm.confirm) { this.pwErr = 'Passwords do not match.'; return; }
    this.pwSaving = true; this.pwErr = ''; this.pwOk = false;
    this.blog.updateMe({ currentPassword: this.pwForm.currentPassword, newPassword: this.pwForm.newPassword }).subscribe({
      next: () => { this.pwSaving = false; this.pwOk = true; this.pwForm = { currentPassword: '', newPassword: '', confirm: '' }; setTimeout(() => this.pwOk = false, 2000); },
      error: (e: any) => { this.pwSaving = false; this.pwErr = e?.error?.message || 'Password change failed.'; },
    });
  }

  timeAgo(d: string): string {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 60) return `${Math.max(1, m)}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  get publishedCount() { return this.myPosts.filter(p => p.published).length; }
  get draftCount()     { return this.myPosts.filter(p => !p.published).length; }

  safeHtml(html: string): SafeHtml { return this.san.bypassSecurityTrustHtml(html); }
}
