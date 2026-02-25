/**
 * Smart Match / Blind Bidding API
 * 
 * POST /api/smart-match — get best pro match for a job
 * GET /api/smart-match/:matchId/alternatives — see all 3 matches
 * POST /api/smart-match/:matchId/book — book a matched pro
 */

import type { Express, Request, Response } from "express";
import { matchProsForJob, getStoredMatch } from "../services/pro-matching-engine";
import { calculateFees } from "../services/fee-calculator-v2";
import { db } from "../db";
import { serviceRequests } from "../../shared/schema";
import { sql } from "drizzle-orm";

export function registerSmartMatchRoutes(app: Express) {
  // POST /api/smart-match — find best pro match
  app.post("/api/smart-match", async (req: Request, res: Response) => {
    try {
      const { serviceType, address, scope, photos, description } = req.body;

      if (!serviceType || !address) {
        return res.status(400).json({ error: "serviceType and address are required" });
      }

      const result = await matchProsForJob(serviceType, scope || {}, address);

      if (result.matches.length === 0) {
        return res.status(404).json({ error: "No pros available for this service in your area" });
      }

      const topMatch = result.matches[0];
      const fees = calculateFees(topMatch.price);

      res.json({
        recommendedPro: {
          firstName: topMatch.firstName,
          rating: topMatch.rating,
          completedJobs: topMatch.completedJobs,
          verified: topMatch.verified,
          tenureMonths: topMatch.tenureMonths,
        },
        price: fees.proPrice,
        serviceFee: fees.serviceFee,
        totalPrice: fees.customerTotal,
        priceProtected: true,
        matchId: result.matchId,
      });
    } catch (error: any) {
      console.error("Smart match error:", error);
      res.status(500).json({ error: "Failed to find a match" });
    }
  });

  // GET /api/smart-match/:matchId/alternatives — view all matches
  app.get("/api/smart-match/:matchId/alternatives", async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const stored = getStoredMatch(matchId);

      if (!stored) {
        return res.status(404).json({ error: "Match not found or expired" });
      }

      const alternatives = stored.matches.map((match) => {
        const fees = calculateFees(match.price);
        return {
          proId: match.proId,
          firstName: match.firstName,
          rating: match.rating,
          completedJobs: match.completedJobs,
          verified: match.verified,
          tenureMonths: match.tenureMonths,
          price: fees.proPrice,
          serviceFee: fees.serviceFee,
          totalPrice: fees.customerTotal,
          valueScore: match.valueScore,
          priceProtected: true,
        };
      });

      res.json({ alternatives, matchId });
    } catch (error: any) {
      console.error("Alternatives error:", error);
      res.status(500).json({ error: "Failed to fetch alternatives" });
    }
  });

  // POST /api/smart-match/:matchId/book — book a matched pro
  app.post("/api/smart-match/:matchId/book", async (req: Request, res: Response) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { matchId } = req.params;
      const { proId, scheduledFor, address, description } = req.body;
      const userId = (req.user as any).userId || (req.user as any).id;

      const stored = getStoredMatch(matchId);
      if (!stored) {
        return res.status(404).json({ error: "Match not found or expired (30 min TTL)" });
      }

      // Validate TTL: 30 minutes
      const matchAge = Date.now() - new Date(stored.createdAt).getTime();
      if (matchAge > 30 * 60 * 1000) {
        return res.status(410).json({ error: "Match expired. Please search again." });
      }

      // Find the selected pro (default to top match)
      const selectedPro = proId
        ? stored.matches.find((m) => m.proId === proId)
        : stored.matches[0];

      if (!selectedPro) {
        return res.status(400).json({ error: "Selected pro not found in match results" });
      }

      const fees = calculateFees(selectedPro.price);

      // Enforce minimum $50 pro payout
      if (fees.proPayout < 50) {
        return res.status(400).json({ error: "Job does not meet minimum payout threshold" });
      }

      const isRealPro = !["default-1", "default-2", "default-3"].includes(selectedPro.proId);
      const assignedProId = isRealPro ? selectedPro.proId : null;

      // Check if pro has a connected Stripe account for payment splitting
      let connectedAccountId: string | null = null;
      let businessPartnerId: string | null = null;
      let paymentResult: any = null;

      if (isRealPro) {
        const { haulerProfiles: hp } = await import("../../shared/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        const [proProfile] = await db
          .select({
            stripeAccountId: hp.stripeAccountId,
            stripeOnboardingComplete: hp.stripeOnboardingComplete,
            businessPartnerId: hp.businessPartnerId,
          })
          .from(hp)
          .where(eqOp(hp.userId, selectedPro.proId))
          .limit(1);

        if (proProfile?.stripeOnboardingComplete && proProfile.stripeAccountId) {
          connectedAccountId = proProfile.stripeAccountId;
        }
        businessPartnerId = proProfile?.businessPartnerId || null;
      }

      // Create service request with pending_acceptance status
      const [request] = await db
        .insert(serviceRequests)
        .values({
          customerId: userId,
          serviceType: stored.serviceType,
          status: "requested",
          pickupAddress: address || stored.location,
          pickupCity: "Orlando",
          pickupZip: "32832",
          loadEstimate: "smart_match",
          scheduledFor: scheduledFor || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          estimatedPrice: selectedPro.price,
          priceEstimate: fees.customerTotal,
          guaranteedCeiling: fees.customerTotal,
          assignedHaulerId: assignedProId,
          businessPartnerId: businessPartnerId,
          description: description || `Smart Match booking - ${stored.serviceType}`,
          bookingSource: "smart_match",
          createdAt: new Date().toISOString(),
        })
        .returning();

      // Send notification to pro
      if (assignedProId) {
        const { nanoid } = await import("nanoid");
        const { pool: dbPool } = await import("../db");
        try {
          await dbPool.query(
            `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
             VALUES ($1, $2, 'smart_match_job', $3, $4, $5, NOW()) ON CONFLICT DO NOTHING`,
            [
              nanoid(12),
              assignedProId,
              `New ${stored.serviceType.replace(/_/g, " ")} Job`,
              `New job available. You will earn $${fees.proPayout.toFixed(2)}. Accept or decline.`,
              JSON.stringify({
                jobId: request.id,
                serviceType: stored.serviceType,
                scheduledFor: request.scheduledFor,
                proPayout: fees.proPayout,
                matchId,
              }),
            ]
          );
        } catch (err) {
          console.error("Notification error:", err);
        }
      }

      res.json({
        bookingId: request.id,
        status: "requested",
        pro: {
          firstName: selectedPro.firstName,
          rating: selectedPro.rating,
          verified: selectedPro.verified,
        },
        totalPrice: fees.customerTotal,
        serviceFee: fees.serviceFee,
        proPayout: fees.proPayout,
        priceProtected: true,
        guaranteedCeiling: fees.customerTotal,
        hasConnectedAccount: !!connectedAccountId,
      });
    } catch (error: any) {
      console.error("Smart match booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });
}
