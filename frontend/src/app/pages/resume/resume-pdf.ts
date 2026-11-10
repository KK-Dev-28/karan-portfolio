// Builds the downloadable resume as a real text PDF (selectable, searchable,
// readable by applicant-tracking systems) with jsPDF's built-in Helvetica.
// Loaded on demand from the resume page, so it costs nothing until used.
import { jsPDF } from 'jspdf';

export interface PdfRole { role: string; period: string; bullets: string[] }
export interface PdfCompany { company: string; location: string; span: string; roles: PdfRole[] }
export interface PdfResume {
  name: string; title: string; tagline?: string; location?: string;
  email?: string; altEmail?: string; phone?: string; availability?: string;
  links: { label: string; url: string }[];
  summary?: string; highlights?: string[];
  companies: PdfCompany[];
  projects?: { name: string; stack: string; summary: string; link?: string }[];
  skills: { name: string; items: string[] }[];
  education: { degree: string; institution: string; period: string; score: string; note: string }[];
  certifications?: { title: string; issuer: string; date: string; note: string }[];
  awards?: { title: string; issuer: string; date: string }[];
  languages?: string[];
}

const W = 210, H = 297, M = 15, CW = W - M * 2;
const INK: [number, number, number] = [20, 23, 28];
const MUTED: [number, number, number] = [90, 99, 114];
const RULE: [number, number, number] = [223, 227, 233];
const GOLD: [number, number, number] = [138, 100, 8];

/* Helvetica in jsPDF covers WinAnsi only; map the few characters it lacks. */
const clean = (s: string) => (s ?? '')
  .replace(/→/g, '->').replace(/[✓✔]/g, '')
  .replace(/[^\x00-\xFF–—‘’“”•…€]/g, '');

