/**
 * Partner Operations 2 API Routes
 *
 * Endpoints for dispatch notifications, digital signatures,
 * and partner reporting.
 */

import { Router, type Express } from "express";
import {
  sendOnMyWay,
  markArrived,
  markCompleted,
  getActiveDispatches,
  getDispatchHistory,
} from "../services/on-my-way-notifications";
import {
  createSignatureRequest,
  recordSignature,
  verifySignature,
  getSignaturesForDocument,
  getSignatureStats,
  isDocumentSigned,
} from "../services/digital-signatures";
import {
  getTechPerformance,
  getJobCostingReport,
  getRevenueReport,
  getCustomerReport,
  getServiceMixReport,
  getLeadConversionReport,
  generateWeeklyDigest,
  getKPIDashboard,
} from "../services/partner-reporting";

export function registerPartnerOperations2Routes(app: Express) {
  const router = Router();

  // ============================================================
  // Dispatch / On My Way Notifications
  // ============================================================

  /** Send an "on my way" notification */
  router.post("/:slug/dispatch/send", async (req, res) => {
    try {
      const { slug } = req.params;
      const { jobId, techName, techPhone, customerName, customerPhone, customerEmail, etaMinutes } = req.body;
      if (!jobId || !techName || !customerName) {
        return res.status(400).json({ error: "jobId, techName, and customerName are required" });
      }
      const result = await sendOnMyWay(slug, jobId, techName, techPhone || "", customerName, customerPhone || "", customerEmail || "", etaMinutes || 30);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Mark dispatch as arrived */
  router.post("/:slug/dispatch/:notificationId/arrived", async (req, res) => {
    try {
      await markArrived(parseInt(req.params.notificationId));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Mark dispatch as completed */
  router.post("/:slug/dispatch/:notificationId/completed", async (req, res) => {
    try {
      await markCompleted(parseInt(req.params.notificationId));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Get active dispatches */
  router.get("/:slug/dispatch/active", async (req, res) => {
    try {
      const dispatches = await getActiveDispatches(req.params.slug);
      res.json(dispatches);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Get dispatch history */
  router.get("/:slug/dispatch/history", async (req, res) => {
    try {
      const { start, end } = req.query;
      const dateRange = start && end ? { start: start as string, end: end as string } : undefined;
      const history = await getDispatchHistory(req.params.slug, dateRange);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Digital Signatures
  // ============================================================

  /** Create a signature request */
  router.post("/:slug/signatures/request", async (req, res) => {
    try {
      const { slug } = req.params;
      const { documentType, documentId, signerName, signerEmail } = req.body;
      if (!documentType || !documentId || !signerName) {
        return res.status(400).json({ error: "documentType, documentId, and signerName are required" });
      }
      const result = await createSignatureRequest(slug, documentType, documentId, signerName, signerEmail || "");
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Record a signature */
  router.post("/:slug/signatures/sign", async (req, res) => {
    try {
      const { token, signatureData } = req.body;
      if (!token || !signatureData) {
        return res.status(400).json({ error: "token and signatureData are required" });
      }
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";
      const result = await recordSignature(token, signatureData, ipAddress, userAgent);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Verify a signature */
  router.get("/:slug/signatures/:signatureId/verify", async (req, res) => {
    try {
      const signature = await verifySignature(parseInt(req.params.signatureId));
      if (!signature) return res.status(404).json({ error: "Signature not found" });
      res.json(signature);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Get signatures for a document */
  router.get("/:slug/signatures/document/:documentType/:documentId", async (req, res) => {
    try {
      const signatures = await getSignaturesForDocument(req.params.documentType, req.params.documentId);
      res.json(signatures);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Check if a document is signed */
  router.get("/:slug/signatures/document/:documentType/:documentId/signed", async (req, res) => {
    try {
      const signed = await isDocumentSigned(req.params.documentType, req.params.documentId);
      res.json({ signed });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Get signature stats */
  router.get("/:slug/signatures/stats", async (req, res) => {
    try {
      const stats = await getSignatureStats(req.params.slug);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Reports
  // ============================================================

  /** Tech performance report */
  router.get("/:slug/reports/tech-performance", async (req, res) => {
    try {
      const { techName, start, end } = req.query;
      const dateRange = start && end ? { start: start as string, end: end as string } : undefined;
      const data = await getTechPerformance(req.params.slug, techName as string | undefined, dateRange);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Job costing report */
  router.get("/:slug/reports/job-costing", async (req, res) => {
    try {
      const { start, end } = req.query;
      const dateRange = start && end ? { start: start as string, end: end as string } : undefined;
      const data = await getJobCostingReport(req.params.slug, dateRange);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Revenue report */
  router.get("/:slug/reports/revenue", async (req, res) => {
    try {
      const { start, end } = req.query;
      const dateRange = start && end ? { start: start as string, end: end as string } : undefined;
      const data = await getRevenueReport(req.params.slug, dateRange);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Customer report */
  router.get("/:slug/reports/customers", async (req, res) => {
    try {
      const data = await getCustomerReport(req.params.slug);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Service mix report */
  router.get("/:slug/reports/service-mix", async (req, res) => {
    try {
      const data = await getServiceMixReport(req.params.slug);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Lead conversion report */
  router.get("/:slug/reports/lead-conversion", async (req, res) => {
    try {
      const data = await getLeadConversionReport(req.params.slug);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Weekly digest */
  router.get("/:slug/reports/weekly-digest", async (req, res) => {
    try {
      const digest = await generateWeeklyDigest(req.params.slug);
      res.json({ digest });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** KPI dashboard */
  router.get("/:slug/reports/kpi", async (req, res) => {
    try {
      const data = await getKPIDashboard(req.params.slug);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use("/api/partners", router);
}
