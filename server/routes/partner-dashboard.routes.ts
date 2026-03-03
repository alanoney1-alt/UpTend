/**
 * Partner Dashboard API Routes
 * 
 * Endpoints:
 * - GET  /api/partners/:slug/stats  — summary numbers
 * - GET  /api/partners/:slug/leads  — recent leads
 * - GET  /api/partners/:slug/jobs   — jobs list
 * - POST /api/partners/tiered-quote — generate Good/Better/Best quote
 * - GET  /api/partners/:slug/maintenance-reminders — upcoming reminders
 * - POST /api/partners/:slug/maintenance-reminders/trigger — manually trigger reminders
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { generateTieredQuote } from "../services/partner-tiered-quoting";
import { getPartnerReminders, processReminders, scheduleMaintenanceReminder } from "../services/partner-maintenance-reminders";
import { queueReviewRequest } from "../services/partner-review-requests";

export function registerPartnerDashboardRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // GET /api/partners/:slug/stats
  // ==========================================
  router.get("/:slug/stats", async (req, res) => {
    const { slug } = req.params;
    
    // Demo data - structured to wire to real DB queries later
    res.json({
      success: true,
      stats: {
        totalLeads: 47,
        activeJobs: 8,
        revenueThisMonth: 12450,
        averageRating: 4.8,
        completedJobsThisMonth: 23,
        reviewRequestsSent: 19,
        reviewsReceived: 12,
        maintenanceRemindersDue: 5,
      },
      period: "current_month",
      partnerSlug: slug,
    });
  });

  // ==========================================
  // GET /api/partners/:slug/leads
  // ==========================================
  router.get("/:slug/leads", async (req, res) => {
    const { slug } = req.params;
    
    // Demo data
    res.json({
      success: true,
      leads: [
        { id: "lead-1", name: "Sarah Johnson", phone: "(407) 555-0101", issue: "AC not cooling", status: "new", date: "2026-03-02T10:30:00Z" },
        { id: "lead-2", name: "Mike Chen", phone: "(407) 555-0102", issue: "Leaking faucet", status: "contacted", date: "2026-03-01T14:15:00Z" },
        { id: "lead-3", name: "Lisa Rodriguez", phone: "(407) 555-0103", issue: "Thermostat replacement", status: "quoted", date: "2026-03-01T09:00:00Z" },
        { id: "lead-4", name: "James Wilson", phone: "(407) 555-0104", issue: "Annual HVAC tune-up", status: "new", date: "2026-02-28T16:45:00Z" },
        { id: "lead-5", name: "Emily Davis", phone: "(407) 555-0105", issue: "Drain clog", status: "booked", date: "2026-02-28T11:20:00Z" },
      ],
      partnerSlug: slug,
    });
  });

  // ==========================================
  // GET /api/partners/:slug/jobs
  // ==========================================
  router.get("/:slug/jobs", async (req, res) => {
    const { slug } = req.params;
    
    // Demo data
    res.json({
      success: true,
      jobs: [
        { id: "job-1", customer: "Sarah Johnson", service: "AC Repair", status: "in_progress", amount: "$285", date: "2026-03-02" },
        { id: "job-2", customer: "Mike Chen", service: "Faucet Repair", status: "completed", amount: "$175", date: "2026-03-01" },
        { id: "job-3", customer: "Tom Baker", service: "HVAC Maintenance", status: "completed", amount: "$149", date: "2026-02-28" },
        { id: "job-4", customer: "Lisa Rodriguez", service: "Thermostat Install", status: "scheduled", amount: "$320", date: "2026-03-03" },
        { id: "job-5", customer: "Emily Davis", service: "Drain Cleaning", status: "completed", amount: "$195", date: "2026-02-27" },
        { id: "job-6", customer: "Robert Kim", service: "Water Heater Repair", status: "completed", amount: "$450", date: "2026-02-26" },
      ],
      partnerSlug: slug,
    });
  });

  // ==========================================
  // POST /api/partners/tiered-quote
  // ==========================================
  const tieredQuoteSchema = z.object({
    serviceType: z.string().min(1),
    conversationContext: z.string().optional(),
    basePrice: z.number().optional(),
    partnerSlug: z.string().min(1),
    customerName: z.string().optional(),
  });

  router.post("/tiered-quote", async (req, res) => {
    try {
      const validated = tieredQuoteSchema.parse(req.body);
      const result = generateTieredQuote(validated);
      res.json({ success: true, ...result });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      res.status(500).json({ error: "Failed to generate quote" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/maintenance-reminders
  // ==========================================
  router.get("/:slug/maintenance-reminders", async (req, res) => {
    try {
      const reminders = await getPartnerReminders(req.params.slug);
      res.json({ success: true, reminders });
    } catch {
      res.json({ success: true, reminders: [] });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/maintenance-reminders/trigger
  // ==========================================
  router.post("/:slug/maintenance-reminders/trigger", async (req, res) => {
    try {
      const result = await processReminders();
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: "Failed to process reminders" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/maintenance-reminders/schedule
  // ==========================================
  const scheduleSchema = z.object({
    customerId: z.string().min(1),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    serviceType: z.string().min(1),
    serviceDate: z.string().optional(),
  });

  router.post("/:slug/maintenance-reminders/schedule", async (req, res) => {
    try {
      const validated = scheduleSchema.parse(req.body);
      const record = await scheduleMaintenanceReminder({
        partnerSlug: req.params.slug,
        ...validated,
      });
      res.json({ success: true, record });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      res.status(500).json({ error: "Failed to schedule reminder" });
    }
  });

  app.use("/api/partners", router);
}
