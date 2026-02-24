/**
 * Same-Day Available Badge — "Same-Day Available "
 */

import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface SameDayBadgeProps {
  className?: string;
  size?: "sm" | "md";
  showPremium?: boolean;
  premiumMultiplier?: number;
}

export function SameDayBadge({
  className = "",
  size = "sm",
  showPremium = false,
  premiumMultiplier = 1.25,
}: SameDayBadgeProps) {
  const sizeClasses = size === "sm"
    ? "text-xs px-2 py-0.5"
    : "text-sm px-3 py-1";

  return (
    <Badge
      className={`bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 inline-flex items-center gap-1 ${sizeClasses} ${className}`}
    >
      <Zap className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      Same-Day Available
      {showPremium && (
        <span className="ml-1 opacity-75">
          (+{Math.round((premiumMultiplier - 1) * 100)}%)
        </span>
      )}
    </Badge>
  );
}