export function buildResumePdf(cv: PdfResume, qr: boolean[][] | null): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: `${cv.name} — Resume`, author: cv.name, subject: cv.title, keywords: cv.skills.flatMap(s => s.items).join(', ') });
  let y = M;

  const font = (size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color = INK) => {
    doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
  };
  const lh = (size: number) => size * 0.3528 * 1.28; // pt → mm, with leading
  const ensure = (need: number) => { if (y + need > H - 13) { doc.addPage(); y = M; } };
  const para = (text: string, x: number, width: number, size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color = INK) => {
    font(size, style, color);
    const lines = doc.splitTextToSize(clean(text), width) as string[];
    for (const l of lines) { ensure(lh(size)); doc.text(l, x, y + size * 0.3528); y += lh(size); }
  };
  const heading = (t: string) => {
    ensure(24); y += 2.6; // keep the heading with its first entry
    font(8.6, 'bold', GOLD); doc.setCharSpace(0.45); doc.text(t.toUpperCase(), M, y + 3); doc.setCharSpace(0);
    y += 4.6; doc.setDrawColor(...RULE); doc.setLineWidth(0.25); doc.line(M, y, W - M, y); y += 2.0;
  };
  const rightText = (t: string, size: number, color = MUTED, style: 'normal' | 'bold' = 'normal') => {
    font(size, style, color); doc.text(clean(t), W - M, y + size * 0.3528, { align: 'right' });
  };

  // ── Header: name and title left; contact and QR right ──
  const qrSize = qr ? 21 : 0;
  font(25, 'bold', INK); doc.text(clean(cv.name), M, y + 8.2);
  font(10, 'bold', GOLD); doc.setCharSpace(0.6); doc.text(clean(cv.title).toUpperCase(), M, y + 14.6); doc.setCharSpace(0);
  if (cv.tagline) { font(9, 'normal', MUTED); doc.text(clean(cv.tagline), M, y + 19.6); }

  const contact: { t: string; url?: string }[] = [
    ...(cv.email ? [{ t: cv.email, url: 'mailto:' + cv.email }] : []),
    ...(cv.altEmail ? [{ t: cv.altEmail, url: 'mailto:' + cv.altEmail }] : []),
    ...(cv.phone ? [{ t: cv.phone, url: 'tel:' + cv.phone.replace(/[^\d+]/g, '') }] : []),
    ...(cv.location ? [{ t: cv.location }] : []),
    ...cv.links.map(l => ({ t: l.url.replace(/^https?:\/\/(www\.)?/, ''), url: l.url })),
  ];
  const cx = W - M - (qr ? qrSize + 4 : 0);
  font(8.2, 'normal', MUTED);
  contact.forEach((c, i) => {
    const ty = y + 3 + i * 3.75;
    if (c.url) doc.textWithLink(clean(c.t), cx - doc.getTextWidth(clean(c.t)), ty, { url: c.url });
    else doc.text(clean(c.t), cx, ty, { align: 'right' });
  });
  if (qr) {
    const n = qr.length, cell = qrSize / n, qx = W - M - qrSize, qy = y;
    doc.setFillColor(...INK);
    qr.forEach((row, r) => row.forEach((on, c) => { if (on) doc.rect(qx + c * cell, qy + r * cell, cell + 0.02, cell + 0.02, 'F'); }));
    font(6.4, 'normal', MUTED); doc.text('Portfolio', qx + qrSize / 2, qy + qrSize + 3, { align: 'center' });
    doc.link(qx, qy, qrSize, qrSize, { url: cv.links.find(l => /portfolio/i.test(l.label))?.url ?? 'https://karan-portfolio-six-sigma.vercel.app' });
  }
  y += Math.max(24, contact.length * 3.75 + 3, qrSize + 5);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); y += 2;

  // ── Profile + highlights ──
  if (cv.summary) { heading('Profile'); para(cv.summary, M, CW, 9.2); }
  if (cv.highlights?.length) {
    y += 1.5;
    const colW = (CW - 6) / 2;
    for (let i = 0; i < cv.highlights.length; i += 2) {
      const startY = y; let endY = y;
      [cv.highlights[i], cv.highlights[i + 1]].forEach((h, k) => {
        if (!h) return;
        y = startY; const x = M + k * (colW + 6);
        font(9, 'bold', GOLD); doc.text('•', x, y + 3.1);
        para(h, x + 3.2, colW - 3.2, 8.8, 'bold');
        endY = Math.max(endY, y);
      });
      y = endY + 0.6;
    }
  }

  // ── Experience, grouped by company ──
  if (cv.companies.length) {
    heading('Experience');
    for (const co of cv.companies) {
      ensure(16);
      font(10.6, 'bold', INK); doc.text(clean(co.company), M, y + 3.8);
      rightText(co.span, 8.6, MUTED, 'bold');
      y += 5.2;
      if (co.location) { para(co.location, M, CW, 8.4, 'normal', MUTED); }
      for (const r of co.roles) {
        ensure(10); y += 1.0;
        font(9.6, 'bold', INK); doc.text(clean(r.role), M + 3, y + 3.4);
        rightText(r.period, 8.4);
        y += 5;
        for (const b of r.bullets) {
          font(9, 'normal', GOLD); ensure(lh(9)); doc.text('•', M + 3.4, y + 3.1);
          para(b, M + 7, CW - 7, 8.8);
          y += 0.3;
        }
      }
      y += 1.0;
    }
  }

  // ── Projects ──
  if (cv.projects?.length) {
    heading('Selected Projects');
    for (const p of cv.projects) {
      ensure(14);
      font(9.8, 'bold', INK); doc.text(clean(p.name), M, y + 3.6);
      if (p.link) {
        const url = /^https?:/.test(p.link) ? p.link : 'https://' + p.link;
        font(8.2, 'normal', GOLD); const t = clean(p.link.replace(/^https?:\/\//, ''));
        doc.textWithLink(t, W - M - doc.getTextWidth(t), y + 3.6, { url });
      }
      y += 4.8;
      para(p.stack, M, CW, 8.4, 'italic', MUTED);
      para(p.summary, M, CW, 8.9);
      y += 1.0;
    }
  }

  // ── Skills ──
  if (cv.skills.length) {
    heading('Technical Skills');
    for (const g of cv.skills) {
      ensure(6);
      const top = y;
      font(8.8, 'bold', INK); doc.text(clean(g.name), M, y + 3.1);
      para(g.items.join(' · '), M + 30, CW - 30, 8.8);
      y = Math.max(y, top + lh(8.8)) + 0.6;
    }
  }

  // ── Education, training, awards, languages ──
  const entries = (title: string, rows: { a: string; b: string; right: string; note?: string }[]) => {
    if (!rows.length) return;
    heading(title);
    for (const r of rows) {
      ensure(10);
      font(9.6, 'bold', INK); doc.text(clean(r.a), M, y + 3.4);
      rightText(r.right, 8.4);
      y += 4.8;
      para(r.b, M, CW, 8.6, 'normal', MUTED);
      if (r.note) para(r.note, M, CW, 8.4, 'italic', MUTED);
      y += 0.8;
    }
  };
  entries('Education', cv.education.map(e => ({ a: e.degree, b: e.institution, right: [e.period, e.score].filter(Boolean).join(' · '), note: e.note })));
  entries('Training & Certifications', (cv.certifications ?? []).map(t => ({ a: t.title, b: t.issuer, right: t.date, note: t.note })));
  entries('Awards', (cv.awards ?? []).map(a => ({ a: a.title, b: a.issuer, right: a.date })));
  // Languages and availability close the page as two labelled lines, not full sections.
  const closing = (label: string, text: string, style: 'normal' | 'italic' = 'normal') => {
    ensure(6); const top = y;
    font(8.8, 'bold', GOLD); doc.text(label.toUpperCase(), M, y + 3.1);
    para(text, M + 30, CW - 30, 8.8, style, style === 'italic' ? MUTED : INK);
    y = Math.max(y, top + lh(8.8)) + 0.6;
  };
  if (cv.languages?.length || cv.availability) { y += 2; doc.setDrawColor(...RULE); doc.setLineWidth(0.25); doc.line(M, y, W - M, y); y += 2; }
  if (cv.languages?.length) closing('Languages', cv.languages.join(' · '));
  if (cv.availability) closing('Availability', cv.availability, 'italic');

  // ── Footer on every page ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    font(7.2, 'normal', MUTED);
    doc.text(clean(`${cv.name} · ${cv.title}`), M, H - 8);
    doc.text(`${i} / ${pages}`, W - M, H - 8, { align: 'right' });
  }
  return doc;
}
