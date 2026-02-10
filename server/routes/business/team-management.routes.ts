/**
 * Business Team Management API Routes
 *
 * Multi-user B2B account management endpoints.
 *
 * Endpoints:
 * - POST /api/business/:id/team/invite - Invite team member
 * - GET /api/business/:id/team - List team members
 * - PATCH /api/business/:id/team/:userId - Update team member permissions
 * - DELETE /api/business/:id/team/:userId - Remove team member
 * - POST /api/business/team/accept-invitation - Accept team invitation
 */

import { Router } from "express";
import { z } from "zod";
import { BusinessAccountsStorage } from "../../storage/domains/business-accounts/storage";
import crypto from "crypto";

const router = Router();
const businessStorage = new BusinessAccountsStorage();

// Permission check middleware
async function checkTeamPermission(
  userId: string,
  businessAccountId: string,
  requiredPermission: "canManageTeam" | "canViewFinancials"
): Promise<boolean> {
  const member = await businessStorage.getTeamMemberByUserAndBusiness(userId, businessAccountId);
  if (!member || !member.isActive) return false;
  if (member.role === "owner") return true;
  return member[requiredPermission] || false;
}

// ==========================================
// POST /api/business/:id/team/invite
// Invite a new team member
// ==========================================
const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]),
  permissions: z.object({
    canViewFinancials: z.boolean().optional(),
    canManageTeam: z.boolean().optional(),
    canCreateJobs: z.boolean().optional(),
    canApprovePayments: z.boolean().optional(),
    canAccessEsgReports: z.boolean().optional(),
    canManageProperties: z.boolean().optional(),
  }).optional(),
});

router.post("/:id/team/invite", async (req, res) => {
  try {
    const { id: businessAccountId } = req.params;
    const validated = inviteTeamMemberSchema.parse(req.body);

    // Check if requesting user has permission to manage team
    // @ts-ignore - req.user is set by auth middleware
    const requestingUserId = req.user?.id;
    if (!requestingUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasPermission = await checkTeamPermission(requestingUserId, businessAccountId, "canManageTeam");
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions to invite team members" });
    }

    // Check if user already exists (simplified - in production, lookup by email)
    // For now, we'll create a pending invitation
    const invitationToken = crypto.randomBytes(32).toString("hex");

    const teamMember = await businessStorage.createTeamMember({
      businessAccountId,
      userId: "", // Will be filled when user accepts invitation
      role: validated.role,
      canViewFinancials: validated.permissions?.canViewFinancials ?? (validated.role === "admin"),
      canManageTeam: validated.permissions?.canManageTeam ?? (validated.role === "admin"),
      canCreateJobs: validated.permissions?.canCreateJobs ?? true,
      canApprovePayments: validated.permissions?.canApprovePayments ?? (validated.role === "admin"),
      canAccessEsgReports: validated.permissions?.canAccessEsgReports ?? true,
      canManageProperties: validated.permissions?.canManageProperties ?? (validated.role === "admin"),
      invitedBy: requestingUserId,
      invitationToken,
      invitationStatus: "pending",
      isActive: false, // Will be activated when invitation is accepted
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // TODO: Send invitation email with invitationToken
    // For now, return the token for testing
    res.json({
      success: true,
      teamMember,
      invitationUrl: `/business/team/accept?token=${invitationToken}`,
    });
  } catch (error: any) {
    console.error("Error inviting team member:", error);
    res.status(400).json({
      error: error.message || "Failed to invite team member",
    });
  }
});

// ==========================================
// GET /api/business/:id/team
// List all team members
// ==========================================
router.get("/:id/team", async (req, res) => {
  try {
    const { id: businessAccountId } = req.params;

    // @ts-ignore
    const requestingUserId = req.user?.id;
    if (!requestingUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if requesting user is a member of this business
    const member = await businessStorage.getTeamMemberByUserAndBusiness(requestingUserId, businessAccountId);
    if (!member || !member.isActive) {
      return res.status(403).json({ error: "Not a member of this business account" });
    }

    const teamMembers = await businessStorage.getTeamMembersByBusiness(businessAccountId);

    res.json({
      success: true,
      teamMembers,
    });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch team members",
    });
  }
});

// ==========================================
// PATCH /api/business/:id/team/:memberId
// Update team member permissions
// ==========================================
const updateTeamMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
  permissions: z.object({
    canViewFinancials: z.boolean().optional(),
    canManageTeam: z.boolean().optional(),
    canCreateJobs: z.boolean().optional(),
    canApprovePayments: z.boolean().optional(),
    canAccessEsgReports: z.boolean().optional(),
    canManageProperties: z.boolean().optional(),
  }).optional(),
});

router.patch("/:id/team/:memberId", async (req, res) => {
  try {
    const { id: businessAccountId, memberId } = req.params;
    const validated = updateTeamMemberSchema.parse(req.body);

    // @ts-ignore
    const requestingUserId = req.user?.id;
    if (!requestingUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasPermission = await checkTeamPermission(requestingUserId, businessAccountId, "canManageTeam");
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions to update team members" });
    }

    // Prepare updates
    const updates: any = {};
    if (validated.role) updates.role = validated.role;
    if (validated.permissions) {
      Object.assign(updates, validated.permissions);
    }

    const updatedMember = await businessStorage.updateTeamMember(memberId, updates);

    if (!updatedMember) {
      return res.status(404).json({ error: "Team member not found" });
    }

    res.json({
      success: true,
      teamMember: updatedMember,
    });
  } catch (error: any) {
    console.error("Error updating team member:", error);
    res.status(400).json({
      error: error.message || "Failed to update team member",
    });
  }
});

// ==========================================
// DELETE /api/business/:id/team/:memberId
// Remove team member
// ==========================================
router.delete("/:id/team/:memberId", async (req, res) => {
  try {
    const { id: businessAccountId, memberId } = req.params;

    // @ts-ignore
    const requestingUserId = req.user?.id;
    if (!requestingUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasPermission = await checkTeamPermission(requestingUserId, businessAccountId, "canManageTeam");
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions to remove team members" });
    }

    await businessStorage.deleteTeamMember(memberId);

    res.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error: any) {
    console.error("Error removing team member:", error);
    res.status(500).json({
      error: error.message || "Failed to remove team member",
    });
  }
});

// ==========================================
// POST /api/business/team/accept-invitation
// Accept team invitation
// ==========================================
const acceptInvitationSchema = z.object({
  invitationToken: z.string(),
});

router.post("/team/accept-invitation", async (req, res) => {
  try {
    const { invitationToken } = acceptInvitationSchema.parse(req.body);

    // @ts-ignore
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find invitation by token
    const invitation = await businessStorage.getTeamMemberByToken(invitationToken);
    if (!invitation) {
      return res.status(404).json({ error: "Invalid invitation token" });
    }

    if (invitation.invitationStatus === "accepted") {
      return res.status(400).json({ error: "Invitation already accepted" });
    }

    // Update invitation with user ID and mark as accepted
    const updatedMember = await businessStorage.updateTeamMember(invitation.id, {
      userId,
      invitationStatus: "accepted",
      isActive: true,
    });

    res.json({
      success: true,
      teamMember: updatedMember,
      message: "Team invitation accepted successfully",
    });
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    res.status(400).json({
      error: error.message || "Failed to accept invitation",
    });
  }
});

export default router;
