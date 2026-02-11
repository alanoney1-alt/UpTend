import { Badge } from "@/components/ui/badge";
import { Shield, User, Check, AlertTriangle } from "lucide-react";

interface ProTierBadgeProps {
  tier: string;
  showDisclaimer?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProTierBadge({ tier, showDisclaimer = false, size = "md" }: ProTierBadgeProps) {
  const isVerifiedPro = tier === "verified_pro";

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  if (isVerifiedPro) {
    return (
      <div className="flex flex-col gap-1">
        <Badge
          className={`bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0 ${sizeClasses[size]}`}
          data-testid="badge-verified-pro"
        >
          <Shield className="w-3 h-3 mr-1" />
          VERIFIED PRO
        </Badge>
        {showDisclaimer && (
          <p className="text-xs text-muted-foreground" data-testid="text-verified-pro-info">
            Licensed, insured, and background checked
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant="secondary"
        className={sizeClasses[size]}
        data-testid="badge-independent"
      >
        <User className="w-3 h-3 mr-1" />
        Independent Pro
      </Badge>
      {showDisclaimer && (
        <p className="text-xs text-muted-foreground" data-testid="text-independent-disclaimer">
          This Pro operates independently. Background checked with card on file for your protection.
        </p>
      )}
    </div>
  );
}

export function ProTierInfo({ tier }: { tier: string }) {
  const isVerifiedPro = tier === "verified_pro";

  if (isVerifiedPro) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4" data-testid="card-verified-pro-info">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-amber-700 dark:text-amber-400">VERIFIED PRO</span>
        </div>
        <ul className="text-sm space-y-1 text-amber-800 dark:text-amber-300">
          <li className="flex items-center gap-1"><Check className="w-4 h-4" /> Business licensed</li>
          <li className="flex items-center gap-1"><Check className="w-4 h-4" /> Fully insured</li>
          <li className="flex items-center gap-1"><Check className="w-4 h-4" /> Background checked</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4" data-testid="card-independent-info">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-5 h-5 text-muted-foreground" />
        <span className="font-semibold">Independent Pro</span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        This service provider operates as an independent contractor and is not employed by UpTend.
      </p>
      <ul className="text-sm space-y-1">
        <li className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-500" /> May not carry commercial insurance</li>
        <li className="flex items-center gap-1"><Check className="w-4 h-4 text-green-600" /> Background checked</li>
        <li className="flex items-center gap-1"><Check className="w-4 h-4 text-green-600" /> Card on file for accountability</li>
      </ul>
      <p className="text-xs text-muted-foreground mt-3 italic">
        UpTend provides a platform connecting you with independent service providers.
        You agree that UpTend is not liable for any damages, losses, or injuries
        that may occur during the service provided by independent Pros.
      </p>
    </div>
  );
}

// Legacy export aliases for backward compatibility
export const PyckerTierBadge = ProTierBadge;
export const PyckerTierInfo = ProTierInfo;
