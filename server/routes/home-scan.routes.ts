/**
 * Self-Serve Home DNA Scan Routes
 *
 * Gamified room-by-room home scanning with GPT-5.2 vision analysis.
 * Customers earn credits for each appliance scanned.
 *
 * Endpoints:
 * - POST /api/home-scan/start           - create scan session
 * - POST /api/home-scan/scan-item       - upload photo → GPT-5.2 vision → award credit
 * - GET  /api/home-scan/progress/:customerId - scan progress, badges, credits
 * - POST /api/home-scan/complete        - finalize scan, award completion bonus
 * - GET  /api/wallet/:customerId        - wallet balance + transaction history
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";
import { analyzeImages } from "../services/ai/openai-vision-client";
import { lookupWarranty } from "../services/warranty-lookup";
import { requireAuth } from "../auth-middleware";

// ─── Constants ───────────────────────────────────────────────────────────────

const CREDIT_PER_ITEM = 1;
const COMPLETION_BONUS = 25;
const STREAK_BONUS = 5;
const STREAK_DAYS_REQUIRED = 3;
const MIN_ITEMS_FOR_COMPLETION = 10;
const ESTIMATED_TOTAL_ITEMS = 20;

const ROOM_BADGES = [
  "Kitchen", "Bathroom", "Bedroom", "Garage", "HVAC", "Laundry", "Living Room", "Outdoor",
];

function getTier(percentage: number): string {
  if (percentage >= 75) return "Smart Home Ready";
  if (percentage >= 50) return "Gold";
  if (percentage >= 25) return "Silver";
  return "Bronze Home";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureWallet(customerId: string) {
  await pool.query(
    `INSERT INTO customer_wallet (customer_id, balance, total_earned, total_spent)
     VALUES ($1, 0, 0, 0)
     ON CONFLICT (customer_id) DO NOTHING`,
    [customerId]
  );
}

async function awardCredit(customerId: string, amount: number, rewardType: string, description: string) {
  await ensureWallet(customerId);
  await pool.query(
    `UPDATE customer_wallet SET balance = balance + $1, total_earned = total_earned + $1, updated_at = now() WHERE customer_id = $2`,
    [amount, customerId]
  );
  await pool.query(
    `INSERT INTO scan_rewards (customer_id, reward_type, amount, description) VALUES ($1, $2, $3, $4)`,
    [customerId, rewardType, amount, description]
  );
}

async function calculateStreakDays(customerId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT DISTINCT DATE(scanned_at) as scan_date FROM scanned_items
     WHERE customer_id = $1 ORDER BY scan_date DESC LIMIT 10`,
    [customerId]
  );
  if (rows.length === 0) return 0;

  let streak = 1;
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].scan_date);
    const curr = new Date(rows[i].scan_date);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export function registerHomeScanRoutes(app: Express) {
  const router = Router();

  // POST /api/home-scan/start - create scan session
  const startSchema = z.object({
    customerId: z.string().min(1),
  });

  router.post("/start", requireAuth, async (req, res) => {
    try {
      const { customerId } = startSchema.parse(req.body);
      await ensureWallet(customerId);

      const { rows } = await pool.query(
        `INSERT INTO home_scan_sessions (customer_id, status) VALUES ($1, 'in_progress') RETURNING *`,
        [customerId]
      );

      res.json({ success: true, session: rows[0] });
    } catch (error: any) {
      console.error("[Home Scan] Start error:", error);
      res.status(error.name === "ZodError" ? 400 : 500).json({ error: error.message || "Failed to start scan session" });
    }
  });

  // POST /api/home-scan/scan-item - upload photo + room → GPT-5.2 vision → store → award credit
  const scanItemSchema = z.object({
    customerId: z.string().min(1),
    scanSessionId: z.string().uuid(),
    roomName: z.string().min(1),
    photoUrl: z.string().url(),
  });

  router.post("/scan-item", async (req, res) => {
    try {
      const { customerId, scanSessionId, roomName, photoUrl } = scanItemSchema.parse(req.body);

      // Verify session exists and belongs to customer
      const { rows: sessions } = await pool.query(
        `SELECT * FROM home_scan_sessions WHERE id = $1 AND customer_id = $2 AND status = 'in_progress'`,
        [scanSessionId, customerId]
      );
      if (sessions.length === 0) {
        return res.status(404).json({ error: "Active scan session not found" });
      }

      // Call GPT-5.2 vision to analyze the photo
      let analysisResult: any;
      try {
        analysisResult = await analyzeImages({
        imageUrls: [photoUrl],
        prompt: `Analyze this home appliance/item photo for a home scan. Identify everything you can, paying special attention to any data plates, rating plates, serial number labels, or manufacturer stickers visible in the image.

Return JSON:
{
  "applianceType": "what this appliance/item is",
  "category": "hvac" | "water_heater" | "appliance" | "roofing" | "plumbing" | "other",
  "brand": "manufacturer" or null,
  "model": "model number" or null,
  "serialNumber": "serial number if visible on label/plate" or null,
  "modelNumber": "full model number if visible" or null,
  "manufacturingDate": "YYYY-MM-DD or YYYY if visible" or null,
  "dataPlateText": "full text from any data/rating plate visible" or null,
  "estimatedAge": "X years" or null,
  "condition": 1-10 (10 = excellent),
  "visibleIssues": ["issue1", ...] or [],
  "maintenanceRecommendations": ["recommendation1", ...],
  "estimatedReplacement": "when replacement may be needed" or null,
  "notes": "any other observations"
}`,
        systemPrompt: "You are an expert home inspector analyzing appliances and home items for a comprehensive home scan. Be accurate and helpful. Look carefully for serial numbers, model numbers, manufacturing dates, and data plate information.",
        jsonMode: true,
      });
      } catch (visionErr: any) {
        // Graceful fallback for 429 rate limit or other OpenAI errors
        console.warn("[Home Scan] Vision API error, using fallback:", visionErr.message);
        analysisResult = {
          applianceType: "Unknown Item (AI unavailable)",
          category: "other",
          brand: null,
          model: null,
          serialNumber: null,
          modelNumber: null,
          manufacturingDate: null,
          dataPlateText: null,
          estimatedAge: null,
          condition: 5,
          visibleIssues: [],
          maintenanceRecommendations: ["Schedule a professional inspection"],
          estimatedReplacement: null,
          notes: "AI vision analysis temporarily unavailable. Please re-scan later for detailed analysis.",
        };
      }

      // Warranty lookup
      let warrantyInfo = null;
      if (analysisResult.brand) {
        warrantyInfo = lookupWarranty(
          analysisResult.brand,
          analysisResult.modelNumber || analysisResult.model || null,
          analysisResult.serialNumber || null,
          analysisResult.category || analysisResult.applianceType || "appliance"
        );
      }

      const mfgDateStr = analysisResult.manufacturingDate
        || (warrantyInfo?.estimatedManufactureDate ? warrantyInfo.estimatedManufactureDate.toISOString().split("T")[0] : null);

      // Store scanned item
      const { rows: items } = await pool.query(
        `INSERT INTO scanned_items (scan_session_id, customer_id, room_name, appliance_name, photo_url, analysis_result, condition, brand, model, estimated_age, credit_awarded, serial_number, model_number, manufacture_date, warranty_status, warranty_expires, warranty_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [
          scanSessionId, customerId, roomName,
          analysisResult.applianceType || "Unknown Item",
          photoUrl,
          JSON.stringify(analysisResult),
          analysisResult.condition || null,
          analysisResult.brand || null,
          analysisResult.model || null,
          analysisResult.estimatedAge || null,
          CREDIT_PER_ITEM,
          analysisResult.serialNumber || null,
          analysisResult.modelNumber || analysisResult.model || null,
          mfgDateStr || null,
          warrantyInfo?.overallStatus || null,
          warrantyInfo?.overallExpires || null,
          warrantyInfo ? JSON.stringify(warrantyInfo) : null,
        ]
      );

      // Award $1 credit
      await awardCredit(customerId, CREDIT_PER_ITEM, "per_item", `Scanned: ${analysisResult.applianceType || "item"} in ${roomName}`);

      // Update session credits
      await pool.query(
        `UPDATE home_scan_sessions SET total_credits_earned = total_credits_earned + $1 WHERE id = $2`,
        [CREDIT_PER_ITEM, scanSessionId]
      );

      // Check streak bonus
      const streakDays = await calculateStreakDays(customerId);
      let streakBonusAwarded = false;
      if (streakDays >= STREAK_DAYS_REQUIRED && streakDays % STREAK_DAYS_REQUIRED === 0) {
        // Check if we already awarded this streak milestone
        const { rows: existingStreak } = await pool.query(
          `SELECT id FROM scan_rewards WHERE customer_id = $1 AND reward_type = 'streak_bonus' AND description LIKE $2`,
          [customerId, `%${streakDays}-day%`]
        );
        if (existingStreak.length === 0) {
          await awardCredit(customerId, STREAK_BONUS, "streak_bonus", `${streakDays}-day scanning streak bonus!`);
          streakBonusAwarded = true;
          await pool.query(
            `UPDATE home_scan_sessions SET streak_days = $1, total_credits_earned = total_credits_earned + $2 WHERE id = $3`,
            [streakDays, STREAK_BONUS, scanSessionId]
          );
        }
      }

      res.json({
        success: true,
        item: items[0],
        analysis: analysisResult,
        warranty: warrantyInfo,
        creditAwarded: CREDIT_PER_ITEM,
        streakDays,
        streakBonusAwarded,
      });
    } catch (error: any) {
      console.error("[Home Scan] Scan item error:", error);
      res.status(error.name === "ZodError" ? 400 : 500).json({ error: error.message || "Failed to scan item" });
    }
  });

  // GET /api/home-scan/progress/:customerId - progress, rooms, credits, badges
  router.get("/progress/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;

      // Get active session
      const { rows: sessions } = await pool.query(
        `SELECT * FROM home_scan_sessions WHERE customer_id = $1 ORDER BY started_at DESC LIMIT 1`,
        [customerId]
      );

      // Get all scanned items for customer
      const { rows: items } = await pool.query(
        `SELECT * FROM scanned_items WHERE customer_id = $1 ORDER BY scanned_at DESC`,
        [customerId]
      );

      // Compute rooms completed
      const roomsScanned = [...new Set(items.map((i) => i.room_name))];
      const earnedBadges = ROOM_BADGES.filter((badge) =>
        roomsScanned.some((room) => room.toLowerCase().includes(badge.toLowerCase()))
      );

      const totalItems = items.length;
      const progressPercentage = Math.min(100, Math.round((totalItems / ESTIMATED_TOTAL_ITEMS) * 100));
      const tier = getTier(progressPercentage);
      const streakDays = await calculateStreakDays(customerId);

      // Get wallet
      await ensureWallet(customerId);
      const { rows: walletRows } = await pool.query(
        `SELECT * FROM customer_wallet WHERE customer_id = $1`,
        [customerId]
      );

      res.json({
        success: true,
        session: sessions[0] || null,
        progress: {
          totalItemsScanned: totalItems,
          estimatedTotal: ESTIMATED_TOTAL_ITEMS,
          progressPercentage,
          tier,
          streakDays,
        },
        rooms: {
          scanned: roomsScanned,
          badges: earnedBadges,
          allBadges: ROOM_BADGES,
        },
        credits: {
          totalEarned: walletRows[0]?.total_earned || 0,
          balance: walletRows[0]?.balance || 0,
        },
        recentItems: items.slice(0, 10),
      });
    } catch (error: any) {
      console.error("[Home Scan] Progress error:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // POST /api/home-scan/complete - finalize scan, award completion bonus
  const completeSchema = z.object({
    customerId: z.string().min(1),
    scanSessionId: z.string().uuid(),
  });

  router.post("/complete", async (req, res) => {
    try {
      const { customerId, scanSessionId } = completeSchema.parse(req.body);

      // Verify session
      const { rows: sessions } = await pool.query(
        `SELECT * FROM home_scan_sessions WHERE id = $1 AND customer_id = $2 AND status = 'in_progress'`,
        [scanSessionId, customerId]
      );
      if (sessions.length === 0) {
        return res.status(404).json({ error: "Active scan session not found" });
      }

      // Count items in session
      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*) as count FROM scanned_items WHERE scan_session_id = $1`,
        [scanSessionId]
      );
      const itemCount = parseInt(countRows[0].count, 10);

      if (itemCount < MIN_ITEMS_FOR_COMPLETION) {
        return res.status(400).json({
          error: `Minimum ${MIN_ITEMS_FOR_COMPLETION} items required for completion bonus. Currently: ${itemCount}`,
        });
      }

      // Award completion bonus
      await awardCredit(customerId, COMPLETION_BONUS, "completion_bonus", `Full home scan completed! ${itemCount} items scanned.`);

      // Mark session complete
      await pool.query(
        `UPDATE home_scan_sessions SET status = 'completed', completed_at = now(), total_credits_earned = total_credits_earned + $1 WHERE id = $2`,
        [COMPLETION_BONUS, scanSessionId]
      );

      // Get updated wallet
      const { rows: walletRows } = await pool.query(
        `SELECT * FROM customer_wallet WHERE customer_id = $1`,
        [customerId]
      );

      res.json({
        success: true,
        completionBonus: COMPLETION_BONUS,
        totalItemsScanned: itemCount,
        wallet: walletRows[0],
        message: `Congratulations! You've completed your home scan with ${itemCount} items and earned a $${COMPLETION_BONUS} bonus!`,
      });
    } catch (error: any) {
      console.error("[Home Scan] Complete error:", error);
      res.status(error.name === "ZodError" ? 400 : 500).json({ error: error.message || "Failed to complete scan" });
    }
  });

  app.use("/api/home-scan", router);

  // ─── Wallet Routes ───────────────────────────────────────────────────────

  const walletRouter = Router();

  // GET /api/wallet/:customerId - balance + transaction history
  walletRouter.get("/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      await ensureWallet(customerId);

      const { rows: walletRows } = await pool.query(
        `SELECT * FROM customer_wallet WHERE customer_id = $1`,
        [customerId]
      );

      const { rows: rewards } = await pool.query(
        `SELECT * FROM scan_rewards WHERE customer_id = $1 ORDER BY awarded_at DESC LIMIT 50`,
        [customerId]
      );

      res.json({
        success: true,
        wallet: walletRows[0],
        transactions: rewards,
      });
    } catch (error: any) {
      console.error("[Wallet] Fetch error:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  app.use("/api/wallet", walletRouter);
}
