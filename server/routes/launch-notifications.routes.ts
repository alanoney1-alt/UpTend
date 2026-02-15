import type { Express } from "express";
import { db } from "../db";
import { launchNotifications } from "@shared/schema";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";

export function registerLaunchNotificationRoutes(app: Express) {
  const launchNotifLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  });

  app.post("/api/launch-notifications", launchNotifLimiter, async (req, res) => {
    try {
      const { email, city } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      // Check if already registered
      const [existing] = await db
        .select()
        .from(launchNotifications)
        .where(eq(launchNotifications.email, email));

      if (existing) {
        return res.json({ message: "You're already on the list! We'll notify you when we launch." });
      }

      await db.insert(launchNotifications).values({ email, city: city || null });

      res.json({ message: "We'll notify you when UpTend launches in your area." });
    } catch (error) {
      console.error("Launch notification signup error:", error);
      res.status(500).json({ error: "Failed to register for notifications" });
    }
  });
}
