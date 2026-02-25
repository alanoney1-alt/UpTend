/**
 * Emergency SOS Routes — POST /api/emergency/request
 * 
 * Accepts emergency service requests, matches with highest-availability pro,
 * returns estimated response time and emergency pricing.
 */

import type { Express, Request, Response } from "express";

const EMERGENCY_FEE = 25;

const BASE_PRICES: Record<string, number> = {
  burst_pipe: 185,
  ac_failed: 150,
  tree_down: 275,
  electrical_issue: 165,
  roof_leak: 225,
  other: 125,
};

// Simulated pro pool — in production this queries the real pro availability index
const PRO_POOL = [
  { id: 1, name: "Marcus Rivera", companyName: "Rivera Plumbing & Repair", rating: 4.9, completedJobs: 342, phone: "+14073001234", availabilityScore: 95, categories: ["burst_pipe", "roof_leak", "other"] },
  { id: 2, name: "James Chen", companyName: "CoolBreeze HVAC", rating: 4.8, completedJobs: 218, phone: "+14073005678", availabilityScore: 88, categories: ["ac_failed", "other"] },
  { id: 3, name: "Tony Garrett", companyName: "Garrett Tree & Land", rating: 4.7, completedJobs: 156, phone: "+14073009012", availabilityScore: 91, categories: ["tree_down", "other"] },
  { id: 4, name: "Sarah Mitchell", companyName: "Bright Spark Electric", rating: 4.9, completedJobs: 289, phone: "+14073003456", availabilityScore: 93, categories: ["electrical_issue", "other"] },
  { id: 5, name: "David Park", companyName: "Park Home Services", rating: 4.6, completedJobs: 178, phone: "+14073007890", availabilityScore: 85, categories: ["burst_pipe", "roof_leak", "ac_failed", "electrical_issue", "tree_down", "other"] },
];

export function registerEmergencySosRoutes(app: Express) {
  app.post("/api/emergency/request", async (req: Request, res: Response) => {
    try {
      const { serviceCategory, description, address, customerId } = req.body;

      if (!serviceCategory || !address) {
        return res.status(400).json({ error: "serviceCategory and address are required" });
      }

      const basePrice = BASE_PRICES[serviceCategory] ?? BASE_PRICES.other;

      // Find best pro: filter by category, sort by availability score (highest first)
      const eligible = PRO_POOL
        .filter(p => p.categories.includes(serviceCategory))
        .sort((a, b) => b.availabilityScore - a.availabilityScore);

      const matchedPro = eligible[0] ?? PRO_POOL[PRO_POOL.length - 1];

      // Estimate response time based on availability score
      const responseMinutes = Math.max(25, Math.round(120 - matchedPro.availabilityScore));
      const estimatedResponse = responseMinutes <= 60
        ? `~${responseMinutes} minutes`
        : `~${Math.round(responseMinutes / 15) * 15} minutes`;

      console.log(`[EmergencySOS] Request: category=${serviceCategory}, address="${address}", matched=${matchedPro.name} (score=${matchedPro.availabilityScore})`);

      return res.json({
        pro: {
          name: matchedPro.name,
          companyName: matchedPro.companyName,
          rating: matchedPro.rating,
          completedJobs: matchedPro.completedJobs,
          responseTime: estimatedResponse,
          phone: matchedPro.phone,
        },
        basePrice,
        emergencyFee: EMERGENCY_FEE,
        totalPrice: basePrice + EMERGENCY_FEE,
        estimatedResponse,
        guaranteedWithin: "2 hours",
      });
    } catch (error: any) {
      console.error("[EmergencySOS] Error:", error);
      return res.status(500).json({ error: "Failed to process emergency request" });
    }
  });
}
