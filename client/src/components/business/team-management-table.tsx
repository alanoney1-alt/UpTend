/**
 * TeamManagementTable Component
 *
 * Lists team members with roles, permissions, and management actions
 * Props:
 * - businessAccountId: string
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
import { Switch } from "@/components/ui/switch";
import { UserPlus, Mail, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TeamManagementTableProps {
  businessAccountId: string;
}

interface TeamMember {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  canViewFinancials: boolean;
  canManageTeam: boolean;
  canCreateJobs: boolean;
  canApprovePayments: boolean;
  canAccessEsgReports: boolean;
  canManageProperties: boolean;
  invitationStatus: "pending" | "accepted" | "declined";
  isActive: boolean;
}

export function TeamManagementTable({ businessAccountId }: TeamManagementTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermissions, setInvitePermissions] = useState({
    canViewFinancials: false,
    canManageTeam: false,
    canCreateJobs: true,
    canApprovePayments: false,
    canAccessEsgReports: true,
    canManageProperties: false,
  });

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/business", businessAccountId, "team"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/business/${businessAccountId}/team`);
      return response.json();
    },
    enabled: !!businessAccountId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/business/${businessAccountId}/team/invite`, {
        email: inviteEmail,
        ...invitePermissions,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business", businessAccountId, "team"] });
      toast({
        title: "Invitation sent",
        description: `Invited ${inviteEmail} to join your team`,
      });
      setInviteDialogOpen(false);
      setInviteEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Invitation failed",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/business/${businessAccountId}/team/${userId}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business", businessAccountId, "team"] });
      toast({
        title: "Member removed",
        description: "Team member has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Remove failed",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your business account
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                {Object.entries(invitePermissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                      {key.replace(/^can/, "").replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) =>
                        setInvitePermissions((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => inviteMutation.mutate()}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
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
            {teamMembers?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{member.userName || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.invitationStatus === "accepted" ? (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Active
                    </Badge>
                  ) : member.invitationStatus === "pending" ? (
                    <Badge variant="outline" className="gap-1">
                      <Mail className="w-3 h-3 text-yellow-600" />
                      Pending
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="w-3 h-3 text-red-600" />
                      Declined
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.canManageTeam && <Badge variant="secondary">Team</Badge>}
                    {member.canViewFinancials && <Badge variant="secondary">Finance</Badge>}
                    {member.canAccessEsgReports && <Badge variant="secondary">ESG</Badge>}
                    {member.canManageProperties && <Badge variant="secondary">Properties</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate(member.userId)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
