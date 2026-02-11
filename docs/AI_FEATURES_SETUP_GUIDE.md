# 🤖 AI Features - Complete Setup Guide

This guide walks you through setting up all AI features with real API integrations.

---

## 📋 Quick Start (5 minutes)

Run the automated setup wizard:

```bash
./setup-api-keys.sh
```

Or follow the manual steps below.

---

## 🔑 Required API Keys

### 1. Anthropic Claude API (REQUIRED)

**Why:** Powers all AI features (chat, vision, OCR, content generation)

**Cost:** ~$3 per million input tokens, ~$15 per million output tokens

**Setup:**

1. Visit: https://console.anthropic.com/
2. Sign up/Login
3. Go to Settings → API Keys
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-api03-`)
6. Add to `.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

**Test:**
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

### 2. SendGrid Email (Recommended)

**Why:** Email notifications for fraud alerts, quality scores, seasonal advisories

**Cost:** Free tier (100 emails/day), then $19.95/month (40k emails)

**Setup:**

1. Visit: https://signup.sendgrid.com/
2. Sign up (free tier available)
3. Verify your sender email address
4. Go to Settings → API Keys → Create API Key
5. Select "Full Access" or "Mail Send" only
6. Copy the key (starts with `SG.`)
7. Add to `.env`:
   ```bash
   SENDGRID_API_KEY=SG.your-key-here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

**Verify domain (for production):**
- Go to Settings → Sender Authentication
- Authenticate your domain (adds DNS records)
- This prevents emails going to spam

**Test:**
```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@yourdomain.com"},
    "subject": "Test",
    "content": [{"type": "text/plain", "value": "Test email"}]
  }'
```

---

### 3. Cloudflare R2 Storage (Recommended)

**Why:** Store uploaded photos permanently (not just in memory)

**Cost:** Free tier (10GB storage, 1M reads/month), then $0.015/GB

**Setup:**

1. Visit: https://dash.cloudflare.com/
2. Sign up/Login
3. Go to R2 → Create Bucket
4. Bucket name: `uptend-photos`
5. Go to Manage R2 API Tokens → Create API Token
6. Select "Object Read & Write" permissions
7. Copy Account ID, Access Key ID, Secret Access Key
8. Add to `.env`:
   ```bash
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key-id
   R2_SECRET_ACCESS_KEY=your-secret-access-key
   R2_BUCKET_NAME=uptend-photos
   R2_PUBLIC_URL=https://uptend-photos.your-account-id.r2.cloudflarestorage.com
   ```

**Alternative: AWS S3**
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=uptend-uploads
```

---

### 4. Google Maps API (Already Configured ✅)

**Why:** Accurate route optimization with traffic data

**Current:** You already have `GOOGLE_PLACES_API_KEY` configured

**Additional APIs to enable:**

1. Visit: https://console.cloud.google.com/apis/library
2. Search and enable:
   - **Directions API** (for route calculations)
   - **Distance Matrix API** (for distance calculations)
   - **Geocoding API** (for address lookup)
   - **Maps JavaScript API** (for map displays)

3. Your existing key will work for all of these

**Optional: Create Maps-specific key:**
```bash
GOOGLE_MAPS_API_KEY=your-maps-key  # Separate from Places key
```

---

## 📦 Install Additional Dependencies

```bash
npm install @anthropic-ai/sdk @sendgrid/mail @aws-sdk/client-s3 twilio
```

---

## 🔧 Update Code to Use Real APIs

The code is already set up to automatically use real APIs when keys are present!

**How it works:**

```typescript
// server/services/ai/anthropic-client.ts
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

if (!ANTHROPIC_API_KEY) {
  console.warn("⚠️  ANTHROPIC_API_KEY not set. Using mock responses.");
  // Returns mock data
} else {
  // Calls real API
  const response = await anthropic.messages.create({...});
}
```

**No code changes needed!** Just add the API keys and restart.

---

## 🚀 Testing Each Feature

### 1. AI Chat Widget

**Test:**
1. Visit any page (customer dashboard, pro dashboard)
2. Click the floating chat button (bottom-right)
3. Type: "What services do you offer?"
4. Should get real AI response (not mock)

**Mock response:** "Mock AI response: What services..."
**Real response:** "UpTend provides 11+ services including..."

### 2. Photo-to-Quote

**Test:**
1. Visit customer dashboard
2. Click "Get Instant Quote"
3. Upload a photo of furniture/junk
4. Should get AI analysis with detected items

**Mock:** detectedItems: ["furniture", "boxes", "appliances"]
**Real:** Actual AI vision analysis of your photo

### 3. Quality Scoring (Pro Dashboard)

**Test:**
1. Login as pro
2. Navigate to "Quality Score" tab
3. Should see calculated score

**Note:** Real scores calculated nightly at 2 AM by CRON job

### 4. Fraud Detection (Admin Dashboard)

