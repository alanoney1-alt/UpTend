/**
 * Business Authentication Routes
 *
 * Handles business user login, signup, and context switching
 */

import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAuth } from "../../middleware/auth";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function registerBusinessAuthRoutes(app: Express) {
  // ==========================================
  // Business User Signup
  // ==========================================
  const businessSignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    businessName: z.string().min(1),
    businessType: z.enum(["hoa", "property_manager", "business"]),
    phone: z.string().optional(),
  });

  app.post("/api/auth/business/signup", async (req, res) => {
    try {
      const validated = businessSignupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validated.password, 10);

      // Create user account
      const user = await storage.createUser({
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone || "",
        role: "business_user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create business account
      const businessAccount = await storage.createBusinessAccount({
        userId: user.id,
        businessName: validated.businessName,
        businessType: validated.businessType,
        accountType: validated.businessType,
        primaryContactName: `${validated.firstName} ${validated.lastName}`,
        primaryContactEmail: validated.email,
        primaryContactPhone: validated.phone || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create owner team member entry
      await storage.createTeamMember({
        businessAccountId: businessAccount.id,
        userId: user.id,
        role: "owner",
        canViewFinancials: true,
        canManageTeam: true,
        canCreateJobs: true,
        canApprovePayments: true,
        canAccessEsgReports: true,
        canManageProperties: true,
        invitationStatus: "accepted",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          businessAccountId: businessAccount.id,
        },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        businessAccount: {
          id: businessAccount.id,
          businessName: businessAccount.businessName,
          businessType: businessAccount.businessType,
        },
        token,
      });
    } catch (error: any) {
      console.error("Business signup error:", error);
      res.status(400).json({
        error: error.message || "Failed to create business account",
      });
    }
  });

  // ==========================================
  // Business User Login
  // ==========================================
  const businessLoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  app.post("/api/auth/business/login", async (req, res) => {
    try {
      const validated = businessLoginSchema.parse(req.body);

      // Get user
      const user = await storage.getUserByEmail(validated.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(validated.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Get business memberships
      const memberships = await storage.getBusinessMembershipsForUser(user.id);
      if (memberships.length === 0) {
        return res.status(403).json({ error: "No business accounts found for this user" });
      }

      // Get business accounts with details
      const businessAccounts = await Promise.all(
        memberships.map(async (membership) => {
          const account = await storage.getBusinessAccount(membership.businessAccountId);
          return {
            id: account!.id,
            businessName: account!.businessName,
            businessType: account!.businessType,
            role: membership.role,
            permissions: {
              canViewFinancials: membership.canViewFinancials,
              canManageTeam: membership.canManageTeam,
              canCreateJobs: membership.canCreateJobs,
              canApprovePayments: membership.canApprovePayments,
              canAccessEsgReports: membership.canAccessEsgReports,
              canManageProperties: membership.canManageProperties,
            },
          };
        })
      );

      // Default to first business account
      const primaryBusiness = businessAccounts[0];

      // Generate JWT with business context
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          businessAccountId: primaryBusiness.id,
        },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        businessAccounts,
        currentBusinessAccount: primaryBusiness,
        token,
      });
    } catch (error: any) {
      console.error("Business login error:", error);
      res.status(400).json({
        error: error.message || "Login failed",
      });
    }
  });

  // ==========================================
  // Get Business Context
  // ==========================================
  app.get("/api/auth/business/context", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Get all business memberships
      const memberships = await storage.getBusinessMembershipsForUser(userId);

      const businessAccounts = await Promise.all(
        memberships.map(async (membership) => {
          const account = await storage.getBusinessAccount(membership.businessAccountId);
          return {
            id: account!.id,
            businessName: account!.businessName,
            businessType: account!.businessType,
            role: membership.role,
            permissions: {
              canViewFinancials: membership.canViewFinancials,
              canManageTeam: membership.canManageTeam,
              canCreateJobs: membership.canCreateJobs,
              canApprovePayments: membership.canApprovePayments,
              canAccessEsgReports: membership.canAccessEsgReports,
              canManageProperties: membership.canManageProperties,
            },
          };
        })
      );

      res.json({
        success: true,
        businessAccounts,
      });
    } catch (error: any) {
      console.error("Get business context error:", error);
      res.status(500).json({
        error: error.message || "Failed to get business context",
      });
    }
  });

  // ==========================================
  // Switch Business Context
  // ==========================================
  const switchContextSchema = z.object({
    businessAccountId: z.string(),
  });

  app.post("/api/auth/business/switch-context", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { businessAccountId } = switchContextSchema.parse(req.body);

      // Verify user is a member of this business
      const membership = await storage.getTeamMemberByUserAndBusiness(userId, businessAccountId);
      if (!membership || !membership.isActive) {
        return res.status(403).json({ error: "Not a member of this business account" });
      }

      // Get business account details
      const businessAccount = await storage.getBusinessAccount(businessAccountId);
      if (!businessAccount) {
        return res.status(404).json({ error: "Business account not found" });
      }

      // Generate new JWT with updated business context
      const token = jwt.sign(
        {
          id: userId,
          email: req.user!.email,
          role: req.user!.role,
          businessAccountId: businessAccountId,
        },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        success: true,
        businessAccount: {
          id: businessAccount.id,
          businessName: businessAccount.businessName,
          businessType: businessAccount.businessType,
        },
        role: membership.role,
        permissions: {
          canViewFinancials: membership.canViewFinancials,
          canManageTeam: membership.canManageTeam,
          canCreateJobs: membership.canCreateJobs,
          canApprovePayments: membership.canApprovePayments,
          canAccessEsgReports: membership.canAccessEsgReports,
          canManageProperties: membership.canManageProperties,
        },
        token,
      });
    } catch (error: any) {
      console.error("Switch context error:", error);
      res.status(400).json({
        error: error.message || "Failed to switch business context",
      });
    }
  });
}
