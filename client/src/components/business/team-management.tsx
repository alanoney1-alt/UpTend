/**
 * Team Management Component
 *
 * Manages business team members, invitations, and permissions
 */

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TeamInviteForm } from "./team-invite-form";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  canViewFinancials: boolean;
  canManageTeam: boolean;
  canCreateJobs: boolean;
  canApprovePayments: boolean;
  canAccessEsgReports: boolean;
  canManageProperties: boolean;
  invitationStatus: string;
  isActive: boolean;
  createdAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface TeamManagementProps {
  businessAccountId: string;
  currentUserRole: string;
}

export function TeamManagement({ businessAccountId, currentUserRole }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, [businessAccountId]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/business/${businessAccountId}/team`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.teamMembers);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteDialog(false);
    fetchTeamMembers();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/business/${businessAccountId}/team/${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        fetchTeamMembers();
      }
    } catch (error) {
      console.error("Failed to remove team member:", error);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      member: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={colors[role] || colors.member}>
        {role.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      accepted: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      declined: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={colors[status] || colors.pending}>
        {status}
      </Badge>
    );
  };

  const canManageTeam = currentUserRole === "owner" || currentUserRole === "admin";

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Management</h2>
        {canManageTeam && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>Invite Team Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <TeamInviteForm
                businessAccountId={businessAccountId}
                onSuccess={handleInviteSuccess}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({teamMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Permissions</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {member.user
                        ? `${member.user.firstName} ${member.user.lastName}`
                        : "Pending"}
                    </td>
                    <td className="p-3">
                      {member.user?.email || "N/A"}
                    </td>
                    <td className="p-3">{getRoleBadge(member.role)}</td>
                    <td className="p-3">{getStatusBadge(member.invitationStatus)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {member.canViewFinancials && (
                          <Badge variant="outline" className="text-xs">
                            Financials
                          </Badge>
                        )}
                        {member.canManageTeam && (
                          <Badge variant="outline" className="text-xs">
                            Team
                          </Badge>
                        )}
                        {member.canCreateJobs && (
                          <Badge variant="outline" className="text-xs">
                            Jobs
                          </Badge>
                        )}
                        {member.canApprovePayments && (
                          <Badge variant="outline" className="text-xs">
                            Payments
                          </Badge>
                        )}
                        {member.canAccessEsgReports && (
                          <Badge variant="outline" className="text-xs">
                            ESG
                          </Badge>
                        )}
                        {member.canManageProperties && (
                          <Badge variant="outline" className="text-xs">
                            Properties
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {canManageTeam && member.role !== "owner" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* Open edit dialog */}}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Owner</h4>
              <p className="text-sm text-gray-600">
                Full access to all features. Can manage team members, financials, and all business operations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Admin</h4>
              <p className="text-sm text-gray-600">
                Can manage team members, create jobs, approve payments, and access financial reports.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Member</h4>
              <p className="text-sm text-gray-600">
                Can create jobs and access ESG reports. Limited access to financial information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
