/**
 * BusinessContextSwitcher Component
 *
 * Allows users to switch between multiple business accounts
 * Props:
 * - currentBusinessId?: string
 * - onBusinessChange: (businessId: string) => void
 */

import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BusinessContextSwitcherProps {
  currentBusinessId?: string;
  onBusinessChange: (businessId: string) => void;
}

interface BusinessMembership {
  id: string;
  businessAccountId: string;
  businessName: string;
  role: string;
  canViewFinancials: boolean;
  canManageTeam: boolean;
  canCreateJobs: boolean;
  canApprovePayments: boolean;
  canAccessEsgReports: boolean;
  canManageProperties: boolean;
}

export function BusinessContextSwitcher({
  currentBusinessId,
  onBusinessChange,
}: BusinessContextSwitcherProps) {
  const { data: memberships, isLoading } = useQuery<BusinessMembership[]>({
    queryKey: ["/api/business/my-memberships"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/business/my-memberships");
      return response.json();
    },
  });

  // Hide switcher if user has only 1 business
  if (!isLoading && memberships && memberships.length <= 1) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === "owner") return "bg-purple-600 text-white";
    if (role === "admin") return "bg-blue-600 text-white";
    return "bg-gray-600 text-white";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading businesses...</span>
      </div>
    );
  }

  if (!memberships || memberships.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Building2 className="w-5 h-5 text-muted-foreground" />
      <Select value={currentBusinessId} onValueChange={onBusinessChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select business account" />
        </SelectTrigger>
        <SelectContent>
          {memberships.map((membership) => (
            <SelectItem
              key={membership.businessAccountId}
              value={membership.businessAccountId}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{membership.businessName}</span>
                <Badge className={getRoleBadgeColor(membership.role)}>
                  {membership.role}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
