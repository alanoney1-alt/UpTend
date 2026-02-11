/**
 * Service ESG Badge Component
 *
 * Displays service-specific sustainability badges for pros
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ServiceEsgBadgeProps {
  serviceType: string;
  esgScore: number;
  metrics?: {
    waterSaved?: number;
    co2Saved?: number;
    diversionRate?: number;
    energySaved?: number;
  };
}

const BADGE_TYPES = {
  water_saver: {
    name: "Water Saver",
    icon: "💧",
    color: "bg-blue-100 text-blue-800",
    threshold: (metrics: any) => (metrics?.waterSaved || 0) > 100,
  },
  chemical_optimizer: {
    name: "Chemical Optimizer",
    icon: "🧪",
    color: "bg-green-100 text-green-800",
    threshold: (metrics: any) => (metrics?.esgScore || 0) >= 80,
  },
  carbon_champion: {
    name: "Carbon Champion",
    icon: "🌱",
    color: "bg-emerald-100 text-emerald-800",
    threshold: (metrics: any) => (metrics?.co2Saved || 0) > 50,
  },
  eco_pro: {
    name: "Eco Pro",
    icon: "⭐",
    color: "bg-purple-100 text-purple-800",
    threshold: (metrics: any) => (metrics?.esgScore || 0) >= 90,
  },
  waste_diverter: {
    name: "Waste Diverter",
    icon: "♻️",
    color: "bg-teal-100 text-teal-800",
    threshold: (metrics: any) => (metrics?.diversionRate || 0) > 75,
  },
  energy_efficient: {
    name: "Energy Efficient",
    icon: "⚡",
    color: "bg-yellow-100 text-yellow-800",
    threshold: (metrics: any) => (metrics?.energySaved || 0) > 10,
  },
};

export function ServiceEsgBadge({ serviceType, esgScore, metrics = {} }: ServiceEsgBadgeProps) {
  const earnedBadges = Object.entries(BADGE_TYPES).filter(([_, badge]) =>
    badge.threshold({ esgScore, ...metrics })
  );

  if (earnedBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {earnedBadges.map(([key, badge]) => (
        <TooltipProvider key={key}>
          <Tooltip>
            <TooltipTrigger>
              <Badge className={badge.color}>
                <span className="mr-1">{badge.icon}</span>
                {badge.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">{badge.name}</p>
                {metrics.waterSaved && key === "water_saver" && (
                  <p className="text-sm">Saved {Math.round(metrics.waterSaved)} gallons of water</p>
                )}
                {metrics.co2Saved && key === "carbon_champion" && (
                  <p className="text-sm">Avoided {Math.round(metrics.co2Saved)} lbs of CO₂</p>
                )}
                {metrics.diversionRate && key === "waste_diverter" && (
                  <p className="text-sm">{Math.round(metrics.diversionRate)}% waste diverted from landfill</p>
                )}
                {metrics.energySaved && key === "energy_efficient" && (
                  <p className="text-sm">Saved {Math.round(metrics.energySaved)} kWh of energy</p>
                )}
                {key === "eco_pro" && (
                  <p className="text-sm">ESG Score: {esgScore}/100</p>
                )}
                {key === "chemical_optimizer" && (
                  <p className="text-sm">Used eco-friendly products</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

export function ServiceEsgSummary({ proId }: { proId: string }) {
  // This would fetch aggregate ESG data for the Pro across all services
  // For now, placeholder
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-3xl mb-1">💧</div>
        <div className="text-2xl font-bold">2,450</div>
        <div className="text-sm text-gray-600">Gallons Saved</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-3xl mb-1">🌱</div>
        <div className="text-2xl font-bold">1,250</div>
        <div className="text-sm text-gray-600">lbs CO₂ Saved</div>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-3xl mb-1">⭐</div>
        <div className="text-2xl font-bold">85</div>
        <div className="text-sm text-gray-600">Avg ESG Score</div>
      </div>
    </div>
  );
}
