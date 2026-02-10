/**
 * ServiceEsgBadge Component
 *
 * Displays ESG score with color-coded badges
 * Props:
 * - serviceType: string (service identifier)
 * - esgScore: number (0-100)
 * - co2SavedLbs?: number
 * - waterSavedGallons?: number
 * - compact?: boolean (for tight spaces)
 */

import { Badge } from "@/components/ui/badge";
import { Leaf, Droplets } from "lucide-react";

interface ServiceEsgBadgeProps {
  serviceType: string;
  esgScore: number;
  co2SavedLbs?: number;
  waterSavedGallons?: number;
  compact?: boolean;
}

const SERVICE_ICONS: Record<string, string> = {
  junk_removal: "🚛",
  pressure_washing: "💧",
  gutter_cleaning: "🏠",
  pool_cleaning: "🏊",
  landscaping: "🌿",
  carpet_cleaning: "✨",
  home_cleaning: "✨",
  moving_labor: "💪",
  light_demolition: "🔨",
  handyman: "🔧",
};

export function ServiceEsgBadge({
  serviceType,
  esgScore,
  co2SavedLbs,
  waterSavedGallons,
  compact = false,
}: ServiceEsgBadgeProps) {
  // Color coding based on ESG score
  const getScoreVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default"; // Green
    if (score >= 60) return "secondary"; // Yellow
    return "destructive"; // Red
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const icon = SERVICE_ICONS[serviceType] || "📊";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <Badge variant={getScoreVariant(esgScore)} className="text-xs">
          {esgScore}/100
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold capitalize">
            {serviceType.replace(/_/g, " ")}
          </span>
          <Badge variant={getScoreVariant(esgScore)}>
            ESG: {esgScore}/100
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {co2SavedLbs !== undefined && (
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-green-600" />
              {co2SavedLbs.toFixed(1)} lbs CO₂
            </span>
          )}
          {waterSavedGallons !== undefined && (
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-600" />
              {waterSavedGallons.toFixed(0)} gal
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
