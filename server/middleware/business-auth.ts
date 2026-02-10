/**
 * Business Context & Permission Middleware
 *
 * Validates business account access and permissions
 */

import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      businessContext?: {
        businessAccountId: string;
        role: string;
        permissions: {
          canViewFinancials: boolean;
          canManageTeam: boolean;
          canCreateJobs: boolean;
          canApprovePayments: boolean;
          canAccessEsgReports: boolean;
          canManageProperties: boolean;
        };
      };
    }
  }
}

/**
 * Middleware to load business context from JWT
 */
export async function loadBusinessContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get business account ID from JWT or request params
    const businessAccountId =
      (req as any).user?.businessAccountId || req.params.businessAccountId;

    if (!businessAccountId) {
      return res.status(400).json({ error: "Business account ID required" });
    }

    // Get team member details
    const membership = await storage.getTeamMemberByUserAndBusiness(
      userId,
      businessAccountId
    );

    if (!membership || !membership.isActive) {
      return res
        .status(403)
        .json({ error: "Not a member of this business account" });
    }

    // Attach business context to request
    req.businessContext = {
      businessAccountId: membership.businessAccountId,
      role: membership.role,
      permissions: {
        canViewFinancials: membership.canViewFinancials || false,
        canManageTeam: membership.canManageTeam || false,
        canCreateJobs: membership.canCreateJobs || false,
        canApprovePayments: membership.canApprovePayments || false,
        canAccessEsgReports: membership.canAccessEsgReports || false,
        canManageProperties: membership.canManageProperties || false,
      },
    };

    next();
  } catch (error) {
    console.error("Business context middleware error:", error);
    res.status(500).json({ error: "Failed to load business context" });
  }
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: keyof typeof permissionMap) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.businessContext) {
        return res.status(403).json({ error: "Business context not loaded" });
      }

      // Owners have all permissions
      if (req.businessContext.role === "owner") {
        return next();
      }

      // Check specific permission
      const permissionKey = permissionMap[permission];
      if (!req.businessContext.permissions[permissionKey]) {
        return res.status(403).json({
          error: `Insufficient permissions: ${permission} required`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Permission check failed" });
    }
  };
}

// Map friendly names to permission keys
const permissionMap = {
  viewFinancials: "canViewFinancials" as const,
  manageTeam: "canManageTeam" as const,
  createJobs: "canCreateJobs" as const,
  approvePayments: "canApprovePayments" as const,
  accessEsgReports: "canAccessEsgReports" as const,
  manageProperties: "canManageProperties" as const,
};

/**
 * Middleware to require owner or admin role
 */
export async function requireOwnerOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.businessContext) {
      return res.status(403).json({ error: "Business context not loaded" });
    }

    if (
      req.businessContext.role !== "owner" &&
      req.businessContext.role !== "admin"
    ) {
      return res.status(403).json({
        error: "Owner or admin role required",
      });
    }

    next();
  } catch (error) {
    console.error("Role check error:", error);
    res.status(500).json({ error: "Role check failed" });
  }
}

/**
 * Middleware to require owner role only
 */
export async function requireOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.businessContext) {
      return res.status(403).json({ error: "Business context not loaded" });
    }

    if (req.businessContext.role !== "owner") {
      return res.status(403).json({
        error: "Owner role required",
      });
    }

    next();
  } catch (error) {
    console.error("Owner check error:", error);
    res.status(500).json({ error: "Owner check failed" });
  }
}
