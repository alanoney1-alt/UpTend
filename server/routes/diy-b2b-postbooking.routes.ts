/**
 * Routes: DIY Tips, B2B Contracts, Post-Booking Intelligence, Neighborhood Insights
 */

import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import { getDIYTip, getSeasonalDIYTips, getDIYvsPro } from "../services/diy-tips.js";
import {
  generateServiceAgreement,
  getAgreementStatus,
  getDocumentTracker,
  flagExpiringDocuments,
  getComplianceReport,
} from "../services/b2b-contracts.js";
import {
  getPostBookingQuestion,
  processAnswer,
  getProJobPrompts,
  processProPromptResponse,
} from "../services/post-booking.js";
import { generateInsights, getSeasonalDemand } from "../services/neighborhood-insights.js";

export function registerDiyB2bPostBookingRoutes(app: Express) {
  // ── DIY Tips ──────────────────────────────────────────

  app.get("/api/diy/:serviceType", requireAuth, async (req, res) => {
    try {
      const tip = await getDIYTip(req.params.serviceType);
      if (!tip) return res.status(404).json({ error: "No DIY tip found for this service type" });
      res.json(tip);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/diy/seasonal/:month", requireAuth, async (req, res) => {
    try {
      const month = parseInt(req.params.month);
      if (isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Month must be 1-12" });
      }
      const tips = await getSeasonalDIYTips(month);
      res.json(tips);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/diy/compare/:serviceType", requireAuth, async (req, res) => {
    try {
      const comparison = await getDIYvsPro(req.params.serviceType);
      res.json(comparison);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── B2B Contracts ─────────────────────────────────────

  app.get("/api/b2b/agreements/:businessId", requireAuth, async (req, res) => {
    try {
      const docs = await getDocumentTracker(req.params.businessId);
      res.json(docs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/b2b/agreements", requireAuth, async (req, res) => {
    try {
      const { businessAccountId, agreementType, terms } = req.body;
      if (!businessAccountId || !agreementType) {
        return res.status(400).json({ error: "businessAccountId and agreementType required" });
      }
      const agreement = await generateServiceAgreement(businessAccountId, agreementType, terms || {});
      res.json(agreement);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/b2b/agreements/status/:agreementId", requireAuth, async (req, res) => {
    try {
      const status = await getAgreementStatus(req.params.agreementId);
      if (!status) return res.status(404).json({ error: "Agreement not found" });
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/b2b/documents/:businessId", requireAuth, async (req, res) => {
    try {
      const docs = await getDocumentTracker(req.params.businessId);
      res.json(docs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/b2b/documents/:businessId/expiring", requireAuth, async (req, res) => {
    try {
      const expiring = await flagExpiringDocuments(req.params.businessId);
      res.json(expiring);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/b2b/compliance/:businessId", requireAuth, async (req, res) => {
    try {
      const report = await getComplianceReport(req.params.businessId);
      res.json(report);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Post-Booking Intelligence ─────────────────────────

  app.get("/api/post-booking/question/:customerId/:jobId", requireAuth, async (req, res) => {
    try {
      const { customerId, jobId } = req.params;
      const serviceType = req.query.serviceType as string | undefined;
      const question = await getPostBookingQuestion(customerId, jobId, serviceType);
      res.json(question);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/post-booking/answer", requireAuth, async (req, res) => {
    try {
      const { questionId, answer } = req.body;
      if (!questionId || !answer) {
        return res.status(400).json({ error: "questionId and answer required" });
      }
      const result = await processAnswer(questionId, answer);
      if (!result) return res.status(404).json({ error: "Question not found" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/pro/prompts/:proId/:jobId", requireAuth, async (req, res) => {
    try {
      const { proId, jobId } = req.params;
      const serviceType = req.query.serviceType as string | undefined;
      const prompts = await getProJobPrompts(proId, jobId, serviceType);
      res.json(prompts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/pro/prompts/respond", requireAuth, async (req, res) => {
    try {
      const { promptId, response, photos } = req.body;
      if (!promptId || !response) {
        return res.status(400).json({ error: "promptId and response required" });
      }
      const result = await processProPromptResponse(promptId, response, photos);
      if (!result) return res.status(404).json({ error: "Prompt not found" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Neighborhood Insights ─────────────────────────────

  app.get("/api/neighborhood/:zip", requireAuth, async (req, res) => {
    try {
      const insights = await generateInsights(req.params.zip);
      res.json(insights);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/neighborhood/:zip/seasonal/:month", requireAuth, async (req, res) => {
    try {
      const month = parseInt(req.params.month);
      if (isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Month must be 1-12" });
      }
      const demand = await getSeasonalDemand(req.params.zip, month);
      res.json(demand);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
