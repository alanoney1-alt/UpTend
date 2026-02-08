import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replit_integrations/auth";

export function registerAgenticRoutes(app: Express) {
  // ==========================================
  // AGENTIC BRAIN - Instant Triage
  // ==========================================

  // Run AI triage on photos to identify items, estimate weight, and generate pricing
  app.post("/api/agentic/triage", isAuthenticated, async (req, res) => {
    try {
      const { photoUrls, serviceRequestId } = req.body;
      if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
        return res.status(400).json({ error: "photoUrls array is required" });
      }

      const { runInstantTriage, generateDispatchRecommendation } = await import("../../services/agentic-brain");
      const triageResult = await runInstantTriage(photoUrls);

      const report = await storage.createAiTriageReport({
        serviceRequestId: serviceRequestId || null,
        requestedBy: (req as any).user?.id || null,
        photoUrls,
        overallClassification: triageResult.overallClassification,
        confidence: triageResult.confidence,
        inventory: JSON.stringify(triageResult.inventory),
        totalEstimatedWeightLbs: triageResult.totalEstimatedWeightLbs,
        totalItemCount: triageResult.totalItemCount,
        hazardousItemCount: triageResult.hazardousItemCount,
        donationItemCount: triageResult.donationItemCount,
        recyclableItemCount: triageResult.recyclableItemCount,
        guaranteedPrice: triageResult.guaranteedPrice,
        recommendedCrewSize: triageResult.recommendedCrewSize,
        recommendedVehicleType: triageResult.recommendedVehicleType,
        specialEquipmentNeeded: triageResult.specialEquipmentNeeded,
        safetyWarnings: triageResult.safetyWarnings,
        rawResponse: triageResult.rawResponse,
        createdAt: new Date().toISOString(),
      });

      const dispatchRec = generateDispatchRecommendation(triageResult);

      if (serviceRequestId) {
        await storage.createDispatchRecommendation({
          serviceRequestId,
          triageReportId: report.id,
          recommendedCrewSize: dispatchRec.recommendedCrewSize,
          recommendedVehicleType: dispatchRec.recommendedVehicleType,
          estimatedTotalWeightLbs: dispatchRec.estimatedTotalWeightLbs,
          estimatedVolumeCubicFt: dispatchRec.estimatedVolumeCubicFt,
          estimatedDurationHours: dispatchRec.estimatedDurationHours,
          fuelEfficiencyScore: dispatchRec.fuelEfficiencyScore,
          greenMatchPriority: dispatchRec.greenMatchPriority,
          reasoning: dispatchRec.reasoning,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }

      res.json({
        ...report,
        inventory: triageResult.inventory,
        dispatchRecommendation: dispatchRec,
      });
    } catch (error: any) {
      console.error("AI Triage error:", error);
      res.status(500).json({ error: "Failed to run AI triage" });
    }
  });

  // Get specific triage report by ID
  app.get("/api/agentic/triage/:id", isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getAiTriageReport(req.params.id);
      if (!report) return res.status(404).json({ error: "Triage report not found" });

      let inventory = [];
      try {
        inventory = JSON.parse(report.inventory || "[]");
      } catch (error) {
        console.error('Failed to parse inventory JSON:', error);
        return res.status(400).json({ error: "Invalid JSON in inventory field" });
      }

      res.json({ ...report, inventory });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch triage report" });
    }
  });

  // Get recent triage reports
  app.get("/api/agentic/triage", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const reports = await storage.getRecentAiTriageReports(limit);

      const parsedReports = reports.map(r => {
        try {
          return { ...r, inventory: JSON.parse(r.inventory || "[]") };
        } catch (error) {
          console.error('Failed to parse inventory JSON for report:', r.id, error);
          return { ...r, inventory: [] };
        }
      });

      res.json(parsedReports);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch triage reports" });
    }
  });

  // ==========================================
  // AGENTIC BRAIN - Revenue Protector (Sentiment Analysis)
  // ==========================================

  // Scan text for sentiment and risk indicators
  app.post("/api/agentic/sentiment-scan", isAuthenticated, async (req, res) => {
    try {
      const { text, sourceType, sourceId, serviceRequestId, customerId, haulerId } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text field is required" });
      }
      if (!sourceType) {
        return res.status(400).json({ error: "sourceType is required (review, message, feedback, complaint)" });
      }

      const { analyzeSentiment } = await import("../../services/agentic-brain");
      const result = await analyzeSentiment(text, { sourceType });

      const flag = await storage.createSentimentFlag({
        sourceType,
        sourceId: sourceId || null,
        serviceRequestId: serviceRequestId || null,
        customerId: customerId || null,
        haulerId: haulerId || null,
        rawText: text,
        sentimentScore: result.sentimentScore,
        riskLevel: result.riskLevel,
        keyPhrases: result.keyPhrases,
        issues: result.issues,
        recommendedAction: result.recommendedAction,
        urgencyReason: result.urgencyReason || null,
        status: result.riskLevel === "critical" ? "urgent" : result.riskLevel === "high" ? "action_needed" : "new",
        createdAt: new Date().toISOString(),
      });

      res.json(flag);
    } catch (error: any) {
      console.error("Sentiment scan error:", error);
      res.status(500).json({ error: "Failed to analyze sentiment" });
    }
  });

  // Get sentiment flags (filtered or all recent)
  app.get("/api/agentic/sentiment-flags", isAuthenticated, async (req, res) => {
    try {
      const { riskLevel, limit } = req.query;
      let flags;
      if (riskLevel && typeof riskLevel === "string") {
        flags = await storage.getSentimentFlagsByRisk(riskLevel);
      } else {
        flags = await storage.getRecentSentimentFlags(parseInt(limit as string) || 20);
      }
      res.json(flags);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch sentiment flags" });
    }
  });

  // Update sentiment flag status/resolution
  app.patch("/api/agentic/sentiment-flags/:id", isAuthenticated, async (req, res) => {
    try {
      const { status, resolutionNotes } = req.body;
      const updates: any = {};
      if (status) updates.status = status;
      if (resolutionNotes) updates.resolutionNotes = resolutionNotes;
      if (status === "resolved") {
        updates.resolvedBy = (req as any).user?.id;
        updates.resolvedAt = new Date().toISOString();
      }
      const flag = await storage.updateSentimentFlag(req.params.id, updates);
      if (!flag) return res.status(404).json({ error: "Sentiment flag not found" });
      res.json(flag);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update sentiment flag" });
    }
  });

  // ==========================================
  // AGENTIC BRAIN - Conflict Shield (Pre-existing Damage Detection)
  // ==========================================

  // Run conflict shield analysis to detect pre-existing damage
  app.post("/api/agentic/conflict-shield", isAuthenticated, async (req, res) => {
    try {
      const { serviceRequestId, photosBefore, photosAfter } = req.body;
      if (!serviceRequestId) {
        return res.status(400).json({ error: "serviceRequestId is required" });
      }
      if (!photosBefore || !Array.isArray(photosBefore) || photosBefore.length === 0) {
        return res.status(400).json({ error: "photosBefore array is required" });
      }

      const { runConflictShield } = await import("../../services/agentic-brain");
      const result = await runConflictShield(photosBefore, photosAfter);

      const report = await storage.createConflictShieldReport({
        serviceRequestId,
        requestedBy: (req as any).user?.id || null,
        photosBefore,
        photosAfter: photosAfter || null,
        preExistingDamage: JSON.stringify(result.preExistingDamage),
        preExistingDamageCount: result.preExistingDamageCount,
        newDamageDetected: result.newDamageDetected,
        newDamage: result.newDamage.length > 0 ? JSON.stringify(result.newDamage) : null,
        confidence: result.confidence,
        summary: result.summary,
        recommendation: result.recommendation,
        rawResponse: result.rawResponse,
        status: "completed",
        createdAt: new Date().toISOString(),
      });

      res.json({
        ...report,
        preExistingDamage: result.preExistingDamage,
        newDamage: result.newDamage,
      });
    } catch (error: any) {
      console.error("Conflict Shield error:", error);
      res.status(500).json({ error: "Failed to run conflict shield analysis" });
    }
  });

  // Get conflict shield report for specific service request
  app.get("/api/agentic/conflict-shield/:serviceRequestId", isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getConflictShieldReportByRequest(req.params.serviceRequestId);
      if (!report) return res.status(404).json({ error: "Conflict shield report not found" });

      let preExistingDamage = [];
      let newDamage = [];

      try {
        preExistingDamage = JSON.parse(report.preExistingDamage || "[]");
      } catch (error) {
        console.error('Failed to parse preExistingDamage JSON:', error);
        return res.status(400).json({ error: "Invalid JSON in preExistingDamage field" });
      }

      try {
        newDamage = report.newDamage ? JSON.parse(report.newDamage) : [];
      } catch (error) {
        console.error('Failed to parse newDamage JSON:', error);
        return res.status(400).json({ error: "Invalid JSON in newDamage field" });
      }

      res.json({
        ...report,
        preExistingDamage,
        newDamage,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch conflict shield report" });
    }
  });

  // Get recent conflict shield reports
  app.get("/api/agentic/conflict-shield", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const reports = await storage.getRecentConflictShieldReports(limit);

      const parsedReports = reports.map(r => {
        let preExistingDamage = [];
        let newDamage = [];

        try {
          preExistingDamage = JSON.parse(r.preExistingDamage || "[]");
        } catch (error) {
          console.error('Failed to parse preExistingDamage JSON for report:', r.id, error);
        }

        try {
          newDamage = r.newDamage ? JSON.parse(r.newDamage) : [];
        } catch (error) {
          console.error('Failed to parse newDamage JSON for report:', r.id, error);
        }

        return {
          ...r,
          preExistingDamage,
          newDamage,
        };
      });

      res.json(parsedReports);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch conflict shield reports" });
    }
  });

  // ==========================================
  // AGENTIC BRAIN - Smart Dispatch Recommendation
  // ==========================================

  // Generate dispatch recommendation from triage report
  app.post("/api/agentic/dispatch-recommendation", isAuthenticated, async (req, res) => {
    try {
      const { serviceRequestId } = req.body;
      if (!serviceRequestId) {
        return res.status(400).json({ error: "serviceRequestId is required" });
      }

      const triageReport = await storage.getAiTriageReportByRequest(serviceRequestId);
      if (!triageReport) {
        return res.status(404).json({ error: "No triage report found for this service request. Run /api/agentic/triage first." });
      }

      const { generateDispatchRecommendation } = await import("../../services/agentic-brain");

      let inventory = [];
      try {
        inventory = JSON.parse(triageReport.inventory || "[]");
      } catch (error) {
        console.error('Failed to parse inventory JSON:', error);
        return res.status(400).json({ error: "Invalid JSON in inventory field" });
      }

      const triageResult = {
        overallClassification: triageReport.overallClassification,
        confidence: triageReport.confidence,
        inventory,
        totalEstimatedWeightLbs: triageReport.totalEstimatedWeightLbs || 0,
        totalItemCount: triageReport.totalItemCount || 0,
        hazardousItemCount: triageReport.hazardousItemCount || 0,
        donationItemCount: triageReport.donationItemCount || 0,
        recyclableItemCount: triageReport.recyclableItemCount || 0,
        guaranteedPrice: triageReport.guaranteedPrice || 149,
        recommendedCrewSize: triageReport.recommendedCrewSize || 2,
        recommendedVehicleType: triageReport.recommendedVehicleType || "cargo_van",
        specialEquipmentNeeded: triageReport.specialEquipmentNeeded || [],
        safetyWarnings: triageReport.safetyWarnings || [],
        rawResponse: triageReport.rawResponse || "",
      };

      const dispatchRec = generateDispatchRecommendation(triageResult);

      const saved = await storage.createDispatchRecommendation({
        serviceRequestId,
        triageReportId: triageReport.id,
        recommendedCrewSize: dispatchRec.recommendedCrewSize,
        recommendedVehicleType: dispatchRec.recommendedVehicleType,
        estimatedTotalWeightLbs: dispatchRec.estimatedTotalWeightLbs,
        estimatedVolumeCubicFt: dispatchRec.estimatedVolumeCubicFt,
        estimatedDurationHours: dispatchRec.estimatedDurationHours,
        fuelEfficiencyScore: dispatchRec.fuelEfficiencyScore,
        greenMatchPriority: dispatchRec.greenMatchPriority,
        reasoning: dispatchRec.reasoning,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      res.json(saved);
    } catch (error: any) {
      console.error("Dispatch recommendation error:", error);
      res.status(500).json({ error: "Failed to generate dispatch recommendation" });
    }
  });

  // Get dispatch recommendation for specific service request
  app.get("/api/agentic/dispatch-recommendation/:serviceRequestId", isAuthenticated, async (req, res) => {
    try {
      const rec = await storage.getDispatchRecommendationByRequest(req.params.serviceRequestId);
      if (!rec) return res.status(404).json({ error: "Dispatch recommendation not found" });
      res.json(rec);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch dispatch recommendation" });
    }
  });

  // ==========================================
  // AGENTIC BRAIN - Dashboard Summary
  // ==========================================

  // Get dashboard summary of all agentic brain activities
  app.get("/api/agentic/dashboard", isAuthenticated, async (req, res) => {
    try {
      const [triageReports, sentimentFlagsData, conflictReports] = await Promise.all([
        storage.getRecentAiTriageReports(5),
        storage.getRecentSentimentFlags(10),
        storage.getRecentConflictShieldReports(5),
      ]);

      const criticalFlags = sentimentFlagsData.filter(f => f.riskLevel === "critical" || f.riskLevel === "high");
      const unresolvedFlags = sentimentFlagsData.filter(f => f.status !== "resolved");

      const parsedTriageReports = triageReports.map(r => {
        try {
          return { ...r, inventory: JSON.parse(r.inventory || "[]") };
        } catch (error) {
          console.error('Failed to parse inventory JSON for report:', r.id, error);
          return { ...r, inventory: [] };
        }
      });

      const parsedConflictReports = conflictReports.map(r => {
        let preExistingDamage = [];
        let newDamage = [];

        try {
          preExistingDamage = JSON.parse(r.preExistingDamage || "[]");
        } catch (error) {
          console.error('Failed to parse preExistingDamage JSON for report:', r.id, error);
        }

        try {
          newDamage = r.newDamage ? JSON.parse(r.newDamage) : [];
        } catch (error) {
          console.error('Failed to parse newDamage JSON for report:', r.id, error);
        }

        return {
          ...r,
          preExistingDamage,
          newDamage,
        };
      });

      res.json({
        summary: {
          totalTriageReports: triageReports.length,
          totalSentimentFlags: sentimentFlagsData.length,
          criticalAlerts: criticalFlags.length,
          unresolvedFlags: unresolvedFlags.length,
          totalConflictShields: conflictReports.length,
          damageDetected: conflictReports.filter(r => r.newDamageDetected).length,
        },
        recentTriage: parsedTriageReports,
        recentSentiment: sentimentFlagsData,
        recentConflictShields: parsedConflictReports,
      });
    } catch (error: any) {
      console.error("Agentic dashboard error:", error);
      res.status(500).json({ error: "Failed to load agentic brain dashboard" });
    }
  });
}
