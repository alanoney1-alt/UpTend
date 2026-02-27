/**
 * Pro Tier Engine - AI-powered gamification system
 * Bronze → Silver → Gold → Platinum → Diamond
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { createChatCompletion } from "../../services/ai/anthropic-client";
import { db } from "../../db";
import { sql } from "drizzle-orm";

const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"] as const;
const TIER_THRESHOLDS: Record<string, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Platinum: 3500,
  Diamond: 7500,
};

function tierFromPoints(points: number): string {
  if (points >= 7500) return "Diamond";
  if (points >= 3500) return "Platinum";
  if (points >= 1500) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
}

function nextTier(current: string): string | null {
  const idx = TIERS.indexOf(current as any);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

interface ProStats {
  jobsCompleted: number;
  avgRating: number;
  onTimePercent: number;
  reviewCount: number;
}

async function getProStats(proId: string): Promise<ProStats> {
  const profile = await db.execute(sql`
    SELECT jobs_completed, rating, review_count FROM hauler_profiles WHERE user_id = ${proId} LIMIT 1
  `);
  const row = profile.rows?.[0] as any;
  if (!row) return { jobsCompleted: 0, avgRating: 5.0, onTimePercent: 85, reviewCount: 0 };

  // on-time % from completed service requests
  const completed = await db.execute(sql`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as done
    FROM service_requests WHERE assigned_hauler_id = ${proId} AND status = 'completed'
  `);
  const cRow = completed.rows?.[0] as any;
  const total = Number(cRow?.total || 0);
  const onTime = total > 0 ? Math.round((Number(cRow?.done || 0) / total) * 100) : 85;

  return {
    jobsCompleted: Number(row.jobs_completed || 0),
    avgRating: Number(row.rating || 5.0),
    onTimePercent: onTime,
    reviewCount: Number(row.review_count || 0),
  };
}

function calculatePoints(stats: ProStats): number {
  return Math.round(
    stats.jobsCompleted * 10 +
    stats.avgRating * 50 +
    stats.onTimePercent * 2 +
    stats.reviewCount * 5
  );
}

function checkAchievements(stats: ProStats, points: number): string[] {
  const achievements: string[] = [];
  if (stats.jobsCompleted >= 1) achievements.push("First Haul 🚛");
  if (stats.jobsCompleted >= 10) achievements.push("Ten-Timer 🔟");
  if (stats.jobsCompleted >= 50) achievements.push("Half Century 🏅");
  if (stats.jobsCompleted >= 100) achievements.push("Century Club 💯");
  if (stats.avgRating >= 4.9) achievements.push("Five Star Legend ⭐");
  if (stats.avgRating >= 4.5) achievements.push("Top Rated 🌟");
  if (stats.onTimePercent >= 95) achievements.push("Punctuality Pro ⏰");
  if (stats.reviewCount >= 25) achievements.push("Review Magnet 📝");
  if (points >= 7500) achievements.push("Diamond Elite 💎");
  return achievements;
}

export function createProTierEngineRoutes(storage: DatabaseStorage) {
  const router = Router();

  // GET /api/ai/pro/tier - current tier status
  router.get("/pro/tier", requireAuth, async (req, res) => {
    try {
      if ((req.user as any).role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }
      const proId = (req.user as any).userId || (req.user as any).id;
      const stats = await getProStats(proId);
      const points = calculatePoints(stats);
      const currentTier = tierFromPoints(points);
      const next = nextTier(currentTier);

      res.json({
        success: true,
        tier: {
          currentTier,
          points,
          nextTier: next,
          pointsNeeded: next ? TIER_THRESHOLDS[next] - points : 0,
          stats,
          achievements: checkAchievements(stats, points),
        },
      });
    } catch (error: any) {
      console.error("Error getting pro tier:", error);
      res.status(500).json({ error: error.message || "Failed to get tier status" });
    }
  });

  // POST /api/ai/pro/tier/evaluate - AI evaluates performance
  router.post("/pro/tier/evaluate", requireAuth, async (req, res) => {
    try {
      if ((req.user as any).role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }
      const proId = (req.user as any).userId || (req.user as any).id;
      const stats = await getProStats(proId);
      const points = calculatePoints(stats);
      const currentTier = tierFromPoints(points);
      const next = nextTier(currentTier);
      const achievements = checkAchievements(stats, points);

      let recommendations: string[] = [];
      try {
        const aiResult = await createChatCompletion({
          systemPrompt: "You are a performance coach for UpTend service pros. Be encouraging, specific, and actionable. Return a JSON array of 3-5 recommendation strings.",
          messages: [{
            role: "user",
            content: `Pro stats: ${JSON.stringify(stats)}. Current tier: ${currentTier} (${points} pts). Next tier: ${next || "MAX"} (needs ${next ? TIER_THRESHOLDS[next] - points : 0} more pts). Achievements: ${achievements.join(", ")}. Give personalized recommendations to advance.`,
          }],
          maxTokens: 500,
        });
        try {
          const cleaned = aiResult.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleaned);
          recommendations = Array.isArray(parsed) ? parsed : [aiResult.content];
        } catch {
          recommendations = [aiResult.content];
        }
      } catch {
        recommendations = [
          "Complete more jobs to earn tier points",
          "Maintain your rating above 4.5 for bonus points",
          "Respond quickly to new job requests",
        ];
      }

      res.json({
        success: true,
        evaluation: {
          currentTier,
          points,
          nextTier: next,
          pointsNeeded: next ? TIER_THRESHOLDS[next] - points : 0,
          stats,
          achievements,
          recommendations,
        },
      });
    } catch (error: any) {
      console.error("Error evaluating tier:", error);
      res.status(500).json({ error: error.message || "Failed to evaluate tier" });
    }
  });

  // GET /api/ai/pro/tier/leaderboard - top pros (anonymized)
  router.get("/pro/tier/leaderboard", requireAuth, async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT id, company_name, jobs_completed, rating, review_count
        FROM hauler_profiles
        WHERE jobs_completed > 0
        ORDER BY jobs_completed DESC, rating DESC
        LIMIT 20
      `);

      const leaderboard = (result.rows || []).map((row: any, idx: number) => {
        const stats: ProStats = {
          jobsCompleted: Number(row.jobs_completed || 0),
          avgRating: Number(row.rating || 5.0),
          onTimePercent: 90,
          reviewCount: Number(row.review_count || 0),
        };
        const points = calculatePoints(stats);
        return {
          rank: idx + 1,
          displayName: `Pro #${(idx + 1).toString().padStart(3, "0")}`,
          tier: tierFromPoints(points),
          points,
          jobsCompleted: stats.jobsCompleted,
          rating: stats.avgRating,
        };
      });

      res.json({ success: true, leaderboard });
    } catch (error: any) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ error: error.message || "Failed to get leaderboard" });
    }
  });

  // POST /api/ai/pro/tier/achievements - check & award new achievements
  router.post("/pro/tier/achievements", requireAuth, async (req, res) => {
    try {
      if ((req.user as any).role !== "hauler") {
        return res.status(403).json({ error: "Pro access required" });
      }
      const proId = (req.user as any).userId || (req.user as any).id;
      const stats = await getProStats(proId);
      const points = calculatePoints(stats);
      const achievements = checkAchievements(stats, points);

      let descriptions: Record<string, string> = {};
      try {
        const aiResult = await createChatCompletion({
          systemPrompt: "Generate short fun descriptions (1 sentence each) for achievement badges. Return JSON object { achievementName: description }.",
          messages: [{
            role: "user",
            content: `Achievements earned: ${JSON.stringify(achievements)}. Pro has ${stats.jobsCompleted} jobs, ${stats.avgRating} rating.`,
          }],
          maxTokens: 400,
        });
        try {
          descriptions = JSON.parse(aiResult.content);
        } catch {
          // fallback - no descriptions
        }
      } catch {
        // AI unavailable - just return badges
      }

      res.json({
        success: true,
        achievements: achievements.map((a) => ({
          name: a,
          description: descriptions[a] || "",
          earned: true,
        })),
        totalPoints: points,
        tier: tierFromPoints(points),
      });
    } catch (error: any) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ error: error.message || "Failed to check achievements" });
    }
  });

  return router;
}

export default createProTierEngineRoutes;
