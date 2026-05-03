# Enterprise Deployment Guide

This guide makes your portfolio production-ready with CI/CD, domain, SSL, and operational standards.

## 1) Target Architecture

- Frontend: Vercel (`frontend`)
- Backend API: Railway (`backend`)
- Database: Railway PostgreSQL
- Payments: Stripe Checkout + Webhooks
- DNS + domain: Vercel Domains (or external registrar)

## 2) Buy Domain on Vercel + DNS Setup

Recommended names:
- `yourname.dev` (developer brand)
- `yourname.in` (India audience)
- `yourname.com` (global brand)

In Vercel:
1. Go to Project -> Settings -> Domains.
2. Click **Add** domain (buy new or connect existing).
3. Add `www.yourdomain.com` to frontend project.
4. Keep root redirecting to `www` if preferred.

Add backend subdomain in your DNS provider (or Vercel DNS):
- `api.yourdomain.com` -> Railway backend public hostname (CNAME)

After DNS:
- Frontend URL: `https://www.yourdomain.com`
- Backend URL: `https://api.yourdomain.com`
- Set backend `FRONTEND_URL=https://www.yourdomain.com`
- Set frontend `apiUrl=https://api.yourdomain.com/api`

## 3) GitHub Secrets for CI/CD

Create these repository secrets:

### Railway
- `RAILWAY_TOKEN`
- `RAILWAY_SERVICE_ID`

### Vercel
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 4) Workflows Added

- `.github/workflows/ci.yml`
  - Build backend on Node 20
  - Build frontend on Node 20
  - Runs on push + PR to `main`

- `.github/workflows/deploy.yml`
  - Deploy backend to Railway
  - Deploy frontend to Vercel
  - Runs on push to `main` and manually (`workflow_dispatch`)

## 5) Backend Production Checklist

Set these env vars in Railway:

- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `JWT_SECRET` (long random, 32+ chars)
- `ADMIN_PASSWORD` (strong password)
- `PORT=3000`
- `FRONTEND_URL=https://www.yourdomain.com`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Optional: `STRIPE_CURRENCY`, `STRIPE_STARTER_AMOUNT`, `STRIPE_STANDARD_AMOUNT`, `STRIPE_ENTERPRISE_AMOUNT`

Notes:
- `synchronize` is now auto-disabled in production (`NODE_ENV=production`).
- API health endpoint: `GET /api/health`
- Helmet + compression are enabled.

## 6) Stripe Production Setup

1. Switch Stripe keys from test to live in Railway.
2. Create production webhook endpoint:
   - `https://api.yourdomain.com/api/payments/webhook`
3. Listen to:
   - `checkout.session.completed`
   - `checkout.session.expired`
4. Put webhook signing secret in `STRIPE_WEBHOOK_SECRET`.

## 6.1) Paid Visitor Logs Subscription

This project includes subscription-gated logs access:
- Public checkout endpoint: `POST /api/payments/insights/checkout`
- Activation endpoint: `POST /api/payments/insights/activate`
- Premium analytics endpoint: `GET /api/visitors/premium-analytics` (Bearer paid token)

Set env vars:
- `STRIPE_INSIGHTS_AMOUNT` (default `9900` = 99.00)
- `INSIGHTS_ACCESS_DAYS` (default `30`)

## 7) Frontend Production Setup

- File: `frontend/src/environments/environment.prod.ts`
  - Set `apiUrl` to `https://api.yourdomain.com/api`
- Vercel config (`frontend/vercel.json`) already includes:
  - SPA rewrites
  - Basic security headers

## 8) Go-Live Verification

- Open homepage and check all sections.
- Submit contact form.
- Subscribe newsletter.
- Complete Stripe test/live checkout.
- Verify Admin Dashboard tabs:
  - Visitors, Messages, Analytics, Payments, Newsletter, Journal
- Verify premium flow:
  - Open `/insights`
  - Complete checkout
  - Activate token
  - Confirm paid analytics load
- Verify `https://api.yourdomain.com/api/health`.
- Verify webhook events are received in Stripe dashboard.

## 9) Enterprise Hardening Next Steps

- Add TypeORM migrations (instead of sync-based schema evolution)
- Add centralized logging (Datadog/Sentry/Logtail/Axiom) for long-term retention + alerts
- Add uptime monitors (Better Stack / UptimeRobot)
- Add WAF + bot rules in Cloudflare
- Add automated backups + restore drill
- Add role-based admin auth (multi-user)

## 10) Organization repo & collaborators

Primary remote for this workspace: `https://github.com/KK-Dev-28/karan-portfolio.git`

- Keep the repository **private** until you intentionally publish or sell a snapshot.
- Grant access via **GitHub → Settings → Collaborators** (or org team) — never commit personal Stripe/DB passwords into git.
- Branch flow: feature branches → **`dev`** → PR → **`main`** (protect `main` with required PR + CI).

## 11) Python resume analyzer (optional microservice)

The Nest API exposes `POST /api/resume/analyze` and **proxies** to a FastAPI app in `services/resume-analyzer/`.

### Local

