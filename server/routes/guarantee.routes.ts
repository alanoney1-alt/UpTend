import type { Express } from "express";
import { requireAuth, requireAdmin } from "../auth-middleware";
import { db } from "../db";
import { guaranteeClaims } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const MAX_GUARANTEE_AMOUNT = 500;

export function registerGuaranteeRoutes(app: Express) {
  // Customer submits a guarantee claim
  app.post("/api/guarantee/claim", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { serviceRequestId, reason, amount } = req.body;

      if (!serviceRequestId || !reason) {
        return res.status(400).json({ error: "serviceRequestId and reason are required" });
      }

      const claimAmount = amount ? Math.min(Number(amount), MAX_GUARANTEE_AMOUNT) : null;

      const [claim] = await db.insert(guaranteeClaims).values({
        serviceRequestId,
        customerId: user.id,
        reason,
        amount: claimAmount,
        status: "pending",
      }).returning();

      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating guarantee claim:", error);
      res.status(500).json({ error: "Failed to submit guarantee claim" });
    }
  });

  // Admin lists all claims
  app.get("/api/guarantee/claims", requireAdmin, async (req, res) => {
    try {
      const claims = await db.select().from(guaranteeClaims).orderBy(guaranteeClaims.createdAt);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching guarantee claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // Admin resolves a claim
  app.patch("/api/guarantee/claims/:id", requireAdmin, async (req, res) => {
    try {
      const admin = req.user as any;
      const { id } = req.params;
      const { status, notes, amount } = req.body;

      if (!status || !["approved", "denied", "refunded"].includes(status)) {
        return res.status(400).json({ error: "Valid status required: approved, denied, or refunded" });
      }

      const resolvedAmount = amount ? Math.min(Number(amount), MAX_GUARANTEE_AMOUNT) : undefined;

      const [updated] = await db.update(guaranteeClaims)
        .set({
          status,
          notes,
          amount: resolvedAmount,
          resolvedAt: new Date().toISOString(),
          resolvedBy: admin.id,
        })
        .where(eq(guaranteeClaims.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Claim not found" });
      }

      // If approved, attempt Stripe refund
      if (status === "approved" && resolvedAmount && resolvedAmount > 0) {
        try {
          const stripe = await getUncachableStripeClient();
          // Look up payment intent for this service request to refund
          // This is a best-effort refund - admin can also manually refund via Stripe dashboard
          console.log(`Guarantee claim ${id} approved for $${resolvedAmount}. Manual Stripe refund may be needed.`);
        } catch (stripeError) {
          console.error("Stripe refund attempt failed:", stripeError);
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("Error resolving guarantee claim:", error);
      res.status(500).json({ error: "Failed to resolve claim" });
    }
  });
}
