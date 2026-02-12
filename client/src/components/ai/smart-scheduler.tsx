import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CalendarClock,
  Cloud,
  Sun,
  CloudRain,
  Check,
  X,
  Pencil,
  User,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Suggestion {
  id: string;
  serviceType: string;
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  weather: { condition: string; tempHigh: number };
  proAvailability: "high" | "medium" | "low";
  score: number;
}

const weatherIcon = (condition: string) => {
  if (condition.includes("rain")) return <CloudRain className="w-4 h-4 text-blue-500" />;
  if (condition.includes("cloud")) return <Cloud className="w-4 h-4 text-gray-500" />;
  return <Sun className="w-4 h-4 text-yellow-500" />;
};

const availabilityColor = {
  high: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-red-600 bg-red-50",
};

export function SmartScheduler({ serviceType }: { serviceType?: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data: suggestions, isLoading } = useQuery<Suggestion[]>({
    queryKey: ["/api/ai/smart-schedule/suggestions"],
  });

  const acceptMutation = useMutation({
    mutationFn: async (suggestion: Suggestion) => {
      setAccepting(suggestion.id);
      await apiRequest("POST", "/api/ai/smart-schedule", {
        suggestionId: suggestion.id,
        action: "accept",
      });
    },
    onSuccess: () => {
      toast({ title: "Service scheduled!" });
      qc.invalidateQueries({ queryKey: ["/api/ai/smart-schedule/suggestions"] });
      setAccepting(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to schedule", description: err.message, variant: "destructive" });
      setAccepting(null);
    },
  });

  return (
    <Card className="p-6 border-purple-200 dark:border-purple-900">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            Smart Scheduling
          </h3>
          <p className="text-xs text-gray-500">AI-optimized timing</p>
        </div>
        <Sparkles className="w-4 h-4 text-purple-400 ml-auto" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : !suggestions?.length ? (
        <div className="text-center py-8 text-gray-500">
          <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No scheduling suggestions yet</p>
          <p className="text-xs mt-1">Book a service to get AI-optimized times</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.slice(0, 3).map((s) => (
            <div
              key={s.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {s.serviceType}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.reason}</p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-50 text-purple-700"
                >
                  {Math.round(s.score * 100)}% match
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" />
                  {new Date(s.suggestedDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  @ {s.suggestedTime}
                </span>
                <span className="flex items-center gap-1">
                  {weatherIcon(s.weather.condition)} {s.weather.tempHigh}°F
                </span>
                <span
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${availabilityColor[s.proAvailability]}`}
                >
                  <User className="w-3 h-3" /> {s.proAvailability} avail.
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-[#F47C20] hover:bg-[#e06b10] text-white text-xs"
                  disabled={accepting === s.id}
                  onClick={() => acceptMutation.mutate(s)}
                >
                  {accepting === s.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  Accept
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs px-3">
                  <Pencil className="w-3 h-3 mr-1" /> Modify
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs px-3 text-gray-500">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
