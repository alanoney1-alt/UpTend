/**
 * Unified File Storage Service
 * 
 * Automatically uses S3-compatible storage (S3, R2, etc.) when AWS_S3_BUCKET is set,
 * otherwise falls back to local disk storage for development.
 * 
 * Usage:
 *   import { uploadFile, getFileUrl, isCloudStorage, getMulterStorage } from "./services/file-storage";
 *   const url = await uploadFile(buffer, "photo.jpg", "image/jpeg", "general");
 */

import path from "path";
import fs from "fs";

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_S3_ENDPOINT = process.env.AWS_S3_ENDPOINT; // For R2/MinIO: e.g. https://<account>.r2.cloudflarestorage.com
const AWS_S3_PUBLIC_URL = process.env.AWS_S3_PUBLIC_URL; // Public URL prefix if using CDN/custom domain

export const isCloudStorage = !!(AWS_S3_BUCKET && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);

let s3ClientInstance: any = null;

async function getS3Client() {
  if (s3ClientInstance) return s3ClientInstance;
  const { S3Client } = await import("@aws-sdk/client-s3");
  s3ClientInstance = new S3Client({
    region: AWS_S3_ENDPOINT ? "auto" : AWS_REGION,
    ...(AWS_S3_ENDPOINT && { endpoint: AWS_S3_ENDPOINT }),
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID!,
      secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
  });
  return s3ClientInstance;
}

function generateFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${uniqueSuffix}${ext}`;
}

/**
 * Upload a file buffer to storage.
 * Returns the public URL.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder: string = "general"
): Promise<string> {
  const storedName = generateFilename(filename);

  if (isCloudStorage) {
    const client = await getS3Client();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const key = `${folder}/${storedName}`;

    await client.send(new PutObjectCommand({
      Bucket: AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    console.log(`☁️  Uploaded to S3: ${key}`);

    if (AWS_S3_PUBLIC_URL) {
      return `${AWS_S3_PUBLIC_URL}/${key}`;
    }
    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }

  // Local fallback
  const dir = path.join(process.cwd(), "uploads", folder);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, storedName);
  fs.writeFileSync(filePath, buffer);
  console.log(`📁 Uploaded locally: /uploads/${folder}/${storedName}`);
  return `/uploads/${folder}/${storedName}`;
}

/**
 * Get the URL for a previously stored file key.
 */
export function getFileUrl(key: string): string {
  if (isCloudStorage) {
    if (AWS_S3_PUBLIC_URL) {
      return `${AWS_S3_PUBLIC_URL}/${key}`;
    }
    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }
  // key is expected to be like "general/123-456.jpg"
  return `/uploads/${key}`;
}

/**
 * Returns a multer storage engine: memoryStorage for cloud, diskStorage for local.
 */
export function getMulterStorage(folder: string) {
  // Dynamic import not needed — multer is always available
  const multer = require("multer");

  if (isCloudStorage) {
    return multer.memoryStorage();
  }

  const dir = path.join(process.cwd(), "uploads", folder);
  fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => cb(null, dir),
    filename: (_req: any, file: any, cb: any) => cb(null, generateFilename(file.originalname)),
  });
}
