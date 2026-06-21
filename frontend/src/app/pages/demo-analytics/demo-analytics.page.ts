import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Kpi { label: string; value: number; prefix?: string; suffix?: string; decimals?: number; change: number; color: string; }
interface Order { id: string; customer: string; product: string; amount: string; status: 'Completed' | 'Pending' | 'Failed'; }
interface Slice { label: string; pct: number; color: string; }

@Component({
  selector: 'app-demo-analytics-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './demo-analytics.page.html',
  styleUrls: ['./demo-analytics.page.scss'],
})
export class DemoAnalyticsPageComponent implements OnInit, OnDestroy {

  navItems = [
    { icon: 'grid',    label: 'Dashboard', active: true },
    { icon: 'chart',   label: 'Analytics', active: false },
    { icon: 'users',   label: 'Customers', active: false },
    { icon: 'cart',    label: 'Orders',    active: false },
    { icon: 'box',     label: 'Products',  active: false },
    { icon: 'wallet',  label: 'Revenue',   active: false },
    { icon: 'file',    label: 'Reports',   active: false },
    { icon: 'gear',    label: 'Settings',  active: false },
  ];

  kpis: Kpi[] = [
    { label: 'Total Revenue',    value: 128450, prefix: '$', change: 12.4, color: '#f59e0b' },
    { label: 'Active Users',     value: 8942,   change: 5.2,  color: '#3b82f6' },
    { label: 'Orders',           value: 1284,   change: -2.1, color: '#a855f7' },
    { label: 'Conversion Rate',  value: 3.8,    suffix: '%', decimals: 1, change: 0.4, color: '#22c55e' },
  ];

  revenue: number[] = [42, 48, 45, 58, 62, 60, 70, 75, 72, 84, 90, 98];
  months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  categories = [
    { label: 'Electronics', pct: 88, color: '#f59e0b' },
    { label: 'Fashion',     pct: 72, color: '#3b82f6' },
    { label: 'Home & Living', pct: 58, color: '#a855f7' },
    { label: 'Sports',      pct: 44, color: '#22c55e' },
    { label: 'Books',       pct: 30, color: '#ef4444' },
  ];

  traffic: Slice[] = [
    { label: 'Organic Search', pct: 42, color: '#f59e0b' },
    { label: 'Direct',         pct: 28, color: '#3b82f6' },
    { label: 'Social Media',   pct: 18, color: '#a855f7' },
    { label: 'Referral',       pct: 12, color: '#22c55e' },
  ];

  orders: Order[] = [
    { id: '#ORD-9182', customer: 'Aarav Mehta',     product: 'Wireless Earbuds Pro',     amount: '$89.00',  status: 'Completed' },
    { id: '#ORD-9181', customer: 'Sara Williams',   product: 'Smart Fitness Watch',      amount: '$149.00', status: 'Completed' },
    { id: '#ORD-9180', customer: 'Liam Chen',       product: '4K Action Camera',         amount: '$229.00', status: 'Pending' },
    { id: '#ORD-9179', customer: 'Priya Nair',      product: 'Ergonomic Office Chair',   amount: '$315.00', status: 'Completed' },
    { id: '#ORD-9178', customer: 'Daniel Smith',    product: 'Bluetooth Speaker Mini',   amount: '$42.00',  status: 'Failed' },
    { id: '#ORD-9177', customer: 'Meera Iyer',      product: 'Laptop Stand Aluminium',   amount: '$58.00',  status: 'Completed' },
    { id: '#ORD-9176', customer: 'Noah Davis',      product: 'Mechanical Keyboard RGB',  amount: '$112.00', status: 'Pending' },
  ];

  liveFeed: string[] = [
    'New order #ORD-9183 placed by Karthik R.',
    'Aisha P. signed up — Free plan',
    'Payment received — $229.00 from Liam Chen',
    'Server response time: 142ms (healthy)',
    'New review (5★) on "Wireless Earbuds Pro"',
  ];

  clockStr = '';
  private timer: any;

  ngOnInit() {
    this.tickClock();
    this.timer = setInterval(() => {
      this.tickClock();
      // gentle "live" jitter on KPI values
      this.kpis = this.kpis.map(k => {
        const jitter = (Math.random() - 0.5) * (k.decimals ? 0.06 : (k.value > 10000 ? 40 : 4));
        return { ...k, value: Math.max(0, k.value + jitter) };
      });
    }, 2600);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private tickClock() {
    this.clockStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  fmtKpi(k: Kpi): string {
    const val = k.decimals ? k.value.toFixed(k.decimals) : Math.round(k.value).toLocaleString('en-US');
    return `${k.prefix || ''}${val}${k.suffix || ''}`;
  }

  // Build a smooth SVG path for the revenue line chart (viewbox 0..600 x 0..200)
  linePath(): string {
    const max = Math.max(...this.revenue);
    const min = Math.min(...this.revenue);
    const w = 600, h = 200, pad = 10;
    const stepX = w / (this.revenue.length - 1);
    const pts = this.revenue.map((v, i) => {
      const x = i * stepX;
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return [x, y];
    });
    return 'M ' + pts.map(p => p.join(',')).join(' L ');
  }

  areaPath(): string {
    const line = this.linePath();
    const w = 600, h = 200;
    return `${line} L ${w},${h} L 0,${h} Z`;
  }

  // Conic-gradient string for the traffic donut chart
  donutGradient(): string {
    let acc = 0;
    const stops = this.traffic.map(s => {
      const start = acc; acc += s.pct;
      return `${s.color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  @HostListener('contextmenu', ['$event'])
  noCtx(e: Event) { e.preventDefault(); }
}
