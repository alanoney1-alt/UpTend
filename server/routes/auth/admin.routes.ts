import type { Express } from "express";
import { storage } from "../../storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../services/notifications";
import { passwordResetTokens } from "@shared/schema";
import { db } from "../../db";
import { eq, and, gt } from "drizzle-orm";

// Password reset rate limiting
const passwordResetAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_RESET_ATTEMPTS = 3; // Max 3 attempts per 15 minutes

function checkPasswordResetRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = passwordResetAttempts.get(identifier);

  if (!entry || now > entry.resetAt) {
    passwordResetAttempts.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= MAX_RESET_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Admin Authentication Routes
 * Handles admin login, logout, and password reset functionality
 */
export async function registerAdminAuthRoutes(app: Express): Promise<void> {
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        console.error("ADMIN_PASSWORD not configured");
        return res.status(500).json({ error: "Admin login not configured" });
      }

      // Compare passwords securely
      let isValid = false;
      if (adminPassword.startsWith('$2b$') || adminPassword.startsWith('$2a$')) {
        // Password is already stored as bcrypt hash - compare securely
        isValid = await bcrypt.compare(password, adminPassword);
      } else {
        // For plaintext stored password, use constant-time comparison
        // Pad both strings to prevent timing attacks based on string length
        const maxLen = Math.max(password.length, adminPassword.length, 64);
        const paddedInput = password.padEnd(maxLen, '\0');
        const paddedExpected = adminPassword.padEnd(maxLen, '\0');

        try {
          isValid = crypto.timingSafeEqual(
            Buffer.from(paddedInput, 'utf8'),
            Buffer.from(paddedExpected, 'utf8')
          );
        } catch {
          isValid = false;
        }
      }

      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Set admin session
      (req.session as any).isAdmin = true;
      (req.session as any).adminLoginAt = new Date().toISOString();

      // Create Passport session so requireAuth/requireAdmin middleware works
      const adminUser = {
        localAuth: true,
        userId: "admin",
        role: "admin",
      };
      req.login(adminUser, (loginErr) => {
        if (loginErr) {
          console.error("Admin session creation error:", loginErr);
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ success: true, message: "Admin login successful" });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Check admin session
  app.get("/api/admin/check", (req, res) => {
    const isAdmin = (req.session as any)?.isAdmin === true;
    res.json({ isAdmin });
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    (req.session as any).isAdmin = false;
    res.json({ success: true });
  });

  // Password reset - forgot password (send reset link)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Rate limit by IP and email
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const ipAllowed = checkPasswordResetRateLimit(`ip:${clientIp}`);
      const emailAllowed = checkPasswordResetRateLimit(`email:${email.toLowerCase()}`);

      if (!ipAllowed || !emailAllowed) {
        return res.status(429).json({ error: "Too many password reset requests. Please try again in 15 minutes." });
      }

      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ success: true, message: "If an account exists with that email, you will receive a password reset link." });
      }

      // Generate a secure token (raw for email, hashed for storage)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Invalidate any existing tokens for this user
      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.userId, user.id));

      // Save the hashed token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: hashedToken,
        expiresAt,
        used: false,
      });

      // Build the reset link (use raw token in email, not hashed)
      const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;

      // Send the email
      const emailResult = await sendPasswordResetEmail(email, resetLink);

      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
      }

      res.json({ success: true, message: "If an account exists with that email, you will receive a password reset link." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Password reset - reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      // Hash the incoming token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find the token
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, hashedToken),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        );

      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the user's password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });

      // Mark the token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ success: true, message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
}
