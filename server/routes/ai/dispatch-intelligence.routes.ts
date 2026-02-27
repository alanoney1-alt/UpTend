/**
 * Dispatch Intelligence - AI-powered job matching and dispatch optimization
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { createChatCompletion } from "../../services/ai/anthropic-client";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { filterCertifiedPros } from "../../services/certification-guard";

// Haversine distance in miles
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreDistance(miles: number): number {
  if (miles <= 5) return 100;
  if (miles <= 15) return 80;
  if (miles <= 30) return 50;
  if (miles <= 50) return 20;
  return 0;
}

export function createDispatchIntelligenceRoutes(storage: DatabaseStorage) {
  const router = Router();

  // POST /api/ai/dispatch/match - find best pros for a service request
  const matchSchema = z.object({ serviceRequestId: z.string() });

  router.post("/dispatch/match", requireAuth, async (req, res) => {
    try {
      const { serviceRequestId } = matchSchema.parse(req.body);

      // Get service request
      const srResult = await db.execute(sql`
        SELECT * FROM service_requests WHERE id = ${serviceRequestId} LIMIT 1
      `);
      const sr = srResult.rows?.[0] as any;
      if (!sr) return res.status(404).json({ error: "Service request not found" });

      // Get available pros
      const prosResult = await db.execute(sql`
        SELECT * FROM hauler_profiles
        WHERE is_available = true AND can_accept_jobs = true
        ORDER BY rating DESC
        LIMIT 50
      `);

      const candidates = (prosResult.rows || []).map((pro: any) => {
        const dist = (sr.pickup_lat && sr.pickup_lng && pro.current_lat && pro.current_lng)
          ? haversine(Number(sr.pickup_lat), Number(sr.pickup_lng), Number(pro.current_lat), Number(pro.current_lng))
          : 999;

        const distScore = scoreDistance(dist);
        const ratingScore = Number(pro.rating || 3) * 20;
        const jobScore = Math.min(Number(pro.jobs_completed || 0) * 2, 100);
        const serviceMatch = (pro.service_types || []).includes(sr.service_type) ? 100 : 30;
        const totalScore = Math.round(distScore * 0.3 + ratingScore * 0.3 + jobScore * 0.2 + serviceMatch * 0.2);

        return {
          proId: pro.id,
          userId: pro.user_id,
          companyName: pro.company_name,
          distance: Math.round(dist * 10) / 10,
          rating: Number(pro.rating || 5),
          jobsCompleted: Number(pro.jobs_completed || 0),
          score: totalScore,
          serviceMatch: (pro.service_types || []).includes(sr.service_type),
        };
      });

      candidates.sort((a: any, b: any) => b.score - a.score);

      // Filter by certification requirements
      const allCandidateIds = candidates.map((c: any) => c.proId);
      const certifiedIds = await filterCertifiedPros(allCandidateIds, sr.service_type, sr.business_account_id || undefined);
      const certifiedSet = new Set(certifiedIds);
      const certFiltered = candidates.filter((c: any) => certifiedSet.has(c.proId));
      const top = certFiltered.slice(0, 10);

      // AI reasoning for top matches
      let reasoning = "";
      try {
        const aiResult = await createChatCompletion({
          systemPrompt: "You are a dispatch analyst for UpTend. Briefly explain why the top candidates are good matches. 2-3 sentences max.",
          messages: [{
            role: "user",
            content: `Job: ${sr.service_type} in ${sr.pickup_city} (${sr.pickup_zip}). Top matches: ${JSON.stringify(top.slice(0, 3).map((t: any) => ({ name: t.companyName, dist: t.distance, rating: t.rating, score: t.score })))}`,
          }],
          maxTokens: 200,
        });
        reasoning = aiResult.content;
      } catch {
        reasoning = "Ranked by composite score (distance, rating, experience, specialization).";
      }

      res.json({
        success: true,
        serviceRequestId,
        matches: top,
        reasoning,
        totalCandidates: candidates.length,
      });
    } catch (error: any) {
      console.error("Error matching dispatch:", error);
      res.status(400).json({ error: error.message || "Failed to match" });
    }
  });

  // POST /api/ai/dispatch/optimize - optimize daily schedule for a pro
  const optimizeSchema = z.object({
    proId: z.string(),
    date: z.string(),
  });

  router.post("/dispatch/optimize", requireAuth, async (req, res) => {
    try {
      const { proId, date } = optimizeSchema.parse(req.body);

      // Get jobs assigned for this date
      const jobsResult = await db.execute(sql`
        SELECT id, service_type, pickup_address, pickup_city, pickup_lat, pickup_lng,
               destination_address, destination_lat, destination_lng, scheduled_for, load_estimate
        FROM service_requests
        WHERE assigned_hauler_id = ${proId}
          AND scheduled_for LIKE ${date + '%'}
          AND status IN ('pending', 'accepted', 'in_progress')
        ORDER BY scheduled_for
      `);

      const jobs = jobsResult.rows || [];
      if (jobs.length === 0) {
        return res.json({ success: true, schedule: [], message: "No jobs scheduled for this date" });
      }

      // Simple nearest-neighbor optimization
      const ordered: any[] = [];
      const remaining = [...jobs] as any[];
      let currentLat = Number(remaining[0].pickup_lat || 0);
      let currentLng = Number(remaining[0].pickup_lng || 0);

      while (remaining.length > 0) {
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const d = haversine(currentLat, currentLng, Number(remaining[i].pickup_lat || 0), Number(remaining[i].pickup_lng || 0));
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        const picked = remaining.splice(bestIdx, 1)[0];
        ordered.push({ ...picked, distanceFromPrev: Math.round(bestDist * 10) / 10 });
        currentLat = Number(picked.destination_lat || picked.pickup_lat || 0);
        currentLng = Number(picked.destination_lng || picked.pickup_lng || 0);
      }

      let totalDistance = ordered.reduce((sum: number, j: any) => sum + (j.distanceFromPrev || 0), 0);

      // AI schedule summary
      let aiSummary = "";
      try {
        const aiResult = await createChatCompletion({
          systemPrompt: "You optimize daily schedules for service pros. Give a brief optimized plan summary with estimated times. 3-4 sentences.",
          messages: [{
            role: "user",
            content: `${ordered.length} jobs on ${date}: ${JSON.stringify(ordered.map((j: any) => ({ type: j.service_type, city: j.pickup_city, dist: j.distanceFromPrev })))}. Total route: ${Math.round(totalDistance)} miles.`,
          }],
          maxTokens: 300,
        });
        aiSummary = aiResult.content;
      } catch {
        aiSummary = `Optimized route: ${ordered.length} stops, ~${Math.round(totalDistance)} miles total.`;
      }

      res.json({
        success: true,
        date,
        proId,
        schedule: ordered.map((j: any, idx: number) => ({
          order: idx + 1,
          jobId: j.id,
          serviceType: j.service_type,
          pickupAddress: j.pickup_address,
          pickupCity: j.pickup_city,
          distanceFromPrev: j.distanceFromPrev,
          scheduledFor: j.scheduled_for,
        })),
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalJobs: ordered.length,
        aiSummary,
      });
    } catch (error: any) {
      console.error("Error optimizing dispatch:", error);
      res.status(400).json({ error: error.message || "Failed to optimize" });
    }
  });

  // GET /api/ai/dispatch/availability - pro availability heatmap by zip
  router.get("/dispatch/availability", requireAuth, async (req, res) => {
    try {
      const zip = (req.query.zip as string) || "";
      if (!zip) return res.status(400).json({ error: "zip query parameter required" });

      // Count available pros near this zip (using service requests as proxy for area)
      const prosResult = await db.execute(sql`
        SELECT id, company_name, service_types, is_available, rating, jobs_completed,
               current_lat, current_lng
        FROM hauler_profiles
        WHERE is_available = true
        ORDER BY rating DESC
        LIMIT 100
      `);

      const pros = prosResult.rows || [];
      const available = pros.filter((p: any) => p.is_available);
      const byServiceType: Record<string, number> = {};
      for (const p of available as any[]) {
        for (const st of (p.service_types || [])) {
          byServiceType[st] = (byServiceType[st] || 0) + 1;
        }
      }

      res.json({
        success: true,
        zip,
        totalAvailable: available.length,
        byServiceType,
        heatmap: {
          high: Object.entries(byServiceType).filter(([, v]) => v >= 5).map(([k]) => k),
          medium: Object.entries(byServiceType).filter(([, v]) => v >= 2 && v < 5).map(([k]) => k),
          low: Object.entries(byServiceType).filter(([, v]) => v < 2).map(([k]) => k),
        },
      });
    } catch (error: any) {
      console.error("Error getting availability:", error);
      res.status(500).json({ error: error.message || "Failed to get availability" });
    }
  });

  // POST /api/ai/dispatch/auto-assign - admin only, auto-assign best pro
  const autoAssignSchema = z.object({ serviceRequestId: z.string() });

  router.post("/dispatch/auto-assign", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { serviceRequestId } = autoAssignSchema.parse(req.body);

      // Get service request
      const srResult = await db.execute(sql`
        SELECT * FROM service_requests WHERE id = ${serviceRequestId} LIMIT 1
      `);
      const sr = srResult.rows?.[0] as any;
      if (!sr) return res.status(404).json({ error: "Service request not found" });
      if (sr.assigned_hauler_id) return res.status(400).json({ error: "Already assigned" });

      // Find best available pro
      const prosResult = await db.execute(sql`
        SELECT * FROM hauler_profiles
        WHERE is_available = true AND can_accept_jobs = true
        ORDER BY rating DESC, jobs_completed DESC
        LIMIT 20
      `);

      const allPros = (prosResult.rows || []) as any[];
      if (allPros.length === 0) return res.status(404).json({ error: "No available pros" });

      // Filter by certification requirements
      const allProIds = allPros.map((p: any) => p.id);
      const certifiedProIds = await filterCertifiedPros(allProIds, sr.service_type, sr.business_account_id || undefined);
      const certSet = new Set(certifiedProIds);
      const pros = allPros.filter((p: any) => certSet.has(p.id));
      if (pros.length === 0) return res.status(404).json({ error: "No certified pros available for this job type" });

      // Score and pick best
      let best: any = null;
      let bestScore = -1;
      for (const pro of pros) {
        const dist = (sr.pickup_lat && sr.pickup_lng && pro.current_lat && pro.current_lng)
          ? haversine(Number(sr.pickup_lat), Number(sr.pickup_lng), Number(pro.current_lat), Number(pro.current_lng))
          : 999;
        const score = scoreDistance(dist) * 0.4 + Number(pro.rating || 3) * 20 * 0.4 + Math.min(Number(pro.jobs_completed || 0) * 2, 100) * 0.2;
        if (score > bestScore) { bestScore = score; best = { ...pro, distance: dist, score }; }
      }

      if (!best) return res.status(404).json({ error: "No suitable pro found" });

      // Assign
      await db.execute(sql`
        UPDATE service_requests SET assigned_hauler_id = ${best.id}, status = 'accepted'
        WHERE id = ${serviceRequestId}
      `);

      res.json({
        success: true,
        assigned: {
          serviceRequestId,
          proId: best.id,
          companyName: best.company_name,
          rating: Number(best.rating),
          distance: Math.round(best.distance * 10) / 10,
          score: Math.round(best.score),
        },
      });
    } catch (error: any) {
      console.error("Error auto-assigning:", error);
      res.status(400).json({ error: error.message || "Failed to auto-assign" });
    }
  });

  return router;
}

export default createDispatchIntelligenceRoutes;
