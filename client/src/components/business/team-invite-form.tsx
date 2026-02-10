/**
 * Team Invite Form Component
 *
 * Form for inviting new team members to a business account
 */

import { useState } from "react";
import { Button } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface TeamInviteFormProps {
  businessAccountId: string;
  onSuccess: () => void;
}

export function TeamInviteForm({ businessAccountId, onSuccess }: TeamInviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [permissions, setPermissions] = useState({
    canViewFinancials: false,
    canManageTeam: false,
    canCreateJobs: true,
    canApprovePayments: false,
    canAccessEsgReports: true,
    canManageProperties: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);

    // Preset permissions based on role
    if (newRole === "admin") {
      setPermissions({
        canViewFinancials: true,
        canManageTeam: true,
        canCreateJobs: true,
        canApprovePayments: true,
        canAccessEsgReports: true,
        canManageProperties: true,
      });
    } else if (newRole === "member") {
      setPermissions({
        canViewFinancials: false,
        canManageTeam: false,
        canCreateJobs: true,
        canApprovePayments: false,
        canAccessEsgReports: true,
        canManageProperties: false,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/business/${businessAccountId}/team/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          email,
          role,
          permissions,
        }),
      });

      if (response.ok) {
        onSuccess();
        // Reset form
        setEmail("");
        setRole("member");
        setPermissions({
          canViewFinancials: false,
          canManageTeam: false,
          canCreateJobs: true,
          canApprovePayments: false,
          canAccessEsgReports: true,
          canManageProperties: false,
        });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send invitation");
      }
    } catch (error) {
      setError("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          {role === "admin"
            ? "Full access to manage team, financials, and operations"
            : "Can create jobs and access ESG reports"}
        </p>
      </div>

      <div className="space-y-3">
        <Label>Permissions</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="canViewFinancials"
              checked={permissions.canViewFinancials}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canViewFinancials: !!checked })
              }
            />
            <Label htmlFor="canViewFinancials" className="font-normal">
              View Financials
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="canManageTeam"
              checked={permissions.canManageTeam}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canManageTeam: !!checked })
              }
            />
            <Label htmlFor="canManageTeam" className="font-normal">
              Manage Team
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="canCreateJobs"
              checked={permissions.canCreateJobs}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canCreateJobs: !!checked })
              }
            />
            <Label htmlFor="canCreateJobs" className="font-normal">
              Create Jobs
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="canApprovePayments"
              checked={permissions.canApprovePayments}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canApprovePayments: !!checked })
              }
            />
            <Label htmlFor="canApprovePayments" className="font-normal">
              Approve Payments
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="canAccessEsgReports"
              checked={permissions.canAccessEsgReports}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canAccessEsgReports: !!checked })
              }
            />
            <Label htmlFor="canAccessEsgReports" className="font-normal">
              Access ESG Reports
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="canManageProperties"
              checked={permissions.canManageProperties}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canManageProperties: !!checked })
              }
            />
            <Label htmlFor="canManageProperties" className="font-normal">
              Manage Properties
            </Label>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending Invitation..." : "Send Invitation"}
      </Button>
    </form>
  );
}
