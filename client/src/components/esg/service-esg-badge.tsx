/**
 * ServiceEsgBadge Component
 *
 * Displays ESG score with color-coded badges and optional metrics
 *
 * Props:
 * - serviceType: Service type identifier
 * - esgScore: 0-100 score
 * - co2SavedLbs?: Optional CO2 savings to display
 * - waterSavedGallons?: Optional water savings to display
 * - compact?: Compact mode for tight spaces
 */

import { Badge } from "@/components/ui/badge";
import { Leaf, Droplet } from "lucide-react";

interface ServiceEsgBadgeProps {
  serviceType: string;
  esgScore: number;
  co2SavedLbs?: number;
  waterSavedGallons?: number;
  compact?: boolean;
}

const SERVICE_LABELS: Record<string, string> = {
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  pool_cleaning: "Pool Cleaning",
  home_cleaning: "Home Cleaning",
  landscaping: "Landscaping",
  handyman: "Handyman",
  moving_labor: "Moving",
  furniture_moving: "Furniture Moving",
  carpet_cleaning: "Carpet Cleaning",
  light_demolition: "Demolition",
  junk_removal: "Junk Removal",
};

export function ServiceEsgBadge({
  serviceType,
  esgScore,
  co2SavedLbs,
  waterSavedGallons,
  compact = false,
}: ServiceEsgBadgeProps) {
  // Determine badge variant based on score
  const getVariant = (score: number) => {
    if (score >= 80) return "default"; // Green
    if (score >= 60) return "secondary"; // Yellow
    return "outline"; // Red/warning
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const serviceLabel = SERVICE_LABELS[serviceType] || serviceType.replace(/_/g, " ");

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={getVariant(esgScore)} className="text-xs">
          ESG: {Math.round(esgScore)}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{serviceLabel}</span>
        <Badge variant={getVariant(esgScore)}>
          ESG Score: {Math.round(esgScore)}
        </Badge>
      </div>

      {(co2SavedLbs !== undefined || waterSavedGallons !== undefined) && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {co2SavedLbs !== undefined && (
            <div className="flex items-center gap-1">
              <Leaf className="h-4 w-4 text-green-600" />
              <span className={getScoreColor(esgScore)}>
                {co2SavedLbs.toFixed(1)} lbs CO₂ saved
              </span>
            </div>
          )}
          {waterSavedGallons !== undefined && (
            <div className="flex items-center gap-1">
              <Droplet className="h-4 w-4 text-blue-600" />
              <span className={getScoreColor(esgScore)}>
                {waterSavedGallons.toFixed(0)} gal saved
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
