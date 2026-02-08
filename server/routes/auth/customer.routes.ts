import type { Express } from "express";
import { storage } from "../../storage";
import bcrypt from "bcrypt";
import passport from "passport";
import crypto from "crypto";

/**
 * Customer Authentication Routes
 * Handles customer registration, login, and logout
 */
export async function registerCustomerAuthRoutes(app: Express): Promise<void> {
  // Customer registration
  app.post("/api/customers/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, smsOptIn } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (!phone || phone.trim().length < 10) {
        return res.status(400).json({ error: "A valid phone number is required for booking updates" });
      }

      if (!smsOptIn) {
        return res.status(400).json({ error: "You must agree to receive SMS notifications to register" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        id: crypto.randomUUID(),
        username: email,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        role: "customer",
      });

      // Auto-login after registration - wait for session to be established before responding
      req.login({
        localAuth: true,
        userId: user.id,
        role: "customer"
      }, (loginErr) => {
        if (loginErr) {
          console.error("Auto-login failed:", loginErr);
          return res.status(500).json({ error: "Registration succeeded but login failed. Please try logging in." });
        }

        res.json({
          success: true,
          message: "Registration successful",
          userId: user.id,
          requiresPaymentSetup: true,
        });
      });
    } catch (error) {
      console.error("Customer registration error:", error);

      // Handle specific database errors
      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Email already registered" });
      }
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid reference data" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to complete registration" });
    }
  });

  // Customer Login endpoint - validates customer role
  app.post("/api/customers/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        console.error("Customer login error:", err);
        const dbError = err as any;
        if (dbError.code === 'ECONNREFUSED') {
          return res.status(503).json({ error: "Database connection failed" });
        }
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      try {
        // Validate that this is a customer account
        const fullUser = await storage.getUser(user.userId);
        if (fullUser?.role !== "customer") {
          return res.status(401).json({ error: "Please use the PYCKER login portal" });
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Session creation error:", loginErr);
            return res.status(500).json({ error: "Login failed" });
          }
          return res.json({
            success: true,
            message: "Login successful",
            role: user.role,
            hasPaymentMethod: !!fullUser?.stripeCustomerId,
          });
        });
      } catch (error) {
        console.error("Error during login:", error);
        const dbError = error as any;
        if (dbError.code === 'ECONNREFUSED') {
          return res.status(503).json({ error: "Database connection failed" });
        }
        return res.status(500).json({ error: "Login failed" });
      }
    })(req, res, next);
  });

  // Customer Logout endpoint
  app.post("/api/customers/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
}
