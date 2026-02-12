import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import {
  Leaf,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  MapPin,
  ThermometerSun,
} from "lucide-react";

interface Advisory {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimatedCost: { min: number; max: number };
  serviceType: string;
  season: string;
}

interface SeasonalData {
  advisories: Advisory[];
  location: string;
  season: string;
}

const priorityColors = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

export function SeasonalAdvisor({ zipCode = "32801" }: { zipCode?: string }) {
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<SeasonalData>({
    queryKey: [`/api/ai/seasonal-advisories?zipCode=${zipCode}`],
  });

  if (error) return null;

  return (
    <Card className="p-6 border-green-200 dark:border-green-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Seasonal Advisor
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" /> {isLoading ? "..." : data?.location}
            </div>
          </div>
        </div>
        {data?.season && (
          <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
            <ThermometerSun className="w-3 h-3 mr-1" />
            {data.season}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : !data?.advisories?.length ? (
        <div className="text-center py-8 text-gray-500">
          <Leaf className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No seasonal tips right now. You're all set!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.advisories.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.priority === "high" && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    )}
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <Badge className={`text-xs shrink-0 ${priorityColors[item.priority]}`}>
                  {item.priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ${item.estimatedCost.min}–${item.estimatedCost.max}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-[#F47C20] hover:text-[#e06b10] hover:bg-[#F47C20]/10 px-2"
                  onClick={() =>
                    navigate(`/book?service=${encodeURIComponent(item.serviceType)}`)
                  }
                >
                  Schedule <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
