import type { Express } from "express";
import { db } from "../db";
import { insurancePartners, customerInsurance } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireCustomer } from "../auth-middleware";
import { z } from "zod";

const linkInsuranceSchema = z.object({
  insurancePartnerId: z.string().min(1),
  policyNumber: z.string().min(1),
  coverageType: z.string().min(1),
  expiresAt: z.string().optional(),
});

// Service types covered by common insurance/warranty plans
const COVERAGE_MAP: Record<string, string[]> = {
  home_insurance: [
    "water_damage", "fire_damage", "storm_damage", "electrical_emergency",
    "junk_removal", "light_demolition",
  ],
  home_warranty: [
    "hvac", "broken_pipe", "electrical_emergency", "gas_leak",
    "home_cleaning", "gutter_cleaning", "pressure_washing",
  ],
};

export function registerInsuranceRoutes(app: Express) {
  // GET /api/insurance/partners — list available insurance partners
  app.get("/api/insurance/partners", async (_req, res) => {
    try {
      const partners = await db.select({
        id: insurancePartners.id,
        name: insurancePartners.carrierName,
        partnershipTier: insurancePartners.partnershipTier,
        maintenanceDiscountPct: insurancePartners.maintenanceDiscountPct,
        status: insurancePartners.status,
      }).from(insurancePartners)
        .where(eq(insurancePartners.status, "active"));

      res.json(partners);
    } catch (error) {
      console.error("Error fetching insurance partners:", error);
      res.status(500).json({ error: "Failed to fetch insurance partners" });
    }
  });

  // POST /api/insurance/link — customer links insurance
  app.post("/api/insurance/link", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const parsed = linkInsuranceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      // Verify partner exists
      const [partner] = await db.select().from(insurancePartners)
        .where(eq(insurancePartners.id, parsed.data.insurancePartnerId));
      if (!partner) return res.status(404).json({ error: "Insurance partner not found" });

      // Check if already linked
      const [existing] = await db.select().from(customerInsurance)
        .where(and(
          eq(customerInsurance.customerId, userId),
          eq(customerInsurance.insurancePartnerId, parsed.data.insurancePartnerId),
        ));
      if (existing) {
        return res.status(409).json({ error: "Insurance already linked" });
      }

      const [linked] = await db.insert(customerInsurance).values({
        customerId: userId,
        insurancePartnerId: parsed.data.insurancePartnerId,
        policyNumber: parsed.data.policyNumber,
        coverageType: parsed.data.coverageType,
        expiresAt: parsed.data.expiresAt || null,
      }).returning();

      res.status(201).json(linked);
    } catch (error) {
      console.error("Error linking insurance:", error);
      res.status(500).json({ error: "Failed to link insurance" });
    }
  });

  // GET /api/insurance/check-coverage?serviceType=X
  app.get("/api/insurance/check-coverage", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const { serviceType } = req.query;
      if (!serviceType) return res.status(400).json({ error: "serviceType query param required" });

      // Get all customer insurance links
      const customerPolicies = await db.select().from(customerInsurance)
        .where(eq(customerInsurance.customerId, userId));

      if (customerPolicies.length === 0) {
        return res.json({ covered: false, policies: [] });
      }

      // Get partner details for each policy
      const coverageResults = [];
      for (const policy of customerPolicies) {
        const [partner] = await db.select().from(insurancePartners)
          .where(eq(insurancePartners.id, policy.insurancePartnerId));

        if (!partner) continue;

        // Check if expired
        if (policy.expiresAt && new Date(policy.expiresAt) < new Date()) continue;

        // Check coverage map
        const coveredServices = COVERAGE_MAP[partner.partnershipTier || "standard"] || [];
        const isCovered = coveredServices.includes(serviceType as string);

        if (isCovered) {
          coverageResults.push({
            partnerName: partner.carrierName,
            partnerType: partner.partnershipTier || "standard",
            policyNumber: policy.policyNumber,
            coverageType: policy.coverageType,
            discountPercent: partner.maintenanceDiscountPct || 0,
          });
        }
      }

      res.json({
        covered: coverageResults.length > 0,
        serviceType,
        policies: coverageResults,
        bestDiscount: coverageResults.length > 0
          ? Math.max(...coverageResults.map(c => c.discountPercent))
          : 0,
      });
    } catch (error) {
      console.error("Error checking coverage:", error);
      res.status(500).json({ error: "Failed to check coverage" });
    }
  });

  // GET /api/insurance/my-policies — list customer's linked insurance
  app.get("/api/insurance/my-policies", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const policies = await db.select().from(customerInsurance)
        .where(eq(customerInsurance.customerId, userId));

      // Enrich with partner info
      const enriched = [];
      for (const policy of policies) {
        const [partner] = await db.select().from(insurancePartners)
          .where(eq(insurancePartners.id, policy.insurancePartnerId));
        enriched.push({
          ...policy,
          partnerName: partner?.carrierName || "Unknown",
          partnerType: partner?.partnershipTier || "unknown",
          discountPercent: partner?.maintenanceDiscountPct || 0,
          isExpired: policy.expiresAt ? new Date(policy.expiresAt) < new Date() : false,
        });
      }

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ error: "Failed to fetch policies" });
    }
  });

  // DELETE /api/insurance/:id — unlink insurance
  app.delete("/api/insurance/:id", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      const [deleted] = await db.delete(customerInsurance)
        .where(and(
          eq(customerInsurance.id, req.params.id),
          eq(customerInsurance.customerId, userId),
        ))
        .returning();

      if (!deleted) return res.status(404).json({ error: "Policy not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error unlinking insurance:", error);
      res.status(500).json({ error: "Failed to unlink insurance" });
    }
  });
}
