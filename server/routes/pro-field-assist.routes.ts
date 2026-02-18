/**
 * Pro Field Assistant Routes
 * On-site assistance for 1099 independent contractor pros
 */

import type { Express, Request, Response } from "express";
import {
  identifyPartFromPhoto,
  findReplacementPart,
  getTechnicalReference,
  troubleshootOnSite,
  findNearestSupplyStore,
  getQuickTutorial,
  getAssistHistory,
  contributeToKnowledgeBase,
  getProKnowledgeBase,
  logPartOrder,
} from "../services/pro-field-assist.js";

export function registerProFieldAssistRoutes(app: Express) {
  // POST /api/pro/field-assist/identify — photo → part identification
  app.post("/api/pro/field-assist/identify", async (req: Request, res: Response) => {
    try {
      const { proId, photo, description } = req.body;
      if (!proId || !photo) return res.status(400).json({ error: "proId and photo required" });
      const result = await identifyPartFromPhoto(proId, photo, description);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/pro/field-assist/find-part — search for replacement
  app.post("/api/pro/field-assist/find-part", async (req: Request, res: Response) => {
    try {
      const { partDescription, brand, model } = req.body;
      if (!partDescription) return res.status(400).json({ error: "partDescription required" });
      const result = await findReplacementPart(partDescription, brand, model);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/pro/field-assist/reference/:category — quick reference
  app.get("/api/pro/field-assist/reference/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { issue } = req.query;
      const result = await getTechnicalReference(category, (issue as string) || "");
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/pro/field-assist/troubleshoot — on-site troubleshooting
  app.post("/api/pro/field-assist/troubleshoot", async (req: Request, res: Response) => {
    try {
      const { proId, jobId, issueDescription, photo } = req.body;
      if (!proId || !issueDescription) return res.status(400).json({ error: "proId and issueDescription required" });
      const result = await troubleshootOnSite(proId, jobId || null, issueDescription, photo);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/pro/field-assist/stores/:zip — nearest supply stores
  app.get("/api/pro/field-assist/stores/:zip", async (req: Request, res: Response) => {
    try {
      const { zip } = req.params;
      const { part } = req.query;
      const result = await findNearestSupplyStore(zip, part as string);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/pro/field-assist/tutorial — find tutorial
  app.post("/api/pro/field-assist/tutorial", async (req: Request, res: Response) => {
    try {
      const { task, experienceLevel } = req.body;
      if (!task) return res.status(400).json({ error: "task required" });
      const result = await getQuickTutorial(task, experienceLevel);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/pro/field-assist/history/:proId — past assists
  app.get("/api/pro/field-assist/history/:proId", async (req: Request, res: Response) => {
    try {
      const { proId } = req.params;
      const result = await getAssistHistory(proId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/pro/field-assist/knowledge — contribute to knowledge base
  app.post("/api/pro/field-assist/knowledge", async (req: Request, res: Response) => {
    try {
      const { proId, entry } = req.body;
      if (!proId || !entry) return res.status(400).json({ error: "proId and entry required" });
      const result = await contributeToKnowledgeBase(proId, entry);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/pro/field-assist/knowledge/:category — search knowledge base
  app.get("/api/pro/field-assist/knowledge/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { subcategory, brand } = req.query;
      const result = await getProKnowledgeBase(category, subcategory as string, brand as string);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/pro/field-assist/order-part — log part order for job billing
  app.post("/api/pro/field-assist/order-part", async (req: Request, res: Response) => {
    try {
      const { proId, jobId, ...orderData } = req.body;
      if (!proId || !orderData.partName) return res.status(400).json({ error: "proId and partName required" });
      const result = await logPartOrder(proId, jobId || null, orderData);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
