// src/environments/environment.ts
// Dev: `ng serve` proxies /api → http://localhost:3000 (see proxy.conf.json) — avoids CORS and wrong URLs.
export const environment = {
  production: false,
  apiUrl: '/api',
};