1. Python 3.11+ recommended.
2. From `services/resume-analyzer/`:

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8010
```

3. In `backend/.env` set:

```env
RESUME_SERVICE_URL=http://127.0.0.1:8010
```

4. Restart the Nest API. Open the Angular route **`/resume-review`** and run **Analyze**.

If `RESUME_SERVICE_URL` is unset, the API returns **503** with a clear message (frontend shows the error text).

### Production (Railway pattern)

- Create a **second Railway service** from `services/resume-analyzer` (Dockerfile or Nixpacks with start command `uvicorn main:app --host 0.0.0.0 --port $PORT`).
- Set the public or **private networking** URL as `RESUME_SERVICE_URL` on the **Nest** service so only the API can call Python (prefer private URL if both services are on Railway).
- Do **not** expose the Python service to browsers unless you add auth; the intended path is **browser → Nest → Python**.

## 12) CQRS in the Nest API

Writes for **payments** (checkout + Stripe webhook) and **portfolio journal** (create / patch / delete), plus the public **list published updates** read path, go through **`@nestjs/cqrs`** command/query handlers that delegate to the existing services. This keeps room for domain events and sagas later without rewriting business logic.

## 13) Buyer / licensee setup (no secrets in git)

Whoever receives a **source license** must still:

1. Create their own **PostgreSQL** (Railway/Neon/etc.) and set `DB_*` on the backend.
2. Create **Stripe** account → API keys → webhook to `https://<api-host>/api/payments/webhook` with the same events as §6.
3. Deploy **backend** (Railway) and **frontend** (Vercel); set `FRONTEND_URL`, `apiUrl` in `environment.prod.ts`, `JWT_SECRET`, `ADMIN_PASSWORD`.
4. Optionally deploy **`services/resume-analyzer`** and set `RESUME_SERVICE_URL`.

Deliver **`.env.example`** and this document as the handoff; rotate all secrets for the buyer’s own accounts.

---

## 14) Zero-to-live runbook (recommended order)

### A) Postgres (Railway)

1. New Project → **Database** → **PostgreSQL**.
2. After provision, open **Variables** (or **Connect**). Easiest: on your **API** service, **Add variable** → **Reference** → choose the Postgres plugin’s **`DATABASE_URL`** (single variable). The Nest app reads `DATABASE_URL` automatically. Alternatively map `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` manually.
4. Backend enables **TLS to Postgres automatically** when `NODE_ENV=production` and `DB_HOST` is not `localhost`. Override with `DB_SSL=false` only if your provider docs require it.

### B) Nest API (Railway — same project)

1. **New Service** → Deploy from GitHub → pick this repo → set **Root Directory** to **`backend`**.
2. Generate once: strong `JWT_SECRET`, `ADMIN_PASSWORD`; paste **Stripe** keys and webhook secret.
3. Required env (minimum):

| Variable | Purpose |
|---------|---------|
| `DATABASE_SYNC` | **`true` only on the very first boot** against an empty Postgres, then delete this variable or set `false` on redeploy — creates all tables via TypeORM synchronize. Leaving it `true` long-term risks accidental schema drift. |
| `NODE_ENV` | `production` |
| `PORT` | `3000` (Railway injects `$PORT`; our code uses `process.env.PORT` — Railway sets this automatically — still safe to set `3000` if needed) |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` or custom domain (**required** — CORS) |
| `DB_*` | From Postgres service |
| `JWT_SECRET`, `ADMIN_PASSWORD` | Auth |
| `STRIPE_*` | Payments (optional until you enable checkout live) |

4. Deploy → copy public URL e.g. `https://backend-production-xxxx.up.railway.app`.
5. In Stripe Dashboard → **Webhooks** → endpoint `https://<your-backend-host>/api/payments/webhook` with events from §6.
6. **Swagger**: disabled in production by default. Temporary docs: `ENABLE_SWAGGER=true` (disable again after debugging).

### C) Frontend (Vercel)

1. Import repo → **Root Directory** `frontend`.
2. Edit **`frontend/src/environments/environment.prod.ts`**:
   - `apiUrl: 'https://<same-backend-host-as-above>/api'`
3. Deploy. Add **`ADDITIONAL_CORS_ORIGINS`** on the backend if you use **Vercel preview URLs** (`https://your-app-*.vercel.app`), comma-separated.

### D) Resume Python service (Railway — optional)

1. **New Service** from repo → **Root Directory** `services/resume-analyzer` → Dockerfile deploy (recommended; `Dockerfile` is in that folder).
2. After deploy, set on the **Nest** service: `RESUME_SERVICE_URL=https://<python-service-internal-or-public-host>` — prefer Railway **private networking** between services when available.

### E) CI

- Wiring is in `.github/workflows/deploy.yml`; backend and frontend jobs run **independently** when their secrets exist (frontend is not blocked if Railway secrets are missing).
- Secrets: Railway `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID`; Vercel `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

---

## 15) Security posture (what this repo already enforces)

| Area | Behaviour |
|------|-----------|
| HTTP API | Helmet middleware; compression; global validation + whitelist on DTOs |
| CORS | **Production**: only `FRONTEND_URL` + `ADDITIONAL_CORS_ORIGINS`. Fails startup if unset (fail-closed). **Dev**: localhost Angular + `FRONTEND_URL`. |
| DB | Schema sync **`synchronize` off** when `NODE_ENV=production`; use migrations for evolving schema in serious deployments |
| Admin | JWT after password; bcrypt not used for password (single admin — rotate `ADMIN_PASSWORD`; consider hashing in a future iteration) |
| Payments | Stripe signature verification on webhooks |
| Frontend | Security headers in `frontend/vercel.json` (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, DNS prefetch control) |
| Docs | Swagger off in prod unless `ENABLE_SWAGGER=true` |
| Secrets | Never commit `.env`; use Railway/Vercel/GitHub Secrets |

Recommended **next layers** (not automatic in code): Cloudflare/WAF in front of Vercel, Sentry/Datadog, DB automated backups + restore drill, rate-limit tuning per route, CSP tuning (Angular often needs nonce-based CSP — plan separately).

---

## 16) `environment.prod.ts` reminder

Replace the placeholder inside:

`frontend/src/environments/environment.prod.ts`

with your live API base:

`export const environment = { production: true, apiUrl: 'https://YOUR-API-HOST/api' };`

Rebuild/redeploy frontend after every API domain change.
