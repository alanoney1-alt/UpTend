import type { Express } from "express";
import { generatePresignedUploadUrl, uploadPhoto } from "../../services/cloud-storage-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local";

// Multer for local PUT-style uploads
const localUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/**
 * Register object storage routes for file uploads.
 *
 * Supports two flows:
 * 1. Presigned URL (R2/S3): client gets a signed PUT URL, uploads directly to cloud
 * 2. Local fallback: client gets a local endpoint URL, uploads file there
 *
 * Response shape matches what use-upload.ts expects:
 *   { uploadURL, objectPath, metadata }
 */
export function registerObjectStorageRoutes(app: Express): void {

  /**
   * POST /api/uploads/request-url
   * Returns an upload URL (presigned cloud URL or local endpoint)
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }

      const ct = contentType || "application/octet-stream";

      // If cloud storage is configured, generate a real presigned URL
      if (STORAGE_PROVIDER === "r2" || STORAGE_PROVIDER === "s3") {
        const result = await generatePresignedUploadUrl({
          filename: name,
          contentType: ct,
          folder: "uploads",
        });

        return res.json({
          uploadURL: result.uploadUrl,
          objectPath: result.publicUrl,
          metadata: { name, size, contentType: ct },
        });
      }

      // Local storage fallback: generate a unique key and return a local PUT endpoint
      const ext = path.extname(name) || ".bin";
      const key = `${nanoid()}${ext}`;

      return res.json({
        uploadURL: `/api/uploads/local/${key}`,
        objectPath: `/uploads/objects/${key}`,
        metadata: { name, size, contentType: ct },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * PUT /api/uploads/local/:key
   * Accepts the raw file body (same as a presigned S3 PUT)
   */
  app.put("/api/uploads/local/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const uploadDir = path.join(process.cwd(), "uploads", "objects");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, key);
      const writeStream = fs.createWriteStream(filePath);

      req.pipe(writeStream);

      writeStream.on("finish", () => {
        console.log(`📁 Local upload saved: uploads/objects/${key}`);
        res.status(200).send("OK");
      });

      writeStream.on("error", (err) => {
        console.error("Local upload write error:", err);
        res.status(500).json({ error: "Failed to save file" });
      });
    } catch (error) {
      console.error("Local upload error:", error);
      res.status(500).json({ error: "Failed to save file" });
    }
  });

  /**
   * GET /uploads/objects/:key
   * Serve locally uploaded files
   */
  app.get("/uploads/objects/:key", (req, res) => {
    const { key } = req.params;
    const filePath = path.join(process.cwd(), "uploads", "objects", key);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.sendFile(filePath);
  });

  /**
   * GET /objects/:objectPath(*)
   * Serve files from local uploads (backward compatibility)
   */
  app.get("/objects/:objectPath(*)", (req, res) => {
    const objectPath = req.params.objectPath || req.params[0];
    const filePath = path.join(process.cwd(), "uploads", "objects", objectPath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Object not found" });
    }

    res.sendFile(filePath);
  });
}
