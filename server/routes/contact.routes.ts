import type { Express } from "express";

/**
 * Contact Form Routes
 * Handles contact form submissions from /contact page
 */
export function registerContactRoutes(app: Express) {
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const submission = {
        name,
        email,
        phone: phone || "not provided",
        subject: subject || "General Inquiry",
        message,
        timestamp: new Date().toISOString(),
      };

      console.log("[Contact Form] New submission from " + email);

      // Send email notification via SendGrid if configured
      const sendgridKey = process.env.SENDGRID_API_KEY;
      const adminEmail = process.env.ADMIN_EMAIL || "alan@uptend.app";
      const fromEmail = process.env.FROM_EMAIL || "noreply@uptend.app";

      if (sendgridKey) {
        try {
          const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${sendgridKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: adminEmail }] }],
              from: { email: fromEmail, name: "UpTend Contact Form" },
              reply_to: { email, name },
              subject: `[UpTend Contact] ${submission.subject} — from ${name}`,
              content: [
                {
                  type: "text/plain",
                  value: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${submission.phone}\nSubject: ${submission.subject}\n\nMessage:\n${message}\n\nSubmitted: ${submission.timestamp}`,
                },
              ],
            }),
          });

          if (!sgResponse.ok) {
            console.log(`[Contact Form] SendGrid error: ${sgResponse.status}`);
          }
        } catch (emailErr) {
          console.log(`[Contact Form] Email send failed: ${emailErr}`);
          // Don't fail the request — the submission is still logged
        }
      } else {
        console.log("[Contact Form] SENDGRID_API_KEY not set — email not sent. Submission logged only.");
      }

      res.json({
        success: true,
        message: "Thank you for reaching out! We'll get back to you within 24 hours.",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to submit contact form. Please try again." });
    }
  });
}
