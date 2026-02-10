/**
 * BusinessContextSwitcher Component
 *
 * Dropdown for switching between business accounts user is a member of
 *
 * Props:
 * - currentBusinessId?: Currently selected business
 * - onBusinessChange: Callback when business is changed
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
import { Building2, Crown, Shield, User } from "lucide-react";

interface BusinessMembership {
  id: string;
  businessAccountId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  businessAccount: {
    id: string;
    businessName: string;
    accountType: string;
    isActive: boolean;
  } | null;
}

interface BusinessContextSwitcherProps {
  currentBusinessId?: string;
  onBusinessChange: (businessId: string) => void;
}

export function BusinessContextSwitcher({
  currentBusinessId,
  onBusinessChange,
}: BusinessContextSwitcherProps) {
  const { data, isLoading } = useQuery<{ success: boolean; memberships: BusinessMembership[] }>({
    queryKey: ["business-memberships"],
    queryFn: async () => {
      const response = await fetch("/api/business/my-memberships", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch business memberships");
      }

      return response.json();
    },
  });

  const memberships = data?.memberships || [];

  // Hide switcher if user only has 1 business
  if (!isLoading && memberships.length <= 1) {
    return null;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading businesses...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-600" />
      <Select value={currentBusinessId} onValueChange={onBusinessChange}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select a business account" />
        </SelectTrigger>
        <SelectContent>
          {memberships.map((membership) => (
            <SelectItem key={membership.id} value={membership.businessAccountId}>
              <div className="flex items-center justify-between gap-3 w-full">
                <span className="font-medium">
                  {membership.businessAccount?.businessName || "Unknown Business"}
                </span>
                <Badge variant={getRoleBadgeVariant(membership.role)} className="flex items-center gap-1">
                  {getRoleIcon(membership.role)}
                  <span className="capitalize">{membership.role}</span>
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
