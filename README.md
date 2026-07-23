# 🚀 Karan Kapoor — Portfolio Website
### Angular 17 + NestJS + PostgreSQL + Admin Dashboard

---

## 🏢 Enterprise Status (Now Included)

- ✅ Razorpay Checkout + webhook-based payment tracking
- ✅ Newsletter subscription + admin visibility
- ✅ Security middleware (`helmet`, `compression`)
- ✅ Health endpoint: `/api/health`
- ✅ CI workflow: `.github/workflows/ci.yml`
- ✅ CD workflow: `.github/workflows/deploy.yml`
- ✅ Production guide: `ENTERPRISE_DEPLOYMENT.md`
- ✅ **Journal / dynamic updates**: add achievements, learning logs, and milestones from **Admin → Journal** (stored in PostgreSQL, no redeploy)

### Git repository

Root `.gitignore` is included. Initialize and push:

```bash
cd karan-portfolio
git init
git add .
git commit -m "Initial commit: portfolio + API + admin + CI"
git branch -M main
git remote add origin https://github.com/KK-Dev-28/karan-portfolio.git
git push -u origin main
```

---

## 📁 Project Structure

```
karan-portfolio/
├── backend/                  ← NestJS API
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/             ← JWT login
│   │   ├── visitor/          ← Visitor tracking + analytics
│   │   ├── contact/          ← Contact form messages
│   │   ├── project/          ← Projects (auto-seeded)
│   │   └── admin/            ← Dashboard endpoint
│   ├── .env.example
│   └── package.json
│
└── frontend/                 ← Angular app
    ├── src/
    │   ├── app/
    │   │   ├── pages/
    │   │   │   ├── home/     ← Portfolio homepage
    │   │   │   └── admin/    ← Admin dashboard
    │   │   ├── components/
    │   │   │   ├── navbar/
    │   │   │   ├── hero/
    │   │   │   ├── marquee/
    │   │   │   ├── services/
    │   │   │   ├── skills/
    │   │   │   ├── projects/ ← Loads from PostgreSQL
    │   │   │   ├── experience/
    │   │   │   ├── gigs/
    │   │   │   ├── contact/  ← Saves to PostgreSQL
    │   │   │   └── footer/
    │   │   ├── services/     ← HTTP services
    │   │   ├── guards/       ← Auth guard
    │   │   └── interceptors/ ← JWT interceptor
    │   ├── environments/
    │   ├── styles.scss
    │   └── index.html
    └── package.json
```

---

## ⚙️ STEP 1 — Install PostgreSQL

### On Windows:
1. Download from https://www.postgresql.org/download/windows/
2. Run the installer — remember the password you set for `postgres` user
3. Default port is **5432** — keep it

### On Ubuntu/Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### On macOS:
```bash
brew install postgresql@15
brew services start postgresql@15
```

---

## ⚙️ STEP 2 — Create the Database

Open pgAdmin (Windows) or terminal and run:

```sql
-- Connect as postgres user
psql -U postgres

-- Create the database
CREATE DATABASE portfolio_db;

-- Verify it was created
\l

-- Exit
\q
```

**That's it!** NestJS will automatically create all tables when it starts.

---

## ⚙️ STEP 3 — Setup Backend (NestJS)

```bash
# Go to backend folder
cd karan-portfolio/backend

# Install Node.js dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Edit the `.env` file:
```env
# Open .env in any text editor and set these values:

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=YOUR_POSTGRES_PASSWORD_HERE   ← change this
DB_NAME=portfolio_db

JWT_SECRET=karan-portfolio-jwt-secret-2025   ← change to any long string
ADMIN_PASSWORD=Karan@Admin2025               ← your admin panel password

PORT=3000
FRONTEND_URL=http://localhost:4200
```

### Start the backend:
```bash
npm run start:dev
```

You should see:
```
🚀 Server running  → http://localhost:3000
📖 Swagger docs   → http://localhost:3000/api/docs
✅ Projects seeded to PostgreSQL
```

**NestJS automatically:**
- Creates all tables (`visitors`, `contact_messages`, `projects`)
- Seeds all 6 of your real projects into the database
- No SQL scripts needed!

---

## ⚙️ STEP 4 — Setup Frontend (Angular)

Open a **new terminal** window:

```bash
# Go to frontend folder
cd karan-portfolio/frontend

# Install dependencies
npm install

