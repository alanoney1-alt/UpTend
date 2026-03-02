import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import { storeJobPhoto, getJobPhotos, analyzePhoto, getPhoto } from "../services/photo-pipeline";
import multer from "multer";
import { getMulterStorage, uploadFile, isCloudStorage } from "../services/file-storage";

const photoUpload = multer({
  storage: getMulterStorage("job-photos"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(file.originalname.toLowerCase());
    const mime = file.mimetype.startsWith("image/");
    cb(null, ext || mime);
  },
});

export function registerPhotoPipelineRoutes(app: Express) {
  // Upload a job photo
  app.post("/api/jobs/:jobId/photos", requireAuth, photoUpload.single("photo"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No photo uploaded" });

      let photo_url: string;
      if (isCloudStorage) {
        photo_url = await uploadFile(file.buffer, file.originalname, file.mimetype, "job-photos");
      } else {
        photo_url = `/uploads/job-photos/${(file as any).filename}`;
      }

      const user = req.user as any;
      const result = await storeJobPhoto({
        job_id: req.params.jobId,
        pro_id: req.body.pro_id || user?.id,
        customer_id: req.body.customer_id,
        service_type: req.body.service_type,
        photo_url,
        photo_type: req.body.photo_type || "completion",
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [],
      });

      res.json(result);
    } catch (e: any) {
      console.error("[PhotoPipeline] Upload error:", e.message);
      res.status(500).json({ error: "Failed to store photo" });
    }
  });

  // Get all photos for a job
  app.get("/api/jobs/:jobId/photos", requireAuth, async (req, res) => {
    try {
      const photos = await getJobPhotos(req.params.jobId);
      res.json(photos);
    } catch (e: any) {
      console.error("[PhotoPipeline] Fetch error:", e.message);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  // Trigger AI analysis
  app.post("/api/photos/:photoId/analyze", requireAuth, async (req, res) => {
    try {
      const result = await analyzePhoto(req.params.photoId);
      res.json(result);
    } catch (e: any) {
      console.error("[PhotoPipeline] Analysis error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Get photo details
  app.get("/api/photos/:photoId", requireAuth, async (req, res) => {
    try {
      const photo = await getPhoto(req.params.photoId);
      if (!photo) return res.status(404).json({ error: "Photo not found" });
      res.json(photo);
    } catch (e: any) {
      console.error("[PhotoPipeline] Fetch error:", e.message);
      res.status(500).json({ error: "Failed to fetch photo" });
    }
  });
}
