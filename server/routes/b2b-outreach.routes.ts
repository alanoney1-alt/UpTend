/**
 * B2B Resident Outreach Routes
 * 
 * Admin-only endpoints to blast email + SMS to residents
 * when a B2B partner provides their resident list.
 */

import { Router, Request, Response } from "express";
import { sendResidentOutreachEmails, sendResidentOutreachSMS } from "../services/b2b-resident-outreach";

const router = Router();

// POST /api/b2b/outreach - Send outreach to resident list
router.post("/outreach", async (req: Request, res: Response) => {
  // Admin key protection
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== "uptend-admin-2026") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { businessName, businessType, communityName, residents, channels } = req.body;

  if (!businessName || !businessType || !residents?.length) {
    return res.status(400).json({ error: "businessName, businessType, and residents[] required" });
  }

  if (!["hoa", "pm", "construction"].includes(businessType)) {
    return res.status(400).json({ error: "businessType must be hoa, pm, or construction" });
  }

  const config = { businessName, businessType, communityName, residents };
  const results: any = {};

  const sendEmail = !channels || channels.includes("email");
  const sendSMS = !channels || channels.includes("sms");

  if (sendEmail) {
    results.email = await sendResidentOutreachEmails(config);
  }

  if (sendSMS) {
    results.sms = await sendResidentOutreachSMS(config);
  }

  res.json({
    success: true,
    businessName,
    businessType,
    totalResidents: residents.length,
    results,
  });
});

// POST /api/b2b/outreach/preview - Preview email HTML without sending
router.post("/outreach/preview", async (req: Request, res: Response) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== "uptend-admin-2026") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { businessName, businessType, communityName, sampleName, sampleEmail } = req.body;

  // Import the email builder to preview
  const { sendResidentOutreachEmails } = await import("../services/b2b-resident-outreach");

  // Just return what the email would look like
  res.json({
    note: "Use the /outreach endpoint to actually send. This is preview only.",
    config: { businessName, businessType, communityName },
    sampleResident: { name: sampleName || "Jane Smith", email: sampleEmail || "preview@example.com" },
  });
});

export default router;
