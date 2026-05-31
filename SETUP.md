# Portfolio Setup Guide — Complete Step-by-Step

This guide walks you through setting up your own copy of this portfolio from scratch.
Estimated time: **45–60 minutes**. Everything listed here is **free** to set up.

---

## Accounts You Need (All Free)

| Service | Purpose | Link |
|---------|---------|------|
| GitHub | Host your code | github.com |
| Neon | PostgreSQL database | neon.tech |
| Render | Backend hosting | render.com |
| Vercel | Frontend hosting | vercel.com |
| Resend | Email (OTP + alerts) | resend.com |
| Razorpay | Payments | razorpay.com |

---

## Step 1 — Fork the Repository

1. Go to the GitHub repo you received
2. Click **Fork** → choose your GitHub account
3. Clone it locally:
```bash
git clone https://github.com/YOUR_USERNAME/karan-portfolio.git
cd karan-portfolio
```

---

## Step 2 — Set Up Database (Neon)

1. Go to [neon.tech](https://neon.tech) → Sign up → **Create Project**
2. Name it anything (e.g. `my-portfolio`)
3. Copy the **Connection String** — looks like:
```
postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```
4. Save it — you'll use it as `DATABASE_URL`

---

## Step 3 — Set Up Email (Resend)

1. Go to [resend.com](https://resend.com) → Sign up
2. Go to **API Keys** → **Create API Key** → Copy it
3. Save as `RESEND_API_KEY`
4. Emails will send from `Your Name <onboarding@resend.dev>` until you verify a custom domain

> **To use your own domain later:** Add domain in Resend dashboard → Add the 3 DNS records to your registrar → Update `RESEND_FROM` env var

---

## Step 4 — Set Up Payments (Razorpay)

1. Go to [razorpay.com](https://razorpay.com) → Sign up → Complete KYC
2. Go to **Settings → API Keys** → Generate Test Keys first
3. Save `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
4. For **live payments**: Settings → API Keys → Generate Live Keys
5. Set up webhook:
   - Settings → Webhooks → Add Webhook
   - URL: `https://YOUR-RENDER-APP.onrender.com/api/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`
   - Set a **Secret** and save as `RAZORPAY_WEBHOOK_SECRET`

---

## Step 5 — Deploy Backend (Render)

1. Go to [render.com](https://render.com) → Sign up → **New Web Service**
2. Connect your GitHub repo → Select the repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/main`
   - **Plan**: Free
4. Go to **Environment** tab → Add all variables from the list below
5. Click **Deploy** → wait 3–5 minutes
6. Copy your Render URL: `https://YOUR-APP.onrender.com`

### Backend Environment Variables

```env
DATABASE_URL=postgresql://...your-neon-connection-string...
DATABASE_SYNC=true
DB_SSL=true
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://YOUR-VERCEL-APP.vercel.app

JWT_SECRET=generate-a-random-32-char-string-here
ADMIN_PASSWORD=your-strong-admin-password

RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
RAZORPAY_CURRENCY=INR
RAZORPAY_STARTER_AMOUNT=99900
RAZORPAY_STANDARD_AMOUNT=249900
RAZORPAY_ENTERPRISE_AMOUNT=499900
RAZORPAY_INSIGHTS_AMOUNT=49900
INSIGHTS_ACCESS_DAYS=30

WHATSAPP_NUMBER=91XXXXXXXXXX

BOOKING_QUICK_AMOUNT=49900
BOOKING_STRATEGY_AMOUNT=99900
BOOKING_DEEP_AMOUNT=199900

BLOG_ACCESS_AMOUNT=24900
BLOG_JWT_SECRET=another-random-32-char-string

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM=Your Name <onboarding@resend.dev>
SMTP_USER=your@gmail.com
```

> **Generate random secrets:** Go to [generate-secret.vercel.app](https://generate-secret.vercel.app) or run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Step 6 — Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Sign up → **Add New Project**
2. Import your GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Angular
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/karan-portfolio-frontend/browser`
4. Click **Deploy** → wait 2 minutes
5. Copy your Vercel URL

### Update Backend with Frontend URL
Go back to **Render → Environment** → update:
```
FRONTEND_URL=https://YOUR-APP.vercel.app
```
Save → Render redeploys automatically.

---

## Step 7 — Log Into Admin Panel

1. Go to `https://YOUR-VERCEL-APP.vercel.app/admin`
2. Enter your `ADMIN_PASSWORD` from Step 5
3. You're in!

---

## Step 8 — Customize Your Portfolio (via CMS)

In the admin panel, go to **CMS** tab and update each section:

### Hero Section
```json
{
  "name": "Your Name",
  "role": "Full Stack Developer",
  "stack": "Angular · NestJS · PostgreSQL",
  "tagline": "Your tagline here",
  "bio": "Short bio about yourself"
}
```

### Skills Section
Update with your actual tech stack.

### Services Section
Update with services you offer and your pricing.

### Contact Info
```json
{
  "whatsapp": "+91XXXXXXXXXX",
  "email": "you@email.com",
  "linkedin": "https://linkedin.com/in/yourprofile",
  "github": "https://github.com/yourusername"
}
```

### Prices
Update all `RAZORPAY_*_AMOUNT` env vars (values are in paise — multiply ₹ by 100).

---

## Step 9 — Add Your Work Samples (Demos)

In admin panel → **Demos** tab → Add Demo:
- Upload screenshots to any image host (Cloudinary, ImgBB, etc.)
- Paste the image URL
- Add title, description, category

---

## Step 10 — Test Everything

Run through this checklist:

- [ ] Visit your portfolio URL — looks correct
- [ ] Submit contact form — check admin Messages tab
- [ ] Click WhatsApp button — opens correct number
- [ ] Go to `/admin` — login works with your password
- [ ] Admin → Visitors tab — shows your visit
- [ ] Make a test payment (Razorpay test mode) — check admin Payments tab
- [ ] Admin → Approvals tab — pending payment shows up
- [ ] Approve payment — client email received
- [ ] OTP email — goes to `/admin` → test from the AI tools section

---

## Pricing Amounts Reference

All amounts are in **paise** (1 INR = 100 paise):

| Amount | Paise value |
|--------|------------|
| ₹99 | 9900 |
| ₹499 | 49900 |
| ₹999 | 99900 |
| ₹2,499 | 249900 |
| ₹4,999 | 499900 |

---

## Common Issues

**Backend won't start:**
- Check all env vars are set on Render
- Check Render deploy logs for errors

**Emails not sending:**
- Verify `RESEND_API_KEY` is set on Render
- Check Resend dashboard → Logs for delivery status
- Free plan: 100 emails/day limit

**Payments failing:**
- Make sure you're using live keys (not test) in production
- Verify webhook URL is correct in Razorpay dashboard
- Check `RAZORPAY_WEBHOOK_SECRET` matches what's in Razorpay

**Admin login not working:**
- Check `ADMIN_PASSWORD` and `JWT_SECRET` are set on Render
- Wait for Render to finish redeploying after env var changes

**CORS errors:**
- Make sure `FRONTEND_URL` on Render matches your exact Vercel URL (no trailing slash)

---

## Support

Need help? Contact the developer:
- WhatsApp: [Chat directly](https://wa.me/916239589464)
- Email: kk0888176@gmail.com
