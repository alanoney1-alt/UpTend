import type { Request, Response, NextFunction, RequestHandler } from "express";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  [key: string]: any;
}

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  next();
};

export const requireAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  
  if (user.role !== "admin") {
    return res.status(403).json({ 
      error: "Admin access required",
      message: "You do not have permission to access this resource"
    });
  }
  
  next();
};

export const requireHauler: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  
  if (user.role !== "hauler" && user.role !== "admin") {
    return res.status(403).json({ 
      error: "Hauler access required",
      message: "You must be a PYCKER to access this resource"
    });
  }
  
  next();
};

export const requireCustomer: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  
  if (user.role !== "customer" && user.role !== "admin") {
    return res.status(403).json({ 
      error: "Customer access required",
      message: "You must be a customer to access this resource"
    });
  }
  
  next();
};

export function requireOwnership(paramName: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "You must be logged in to access this resource"
      });
    }
    
    const resourceUserId = req.params[paramName];
    
    if (user.role === "admin") {
      return next();
    }
    
    if (user.id !== resourceUserId) {
      return res.status(403).json({ 
        error: "Access denied",
        message: "You can only access your own resources"
      });
    }
    
    next();
  };
}

export const requireHaulerOwnership: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  if (!user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "You must be logged in to access this resource"
    });
  }
  
  if (user.role === "admin") {
    return next();
  }
  
  if (user.role !== "hauler") {
    return res.status(403).json({ 
      error: "Hauler access required",
      message: "You must be a PYCKER to access this resource"
    });
  }
  
  next();
};

export const optionalAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  next();
};

/**
 * Middleware to verify user has access to a business account via team membership
 * Supports optional permission-based authorization
 *
 * @param permission - Optional specific permission to check (e.g., "canManageTeam")
 * @returns RequestHandler that checks team membership and permissions
 *
 * @example
 * // Check team membership only
 * app.get("/api/business/:id/properties", requireAuth, requireBusinessTeamAccess(), handler);
 *
 * // Check specific permission
 * app.post("/api/business/:id/team/invite", requireAuth, requireBusinessTeamAccess("canManageTeam"), handler);
 */
export function requireBusinessTeamAccess(permission?: keyof {
  canViewFinancials: boolean;
  canManageTeam: boolean;
  canCreateJobs: boolean;
  canApprovePayments: boolean;
  canAccessEsgReports: boolean;
  canManageProperties: boolean;
}): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;
    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to access this resource"
      });
    }

    // Admin bypass
    if (user.role === "admin") {
      return next();
    }

    // Get businessAccountId from params or body
    const businessAccountId = req.params.id || req.params.businessAccountId || req.body.businessAccountId;
    if (!businessAccountId) {
      return res.status(400).json({
        error: "Bad request",
        message: "Business account ID is required"
      });
    }

    try {
      // Check if user is the owner of the business account (backward compatibility)
      const { storage } = await import("./storage");
      const businessAccount = await storage.getBusinessAccount(businessAccountId);

      if (!businessAccount) {
        return res.status(404).json({
          error: "Not found",
          message: "Business account not found"
        });
      }

      // Allow direct owner access (backward compatibility)
      if (businessAccount.userId === user.id) {
        // Attach team member info for downstream use (owner has all permissions)
        (req as any).teamMember = {
          id: "owner",
          businessAccountId: businessAccount.id,
          userId: user.id,
          role: "owner",
          canViewFinancials: true,
          canManageTeam: true,
          canCreateJobs: true,
          canApprovePayments: true,
          canAccessEsgReports: true,
          canManageProperties: true,
          isActive: true,
        };
        return next();
      }

      // Check team membership
      const teamMembers = await storage.getTeamMembersByBusiness(businessAccountId);
      const teamMember = teamMembers.find(m => m.userId === user.id && m.isActive && m.invitationStatus === "accepted");

      if (!teamMember) {
        return res.status(403).json({
          error: "Access denied",
          message: "You are not a member of this business account"
        });
      }

      // Check specific permission if required
      if (permission && !teamMember[permission]) {
        return res.status(403).json({
          error: "Permission denied",
          message: `You do not have the required permission: ${permission}`
        });
      }

      // Attach team member info for downstream use
      (req as any).teamMember = teamMember;
      next();
    } catch (error) {
      console.error("Team access check error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to verify team access"
      });
    }
  };
}

/**
 * Helper function to verify team access for a business account
 * Use this for inline checks when businessAccountId needs to be fetched from a resource
 *
 * @param userId - ID of the user to check
 * @param businessAccountId - ID of the business account
 * @param permission - Optional specific permission to require
 * @returns Object with authorized boolean and optional teamMember
 *
 * @example
 * const property = await storage.getHoaProperty(propertyId);
 * const access = await verifyTeamAccess(req.user!.id, property.businessAccountId, "canManageProperties");
 * if (!access.authorized) {
 *   return res.status(403).json({ error: access.message });
 * }
 */
export async function verifyTeamAccess(
  userId: string,
  businessAccountId: string,
  permission?: keyof {
    canViewFinancials: boolean;
    canManageTeam: boolean;
    canCreateJobs: boolean;
    canApprovePayments: boolean;
    canAccessEsgReports: boolean;
    canManageProperties: boolean;
  }
): Promise<{ authorized: boolean; message?: string; teamMember?: any }> {
  try {
    const { storage } = await import("./storage");

    // Get business account
    const businessAccount = await storage.getBusinessAccount(businessAccountId);
    if (!businessAccount) {
      return { authorized: false, message: "Business account not found" };
    }

    // Check if user is the owner (backward compatibility)
    if (businessAccount.userId === userId) {
      return {
        authorized: true,
        teamMember: {
          id: "owner",
          businessAccountId: businessAccount.id,
          userId,
          role: "owner",
          canViewFinancials: true,
          canManageTeam: true,
          canCreateJobs: true,
          canApprovePayments: true,
          canAccessEsgReports: true,
          canManageProperties: true,
          isActive: true,
        }
      };
    }

    // Check team membership
    const teamMembers = await storage.getTeamMembersByBusiness(businessAccountId);
    const teamMember = teamMembers.find(m =>
      m.userId === userId &&
      m.isActive &&
      m.invitationStatus === "accepted"
    );

    if (!teamMember) {
      return { authorized: false, message: "You are not a member of this business account" };
    }

    // Check specific permission if required
    if (permission && !teamMember[permission]) {
      return {
        authorized: false,
        message: `You do not have the required permission: ${permission}`
      };
    }

    return { authorized: true, teamMember };
  } catch (error) {
    console.error("Team access verification error:", error);
    return { authorized: false, message: "Failed to verify team access" };
  }
}
