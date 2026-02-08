/**
 * Recurring Subscriptions API Routes
 *
 * Handles FreshSpace recurring booking subscriptions
 */

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { stripeService } from "../stripeService";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  customerId: z.string(),
  serviceType: z.enum(["home_cleaning"]),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  homeDetails: z.object({
    bedrooms: z.string(),
    bathrooms: z.string(),
    cleanType: z.enum(["standard", "deep", "moveInOut"]),
    addOns: z.array(z.string()),
    specialInstructions: z.string().optional(),
    bringsSupplies: z.boolean(),
  }),
  preferredDay: z.string().optional(),
  preferredTimeWindow: z.enum(["morning", "afternoon", "evening"]).optional(),
  assignedProId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  preferredDay: z.string().optional(),
  preferredTimeWindow: z.enum(["morning", "afternoon", "evening"]).optional(),
  homeDetails: z.any().optional(),
  cancellationReason: z.string().optional(),
});

/**
 * Calculate subscription price based on home details and frequency
 * Matches pricing from server/jobs/subscription-auto-booking.ts
 */
function calculateSubscriptionPrice(
  homeDetails: any,
  frequency: "weekly" | "biweekly" | "monthly"
): number {
  // Base prices by home size
  const basePrices: Record<string, number> = {
    "1-2 bed / 1 bath": 99,
    "3 bed / 2 bath": 149,
    "4 bed / 2-3 bath": 199,
    "5+ bed / 3+ bath": 249,
  };

  const sizeKey = `${homeDetails.bedrooms} / ${homeDetails.bathrooms}`;
  let basePrice = basePrices[sizeKey] || 149;

  // Apply clean type multiplier
  const multipliers: Record<string, number> = {
    standard: 1,
    deep: 1.5,
    moveInOut: 2,
  };
  basePrice *= multipliers[homeDetails.cleanType] || 1;

  // Add-ons pricing
  const addonPrices: Record<string, number> = {
    oven_cleaning: 35,
    fridge_cleaning: 25,
    interior_windows: 45,
    laundry_wash_fold: 40,
    inside_closets: 30,
    pet_hair_removal: 20,
  };

  let addOnsTotal = 0;
  if (homeDetails.addOns && Array.isArray(homeDetails.addOns)) {
    addOnsTotal = homeDetails.addOns.reduce((sum: number, addonId: string) => {
      return sum + (addonPrices[addonId] || 0);
    }, 0);
  }

  let total = basePrice + addOnsTotal;

  // Apply recurring discount
  const discounts: Record<string, number> = {
    weekly: 0.15,
    biweekly: 0.10,
    monthly: 0.05,
  };
  total *= (1 - (discounts[frequency] || 0));

  return Math.round(total);
}

