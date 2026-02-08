/**
 * Recurring Subscriptions API Routes
 *
 * Handles FreshSpace recurring booking subscriptions
 */

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
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

export function registerSubscriptionRoutes(app: Express) {
  /**
   * Create new recurring subscription
   * POST /api/subscriptions
   */
  app.post("/api/subscriptions", async (req: Request, res: Response) => {
    try {
      const data = createSubscriptionSchema.parse(req.body);

      // Calculate next booking date based on frequency
      const nextBookingDate = new Date();
      nextBookingDate.setDate(nextBookingDate.getDate() + (data.frequency === "weekly" ? 7 : data.frequency === "biweekly" ? 14 : 30));

      const subscription = await storage.createRecurringSubscription({
        ...data,
        nextBookingDate: nextBookingDate.toISOString(),
        status: "active",
        bookingsCompleted: 0,
        minimumBookingsCommitment: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.json(subscription);
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

      const subscription = await storage.updateRecurringSubscription(id, {
        status: "paused",
        updatedAt: new Date().toISOString(),
      });

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

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

      const subscription = await storage.updateRecurringSubscription(id, {
        status: "active",
        updatedAt: new Date().toISOString(),
      });

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

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
      const { cancellationReason } = req.body;

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
