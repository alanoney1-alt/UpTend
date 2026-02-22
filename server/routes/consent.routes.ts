/**
 * Consent Routes
 *
 * TCPA/CCPA/GDPR consent management endpoints.
 */

import type { Express, Request, Response } from "express";
import { requireAuth } from "../auth-middleware";
import {
  getConsentStatus,
  grantConsent,
  revokeConsent,
  handleSTOP,
  processDataDeletion,
  getAuditTrail,
  type ConsentType,
  type ConsentMethod,
} from "../services/consent-manager";

export async function registerConsentRoutes(app: Express): Promise<void> {
  // Get all consent statuses for a user
  app.get("/api/consent/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.userId)) {
        return res.status(400).json({ success: false, error: "Invalid userId format — expected UUID" });
      }
      const consents = await getConsentStatus(req.params.userId);
      res.json({ success: true, consents });
    } catch (error: any) {
      console.error("Error getting consent status:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Grant consent
  app.post("/api/consent/grant", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId: rawUserId, customerId, consentType, method, consentText, userType, ipAddress } = req.body;
      const userId = rawUserId || customerId;
      const resolvedMethod = method || "api";
      const resolvedConsentText = consentText || `User consented to ${consentType || "unknown"} via API`;
      if (!userId || !consentType) {
        return res.status(400).json({ success: false, error: "Missing required fields: userId (or customerId) and consentType are required" });
      }
      const consent = await grantConsent(
        userId,
        consentType as ConsentType,
        resolvedMethod as ConsentMethod,
        resolvedConsentText,
        { userType, ipAddress: ipAddress ?? req.ip }
      );
      res.json({ success: true, consent });
    } catch (error: any) {
      console.error("Error granting consent:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Revoke consent
  app.post("/api/consent/revoke", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, consentType } = req.body;
      if (!userId || !consentType) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      const revoked = await revokeConsent(userId, consentType as ConsentType);
      res.json({ success: true, revoked });
    } catch (error: any) {
      console.error("Error revoking consent:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // STOP handler (from SMS webhook)
  app.post("/api/consent/stop", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: "Missing userId" });
      }
      const result = await handleSTOP(userId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error handling STOP:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // CCPA/GDPR data deletion request
  app.post("/api/consent/delete-data", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, categories } = req.body;
      if (!userId || !categories) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      const result = await processDataDeletion(userId, categories);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error processing data deletion:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Audit trail
  app.get("/api/consent/audit/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const trail = await getAuditTrail(req.params.userId);
      res.json({ success: true, trail });
    } catch (error: any) {
      console.error("Error getting audit trail:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Re-engagement cron endpoint
  const { checkAndTriggerReengagement } = await import("../services/reengagement.js");
  app.get("/api/cron/reengagement", async (_req: Request, res: Response) => {
    try {
      const result = await checkAndTriggerReengagement();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error running reengagement cron:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
