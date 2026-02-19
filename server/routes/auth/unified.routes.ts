/**
 * Unified Auth Routes
 * 
 * Provides /api/auth/login and /api/auth/register that dispatch
 * to the appropriate role-specific handler.
 */

import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "../../storage";

export function registerUnifiedAuthRoutes(app: Express) {
  /**
   * POST /api/auth/login
   * Body: { email, password, role?: "customer"|"pro"|"business" }
   * 
   * If role is omitted, looks up user by email and determines role automatically.
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Look up user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // If role specified, verify it matches
      const userRole = user.role || "customer";
      const normalizedRole = role === "pro" ? "hauler" : role;
      if (normalizedRole && normalizedRole !== userRole) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Log in via passport/session
      req.login(user, (err: any) => {
        if (err) {
          console.error("[Unified Auth] Login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        // Return user info (without password)
        const { password: _, ...safeUser } = user as any;
        return res.json({
          success: true,
          user: safeUser,
        });
      });
    } catch (error: any) {
      console.error("[Unified Auth] Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /**
   * POST /api/auth/register
   * Body: { email, password, firstName?, lastName?, phone?, role?: "customer"|"pro"|"business" }
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userRole = role === "pro" ? "hauler" : (role || "customer");

      const user = await storage.createUser({
        id: crypto.randomUUID(),
        username: email,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        role: userRole,
      });

      req.login(user, (err: any) => {
        if (err) {
          console.error("[Unified Auth] Register login error:", err);
          return res.status(500).json({ error: "Registration succeeded but login failed" });
        }
        const { password: _, ...safeUser } = user as any;
        return res.json({
          success: true,
          user: safeUser,
        });
      });
    } catch (error: any) {
      console.error("[Unified Auth] Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
}
