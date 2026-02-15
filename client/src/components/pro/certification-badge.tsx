import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Building2,
  Users,
  Brain,
  Wrench,
  Siren,
  Star,
  ShieldCheck,
} from "lucide-react";

const CERT_CONFIG: Record<string, { label: string; icon: typeof Building2; color: string; bgColor: string }> = {
  "b2b-property-management": {
    label: "PM Certified",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  "b2b-hoa": {
    label: "HOA Certified",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  "ai-home-scan": {
    label: "AI Home Scan",
    icon: Brain,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  "parts-materials": {
    label: "Parts & Materials",
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200 hover:bg-orange-100",
  },
  "emergency-response": {
    label: "Emergency",
    icon: Siren,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200 hover:bg-red-100",
  },
  "government-contract": {
    label: "Gov. Certified",
    icon: Star,
    color: "text-navy-600",
    bgColor: "bg-slate-50 border-slate-300 hover:bg-slate-100",
  },
};

interface CertificationBadgeProps {
  certSlugs: string[];
  size?: "sm" | "md" | "lg";
}

export function CertificationBadges({ certSlugs, size = "sm" }: CertificationBadgeProps) {
  if (!certSlugs || certSlugs.length === 0) return null;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const paddingClasses = {
    sm: "px-1.5 py-0.5",
    md: "px-2 py-1",
    lg: "px-3 py-1.5",
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {certSlugs.map((slug) => {
          const config = CERT_CONFIG[slug];
          if (!config) {
            return (
              <Badge key={slug} variant="outline" className={`${paddingClasses[size]} ${textClasses[size]}`}>
                <ShieldCheck className={`${sizeClasses[size]} mr-0.5`} />
                {slug}
              </Badge>
            );
          }

          const Icon = config.icon;
          return (
            <Tooltip key={slug}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`${paddingClasses[size]} ${textClasses[size]} ${config.bgColor} border cursor-default`}
                >
                  <Icon className={`${sizeClasses[size]} ${config.color} mr-0.5`} />
                  <span className={config.color}>{size === "sm" ? "" : config.label}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

/**
 * Inline icon-only badges for tight spaces (pro cards in lists)
 */
export function CertificationIcons({ certSlugs, size = "sm" }: CertificationBadgeProps) {
  if (!certSlugs || certSlugs.length === 0) return null;

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <TooltipProvider>
      <div className="flex gap-0.5 items-center">
        {certSlugs.map((slug) => {
          const config = CERT_CONFIG[slug] || { label: slug, icon: ShieldCheck, color: "text-gray-500" };
          const Icon = config.icon;
          return (
            <Tooltip key={slug}>
              <TooltipTrigger asChild>
                <Icon className={`${sizeClasses[size]} ${config.color}`} />
              </TooltipTrigger>
              <TooltipContent><p>{config.label}</p></TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
