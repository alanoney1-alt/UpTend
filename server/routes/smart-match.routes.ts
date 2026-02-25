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
        return res.status(404).json({ error: "Match not found or expired" });
      }

      // Find the selected pro (default to top match)
      const selectedPro = proId
        ? stored.matches.find((m) => m.proId === proId)
        : stored.matches[0];

      if (!selectedPro) {
        return res.status(400).json({ error: "Selected pro not found in match results" });
      }

      const fees = calculateFees(selectedPro.price);

      // Create service request
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
          priceEstimate: fees.customerTotal,
          guaranteedCeiling: fees.customerTotal,
          assignedHaulerId: selectedPro.proId !== "default-1" && selectedPro.proId !== "default-2" && selectedPro.proId !== "default-3"
            ? selectedPro.proId
            : null,
          description: description || `Smart Match booking - ${stored.serviceType}`,
          bookingSource: "smart_match",
          createdAt: new Date().toISOString(),
        })
        .returning();

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
        priceProtected: true,
        guaranteedCeiling: fees.customerTotal,
      });
    } catch (error: any) {
      console.error("Smart match booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });
}
