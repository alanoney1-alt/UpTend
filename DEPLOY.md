# UpTend — Railway Deployment Guide

## Quick Deploy (10 minutes)

### 1. Push to GitHub
```bash
cd ~/uptend-openclaw
git remote add origin https://github.com/YOUR_USERNAME/uptend.git
git push -u origin main
```

### 2. Create Railway Project
- Go to https://railway.app/dashboard
- "New Project" → "Deploy from GitHub repo"
- Select your uptend repo

### 3. Set Environment Variables
In Railway dashboard → Variables, add:

**Required:**
```
DATABASE_URL=postgresql://postgres.xxxx:xxxx@aws-1-us-east-1.pooler.supabase.com:5432/postgres
SESSION_SECRET=<generate with: openssl rand -base64 32>
NODE_ENV=production
PORT=5000
```

**Payments:**
```
STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx to start)
STRIPE_PUBLISHABLE_KEY=pk_live_xxx (or pk_test_xxx to start)
```

**AI:**
```
ANTHROPIC_API_KEY=sk-ant-xxx
AI_INTEGRATIONS_OPENAI_API_KEY=sk-xxx
```

**Email (optional but recommended):**
```
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@uptend.app
```

**Admin:**
```
ADMIN_PASSWORD=<your admin password>
```

### 4. Deploy
Railway auto-deploys on push. First build takes ~2-3 minutes.

### 5. Custom Domain
- Railway dashboard → Settings → Domains
- Add `uptend.app` (or whatever domain)
- Update DNS: CNAME record pointing to Railway's provided URL
- SSL auto-provisioned

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | ✅ | Supabase PostgreSQL connection string |
| SESSION_SECRET | ✅ | Random string for session encryption |
| NODE_ENV | ✅ | Set to `production` |
| PORT | ✅ | Set to `5000` |
| STRIPE_SECRET_KEY | ✅ | Stripe API secret key |
| STRIPE_PUBLISHABLE_KEY | ✅ | Stripe API publishable key |
| ANTHROPIC_API_KEY | ✅ | For AI Guide and all AI features |
| AI_INTEGRATIONS_OPENAI_API_KEY | ⚡ | For additional AI features |
| SENDGRID_API_KEY | 📧 | For sending emails |
| FROM_EMAIL | 📧 | Sender email address |
| ADMIN_PASSWORD | 🔒 | Admin dashboard login |
| GOOGLE_PLACES_API_KEY | 📍 | Address autocomplete |
| RAPIDAPI_KEY | 🏠 | Property data lookups |

## After Deploy

1. Visit your Railway URL — site should load
2. Test login with existing test accounts
3. Test AI Guide chat
4. Set up custom domain
5. Switch Stripe to live keys when ready for real payments

## Costs
- Railway: ~$5-20/month depending on usage
- Supabase: Free tier covers early stage
- Anthropic: Pay per AI call (~$0.003-0.015 per Guide conversation)
- SendGrid: Free tier = 100 emails/day
