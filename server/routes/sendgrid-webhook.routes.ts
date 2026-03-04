import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { emailEvents } from "@shared/schema";

const router = Router();

/**
 * SendGrid Event Webhook
 * Receives delivery events: delivered, bounce, spamreport (complained), dropped
 * Configure in SendGrid dashboard → Settings → Mail Settings → Event Webhook
 * URL: https://yourdomain.com/api/webhooks/sendgrid
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "Expected array of events" });
    }

    const trackedTypes = new Set(["delivered", "bounce", "spamreport", "dropped"]);

    const toInsert = events
      .filter((evt: any) => evt.email && trackedTypes.has(evt.event))
      .map((evt: any) => ({
        email: evt.email,
        eventType: evt.event === "spamreport" ? "complained" : evt.event === "bounce" ? "bounced" : evt.event,
        metadata: {
          sg_message_id: evt.sg_message_id,
          timestamp: evt.timestamp,
          reason: evt.reason,
          status: evt.status,
          type: evt.type,
          category: evt.category,
        },
      }));

    if (toInsert.length > 0) {
      await db.insert(emailEvents).values(toInsert);
      console.log(`[SendGrid Webhook] Processed ${toInsert.length} events`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[SendGrid Webhook] Error:", error.message);
    return res.status(200).json({ received: true }); // Always return 200 to prevent retries
  }
});

export default router;
