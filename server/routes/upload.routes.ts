import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import multer from "multer";
import path from "path";
import { uploadFile, getMulterStorage, isCloudStorage } from "../services/file-storage";

const generalUpload = multer({
  storage: getMulterStorage("general"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  },
});

const videoUpload = multer({
  storage: getMulterStorage("general"),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video
  fileFilter: (_req, file, cb) => {
    const allowed = /mp4|mov|avi|webm|mkv|video/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = file.mimetype.startsWith("video/");
    cb(null, ext || mime);
  },
});

export function registerUploadRoutes(app: Express) {
  /** Helper: resolve URLs from multer files, uploading to cloud if configured */
  async function resolveFileUrls(files: Express.Multer.File[], folder: string = "general"): Promise<string[]> {
    if (isCloudStorage) {
      return Promise.all(files.map((f) => uploadFile(f.buffer, f.originalname, f.mimetype, folder)));
    }
    return files.map((f) => `/uploads/${folder}/${f.filename}`);
  }

  // General file upload
  app.post("/api/upload", requireAuth, generalUpload.any(), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const urls = await resolveFileUrls(files);
      res.json({ success: true, urls, url: urls[0], path: urls[0], count: files.length });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Photo analysis upload (for AI scan quotes)
  app.post("/api/upload/analyze", requireAuth, generalUpload.any(), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const urls = await resolveFileUrls(files);
      res.json({ success: true, urls, url: urls[0], count: files.length });
    } catch (error) {
      console.error("Upload analyze error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Video upload (for home-health-audit and other video features)
  app.post("/api/upload/video", requireAuth, videoUpload.any(), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No video uploaded" });
      }
      const urls = await resolveFileUrls(files);
      res.json({ success: true, urls, url: urls[0], count: files.length });
    } catch (error) {
      console.error("Video upload error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  // Verification document upload
  app.post("/api/upload/verification", requireAuth, generalUpload.any(), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const urls = await resolveFileUrls(files);
      res.json({ success: true, urls, url: urls[0], fileUrls: urls, count: files.length });
    } catch (error) {
      console.error("Upload verification error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
}
