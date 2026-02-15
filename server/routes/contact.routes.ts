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

      // Send email notification via Resend/SendGrid
      const { sendEmail } = await import("../services/notifications");
      const adminEmail = process.env.ADMIN_EMAIL || "alan@uptend.app";

      try {
        await sendEmail({
          to: adminEmail,
          subject: `[UpTend Contact] ${submission.subject} — from ${name}`,
          text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${submission.phone}\nSubject: ${submission.subject}\n\nMessage:\n${message}\n\nSubmitted: ${submission.timestamp}`,
          html: `<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ${name}<br/><strong>Email:</strong> ${email}<br/><strong>Phone:</strong> ${submission.phone}<br/><strong>Subject:</strong> ${submission.subject}</p><p><strong>Message:</strong><br/>${message}</p><p style="color:#999;font-size:12px;">Submitted: ${submission.timestamp}</p>`,
        });
      } catch (emailErr) {
        console.log(`[Contact Form] Email send failed: ${emailErr}`);
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
