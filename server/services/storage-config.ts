/**
 * Storage Configuration
 *
 * Centralizes storage provider settings.
 * Set STORAGE_PROVIDER=r2 and the R2_* env vars for production (Railway).
 * Local storage works for development but files are lost on ephemeral deploys.
 */

export const STORAGE_CONFIG = {
  provider: process.env.STORAGE_PROVIDER || 'local',
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME || 'uptend-uploads',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  },
};