**Test:**
1. Login as admin
2. Navigate to admin panel
3. Click "Fraud Alerts"
4. Should see any flagged activities

**Note:** Hourly CRON job scans for fraud patterns

### 5. Route Optimization (Pro Dashboard)

**Test:**
1. Login as pro with 2+ scheduled jobs
2. Click "Optimize Route"
3. Should see optimized route with savings

**Mock:** Uses Haversine distance calculations
**Real:** Same for now (Google Maps integration optional)

---

## 📧 Email Notifications Setup

Create email templates in `/server/services/email-service.ts`:

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendFraudAlert(alert: FraudAlert) {
  const msg = {
    to: 'admin@uptend.com',
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: `🚨 Fraud Alert: ${alert.alertType}`,
    html: `
      <h2>Fraud Alert Detected</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Description:</strong> ${alert.description}</p>
      <p><a href="https://uptend.com/admin/fraud/${alert.id}">Review Alert</a></p>
    `,
  };
  await sgMail.send(msg);
}
```

---

## 🔐 Security Best Practices

### Environment Variables

```bash
# .env.production (never commit to git!)
ANTHROPIC_API_KEY=sk-ant-api03-...
SENDGRID_API_KEY=SG....
R2_SECRET_ACCESS_KEY=...

# Rate limiting
API_RATE_LIMIT=100  # requests per minute
```

### API Key Rotation

```bash
# Rotate keys every 90 days
ANTHROPIC_API_KEY_EXPIRES=2024-06-01
```

### Cost Monitoring

```bash
# Set spending limits
ANTHROPIC_MAX_MONTHLY_COST=100  # USD
SENDGRID_EMAIL_LIMIT=10000      # emails per month
```

---

## 📊 Monitoring & Logging

### Check CRON Jobs

```bash
# View CRON job logs
tail -f server.log | grep "AI CRON"

# Expected output:
# 🤖 [AI CRON] Running nightly pro quality scoring...
# ✅ [AI CRON] Scored 25 / 25 pros
```

### Monitor API Usage

```bash
# Anthropic usage
curl https://api.anthropic.com/v1/usage \
  -H "x-api-key: $ANTHROPIC_API_KEY"

# SendGrid usage
curl https://api.sendgrid.com/v3/stats \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

### Database Queries

```sql
-- Check AI conversations
SELECT COUNT(*) FROM ai_conversations WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check fraud alerts
SELECT severity, COUNT(*) FROM fraud_alerts GROUP BY severity;

-- Check quality scores
SELECT tier, COUNT(*) FROM pro_quality_scores WHERE score_date = CURRENT_DATE;
```

---

## 🐛 Troubleshooting

### AI Features Return Mock Data

**Cause:** API key not configured or invalid

**Fix:**
```bash
# Check if key is set
echo $ANTHROPIC_API_KEY

# Test key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

### CRON Jobs Not Running

**Cause:** Server not restarted or CRON schedule error

**Fix:**
```bash
# Restart server
npm run dev

# Check logs
tail -f server.log | grep "CRON"

# Should see:
# 🤖 AI CRON Jobs initialized
```

### Photos Not Uploading

**Cause:** No cloud storage configured

**Fix:**
- Currently uses local storage (mock)
- Set up R2 or S3 for production

### Emails Not Sending

**Cause:** SendGrid not configured or email not verified

**Fix:**
1. Verify sender email in SendGrid dashboard
2. Check API key has "Mail Send" permission
3. Test with curl command above

---

## 💰 Cost Estimates

### Development (Light Usage)

| Service | Cost |
|---------|------|
| Anthropic Claude | ~$5/month |
| SendGrid | Free (100 emails/day) |
| Cloudflare R2 | Free (10GB) |
| Google Maps | Free ($200 credit/month) |
| **Total** | **~$5/month** |

### Production (1000 users, 50 pros)

| Service | Usage | Cost |
|---------|-------|------|
| Anthropic Claude | 100k messages/month | ~$30/month |
| SendGrid | 5k emails/month | Free |
| Cloudflare R2 | 50GB storage | ~$1/month |
| Google Maps | 10k routes/month | ~$50/month |
| **Total** | | **~$81/month** |

---

## ✅ Final Checklist

- [ ] Run `./setup-api-keys.sh`
- [ ] Add all API keys to `.env`
- [ ] Install dependencies: `npm install @anthropic-ai/sdk @sendgrid/mail`
- [ ] Restart server: `npm run dev`
- [ ] Test AI chat widget
- [ ] Test photo-to-quote
- [ ] Check CRON jobs: `tail -f server.log`
- [ ] Monitor API usage in dashboards
- [ ] Set up email notifications (optional)
- [ ] Configure cloud storage (optional)

---

## 🎉 You're Ready!

All AI features are now fully configured and running with real API integrations!

**Support:**
- Anthropic Docs: https://docs.anthropic.com/
- SendGrid Docs: https://docs.sendgrid.com/
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/

**Questions?** Check server logs for detailed error messages.
