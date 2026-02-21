# Storage Setup — Cloudflare R2

UpTend uses Cloudflare R2 (S3-compatible) for file storage in production. Local disk storage works for development but **files are lost on every Railway deploy** (ephemeral filesystem).

## Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 Object Storage
2. Click **Create bucket** → name it `uptend-uploads`
3. Go to **R2 → Overview → Manage R2 API Tokens** → Create API token
   - Permissions: **Object Read & Write**
   - Scope: Apply to `uptend-uploads` bucket only
4. Copy the **Access Key ID** and **Secret Access Key**
5. Note your **Account ID** (visible in the dashboard URL or R2 overview)
6. (Optional) Set up a **Custom Domain** or **Public Bucket** for serving files publicly — copy the public URL

## Environment Variables (Railway)

Set these in your Railway service environment:

```
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_ACCESS_KEY_ID=<your-r2-api-token-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-api-token-secret-key>
R2_BUCKET_NAME=uptend-uploads
R2_PUBLIC_URL=https://your-r2-public-domain.com
```

## Local Development

No env vars needed — storage defaults to `./uploads/` on local disk. This is fine for dev but **do not rely on it in production**.

## How It Works

- `server/services/storage-config.ts` — central config object
- `server/services/file-storage.ts` — unified upload/URL service (auto-detects R2 vs local)
- `server/services/cloud-storage-service.ts` — lower-level S3/R2 client with presigned URLs
