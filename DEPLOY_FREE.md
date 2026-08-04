# Free deployment guide — LicenseVault

**Total cost: $0/month**

| Service | What it runs | Free limits |
|---|---|---|
| Supabase | PostgreSQL database | 500 MB, 2 projects |
| Render | FastAPI backend | 750 hrs/month, sleeps after 15 min idle |
| Vercel | React frontend | Unlimited deploys, global CDN |
| GitHub Actions | CI/CD pipeline | 2,000 min/month (org accounts) |
| GitHub Container Registry | Docker images (optional) | 500 MB free |

---

## Step 1 — Supabase (database)

1. Go to https://supabase.com and sign in with GitHub.
2. Click **New project** → give it a name (e.g. `licensevault`) → set a strong DB password → choose a region close to you.
3. Wait ~2 minutes for it to provision.
4. Go to **Project Settings → Database** and copy the **Connection string (URI)** — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
5. Save this — you'll paste it into Render in the next step.

---

## Step 2 — Render (backend)

1. Go to https://render.com and sign in with GitHub.
2. Click **New → Web Service** → connect your GitHub org → select this repo.
3. Fill in:
   - **Root directory**: `backend`
   - **Runtime**: Python 3
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | *(paste your Supabase connection string)* |
   | `SECRET_KEY` | *(click "Generate" — Render fills this in)* |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` |
   | `REFRESH_TOKEN_EXPIRE_DAYS` | `30` |
5. Click **Create Web Service**. First deploy takes ~3 minutes.
6. Copy your Render URL — it looks like `https://licensevault-api.onrender.com`.
7. Go to **Settings → Deploy Hook** and copy the deploy hook URL — you'll add this to GitHub secrets.

---

## Step 3 — Vercel (frontend)

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project** → import your repo → select the `frontend` folder as root directory.
3. Under **Environment Variables** add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://licensevault-api.onrender.com/api/v1` |
4. Click **Deploy**. Done — Vercel gives you a URL like `https://licensevault.vercel.app`.
5. Go to **Project Settings → General** and note down:
   - **Project ID**
   - Your **Team/Org ID** (under team settings)
6. Go to **Account Settings → Tokens** and create a token named `github-actions`.

---

## Step 4 — GitHub Secrets (connects CI/CD)

In your GitHub org repo, go to **Settings → Secrets and variables → Actions → New repository secret** and add all of these:

| Secret name | Where to get it |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render → your service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Team Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General → Project ID |

---

## Step 5 — Push and go

```bash
git add .
git commit -m "chore: add free deployment config"
git push origin main
```

GitHub Actions will:
1. Run backend tests against a temporary PostgreSQL container
2. Build the React frontend (catches compile errors)
3. Trigger a Render deploy (backend)
4. Deploy the frontend to Vercel

Watch it at: `https://github.com/YOUR-ORG/YOUR-REPO/actions`

---

## Waking up the backend (Render free tier)

Render's free tier spins down the backend after 15 minutes of no traffic. The first request after sleep takes ~30 seconds. Two ways to handle this:

**Option A — Add a wake-up call in the frontend** (simplest):
In `frontend/src/services/api.js`, call `/health` on app load so the backend wakes before the user tries to log in.

**Option B — Use a free cron ping service** (keeps it always awake):
Sign up at https://cron-job.org (free), add a job to `GET https://licensevault-api.onrender.com/health` every 14 minutes. This keeps Render from sleeping during business hours.

---

## Custom domain (optional, still free)

- **Vercel**: Project Settings → Domains → add your domain → update DNS at your registrar.
- **Render**: Service Settings → Custom Domain → add domain → update DNS.
- SSL certificates are issued automatically by both platforms for free.

---

## Upgrading later

When you need more than free:

| Need | Upgrade |
|---|---|
| Backend never sleeps | Render Starter ($7/mo) |
| Bigger database | Supabase Pro ($25/mo) or Neon free tier |
| Team collaboration on Vercel | Vercel Pro ($20/mo) |
| Move to cloud | Use existing `docker-compose.yml` on AWS/Azure |
