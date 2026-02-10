/**
 * TeamManagementTable Component
 *
 * Lists team members with roles, permissions, and management actions
 *
 * Props:
 * - businessAccountId: Business account to manage
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Trash2, Crown, Shield, User, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  businessAccountId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  canViewFinancials: boolean;
  canManageTeam: boolean;
  canCreateJobs: boolean;
  canApprovePayments: boolean;
  canAccessEsgReports: boolean;
  canManageProperties: boolean;
  invitationStatus: "pending" | "accepted" | "declined";
  isActive: boolean;
  createdAt: string;
}

interface TeamManagementTableProps {
  businessAccountId: string;
}

export function TeamManagementTable({ businessAccountId }: TeamManagementTableProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [permissions, setPermissions] = useState({
    canViewFinancials: false,
    canManageTeam: false,
    canCreateJobs: true,
    canApprovePayments: false,
    canAccessEsgReports: true,
    canManageProperties: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; teamMembers: TeamMember[] }>({
    queryKey: ["team-members", businessAccountId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessAccountId}/team`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }

      return response.json();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/business/${businessAccountId}/team/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          permissions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite team member");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", businessAccountId] });
      setInviteDialogOpen(false);
      setInviteEmail("");
      toast({
        title: "Invitation sent",
        description: "Team member invitation has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/business/${businessAccountId}/team/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to remove team member");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", businessAccountId] });
      toast({
        title: "Member removed",
        description: "Team member has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const teamMembers = data?.teamMembers || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to add a new team member to your business account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="team@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canViewFinancials"
                      checked={permissions.canViewFinancials}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, canViewFinancials: !!checked })
                      }
                    />
                    <label htmlFor="canViewFinancials" className="text-sm">
                      View Financials
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canManageTeam"
                      checked={permissions.canManageTeam}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, canManageTeam: !!checked })
                      }
                    />
                    <label htmlFor="canManageTeam" className="text-sm">
                      Manage Team
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canCreateJobs"
                      checked={permissions.canCreateJobs}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, canCreateJobs: !!checked })
                      }
                    />
                    <label htmlFor="canCreateJobs" className="text-sm">
                      Create Jobs
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canApprovePayments"
                      checked={permissions.canApprovePayments}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, canApprovePayments: !!checked })
                      }
                    />
                    <label htmlFor="canApprovePayments" className="text-sm">
                      Approve Payments
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canAccessEsgReports"
                      checked={permissions.canAccessEsgReports}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, canAccessEsgReports: !!checked })
                      }
                    />
                    <label htmlFor="canAccessEsgReports" className="text-sm">
                      Access ESG Reports
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canManageProperties"
                      checked={permissions.canManageProperties}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, canManageProperties: !!checked })
                      }
                    />
                    <label htmlFor="canManageProperties" className="text-sm">
                      Manage Properties
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending}>
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading team members...</div>
      ) : teamMembers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No team members yet. Invite your first member!</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className="font-medium">{member.userId || "Pending"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={member.role === "owner" ? "default" : member.role === "admin" ? "secondary" : "outline"}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(member.invitationStatus)}
                    <span className="text-sm capitalize">{member.invitationStatus}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.canViewFinancials && <Badge variant="outline" className="text-xs">Financials</Badge>}
                    {member.canManageTeam && <Badge variant="outline" className="text-xs">Team</Badge>}
                    {member.canCreateJobs && <Badge variant="outline" className="text-xs">Jobs</Badge>}
                    {member.canApprovePayments && <Badge variant="outline" className="text-xs">Payments</Badge>}
                    {member.canAccessEsgReports && <Badge variant="outline" className="text-xs">ESG</Badge>}
                    {member.canManageProperties && <Badge variant="outline" className="text-xs">Properties</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate(member.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
