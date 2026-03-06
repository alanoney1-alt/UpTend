/**
 * Public lead capture routes — NO AUTH REQUIRED
 * 
 * These endpoints let anyone submit a service request from the website
 * without logging in or talking to George. Form → DB → email notification.
 */

import { Router } from "express";
import type { Express } from "express";
import { pool } from "../db";
import { notifyNewServiceRequest, notifyLeadNurture } from "../services/n8n-notify";

const router = Router();

/**
 * POST /api/leads/service-request
 * 
 * Public form submission for service requests (HVAC page, etc.)
 * Saves to partner_leads and sends email notification.
 */
router.post("/service-request", async (req, res) => {
  try {
    const { name, phone, email, address, service, issue, partner_slug } = req.body;

    if (!name || !phone || !issue) {
      return res.status(400).json({ error: "Name, phone, and issue description are required." });
    }

    // Use explicit partner_slug if provided, otherwise route by service type
    const partnerSlug = partner_slug || (service === "hvac" ? "comfort-solutions-tech" : "uptend-main");

    // Save lead
    const result = await pool.query(
      `INSERT INTO partner_leads (partner_slug, customer_name, customer_phone, customer_email, service_type, notes, source, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'website_form', 'new', NOW())
       RETURNING id`,
      [
        partnerSlug,
        name.trim(),
        phone.trim(),
        email?.trim() || null,
        service || "hvac",
        [issue, address ? `Address: ${address}` : null].filter(Boolean).join(". "),
      ]
    );

    const leadId = result.rows[0]?.id;
    console.log(`[Public Lead] Saved lead #${leadId} for ${partnerSlug}: ${name} / ${phone} / ${service}`);

    // Send email notification
    try {
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = (await import("@sendgrid/mail")).default;
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({
          to: "alan@uptendapp.com",
          from: "alan@uptendapp.com",
          subject: `🔥 New HVAC Lead: ${name} — Website Form`,
          html: `<h2>New Service Request</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
${address ? `<p><strong>Address:</strong> ${address}</p>` : ""}
<p><strong>Issue:</strong> ${issue}</p>
<p><strong>Source:</strong> Website form (HVAC page)</p>
<hr>
<p><a href="https://uptendapp.com/partners/${partnerSlug}/leads">View all leads →</a></p>`,
        });
        console.log(`[Public Lead] Email notification sent for lead #${leadId}`);
      }
    } catch (emailErr: any) {
      console.error("[Public Lead] Email failed:", emailErr.message);
    }

    // Fire n8n webhooks (non-blocking)
    if (email?.trim()) {
      notifyLeadNurture({
        customerName: name.trim(),
        customerEmail: email.trim(),
        serviceType: service || 'hvac',
        area: address?.trim() || 'Orlando area',
      });
    }
    notifyNewServiceRequest({
      partnerSlug: partnerSlug,
      partnerEmail: 'alan@uptendapp.com',
      customerName: name.trim(),
      serviceType: service || 'hvac',
      area: address?.trim() || 'Orlando area',
      notes: issue,
      source: 'website_form',
    });

    res.json({ success: true, leadId });
  } catch (err: any) {
    console.error("[Public Lead] Error:", err);
    res.status(500).json({ error: "Failed to submit request. Please call (855) 901-2072." });
  }
});

export function registerPublicLeadRoutes(app: Express) {
  app.use("/api/leads", router);
}
