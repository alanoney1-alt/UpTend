/**
 * Partner Features API Routes
 * 
 * Endpoints for all 6 new partner features:
 * - Proactive outreach
 * - Competitor watchdog
 * - Revenue attribution
 * - Voice George
 * - Crew scheduling
 * - Network intros
 */

import { Router, type Express } from "express";
import { sendPartnerMessage, generateWeeklyRecap, registerPartnerContact, getOutreachHistory } from "../services/partner-proactive-outreach";
import { runCompetitiveScan, getAlerts, addTrackedKeyword, getTrackedKeywords, autoGenerateKeywords, getRankingHistory } from "../services/partner-competitor-watchdog";
import { trackLead, updateLeadStatus, generateAttributionReport, getQuickSummary, recordMonthlySpend } from "../services/partner-revenue-attribution";
import { textToSpeechBase64, isVoiceEnabled, getAvailableVoices, georgeVoiceResponse } from "../services/partner-voice-george";
import { addCrewMember, getCrewMembers, scheduleJob, updateJobStatus, getAvailability, getAvailabilitySummary, getWeeklyUtilization } from "../services/partner-crew-scheduling";
import { makeIntroduction, acceptIntro, completeIntro, getPartnerIntros, getIntroSummary } from "../services/partner-network-intros";

export function registerPartnerFeaturesRoutes(app: Express) {
  const router = Router();

  // ============================================================
  // Voice George (#4)
  // ============================================================

  // Check if voice is enabled
  router.get("/voice/status", (_req, res) => {
    res.json({ enabled: isVoiceEnabled(), voices: getAvailableVoices() });
  });

  // Text to speech
  router.post("/voice/speak", async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) return res.status(400).json({ error: "text required" });
      
      const audioBase64 = await textToSpeechBase64(text, { voice });
      if (!audioBase64) {
        return res.status(503).json({ error: "Voice service unavailable. Set ELEVENLABS_API_KEY." });
      }
      
      res.json({ audioBase64, contentType: "audio/mpeg" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // George voice response (text + audio combined)
  router.post("/voice/george", async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) return res.status(400).json({ error: "text required" });
      
      const result = await georgeVoiceResponse(text, { voice });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Proactive Outreach (#3)
  // ============================================================

  // Register partner contact
  router.post("/:slug/contact", async (req, res) => {
    try {
      await registerPartnerContact({
        slug: req.params.slug,
        ...req.body,
      });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Send a proactive message
  router.post("/:slug/outreach", async (req, res) => {
    try {
      const { messageType, body, subject } = req.body;
      await sendPartnerMessage(req.params.slug, messageType || "custom", body, subject);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get outreach history
  router.get("/:slug/outreach", async (req, res) => {
    try {
      const history = await getOutreachHistory(req.params.slug);
      res.json({ messages: history });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Competitor Watchdog (#5)
  // ============================================================

  // Add tracked keyword
  router.post("/:slug/keywords", async (req, res) => {
    try {
      const { keyword, city, isPrimary } = req.body;
      await addTrackedKeyword(req.params.slug, keyword, city, isPrimary);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auto-generate keywords
  router.post("/:slug/keywords/auto", async (req, res) => {
    try {
      const { serviceType, city } = req.body;
      const keywords = await autoGenerateKeywords(req.params.slug, serviceType, city);
      res.json({ keywords, count: keywords.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get tracked keywords
  router.get("/:slug/keywords", async (req, res) => {
    try {
      const keywords = await getTrackedKeywords(req.params.slug);
      res.json({ keywords });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Run competitive scan
  router.post("/:slug/scan", async (req, res) => {
    try {
      const alerts = await runCompetitiveScan(req.params.slug);
      res.json({ alerts, count: alerts.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get alerts
  router.get("/:slug/alerts", async (req, res) => {
    try {
      const alerts = await getAlerts(req.params.slug);
      res.json({ alerts });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get ranking history
  router.get("/:slug/rankings/:keyword", async (req, res) => {
    try {
      const history = await getRankingHistory(req.params.slug, decodeURIComponent(req.params.keyword));
      res.json({ history });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Revenue Attribution (#7)
  // ============================================================

  // Track a new lead
  router.post("/:slug/leads", async (req, res) => {
    try {
      const id = await trackLead({ partnerSlug: req.params.slug, ...req.body });
      res.json({ id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update lead status
  router.patch("/:slug/leads/:leadId", async (req, res) => {
    try {
      await updateLeadStatus(parseInt(req.params.leadId), req.body.status, req.body.jobId, req.body.jobRevenue);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Record monthly spend
  router.post("/:slug/spend", async (req, res) => {
    try {
      const { month, channel, spend } = req.body;
      await recordMonthlySpend(req.params.slug, month, channel, spend);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get attribution report
  router.get("/:slug/attribution", async (req, res) => {
    try {
      const months = parseInt(req.query.months as string) || 1;
      const report = await generateAttributionReport(req.params.slug, months);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Quick summary (for George to text)
  router.get("/:slug/attribution/summary", async (req, res) => {
    try {
      const summary = await getQuickSummary(req.params.slug);
      res.json({ summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Crew Scheduling (#6)
  // ============================================================

  // Add crew member
  router.post("/:slug/crew", async (req, res) => {
    try {
      const id = await addCrewMember({ partnerSlug: req.params.slug, ...req.body });
      res.json({ id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get crew members
  router.get("/:slug/crew", async (req, res) => {
    try {
      const crew = await getCrewMembers(req.params.slug);
      res.json({ crew });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Schedule a job
  router.post("/:slug/schedule", async (req, res) => {
    try {
      const id = await scheduleJob({ partnerSlug: req.params.slug, ...req.body });
      res.json({ id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update job status
  router.patch("/:slug/schedule/:jobId", async (req, res) => {
    try {
      await updateJobStatus(parseInt(req.params.jobId), req.body.status);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get availability for a date
  router.get("/:slug/availability/:date", async (req, res) => {
    try {
      const availability = await getAvailability(req.params.slug, req.params.date);
      res.json({ availability });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Natural language availability summary
  router.get("/:slug/availability/:date/summary", async (req, res) => {
    try {
      const summary = await getAvailabilitySummary(req.params.slug, req.params.date);
      res.json({ summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Weekly utilization
  router.get("/:slug/utilization", async (req, res) => {
    try {
      const report = await getWeeklyUtilization(req.params.slug);
      res.json({ report });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Network Intros (#8)
  // ============================================================

  // Make an introduction
  router.post("/:slug/intro", async (req, res) => {
    try {
      const { customerId, customerName, customerPhone, serviceNeeded, customerCity } = req.body;
      const result = await makeIntroduction(
        req.params.slug, customerId, customerName, customerPhone, serviceNeeded, customerCity
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Accept an intro
  router.post("/intros/:introId/accept", async (req, res) => {
    try {
      await acceptIntro(parseInt(req.params.introId));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Complete an intro (triggers referral bonus)
  router.post("/intros/:introId/complete", async (req, res) => {
    try {
      const { jobId, jobAmount } = req.body;
      await completeIntro(parseInt(req.params.introId), jobId, jobAmount);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get partner's intros
  router.get("/:slug/intros", async (req, res) => {
    try {
      const intros = await getPartnerIntros(req.params.slug);
      res.json(intros);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Intro summary
  router.get("/:slug/intros/summary", async (req, res) => {
    try {
      const summary = await getIntroSummary(req.params.slug);
      res.json({ summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use("/api/partners", router);
}
