/**
 * Business Context Switcher Component
 *
 * Allows users to switch between multiple business accounts they're a member of
 */

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface BusinessAccount {
  id: string;
  businessName: string;
  businessType: string;
  role: string;
  permissions: Record<string, boolean>;
}

interface BusinessContextSwitcherProps {
  currentBusinessId?: string;
  onBusinessChange: (businessId: string) => void;
}

export function BusinessContextSwitcher({
  currentBusinessId,
  onBusinessChange,
}: BusinessContextSwitcherProps) {
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessAccounts();
  }, []);

  const fetchBusinessAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/business/context", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businessAccounts);
      }
    } catch (error) {
      console.error("Failed to fetch business accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSwitch = async (businessId: string) => {
    try {
      const response = await fetch("/api/auth/business/switch-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ businessAccountId: businessId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update token in local storage
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        // Notify parent component
        onBusinessChange(businessId);
        // Refresh page to reload with new context
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to switch business context:", error);
    }
  };

  if (loading || businesses.length === 0) {
    return null;
  }

  // Don't show switcher if user only has one business
  if (businesses.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{businesses[0].businessName}</span>
        <Badge>{businesses[0].role}</Badge>
      </div>
    );
  }

  const currentBusiness = businesses.find((b) => b.id === currentBusinessId);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Business:</span>
      <Select value={currentBusinessId} onValueChange={handleBusinessSwitch}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select business">
            <div className="flex items-center gap-2">
              <span>{currentBusiness?.businessName || "Select business"}</span>
              {currentBusiness && (
                <Badge variant="outline">{currentBusiness.role}</Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {businesses.map((business) => (
            <SelectItem key={business.id} value={business.id}>
              <div className="flex items-center justify-between w-full">
                <span>{business.businessName}</span>
                <Badge variant="outline" className="ml-2">
                  {business.role}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