export function registerSubscriptionRoutes(app: Express) {
  /**
   * Create new recurring subscription
   * POST /api/subscriptions
   */
  app.post("/api/subscriptions", async (req: Request, res: Response) => {
    try {
      const data = createSubscriptionSchema.parse(req.body);

      // Calculate subscription price based on home details and frequency
      const price = calculateSubscriptionPrice(data.homeDetails, data.frequency);

      // Get customer Stripe ID
      const customer = await storage.getCustomer(data.customerId);
      if (!customer || !customer.stripeCustomerId) {
        return res.status(400).json({ error: "Customer must have a Stripe account" });
      }

      // Determine Stripe interval
      let interval: 'week' | 'month' = 'week';
      let intervalCount = 1;
      if (data.frequency === 'weekly') {
        interval = 'week';
        intervalCount = 1;
      } else if (data.frequency === 'biweekly') {
        interval = 'week';
        intervalCount = 2;
      } else if (data.frequency === 'monthly') {
        interval = 'month';
        intervalCount = 1;
      }

      // Create Stripe price and subscription
      const productName = `FreshSpace ${data.homeDetails.cleanType} clean - ${data.homeDetails.bedrooms}/${data.homeDetails.bathrooms}`;
      const stripePrice = await stripeService.createPrice(
        price,
        interval,
        intervalCount,
        productName,
        {
          serviceType: data.serviceType,
          cleanType: data.homeDetails.cleanType,
          bedrooms: data.homeDetails.bedrooms,
          bathrooms: data.homeDetails.bathrooms,
        }
      );

      const stripeSubscription = await stripeService.createSubscription(
        customer.stripeCustomerId,
        stripePrice.id,
        {
          customerId: data.customerId,
          serviceType: data.serviceType,
          frequency: data.frequency,
        }
      );

      // Calculate next booking date based on frequency
      const nextBookingDate = new Date();
      nextBookingDate.setDate(nextBookingDate.getDate() + (data.frequency === "weekly" ? 7 : data.frequency === "biweekly" ? 14 : 30));

      // Create subscription in database
      const subscription = await storage.createRecurringSubscription({
        ...data,
        stripeSubscriptionId: stripeSubscription.id,
        nextBookingDate: nextBookingDate.toISOString(),
        status: "active",
        bookingsCompleted: 0,
        minimumBookingsCommitment: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.json({
        subscription,
        stripeSubscriptionId: stripeSubscription.id,
        clientSecret: (stripeSubscription as any).latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid subscription data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create subscription" });
      }
    }
  });

  /**
   * Get subscription by ID
   * GET /api/subscriptions/:id
   */
  app.get("/api/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getRecurringSubscription(id);

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  /**
   * Get all subscriptions for a customer
   * GET /api/subscriptions/customer/:customerId
   */
  app.get("/api/subscriptions/customer/:customerId", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const subscriptions = await storage.getCustomerSubscriptions(customerId);

      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching customer subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  /**
   * Update subscription
   * PUT /api/subscriptions/:id
   */
  app.put("/api/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateSubscriptionSchema.parse(req.body);

      const updates: any = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      if (data.status === "cancelled") {
        updates.cancelledAt = new Date().toISOString();
      }

      const subscription = await storage.updateRecurringSubscription(id, updates);

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid update data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update subscription" });
      }
    }
  });

  /**
   * Pause subscription
   * PUT /api/subscriptions/:id/pause
   */
  app.put("/api/subscriptions/:id/pause", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get existing subscription
      const existing = await storage.getRecurringSubscription(id);
      if (!existing) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Pause Stripe subscription if exists
      if (existing.stripeSubscriptionId) {
        try {
          await stripeService.updateSubscription(existing.stripeSubscriptionId, {
            pauseCollection: { behavior: 'void' },
          });
        } catch (stripeError) {
          console.error("Error pausing Stripe subscription:", stripeError);
          // Continue even if Stripe fails - we'll still pause locally
        }
      }

      // Update database
      const subscription = await storage.updateRecurringSubscription(id, {
        status: "paused",
        updatedAt: new Date().toISOString(),
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error pausing subscription:", error);
      res.status(500).json({ error: "Failed to pause subscription" });
    }
  });

  /**
   * Resume subscription
   * PUT /api/subscriptions/:id/resume
   */
  app.put("/api/subscriptions/:id/resume", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get existing subscription
      const existing = await storage.getRecurringSubscription(id);
      if (!existing) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Resume Stripe subscription if exists
      if (existing.stripeSubscriptionId) {
        try {
          await stripeService.resumeSubscription(existing.stripeSubscriptionId);
        } catch (stripeError) {
          console.error("Error resuming Stripe subscription:", stripeError);
          // Continue even if Stripe fails
        }
      }

      // Update database
      const subscription = await storage.updateRecurringSubscription(id, {
        status: "active",
        updatedAt: new Date().toISOString(),
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error resuming subscription:", error);
      res.status(500).json({ error: "Failed to resume subscription" });
    }
  });

  /**
   * Cancel subscription
   * PUT /api/subscriptions/:id/cancel
   */
  app.put("/api/subscriptions/:id/cancel", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { cancellationReason, immediately } = req.body;

      // Get existing subscription
      const existing = await storage.getRecurringSubscription(id);
      if (!existing) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Cancel Stripe subscription if exists
      if (existing.stripeSubscriptionId) {
        try {
          await stripeService.cancelSubscription(
            existing.stripeSubscriptionId,
            immediately || false
          );
        } catch (stripeError) {
          console.error("Error cancelling Stripe subscription:", stripeError);
          // Continue even if Stripe fails
        }
      }

      // Update database
      const subscription = await storage.updateRecurringSubscription(id, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancellationReason || null,
        updatedAt: new Date().toISOString(),
      });

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  /**
   * Skip next booking
   * POST /api/subscriptions/:id/skip-booking
   */
  app.post("/api/subscriptions/:id/skip-booking", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const subscription = await storage.getRecurringSubscription(id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Skip the next billing cycle in Stripe if subscription exists
      if (subscription.stripeSubscriptionId) {
        try {
          await stripeService.skipNextCycle(subscription.stripeSubscriptionId);
        } catch (stripeError) {
          console.error("Error skipping Stripe billing cycle:", stripeError);
          // Continue even if Stripe fails - we'll still update locally
        }
      }

      // Calculate next booking date after the skip
      const currentNextDate = new Date(subscription.nextBookingDate!);
      const daysToAdd = subscription.frequency === "weekly" ? 7 : subscription.frequency === "biweekly" ? 14 : 30;
      currentNextDate.setDate(currentNextDate.getDate() + daysToAdd);

      const updated = await storage.updateRecurringSubscription(id, {
        nextBookingDate: currentNextDate.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error skipping booking:", error);
      res.status(500).json({ error: "Failed to skip booking" });
    }
  });

  /**
   * Reschedule subscription (change day/time)
   * PUT /api/subscriptions/:id/reschedule
   */
  app.put("/api/subscriptions/:id/reschedule", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { preferredDay, preferredTimeWindow } = req.body;

      if (!preferredDay || !preferredTimeWindow) {
        return res.status(400).json({ error: "preferredDay and preferredTimeWindow are required" });
      }

      const subscription = await storage.updateRecurringSubscription(id, {
        preferredDay,
        preferredTimeWindow,
        updatedAt: new Date().toISOString(),
      });

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Error rescheduling subscription:", error);
      res.status(500).json({ error: "Failed to reschedule subscription" });
    }
  });
}
