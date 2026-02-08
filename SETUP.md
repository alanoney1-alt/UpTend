# 🚀 UPTEND - Local Development Setup

Quick guide to get UPTEND running locally.

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (local or remote)
- **Stripe** test account
- **OpenAI** API account

## Quick Start

### 1. Environment Setup

Run the interactive setup script:

```bash
npm run setup
```

This will:
- Check if `.env` exists (and offer to create it)
- Validate all environment variables
- Test database connection
- Show you next steps

### 2. Create .env File

If you don't have a `.env` file yet:

```bash
cp .env.example .env
```

Then edit `.env` and fill in at minimum:

```bash
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/uptend
SESSION_SECRET=your-random-secret-here

# Stripe (use test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# OpenAI
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
```

### 3. Generate SESSION_SECRET

```bash
openssl rand -base64 32
```

Copy the output to your `.env` file.

### 4. Setup PostgreSQL

#### Option A: Local PostgreSQL (macOS)

```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb uptend
```

Your `DATABASE_URL` will be:
```
postgresql://postgres@localhost:5432/uptend
```

#### Option B: Remote PostgreSQL

Use any PostgreSQL provider:
- [Neon](https://neon.tech) (free tier)
- [Supabase](https://supabase.com) (free tier)
- [Railway](https://railway.app)
- [Render](https://render.com)

Copy the connection string to `DATABASE_URL`.

### 5. Get API Keys

#### Stripe Test Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Secret key** → `STRIPE_SECRET_KEY`
3. Copy **Publishable key** → `STRIPE_PUBLISHABLE_KEY`

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Copy to `AI_INTEGRATIONS_OPENAI_API_KEY`

### 6. Run Setup Validation

```bash
npm run setup
```

If successful, you'll see:
```
✅ Your environment is configured!
```

### 7. Initialize Database

Push the database schema:

```bash
npm run db:push
```

### 8. Start Development Server

```bash
npm run dev
```

Server will start at: http://localhost:5000

## Optional Setup

### Email Notifications (SendGrid)

1. Get API key from https://app.sendgrid.com/settings/api_keys
2. Add to `.env`:
   ```bash
   SENDGRID_API_KEY=SG...
   FROM_EMAIL=noreply@yourdomain.com
   ```

### SMS Notifications (Twilio)

1. Get credentials from https://console.twilio.com/
2. Add to `.env`:
   ```bash
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   ```

### Admin Dashboard

Set admin password in `.env`:
```bash
ADMIN_PASSWORD=your-secure-password
```

## Useful Commands

```bash
npm run dev         # Start development server
npm run setup       # Validate environment setup
npm run db:push     # Push database schema changes
npm run db:studio   # Open Drizzle Studio (DB GUI)
npm run check       # TypeScript type checking
npm run build       # Build for production
```

## Troubleshooting

### "DATABASE_URL must be set"
- Make sure `.env` file exists in project root
- Verify `DATABASE_URL` is set and not commented out

### "Database connection failed"
- Check PostgreSQL is running: `brew services list`
- Verify connection string format
- Test connection: `psql $DATABASE_URL`

### "Missing AI_INTEGRATIONS_OPENAI_API_KEY"
- All AI features require OpenAI API key
- Get one from https://platform.openai.com/api-keys
- Add to `.env` file

### Port 5000 already in use
- Change port: `PORT=3000 npm run dev`
- Or kill process: `lsof -ti:5000 | xargs kill`

## Development Tips

### Database GUI
Access Drizzle Studio to browse/edit data:
```bash
npm run db:studio
```

Opens at: https://local.drizzle.studio

### Hot Reload
The dev server automatically restarts on code changes.

### Debug Logs
All API requests to `/api/*` are logged with timing and response data.

## Production Deployment

See `DEPLOYMENT.md` for production setup instructions.

## Need Help?

- Check `.env.example` for all available configuration options
- Run `npm run setup` to validate your configuration
- Check server logs for detailed error messages

---

**Ready to build?** 🎉

Run `npm run dev` and open http://localhost:5000
