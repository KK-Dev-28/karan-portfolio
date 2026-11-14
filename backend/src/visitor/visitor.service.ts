import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Visitor } from './visitor.entity';
import { LogVisitDto } from './dto/log-visit.dto';
import { createHash } from 'crypto';

@Injectable()
export class VisitorService {
  constructor(@InjectRepository(Visitor) private repo: Repository<Visitor>) {}

  /* ── Log a visit ──────────────────────────────────────── */
  async log(dto: LogVisitDto, ip: string): Promise<{ ok: boolean }> {
    // v2.0: no visit is stored without explicit opt-in from the visitor.
    if (dto.consent !== true) return { ok: false };
    const ipHash = createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'kk')).digest('hex').slice(0, 32);
    const isReturning = !!(await this.repo.findOne({ where: { ipHash } }));
    const { device, browser, os } = this.parseUA(dto.userAgent || '');
    await this.repo.save(
      this.repo.create({
        ip: this.anonymizeIp(ip), ipHash, isReturning, device, browser, os,
        referrer:  this.parseRef(dto.referrer || ''),
        page:      dto.page      || '/',
        country:   dto.country   || 'Unknown',
        city:      dto.city      || 'Unknown',
        region:    dto.region    || '',
        flag:      dto.flag      || '🌍',
        userAgent: dto.userAgent || '',
        sessionId: dto.sessionId || '',
        visitorName: (dto.visitorName || '').trim().slice(0, 60) || null,
        timezone: dto.timezone || null, language: dto.language || null, screen: dto.screen || null,
        consent: true,
      }),
    );
    return { ok: true };
  }

  /* ── Ingest Telemetry Batch ───────────────────────────── */
  async logEvents(events: any[], ip: string): Promise<{ received: number; ok: boolean }> {
    // Process telemetry events cleanly without throwing exceptions
    if (!Array.isArray(events)) return { received: 0, ok: true };
    return { received: events.length, ok: true };
  }

  /* ── Full analytics ───────────────────────────────────── */
  async analytics() {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(now.getTime() - 7 * 86_400_000);

    const [all, todayRows, weekRows] = await Promise.all([
      this.repo.find({ order: { visitedAt: 'DESC' } }),
      this.repo.find({ where: { visitedAt: MoreThan(today) }, order: { visitedAt: 'DESC' } }),
      this.repo.find({ where: { visitedAt: MoreThan(week) } }),
    ]);

    const count = (rows: Visitor[], key: keyof Visitor) =>
      rows.reduce((acc, v) => { const k = String(v[key]||'Other'); acc[k]=(acc[k]||0)+1; return acc; }, {} as Record<string,number>);

    return {
      stats: {
        total:    all.length,
        today:    todayRows.length,
        week:     weekRows.length,
        unique:   new Set(all.map(v=>v.ipHash || v.ip)).size,
        returning:all.filter(v=>v.isReturning).length,
        newVisitors: all.filter(v=>!v.isReturning).length,
      },
      pageViews:  count(all, 'page'),
      devices:    count(all, 'device'),
      browsers:   count(all, 'browser'),
      referrers:  count(all, 'referrer'),
      countries:  count(all, 'country'),
      dailyChart: this.buildChart(weekRows),
      insights:   this.insights(all),
      // All visitors ever (newest first) so the admin date filters — incl. All Time — see old data too.
      recent: all.slice(0, 5000).map(v => ({
        id: v.id, ip: v.ip, visitorName: v.visitorName, timezone: v.timezone, language: v.language, country: v.country, city: v.city,
        flag: v.flag, device: v.device, browser: v.browser,
        os: v.os, referrer: v.referrer, page: v.page,
        isReturning: v.isReturning, visitedAt: v.visitedAt, screen: v.screen,
      })),
    };
  }

  /** Deeper aggregates for the admin overview: trend, heatmap, sessions, live, growth. */
  private insights(all: Visitor[]) {
    const DAY = 86_400_000, IST = 330 * 60_000, now = Date.now();
    const ist = (d: Date) => new Date(d.getTime() + IST);
    const dayKey = (d: Date) => ist(d).toISOString().slice(0, 10);

    const byDay: Record<string, { views: number; visitors: Set<string> }> = {};
    const heat = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    const sessions: Record<string, number> = {};
    for (const v of all) {
      const k = dayKey(v.visitedAt);
      (byDay[k] ??= { views: 0, visitors: new Set() }).views++;
      byDay[k].visitors.add(v.ipHash || v.ip);
      if (now - v.visitedAt.getTime() < 90 * DAY) { const t = ist(v.visitedAt); heat[t.getUTCDay()][t.getUTCHours()]++; }
      const sid = v.sessionId || `${v.ipHash || v.ip}:${k}`;
      sessions[sid] = (sessions[sid] ?? 0) + 1;
    }
    const daily30 = Array.from({ length: 30 }, (_, i) => {
      const key = dayKey(new Date(now - (29 - i) * DAY));
      return { date: key, views: byDay[key]?.views ?? 0, visitors: byDay[key]?.visitors.size ?? 0 };
    });

    const inRange = (from: number, to: number) => all.filter(v => { const t = now - v.visitedAt.getTime(); return t >= from && t < to; });
    const thisWeek = inRange(0, 7 * DAY).length, lastWeek = inRange(7 * DAY, 14 * DAY).length;
    const live = inRange(0, 30 * 60_000);
    const counts = Object.values(sessions);
    const count = (rows: Visitor[], key: keyof Visitor, n = 8) => Object.entries(
      rows.reduce((acc, v) => { const k = String(v[key] || 'Unknown'); acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>),
    ).sort((x, y) => y[1] - x[1]).slice(0, n).map(([key, n]) => ({ key, n }));

    return {
      daily30,
      heatmap: heat,
      growthPct: lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null,
      thisWeek, lastWeek,
      sessions: counts.length,
      pagesPerSession: counts.length ? +(all.length / counts.length).toFixed(2) : 0,
      bounceRate: counts.length ? Math.round((counts.filter(c => c === 1).length / counts.length) * 100) : 0,
      live: { count: new Set(live.map(v => v.ipHash || v.ip)).size, pages: count(live, 'page', 5) },
      os: count(all, 'os'), cities: count(all, 'city'), languages: count(all, 'language', 6),
      named: all.filter(v => v.visitorName).length,
    };
  }

  /** Stores only a coarse network (IPv4 /24, IPv6 /48) — never the full address. */
  private anonymizeIp(ip: string): string {
    if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::';
    const p = ip.split('.');
    return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0` : ip;
  }

  /** Full visitor history, newest first. Never deletes anything. */
  async history(page = 1, size = 50, q = '') {
    size = Math.min(Math.max(size, 1), 200);
    page = Math.max(page, 1);
    const qb = this.repo.createQueryBuilder('v').orderBy('v.visitedAt', 'DESC');
    if (q) qb.where('(v.city ILIKE :q OR v.country ILIKE :q OR v.visitorName ILIKE :q OR v.page ILIKE :q OR v.browser ILIKE :q)', { q: `%${q}%` });
    const [rows, total] = await qb.skip((page - 1) * size).take(size).getManyAndCount();
    return { total, page, size, pages: Math.ceil(total / size), rows };
  }

  /** Aggregate-only stats that are safe to show publicly. No IPs, names or cities. */
  async publicStats() {
    const all = await this.repo.find({ select: ['country', 'flag', 'device', 'page', 'visitedAt', 'ipHash', 'ip'] });
    const week = new Date(Date.now() - 7 * 86_400_000);
    const byCountry: Record<string, { n: number; flag: string }> = {};
    const byDevice: Record<string, number> = {};
    const byPage: Record<string, number> = {};
    for (const v of all) {
      const c = v.country || 'Unknown';
      byCountry[c] = byCountry[c] || { n: 0, flag: v.flag || '🌍' }; byCountry[c].n++;
      byDevice[v.device || 'Other'] = (byDevice[v.device || 'Other'] || 0) + 1;
      byPage[v.page || '/'] = (byPage[v.page || '/'] || 0) + 1;
    }
    const top = (o: Record<string, number>, n: number) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ key: k, count: v }));
    return {
      totalVisits: all.length,
      uniqueVisitors: new Set(all.map(v => v.ipHash || v.ip)).size,
      countries: Object.keys(byCountry).filter(c => c !== 'Unknown').length,
      thisWeek: all.filter(v => v.visitedAt > week).length,
      topCountries: Object.entries(byCountry).filter(([c]) => c !== 'Unknown').sort((a, b) => b[1].n - a[1].n).slice(0, 6)
        .map(([country, x]) => ({ country, flag: x.flag, count: x.n })),
      devices: top(byDevice, 3),
      topPages: top(byPage, 5),
      daily: this.buildChart(all.filter(v => v.visitedAt > week)),
    };
  }

  /* ── Helpers ──────────────────────────────────────────── */
  private parseUA(ua: string) {
    const l = ua.toLowerCase();
    const device  = /mobile|android|iphone/.test(l) ? 'Mobile' : /tablet|ipad/.test(l) ? 'Tablet' : 'Desktop';
    const browser = l.includes('edg') ? 'Edge' : l.includes('chrome') ? 'Chrome' : l.includes('firefox') ? 'Firefox' : l.includes('safari') ? 'Safari' : 'Other';
    const os      = l.includes('windows') ? 'Windows' : l.includes('android') ? 'Android' : /iphone|ipad/.test(l) ? 'iOS' : l.includes('mac') ? 'macOS' : l.includes('linux') ? 'Linux' : 'Other';
    return { device, browser, os };
  }

  private parseRef(ref: string) {
    if (!ref) return 'Direct';
    if (ref.includes('linkedin'))         return 'LinkedIn';
    if (ref.includes('github'))           return 'GitHub';
    if (ref.includes('google'))           return 'Google';
    if (ref.includes('whatsapp'))         return 'WhatsApp';
    if (ref.includes('twitter')||ref.includes('x.com')) return 'Twitter/X';
    return 'Other';
  }

  private buildChart(rows: Visitor[]) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6-i));
      const date = d.toISOString().split('T')[0];
      return { date, count: rows.filter(v => v.visitedAt.toISOString().split('T')[0] === date).length };
    });
  }
}
