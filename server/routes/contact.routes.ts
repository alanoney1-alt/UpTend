import type { Express } from "express";
import rateLimit from "express-rate-limit";

// Sanitize user input for safe HTML embedding (prevent XSS in admin emails)
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Contact Form Routes
 * Handles contact form submissions from /contact page
 */
export function registerContactRoutes(app: Express) {
  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 submissions per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many submissions. Please try again later." },
  });

  app.post("/api/contact", contactLimiter, async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      if (!name || typeof name !== "string" || !email || typeof email !== "string" || !message || typeof message !== "string") {
        return res.status(400).json({ error: "Name, email, and message are required" });
      }

      // Length limits
      if (name.length > 200 || email.length > 320 || message.length > 5000) {
        return res.status(400).json({ error: "Input too long" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safePhone = escapeHtml(typeof phone === "string" ? phone : "not provided");
      const safeSubject = escapeHtml(typeof subject === "string" ? subject : "General Inquiry");
      const safeMessage = escapeHtml(message);

      const submission = {
        name: safeName,
        email: safeEmail,
        phone: safePhone || "not provided",
        subject: safeSubject || "General Inquiry",
        message: safeMessage,
        timestamp: new Date().toISOString(),
      };

      console.log("[Contact Form] New submission from " + safeEmail);

      // Send email notification via Resend/SendGrid
      const { sendEmail } = await import("../services/notifications");
      const adminEmail = process.env.ADMIN_EMAIL || "alan@uptend.app";

      try {
        await sendEmail({
          to: adminEmail,
          subject: `[UpTend Contact] ${submission.subject} - from ${submission.name}`,
          text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${submission.phone}\nSubject: ${submission.subject}\n\nMessage:\n${message}\n\nSubmitted: ${submission.timestamp}`,
          html: `<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ${submission.name}<br/><strong>Email:</strong> ${submission.email}<br/><strong>Phone:</strong> ${submission.phone}<br/><strong>Subject:</strong> ${submission.subject}</p><p><strong>Message:</strong><br/>${submission.message}</p><p style="color:#999;font-size:12px;">Submitted: ${submission.timestamp}</p>`,
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
