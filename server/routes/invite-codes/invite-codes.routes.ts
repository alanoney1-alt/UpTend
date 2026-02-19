/**
 * Invite Code Routes
 *
 * POST /api/invite-codes/validate  — validate without redeeming
 * POST /api/invite-codes/redeem    — redeem for a pro
 * GET  /api/invite-codes/status/:proId — active discount info
 *
 * POST /api/admin/invite-codes     — create a new code  (admin)
 * GET  /api/admin/invite-codes     — list all codes     (admin)
 */

import type { Express, Request, Response } from "express";
import { db } from "../../db.js";
import { proInviteCodes } from "@shared/schema";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import {
  validateInviteCode,
  redeemInviteCode,
  getActiveDiscount,
} from "../../services/invite-code.service.js";

export function registerInviteCodeRoutes(app: Express) {
  // ── POST /api/invite-codes/validate ─────────────────────────────────────────
  app.post("/api/invite-codes/validate", async (req: Request, res: Response) => {
    try {
      const { code } = req.body as { code?: string };
      if (!code) return res.status(400).json({ valid: false, reason: "code is required" });

      const result = await validateInviteCode(code);
      res.json(result);
    } catch (err) {
      console.error("[InviteCode] validate error:", err);
      res.status(500).json({ valid: false, reason: "Server error" });
    }
  });

  // ── POST /api/invite-codes/redeem ────────────────────────────────────────────
  app.post("/api/invite-codes/redeem", requireAuth, async (req: Request, res: Response) => {
    try {
      const { code, proId } = req.body as { code?: string; proId?: string };
      if (!code || !proId) {
        return res.status(400).json({ error: "code and proId are required" });
      }

      const result = await redeemInviteCode(code, proId);
      res.json(result);
    } catch (err: any) {
      console.error("[InviteCode] redeem error:", err);
      res.status(400).json({ error: err.message || "Failed to redeem code" });
    }
  });

  // ── GET /api/invite-codes/status/:proId ─────────────────────────────────────
  app.get("/api/invite-codes/status/:proId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { proId } = req.params;
      const discount = await getActiveDiscount(proId);
      res.json(discount);
    } catch (err) {
      console.error("[InviteCode] status error:", err);
      res.status(500).json({ error: "Failed to get discount status" });
    }
  });

  // ── POST /api/admin/invite-codes ─────────────────────────────────────────────
  app.post("/api/admin/invite-codes", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        code,
        discountPercent = 10,
        durationDays = 30,
        maxUses = null,
        expiresAt = null,
        isActive = true,
      } = req.body as {
        code?: string;
        discountPercent?: number;
        durationDays?: number;
        maxUses?: number | null;
        expiresAt?: string | null;
        isActive?: boolean;
      };

      if (!code) return res.status(400).json({ error: "code is required" });

      const normalizedCode = code.trim().toUpperCase();

      const [created] = await db
        .insert(proInviteCodes)
        .values({
          code: normalizedCode,
          discountPercent,
          durationDays,
          maxUses: maxUses ?? null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive,
        })
        .returning();

      res.status(201).json(created);
    } catch (err: any) {
      console.error("[InviteCode] create error:", err);
      if (err.code === "23505") {
        return res.status(409).json({ error: "A code with that name already exists" });
      }
      res.status(500).json({ error: "Failed to create invite code" });
    }
  });

  // ── GET /api/admin/invite-codes ──────────────────────────────────────────────
  app.get("/api/admin/invite-codes", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const codes = await db.select().from(proInviteCodes).orderBy(proInviteCodes.createdAt);
      res.json(codes);
    } catch (err) {
      console.error("[InviteCode] list error:", err);
      res.status(500).json({ error: "Failed to list invite codes" });
    }
  });
}
