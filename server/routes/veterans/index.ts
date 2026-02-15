import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadFile, getMulterStorage, isCloudStorage } from "../../services/file-storage";
import {
  veteranProfiles,
  veteranCertifications,
  veteranMentorships,
  militarySpouseProfiles,
} from "@shared/schema";

const uploadsDir = path.join(process.cwd(), "uploads", "dd214");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dd214Upload = multer({
  storage: getMulterStorage("dd214"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

function registerCrud(
  app: Express,
  basePath: string,
  table: any,
  entityName: string,
  opts?: { ownerField?: string }
) {
  const ownerField = opts?.ownerField;

  app.get(basePath, requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const rows = ownerField
        ? await db.select().from(table).where(eq(table[ownerField], userId))
        : await db.select().from(table);
      res.json(rows);
    } catch (error) {
      console.error(`Error fetching ${entityName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${entityName}` });
    }
  });

  app.get(`${basePath}/:id`, requireAuth, async (req, res) => {
    try {
      const [row] = await db.select().from(table).where(eq(table.id, req.params.id));
      if (!row) return res.status(404).json({ error: `${entityName} not found` });
      res.json(row);
    } catch (error) {
      console.error(`Error fetching ${entityName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${entityName}` });
    }
  });

  app.post(basePath, requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const values = ownerField ? { ...req.body, [ownerField]: userId } : req.body;
      const [created] = await db.insert(table).values(values).returning();
      res.status(201).json(created);
    } catch (error) {
      console.error(`Error creating ${entityName}:`, error);
      res.status(500).json({ error: `Failed to create ${entityName}` });
    }
  });

  app.put(`${basePath}/:id`, requireAuth, async (req, res) => {
    try {
      const [updated] = await db.update(table)
        .set({ ...req.body, updatedAt: new Date().toISOString() })
        .where(eq(table.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: `${entityName} not found` });
      res.json(updated);
    } catch (error) {
      console.error(`Error updating ${entityName}:`, error);
      res.status(500).json({ error: `Failed to update ${entityName}` });
    }
  });

  app.delete(`${basePath}/:id`, requireAuth, async (req, res) => {
    try {
      const [deleted] = await db.delete(table).where(eq(table.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ error: `${entityName} not found` });
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error);
      res.status(500).json({ error: `Failed to delete ${entityName}` });
    }
  });
}

export function registerVeteranRoutes(app: Express) {
  // Serve uploaded files
  const express = require("express");
  app.use("/uploads/dd214", express.static(uploadsDir));

  registerCrud(app, "/api/veterans/profiles", veteranProfiles, "veteran profile", { ownerField: "proId" });
  registerCrud(app, "/api/veterans/certifications", veteranCertifications, "veteran certification", { ownerField: "businessId" });
  registerCrud(app, "/api/veterans/mentorships", veteranMentorships, "mentorship");
  registerCrud(app, "/api/veterans/military-spouses", militarySpouseProfiles, "military spouse profile", { ownerField: "userId" });

  // POST /api/veterans/upload-dd214 — upload DD-214 document
  app.post("/api/veterans/upload-dd214", requireAuth, dd214Upload.single("dd214"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded. Accepted formats: PDF, JPG, PNG (max 10MB)" });
      }

      const userId = (req.user as any).userId || (req.user as any).id;
      const fileUrl = isCloudStorage
        ? await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, "dd214")
        : `/uploads/dd214/${req.file.filename}`;

      // Update the veteran profile with the DD-214 URL
      const [updated] = await db.update(veteranProfiles)
        .set({ dd214DocumentUrl: fileUrl, updatedAt: new Date().toISOString() })
        .where(eq(veteranProfiles.proId, userId))
        .returning();

      res.json({ url: fileUrl, profile: updated || null });
    } catch (error) {
      console.error("Error uploading DD-214:", error);
      res.status(500).json({ error: "Failed to upload DD-214" });
    }
  });
}
