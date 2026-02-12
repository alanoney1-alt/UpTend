/**
 * Cloud Storage Service
 *
 * Handles photo uploads to:
 * - Cloudflare R2 (preferred - cheaper than S3)
 * - AWS S3 (alternative)
 * - Local storage (fallback for development)
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

// Configuration
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local"; // "r2", "s3", or "local"

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "uptend-photos";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// S3 Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "uptend-uploads";

// Initialize S3 client (works for both S3 and R2)
let s3Client: S3Client | null = null;

if (STORAGE_PROVIDER === "r2" && R2_ACCOUNT_ID && R2_ACCESS_KEY_ID) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  console.log("✅ Cloudflare R2 storage initialized");
} else if (STORAGE_PROVIDER === "s3" && AWS_ACCESS_KEY_ID) {
  s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log("✅ AWS S3 storage initialized");
} else {
  console.warn("⚠️  No cloud storage configured. Using local storage.");
}

/**
 * Upload a photo to cloud storage
 */
export async function uploadPhoto(options: {
  file: Buffer | ReadableStream;
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<{
  url: string;
  key: string;
}> {
  const { file, filename, contentType, folder = "photos" } = options;

  // Generate unique key
  const extension = filename.split(".").pop() || "jpg";
  const key = `${folder}/${nanoid()}.${extension}`;

  // Upload to cloud storage
  if (s3Client && STORAGE_PROVIDER !== "local") {
    const bucketName = STORAGE_PROVIDER === "r2" ? R2_BUCKET_NAME : S3_BUCKET_NAME;

    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: file,
          ContentType: contentType,
        },
      });

      await upload.done();

      // Generate public URL
      const url =
        STORAGE_PROVIDER === "r2"
          ? `${R2_PUBLIC_URL}/${key}`
          : `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${key}`;

      console.log(`✅ Uploaded photo to ${STORAGE_PROVIDER}: ${key}`);

      return { url, key };
    } catch (error: any) {
      console.error(`❌ Failed to upload to ${STORAGE_PROVIDER}:`, error.message);
      // Fallback to local storage
    }
  }

  // Local storage fallback
  const localDir = path.join(process.cwd(), "uploads", folder);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  const localPath = path.join(localDir, `${nanoid()}.${extension}`);
  if (Buffer.isBuffer(file)) {
    fs.writeFileSync(localPath, file);
  } else {
    // Handle stream
    const writeStream = fs.createWriteStream(localPath);
    //@ts-ignore
    file.pipe(writeStream);
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
  }

  const localUrl = `/uploads/${folder}/${path.basename(localPath)}`;
  console.log(`📁 Uploaded photo to local storage: ${localUrl}`);

  return { url: localUrl, key: path.basename(localPath) };
}

/**
 * Generate a presigned URL for direct client upload (more efficient)
 */
export async function generatePresignedUploadUrl(options: {
  filename: string;
  contentType: string;
  folder?: string;
  expiresIn?: number;
}): Promise<{
  uploadUrl: string;
  publicUrl: string;
  key: string;
}> {
  const { filename, contentType, folder = "photos", expiresIn = 3600 } = options;

  // Generate unique key
  const extension = filename.split(".").pop() || "jpg";
  const key = `${folder}/${nanoid()}.${extension}`;

  if (!s3Client || STORAGE_PROVIDER === "local") {
    // For local development, return a mock URL
    return {
      uploadUrl: `/api/upload/local?key=${key}`,
      publicUrl: `/uploads/${folder}/${key}`,
      key,
    };
  }

  const bucketName = STORAGE_PROVIDER === "r2" ? R2_BUCKET_NAME : S3_BUCKET_NAME;

  // Generate presigned PUT URL
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  const publicUrl =
    STORAGE_PROVIDER === "r2"
      ? `${R2_PUBLIC_URL}/${key}`
      : `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  console.log(`✅ Generated presigned upload URL for: ${key}`);

  return { uploadUrl, publicUrl, key };
}

/**
 * Get a presigned URL to view a private photo
 */
export async function generatePresignedViewUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!s3Client || STORAGE_PROVIDER === "local") {
    return `/uploads/${key}`;
  }

  const bucketName = STORAGE_PROVIDER === "r2" ? R2_BUCKET_NAME : S3_BUCKET_NAME;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Delete a photo from cloud storage
 */
export async function deletePhoto(key: string): Promise<void> {
  if (!s3Client || STORAGE_PROVIDER === "local") {
    // Delete from local storage
    const localPath = path.join(process.cwd(), "uploads", key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`🗑️  Deleted local photo: ${key}`);
    }
    return;
  }

  const bucketName = STORAGE_PROVIDER === "r2" ? R2_BUCKET_NAME : S3_BUCKET_NAME;

  try {
    await s3Client.send({
      name: "DeleteObjectCommand",
      input: {
        Bucket: bucketName,
        Key: key,
      },
    } as any);
    console.log(`🗑️  Deleted photo from ${STORAGE_PROVIDER}: ${key}`);
  } catch (error: any) {
    console.error(`❌ Failed to delete photo:`, error.message);
  }
}

export default {
  uploadPhoto,
  generatePresignedUploadUrl,
  generatePresignedViewUrl,
  deletePhoto,
};
