import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteContentService } from '../../services/site-content.service';

interface Link      { label: string; url: string }
interface Role      { role: string; company: string; location: string; period: string; bullets: string[] }
interface Education { degree: string; institution: string; period: string; score: string; note: string }
interface Award     { title: string; issuer: string; date: string }
interface Project   { name: string; stack: string; summary: string; link?: string }
interface Cert      { title: string; issuer: string; date: string; note: string }

interface Resume {
  name: string; title: string; tagline: string; location: string;
  email: string; altEmail?: string; phone: string; availability: string;
  links: Link[]; summary: string;
  experience: Role[]; education: Education[];
  skills: Record<string, string[]>;
  highlights?: string[];
  languages?: string[];
  projects?: Project[];
  certifications?: Cert[];
  awards: Award[];
}

@Component({
  selector: 'app-resume-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resume.page.html',
  styleUrls: ['./resume.page.scss'],
})
export class ResumePageComponent implements OnInit {
  cv: Resume | null = null;
  loading = true;
  /** Portfolio QR code as a module grid (drawn as SVG on screen, as rects in the PDF). */
  qr: boolean[][] | null = null;
  busy = false;

  constructor(private cms: SiteContentService) {}

  ngOnInit() {
    // Show the last copy straight away; the API (which can take a while to wake) replaces it.
    const cached = readCache();
    if (cached) { this.cv = currentFacts(repairText(cached)); this.loading = false; void this.makeQr(); }
    this.cms.getSection('resume').subscribe({
      next: (data: any) => {
        if (data) writeCache(data);
        this.cv = data ? currentFacts(repairText(data)) : this.cv;
        this.loading = false; void this.makeQr();
      },
      error: () => { this.loading = false; },
    });
  }

  /** One-click download: a typeset text PDF (selectable, ATS-readable) built in
      the browser by jsPDF, loaded only when asked for. */
  async download() {
    if (!this.cv || this.busy) return;
    this.busy = true;
    try {
      const { buildResumePdf } = await import('./resume-pdf');
      const doc = buildResumePdf({ ...this.cv, companies: this.companies(), skills: this.skillGroups() }, this.qr);
      doc.save(`${this.cv.name.replace(/\s+/g, '-')}-Resume.pdf`);
    } finally { this.busy = false; }
  }

  /** The browser's print dialog, for paper or a print-styled PDF. */
  print() { window.print(); }

  /** Consecutive roles at one employer, shown as a single company with a promotion path. */
  companies(): { company: string; location: string; span: string; roles: Role[] }[] {
    const out: { company: string; location: string; span: string; roles: Role[] }[] = [];
    for (const r of this.cv?.experience ?? []) {
      const last = out[out.length - 1];
      if (last && last.company === r.company) last.roles.push(r);
      else out.push({ company: r.company, location: r.location, span: '', roles: [r] });
    }
    for (const c of out) {
      const newest = c.roles[0].period.split(/\s+[-–—]\s+/)[1] ?? c.roles[0].period;
      const oldest = c.roles[c.roles.length - 1].period.split(/\s+[-–—]\s+/)[0];
      c.span = c.roles.length > 1 ? `${oldest} – ${newest}` : c.roles[0].period;
    }
    return out;
  }

  private async makeQr() {
    const url = this.cv?.links?.find(l => /portfolio/i.test(l.label))?.url;
    if (!url) return;
    const mod: any = await import('qrcode-generator');
    const qrcode = mod.default ?? mod;
    const q = qrcode(0, 'M'); q.addData(url); q.make();
    const n = q.getModuleCount();
    this.qr = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => q.isDark(r, c)));
  }

  skillGroups(): { name: string; items: string[] }[] {
    const s = this.cv?.skills ?? {};
    return Object.keys(s).map(name => ({ name, items: s[name] }));
  }

  /** Tel/mailto need the raw value; the page shows the formatted one. */
  telHref(phone: string) { return 'tel:' + (phone || '').replace(/[^\d+]/g, ''); }
}

/* Some resume text was saved after a UTF-8 → Windows-1252 round trip, so
   "—" arrives as "â€”" and "·" as "Â·". Repaired on display, recursively. */
const MOJIBAKE: [RegExp, string][] = [
  [/\u00e2\u20ac\u201d/g, '\u2014'], // em dash
  [/\u00e2\u20ac\u201c/g, '\u2013'], // en dash
  [/\u00e2\u20ac\u02dc/g, '\u2018'], [/\u00e2\u20ac\u2122/g, '\u2019'], // single quotes
  [/\u00e2\u20ac\u0153/g, '\u201c'], [/\u00e2\u20ac\u2026/g, '\u2026'], // open quote, ellipsis
  [/\u00e2\u20ac[\u009d\u00ad]?/g, '\u201d'], // close quote (last: the shortest pattern)
  [/\u00c2\u00b7/g, '\u00b7'], [/\u00c2\u00a0/g, ' '], [/\u00c2(?=[\u0080-\uffff])/g, ''],
];
function repairText<T>(v: T): T {
  if (typeof v === 'string') return MOJIBAKE.reduce((s, [re, to]) => s.replace(re, to), v as string) as T;
  if (Array.isArray(v)) return v.map(repairText) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, repairText(x)])) as T;
  return v;
}

const MAIN_EMAIL = 'kk0888176@gmail.com';
const GITHUBS = [
  { label: 'GitHub (KK-Dev-28)', url: 'https://github.com/KK-Dev-28' },
  { label: 'GitHub (Karan28012002)', url: 'https://github.com/Karan28012002' },
];

/* Facts newer than the saved resume record (Nov 2026): the main email, both
   GitHub accounts, and the completed MCA. Each rule only fires on the old
   value, so once the record is updated in Admin -> Content these are no-ops. */
function currentFacts(cv: Resume): Resume {
  const out: Resume = { ...cv };
  if (out.email && out.email !== MAIN_EMAIL) out.altEmail = out.altEmail ?? out.email;
  out.email = MAIN_EMAIL;
  const links = (out.links ?? []).filter(l => !/github\.com/i.test(l.url));
  out.links = [...links, ...GITHUBS];
  out.education = (out.education ?? []).map(e => /^MCA/i.test(e.degree) && /pursuing/i.test(e.period)
    ? { ...e, period: 'Completed', score: e.score || 'CGPA ~6.8–7.0 (expected)', note: [e.note, 'final result awaited'].filter(Boolean).join(' · ') }
    : e);
  out.summary = (out.summary ?? '').replace(/Currently completing an MCA at ([^.]+?) alongside/i, 'Completed an MCA at $1 alongside');
  return out;
}

const CACHE_KEY = 'kk_resume_v1';
function readCache(): any {
  try { return typeof localStorage === 'undefined' ? null : JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null'); } catch { return null; }
}
function writeCache(data: any) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
}
