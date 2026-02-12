/**
 * AI Business & Admin Features API Routes
 * Portfolio Dashboard, Marketing Content, Move-In Wizard, Document Scanner, Neighborhood Intelligence
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { createChatCompletion, generateContent, extractTextFromDocument } from "../../services/ai/anthropic-client";
import { db } from "../../db";
import { sql } from "drizzle-orm";

export function createBusinessFeaturesRoutes(storage: DatabaseStorage) {
  const router = Router();

  // ==========================================
  // PORTFOLIO DASHBOARD (Property Managers)
  // ==========================================

  router.get("/business/portfolio/health", requireAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.query;
      if (!businessAccountId) {
        return res.status(400).json({ error: "businessAccountId required" });
      }

      const report = await storage.getLatestPortfolioHealthReport(businessAccountId as string);
      if (!report) {
        return res.json({ success: true, report: null, message: "No health report available yet" });
      }

      res.json({ success: true, report });
    } catch (error: any) {
      console.error("Error fetching portfolio health:", error);
      res.status(500).json({ error: error.message || "Failed to fetch portfolio health" });
    }
  });

  router.get("/business/portfolio/history", requireAuth, async (req, res) => {
    try {
      const { businessAccountId, limit } = req.query;
      if (!businessAccountId) {
        return res.status(400).json({ error: "businessAccountId required" });
      }

      const history = await storage.getPortfolioHealthReportHistory(
        businessAccountId as string,
        parseInt((limit as string) || "12")
      );

      res.json({ success: true, history });
    } catch (error: any) {
      console.error("Error fetching portfolio history:", error);
      res.status(500).json({ error: error.message || "Failed to fetch portfolio history" });
    }
  });

  // ==========================================
  // MARKETING CONTENT GENERATOR
  // ==========================================

  const generateContentSchema = z.object({
    contentType: z.enum(["email", "social", "blog", "ad", "sms"]),
    targetAudience: z.string().optional(),
    serviceType: z.string().optional(),
    season: z.string().optional(),
    tone: z.enum(["professional", "friendly", "urgent", "informative"]).default("professional"),
    keywords: z.array(z.string()).optional(),
    platform: z.string().optional(),
  });

  router.post("/marketing/generate", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validated = generateContentSchema.parse(req.body);

      const aiResult = await generateContent({
        contentType: validated.contentType,
        targetAudience: validated.targetAudience,
        keywords: validated.keywords,
        tone: validated.tone,
        context: { serviceType: validated.serviceType, season: validated.season },
      });

      // Extract headline and CTA
      const metaResponse = await createChatCompletion({
        systemPrompt: "Extract a headline (max 10 words) and call-to-action (max 8 words) from the content. Return ONLY JSON: {headline: string, cta: string}",
        messages: [{ role: "user", content: aiResult.generatedContent }],
        maxTokens: 100,
      });

      let headline = "UpTend Home Services", cta = "Book Now!";
      try {
        const meta = JSON.parse(metaResponse.content);
        headline = meta.headline || headline;
        cta = meta.cta || cta;
      } catch {}

      const id = nanoid();
      const now = new Date().toISOString();
      await db.execute(sql`INSERT INTO ai_marketing_content 
        (id, content_type, target_audience, tone, key_points, generated_content, seo_keywords, character_count, platform, status, headline, call_to_action, created_at)
        VALUES (${id}, ${validated.contentType}, ${validated.targetAudience || null}, ${validated.tone}, ${validated.keywords ? `{${validated.keywords.join(",")}}` : null}, ${aiResult.generatedContent}, ${validated.keywords ? `{${validated.keywords.join(",")}}` : null}, ${aiResult.generatedContent.length}, ${validated.platform || validated.contentType}, 'draft', ${headline}, ${cta}, ${now})`);

      res.json({
        success: true,
        content: {
          id,
          contentType: validated.contentType,
          generatedContent: aiResult.generatedContent,
          headline,
          callToAction: cta,
          tone: validated.tone,
          status: "draft",
        },
      });
    } catch (error: any) {
      console.error("Error generating marketing content:", error);
      res.status(400).json({ error: error.message || "Failed to generate marketing content" });
    }
  });

  router.get("/marketing/content", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { contentType, status } = req.query;
      const result = await db.execute(sql`
        SELECT * FROM ai_marketing_content 
        WHERE (${contentType || null} IS NULL OR content_type = ${contentType || ""})
          AND (${status || null} IS NULL OR status = ${status || ""})
        ORDER BY created_at DESC LIMIT 50
      `);

      res.json({ success: true, content: result.rows });
    } catch (error: any) {
      console.error("Error fetching marketing content:", error);
      res.status(500).json({ error: error.message || "Failed to fetch marketing content" });
    }
  });

  // ==========================================
  // MOVE-IN WIZARD
  // ==========================================

  const moveInPlanSchema = z.object({
    propertyAddress: z.string(),
    moveInDate: z.string(),
    propertyType: z.string().optional(),
    bedrooms: z.number().optional(),
    squareFootage: z.number().optional(),
    hasAppliances: z.boolean().default(false),
    hasYard: z.boolean().default(false),
    hasPool: z.boolean().default(false),
    budgetRange: z.string().optional(),
    timelineUrgency: z.enum(["relaxed", "normal", "urgent"]).default("normal"),
  });

  router.post("/move-in/plan", requireAuth, async (req, res) => {
    try {
      const validated = moveInPlanSchema.parse(req.body);
      const userId = ((req.user as any).userId || (req.user as any).id);

      const aiResponse = await createChatCompletion({
        systemPrompt: `You are a move-in planning expert for UpTend. Generate a plan. Return ONLY valid JSON: {recommendedServices: [{service: string, reason: string, estimatedCost: number, priority: 1-3}], serviceTimeline: {beforeMoveIn: [services], firstWeek: [services], firstMonth: [services]}, checklist: {beforeMoveIn: [tasks], moveInDay: [tasks], firstWeek: [tasks], firstMonth: [tasks]}, estimatedTotalCost: number, priorityOrder: [service names in order]}. Available services: junk_removal, deep_cleaning, pressure_washing, gutter_cleaning, lawn_care, pool_cleaning, hvac_inspection, pest_control, landscaping, appliance_removal, carpet_cleaning.`,
        messages: [{
          role: "user",
          content: `Move-in plan for: address="${validated.propertyAddress}", date=${validated.moveInDate}, type=${validated.propertyType || "house"}, bedrooms=${validated.bedrooms || "unknown"}, sqft=${validated.squareFootage || "unknown"}, appliances=${validated.hasAppliances}, yard=${validated.hasYard}, pool=${validated.hasPool}, budget=${validated.budgetRange || "moderate"}, urgency=${validated.timelineUrgency}.`,
        }],
        maxTokens: 1024,
        temperature: 0.7,
      });

      let plan: any;
      try {
        plan = JSON.parse(aiResponse.content);
      } catch {
        plan = {
          recommendedServices: [{ service: "deep_cleaning", reason: "Essential for new home", estimatedCost: 150, priority: 1 }],
          serviceTimeline: { beforeMoveIn: ["deep_cleaning"], firstWeek: ["junk_removal"], firstMonth: ["lawn_care"] },
          checklist: { beforeMoveIn: ["Book cleaning"], moveInDay: ["Final walkthrough"], firstWeek: ["Unpack"], firstMonth: ["Set up maintenance"] },
          estimatedTotalCost: 350,
          priorityOrder: ["deep_cleaning", "junk_removal"],
        };
      }

      const id = nanoid();
      const now = new Date().toISOString();
      await db.execute(sql`INSERT INTO move_in_plans 
        (id, user_id, property_address, move_in_date, property_type, bedrooms, square_footage, has_appliances, has_yard, has_pool, budget_range, timeline_urgency, recommended_services, service_timeline, estimated_total_cost, priority_order, checklist, completed_services, status, created_at, updated_at)
        VALUES (${id}, ${userId}, ${validated.propertyAddress}, ${validated.moveInDate}, ${validated.propertyType || null}, ${validated.bedrooms || null}, ${validated.squareFootage || null}, ${validated.hasAppliances}, ${validated.hasYard}, ${validated.hasPool}, ${validated.budgetRange || null}, ${validated.timelineUrgency}, ${JSON.stringify(plan.recommendedServices || [])}, ${JSON.stringify(plan.serviceTimeline || {})}, ${plan.estimatedTotalCost || 0}, ${plan.priorityOrder ? `{${plan.priorityOrder.join(",")}}` : "{}"}, ${JSON.stringify(plan.checklist || {})}, '{}', 'planning', ${now}, ${now})`);

      res.json({
        success: true,
        plan: {
          id,
          propertyAddress: validated.propertyAddress,
          moveInDate: validated.moveInDate,
          recommendedServices: plan.recommendedServices,
          serviceTimeline: plan.serviceTimeline,
          checklist: plan.checklist,
          estimatedTotalCost: plan.estimatedTotalCost,
          priorityOrder: plan.priorityOrder,
          status: "planning",
        },
      });
    } catch (error: any) {
      console.error("Error creating move-in plan:", error);
      res.status(400).json({ error: error.message || "Failed to create move-in plan" });
    }
  });

  router.get("/move-in/plans", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const result = await db.execute(sql`SELECT * FROM move_in_plans WHERE user_id = ${userId} ORDER BY created_at DESC`);
      res.json({ success: true, plans: result.rows });
    } catch (error: any) {
      console.error("Error fetching move-in plans:", error);
      res.status(500).json({ error: error.message || "Failed to fetch move-in plans" });
    }
  });

  // ==========================================
  // DOCUMENT SCANNER
  // ==========================================

  const scanDocumentSchema = z.object({
    documentType: z.enum(["receipt", "invoice", "contract", "permit", "warranty", "other"]),
    imageUrl: z.string().url(),
    linkedServiceRequestId: z.string().optional(),
  });

  router.post("/documents/scan", requireAuth, async (req, res) => {
    try {
      const validated = scanDocumentSchema.parse(req.body);
      const userId = ((req.user as any).userId || (req.user as any).id);

      const startTime = Date.now();
      let extractedData: any;
      try {
        extractedData = await extractTextFromDocument({
          imageUrl: validated.imageUrl,
          documentType: validated.documentType,
        });
      } catch (e) {
        console.warn("OCR failed, using fallback", e);
        extractedData = { vendorName: "Unknown", totalAmount: 0, serviceDate: null, lineItems: [], confidence: 0.5 };
      }
      const processingTime = Date.now() - startTime;

      const id = nanoid();
      const now = new Date().toISOString();
      await db.execute(sql`INSERT INTO document_scans 
        (id, user_id, document_type, image_url, extracted_text, structured_data, confidence_score, ocr_provider, linked_service_request_id, created_at, processed_at, ai_model_used, processing_time_ms)
        VALUES (${id}, ${userId}, ${validated.documentType}, ${validated.imageUrl}, ${extractedData.analysis || JSON.stringify(extractedData)}, ${JSON.stringify(extractedData)}, ${extractedData.confidence || 0.8}, 'anthropic_claude', ${validated.linkedServiceRequestId || null}, ${now}, ${now}, 'claude-sonnet-4-20250514', ${processingTime})`);

      res.json({
        success: true,
        scan: { id, documentType: validated.documentType, structuredData: extractedData, confidenceScore: extractedData.confidence || 0.8, processingTimeMs: processingTime },
      });
    } catch (error: any) {
      console.error("Error scanning document:", error);
      res.status(400).json({ error: error.message || "Failed to scan document" });
    }
  });

  router.get("/documents/scans", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const result = await db.execute(sql`SELECT * FROM document_scans WHERE user_id = ${userId} ORDER BY created_at DESC`);
      res.json({ success: true, scans: result.rows });
    } catch (error: any) {
      console.error("Error fetching document scans:", error);
      res.status(500).json({ error: error.message || "Failed to fetch document scans" });
    }
  });

  // ==========================================
  // NEIGHBORHOOD INTELLIGENCE (in-memory, no DB table)
  // ==========================================

  router.get("/neighborhood/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code format" });
      }

      const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
      const aiResponse = await createChatCompletion({
        systemPrompt: `You are a market analyst for UpTend home services. Return ONLY valid JSON: {totalJobs: number, avgJobValue: number, popularServices: [strings], seasonalTrends: {spring: [], summer: [], fall: [], winter: []}, competitorPricing: {serviceName: {low: num, avg: num, high: num}}, marketSaturationScore: 0-100, growthOpportunityScore: 0-100, recommendations: [3-5 actionable strings]}.`,
        messages: [{
          role: "user",
          content: `Neighborhood intelligence for zip ${zipCode}. Month: ${currentMonth}. Analyze home services market.`,
        }],
        maxTokens: 1024,
        temperature: 0.7,
      });

      let report: any;
      try {
        report = JSON.parse(aiResponse.content);
      } catch {
        report = {
          totalJobs: 100, avgJobValue: 225,
          popularServices: ["junk_removal", "pressure_washing", "gutter_cleaning"],
          seasonalTrends: { spring: ["landscaping"], summer: ["pressure_washing"], fall: ["gutter_cleaning"], winter: ["snow_removal"] },
          competitorPricing: { junk_removal: { low: 150, avg: 225, high: 350 } },
          marketSaturationScore: 60, growthOpportunityScore: 75,
          recommendations: ["Expand service offerings", "Focus on seasonal demand"],
        };
      }

      res.json({ success: true, report: { zipCode, reportDate: new Date().toISOString().split('T')[0], ...report } });
    } catch (error: any) {
      console.error("Error fetching neighborhood intelligence:", error);
      res.status(500).json({ error: error.message || "Failed to fetch neighborhood intelligence" });
    }
  });

  router.get("/neighborhood/:zipCode/history", async (req, res) => {
    try {
      const { zipCode } = req.params;
      if (!/^\d{5}$/.test(zipCode)) {
        return res.status(400).json({ error: "Invalid zip code format" });
      }
      // No DB table, return empty
      res.json({ success: true, history: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch neighborhood history" });
    }
  });

  return router;
}

export default createBusinessFeaturesRoutes;
