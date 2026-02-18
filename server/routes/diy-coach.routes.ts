/**
 * DIY Coach Routes
 *
 * POST /api/diy-coach/diagnose — get DIY disclaimer + coaching consent
 * POST /api/diy-coach/acknowledge — record disclaimer acknowledgment
 */

import type { Express } from "express";
import {
  getDIYDisclaimerConsent,
  hasUserAcknowledgedDIYDisclaimer,
  recordDIYDisclaimerAcknowledgment,
  isAffirmativeAcknowledgment,
  wantsProInstead,
} from "../services/diy-coach.js";

export function registerDiyCoachRoutes(app: Express) {
  // POST /api/diy-coach/diagnose — start a DIY coaching session
  app.post("/api/diy-coach/diagnose", async (req, res) => {
    try {
      const { userId, conversationId, issueDescription } = req.body;

      if (!issueDescription) {
        return res.status(400).json({ error: "issueDescription required" });
      }

      const convId = conversationId || "default";

      // Check if user already acknowledged disclaimer
      if (userId) {
        const acknowledged = await hasUserAcknowledgedDIYDisclaimer(userId, convId);
        if (acknowledged) {
          return res.json({
            disclaimerAcknowledged: true,
            issueDescription,
            message: `Let's diagnose: "${issueDescription}". Describe the symptoms in detail — what do you see, hear, or smell?`,
          });
        }
      }

      // Return disclaimer for acknowledgment
      const consent = getDIYDisclaimerConsent();
      return res.json({
        disclaimerAcknowledged: false,
        disclaimer: consent,
        issueDescription,
        message: consent.disclaimerText,
      });
    } catch (err: any) {
      console.error("[DIY Coach] Diagnose error:", err);
      res.status(500).json({ error: err.message || "Failed to start DIY coaching" });
    }
  });

  // POST /api/diy-coach/acknowledge — record disclaimer acknowledgment
  app.post("/api/diy-coach/acknowledge", async (req, res) => {
    try {
      const { userId, conversationId, response } = req.body;
      if (!userId || !response) {
        return res.status(400).json({ error: "userId and response required" });
      }

      const convId = conversationId || "default";

      if (wantsProInstead(response)) {
        return res.json({
          acknowledged: false,
          wantsPro: true,
          message: "No problem! Let me connect you with a qualified pro. 🔧",
        });
      }

      if (isAffirmativeAcknowledgment(response)) {
        await recordDIYDisclaimerAcknowledgment(userId, convId);
        return res.json({
          acknowledged: true,
          wantsPro: false,
          message: "Great! Now describe the issue in detail — what do you see, hear, or smell?",
        });
      }

      return res.json({
        acknowledged: false,
        wantsPro: false,
        message: "I need a clear yes or no. Would you like to proceed with DIY coaching, or should I get you a pro?",
      });
    } catch (err: any) {
      console.error("[DIY Coach] Acknowledge error:", err);
      res.status(500).json({ error: err.message || "Failed to process acknowledgment" });
    }
  });
}
