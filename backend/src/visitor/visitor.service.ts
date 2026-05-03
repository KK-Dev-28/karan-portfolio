import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Visitor } from './visitor.entity';
import { LogVisitDto } from './dto/log-visit.dto';

@Injectable()
export class VisitorService {
  constructor(@InjectRepository(Visitor) private repo: Repository<Visitor>) {}

  /* ── Log a visit ──────────────────────────────────────── */
  async log(dto: LogVisitDto, ip: string): Promise<{ ok: boolean }> {
    const isReturning = !!(await this.repo.findOne({ where: { ip } }));
    const { device, browser, os } = this.parseUA(dto.userAgent || '');
    await this.repo.save(
      this.repo.create({
        ip, isReturning, device, browser, os,
        referrer:  this.parseRef(dto.referrer || ''),
        page:      dto.page      || '/',
        country:   dto.country   || 'Unknown',
        city:      dto.city      || 'Unknown',
        region:    dto.region    || '',
        flag:      dto.flag      || '🌍',
        userAgent: dto.userAgent || '',
        sessionId: dto.sessionId || '',
      }),
    );
    return { ok: true };
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
        unique:   new Set(all.map(v=>v.ip)).size,
        returning:all.filter(v=>v.isReturning).length,
        newVisitors: all.filter(v=>!v.isReturning).length,
      },
      pageViews:  count(all, 'page'),
      devices:    count(all, 'device'),
      browsers:   count(all, 'browser'),
      referrers:  count(all, 'referrer'),
      countries:  count(all, 'country'),
      dailyChart: this.buildChart(weekRows),
      recent: todayRows.slice(0, 30).map(v => ({
        id: v.id, ip: v.ip, country: v.country, city: v.city,
        flag: v.flag, device: v.device, browser: v.browser,
        os: v.os, referrer: v.referrer, page: v.page,
        isReturning: v.isReturning, visitedAt: v.visitedAt,
      })),
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
