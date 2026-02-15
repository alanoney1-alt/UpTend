import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { b2bSubscriptionPlans, b2bSubscriptions } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";

export function registerB2bPricingRoutes(app: Express) {
  // GET /api/b2b-pricing/plans - list all plans, filterable by segment
  app.get("/api/b2b-pricing/plans", async (req: Request, res: Response) => {
    try {
      const { segment } = req.query;
      let plans;
      if (segment && typeof segment === "string") {
        plans = await db.select().from(b2bSubscriptionPlans).where(
          and(eq(b2bSubscriptionPlans.segment, segment), eq(b2bSubscriptionPlans.isActive, true))
        );
      } else {
        plans = await db.select().from(b2bSubscriptionPlans).where(eq(b2bSubscriptionPlans.isActive, true));
      }
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/b2b-pricing/plans/:id - single plan details
  app.get("/api/b2b-pricing/plans/:id", async (req: Request, res: Response) => {
    try {
      const [plan] = await db.select().from(b2bSubscriptionPlans).where(eq(b2bSubscriptionPlans.id, req.params.id));
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/b2b-pricing/subscribe - create subscription
  app.post("/api/b2b-pricing/subscribe", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { planId, unitsCount, billingCycle } = req.body;
      if (!planId) return res.status(400).json({ error: "planId is required" });

      const [plan] = await db.select().from(b2bSubscriptionPlans).where(eq(b2bSubscriptionPlans.id, planId));
      if (!plan) return res.status(404).json({ error: "Plan not found" });

      // Calculate monthly price
      let monthlyPrice = 0;
      const units = unitsCount || 1;
      if (plan.unitType === "unit" || plan.unitType === "door") {
        if (plan.maxUnits && units > plan.maxUnits) {
          return res.status(400).json({ error: `Max ${plan.maxUnits} ${plan.unitType}s for this plan` });
        }
        monthlyPrice = plan.pricePerUnit * units;
      } else if (plan.unitType === "flat_monthly") {
        monthlyPrice = plan.pricePerUnit;
      } else if (plan.unitType === "flat_yearly") {
        monthlyPrice = plan.pricePerUnit / 12;
      }

      const now = new Date().toISOString();
      const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const [subscription] = await db.insert(b2bSubscriptions).values({
        clientId: (req.user as any).id,
        planId,
        unitsCount: units,
        monthlyPrice,
        status: "trial",
        billingCycle: billingCycle || "monthly",
        startedAt: now,
        nextBillingAt: nextBilling,
      }).returning();

      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/b2b-pricing/subscription - get current subscription
  app.get("/api/b2b-pricing/subscription", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const [sub] = await db.select().from(b2bSubscriptions).where(
        eq(b2bSubscriptions.clientId, (req.user as any).id)
      );
      if (!sub) return res.status(404).json({ error: "No subscription found" });
      res.json(sub);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/b2b-pricing/subscription - update subscription
  app.put("/api/b2b-pricing/subscription", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { unitsCount, planId } = req.body;
      const userId = (req.user as any).id;

      const [existing] = await db.select().from(b2bSubscriptions).where(eq(b2bSubscriptions.clientId, userId));
      if (!existing) return res.status(404).json({ error: "No subscription found" });

      const targetPlanId = planId || existing.planId;
      const [plan] = await db.select().from(b2bSubscriptionPlans).where(eq(b2bSubscriptionPlans.id, targetPlanId));
      if (!plan) return res.status(404).json({ error: "Plan not found" });

      const units = unitsCount || existing.unitsCount;
      if (plan.maxUnits && units > plan.maxUnits) {
        return res.status(400).json({ error: `Max ${plan.maxUnits} ${plan.unitType}s for this plan` });
      }

      let monthlyPrice = 0;
      if (plan.unitType === "unit" || plan.unitType === "door") {
        monthlyPrice = plan.pricePerUnit * units;
      } else if (plan.unitType === "flat_monthly") {
        monthlyPrice = plan.pricePerUnit;
      } else if (plan.unitType === "flat_yearly") {
        monthlyPrice = plan.pricePerUnit / 12;
      }

      const [updated] = await db.update(b2bSubscriptions)
        .set({ planId: targetPlanId, unitsCount: units, monthlyPrice, updatedAt: new Date().toISOString() })
        .where(eq(b2bSubscriptions.id, existing.id))
        .returning();

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
