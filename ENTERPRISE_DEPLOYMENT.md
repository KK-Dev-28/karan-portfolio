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
