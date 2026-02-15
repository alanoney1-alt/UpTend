import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads", "general");
fs.mkdirSync(uploadDir, { recursive: true });

const generalUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  },
});

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video
  fileFilter: (_req, file, cb) => {
    const allowed = /mp4|mov|avi|webm|mkv|video/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = file.mimetype.startsWith("video/");
    cb(null, ext || mime);
  },
});

export function registerUploadRoutes(app: Express) {
  // General file upload
  app.post("/api/upload", requireAuth, generalUpload.any(), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const urls = files.map((f) => `/uploads/general/${f.filename}`);
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
      const urls = files.map((f) => `/uploads/general/${f.filename}`);
      // Return uploaded URLs — AI analysis happens on the client side or via separate AI endpoint
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
      const urls = files.map((f) => `/uploads/general/${f.filename}`);
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
      const urls = files.map((f) => `/uploads/general/${f.filename}`);
      res.json({ success: true, urls, url: urls[0], fileUrls: urls, count: files.length });
    } catch (error) {
      console.error("Upload verification error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
}
