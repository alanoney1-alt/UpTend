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

      // Log the contact submission (in production, send email or store in DB)
      console.log("[Contact Form]", {
        name,
        email,
        phone: phone || "not provided",
        subject: subject || "General Inquiry",
        message,
        timestamp: new Date().toISOString(),
      });

      // TODO: Send email notification to alan@uptend.app
      // For now, just acknowledge receipt

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