# Start Angular dev server
npm start
```

Open your browser at: **http://localhost:4200**

---

## 🔐 STEP 5 — Access Admin Dashboard

1. Open **http://localhost:4200**
2. Click the **⚙ Admin** button in the top-right navbar
3. Enter your `ADMIN_PASSWORD` from `.env` (default: `Karan@Admin2025`)
4. You'll be redirected to **http://localhost:4200/admin**

### Admin Dashboard shows:
- ✅ Real-time visitor list (IP, country, city, device, browser, referrer, page)
- ✅ Today's visits count
- ✅ Total unique visitors
- ✅ Page views breakdown (bar chart)
- ✅ Device breakdown (Mobile / Desktop / Tablet)
- ✅ Traffic sources (Direct / LinkedIn / GitHub / Google / WhatsApp)
- ✅ Top countries visiting your site
- ✅ Last 7 days visits chart
- ✅ All contact form messages
- ✅ Mark messages as read
- ✅ Reply button opens email client

---

## 📡 API Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/visitors/log` | Public | Log a page visit |
| GET  | `/api/visitors/analytics` | Admin JWT | Full analytics |
| POST | `/api/contact` | Public | Submit contact form |
| GET  | `/api/contact` | Admin JWT | Get all messages |
| PATCH | `/api/contact/:id/read` | Admin JWT | Mark message read |
| GET  | `/api/projects` | Public | Get all projects |
| POST | `/api/auth/login` | Public | Admin login → JWT token |
| GET  | `/api/admin/dashboard` | Admin JWT | Full dashboard data |
| GET  | `/api/updates` | Public | Published journal entries (homepage) |
| POST | `/api/updates` | Admin JWT | Create journal entry |
| PATCH | `/api/updates/:id` | Admin JWT | Edit / publish / unpublish |
| DELETE | `/api/updates/:id` | Admin JWT | Remove entry |
| GET | `/api/payments/insights/catalog` | Public | Subscription pricing for visitor logs |
| POST | `/api/payments/insights/checkout` | Public | Start paid logs access checkout |
| POST | `/api/payments/insights/activate` | Public | Exchange Razorpay order for access token |
| GET | `/api/visitors/premium-analytics` | Paid Token | Access visitor analytics with subscription token |

**Swagger UI:** http://localhost:3000/api/docs

---

## 🌍 STEP 6 — Deploy to Production

### Deploy Backend → Railway

1. Go to https://railway.app → Sign up free
2. Click **New Project** → **Deploy from GitHub**
3. Push your `backend/` folder to GitHub first
4. Connect your GitHub repo
5. Add environment variables in Railway dashboard:
   ```
   DB_HOST     → (Railway gives you this when you add PostgreSQL)
   DB_PORT     → 5432
   DB_USER     → postgres
   DB_PASS     → (Railway gives you this)
   DB_NAME     → railway
   JWT_SECRET  → your-long-secret-string
   ADMIN_PASSWORD → Karan@Admin2025
   PORT        → 3000
   FRONTEND_URL → https://your-vercel-url.vercel.app
   ```
6. Add a **PostgreSQL** database in Railway (free tier available)
7. Railway auto-deploys — your backend URL will be like:
   `https://karan-backend.railway.app`

### Deploy Frontend → Vercel

1. Go to https://vercel.com → Sign up free
2. Push your `frontend/` folder to GitHub
3. Click **New Project** → Import from GitHub
4. Before deploying, update `src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://karan-backend.railway.app/api',  // ← your Railway URL
   };
   ```
5. In Vercel, set **Build Command**: `npm run build`
6. Set **Output Directory**: `dist/karan-portfolio`
7. Deploy → your site goes live at `https://karan-portfolio.vercel.app`

---

## 🐳 Optional — Docker Setup

Create `docker-compose.yml` in the root folder:

```yaml
version: '3.8'
services:

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: portfolio_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASS: password123
      DB_NAME: portfolio_db
      JWT_SECRET: karan-jwt-secret
      ADMIN_PASSWORD: Karan@Admin2025
    depends_on:
      - postgres

volumes:
  pgdata:
```

Run everything with:
```bash
docker-compose up -d
```

---

## 🔧 Customization Checklist

Open each file and update:

### Backend `.env`:
- [ ] `DB_PASS` → your real PostgreSQL password
- [ ] `JWT_SECRET` → any long random string
- [ ] `ADMIN_PASSWORD` → your desired admin password

### Frontend `src/index.html`:
- [ ] Update meta description with your details

### Frontend `src/environments/environment.prod.ts`:
- [ ] Set your real backend URL after deploying to Railway

### Components to personalize:
- [ ] `hero.component.html` — name already set to Karan Kapoor ✅
- [ ] `gigs.component.ts` — WhatsApp numbers already set ✅
- [ ] `contact.component.html` — phone/email already set ✅
- [ ] `footer.component.html` — name already set ✅
- [ ] Projects are auto-loaded from PostgreSQL ✅

---

## 🛠️ Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql        # Linux
brew services list | grep postgresql   # macOS

# Check your .env DB_PASS matches what you set during install
```

### "Port 3000 already in use"
```bash
# Kill whatever is on port 3000
npx kill-port 3000
# Then restart: npm run start:dev
```

### "CORS error" in browser console
- Make sure backend `.env` has `FRONTEND_URL=http://localhost:4200`
- Make sure backend is running on port 3000
- Make sure Angular is running on port 4200

### "401 Unauthorized" on admin dashboard
- Your JWT token expired (12 hour expiry)
- Click Admin button again and log in

### Angular compile error about missing module
```bash
npm install    # reinstall all packages
npm start      # try again
```

---

## 📞 Contact

| Channel | Details |
|---------|---------|
| 📧 Email | kkcode28012002@gmail.com |
| 📞 Phone 1 | +91-8360426467 |
| 📞 Phone 2 | +91-6239589464 |
| 💬 WhatsApp | wa.me/918360426467 |
| 🐙 GitHub | github.com/KK-Dev-28 |
| 📍 Location | Ludhiana, Punjab, India |

---

*Built with ❤️ by Karan Kapoor — Angular · NestJS · PostgreSQL*
