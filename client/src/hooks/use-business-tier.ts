import { useQuery } from "@tanstack/react-query";
import type { BusinessAccount } from "@shared/schema";

/**
 * Hook to check the current user's business tier.
 * Returns tier info and helper booleans.
 */
export function useBusinessTier() {
  const { data: accounts = [] } = useQuery<BusinessAccount[]>({
    queryKey: ["/api/business-accounts"],
  });

  const account = accounts[0] as BusinessAccount | undefined;
  const tier = account?.volumeDiscountTier || null;
  const isIndependent = tier === "independent";

  return {
    account,
    tier,
    isIndependent,
    isLoaded: accounts !== undefined,
  };
}

/** Features restricted on the independent (free) tier */
export const RESTRICTED_FEATURES = [
  "compliance",
  "reports",
  "sla-management",
  "crm-integrations",
  "csv-import",
  "white-label",
] as const;
