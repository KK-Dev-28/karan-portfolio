import { RenderMode, ServerRoute } from '@angular/ssr';

/* The home page is prerendered to static HTML at build time, so search engines
   and first-time visitors get the hero without waiting for JavaScript. Every
   other route renders in the browser as before (served from index.csr.html). */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
