/**
 * Subscription Card. Manage an active subscription (pause/resume/cancel)
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Calendar,
  Clock,
  Pause,
  Play,
  X,
  Sparkles,
  Droplets,
  Leaf,
  Home,
  Waves,
  Loader2,
  MapPin,
} from "lucide-react";

const SERVICE_ICONS: Record<string, any> = {
  home_cleaning: Sparkles,
  pool_cleaning: Waves,
  landscaping: Leaf,
  carpet_cleaning: Home,
  gutter_cleaning: Droplets,
  pressure_washing: Droplets,
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  paused: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

interface SubscriptionCardProps {
  subscription: {
    id: string;
    serviceType: string;
    serviceLabel: string;
    frequency: string;
    preferredDay?: string;
    preferredTime?: string;
    status: string;
    nextServiceDate?: string;
    price: number;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<"pause" | "cancel" | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (payload: { status?: string }) => {
      const res = await apiRequest("PATCH", `/api/subscriptions/plans/${subscription.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/plans"] });
      setConfirming(null);
      toast({ title: "Subscription updated" });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/subscriptions/plans/${subscription.id}/resume`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/plans"] });
      toast({ title: "Subscription resumed!" });
    },
    onError: (err: any) => {
      toast({ title: "Resume failed", description: err.message, variant: "destructive" });
    },
  });

  const Icon = SERVICE_ICONS[subscription.serviceType] || Home;
  const statusStyle = STATUS_STYLES[subscription.status] || STATUS_STYLES.active;
  const isPending = updateMutation.isPending || resumeMutation.isPending;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F47C20]/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#F47C20]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {subscription.serviceLabel}
              </h3>
              <p className="text-sm text-gray-500">
                {FREQUENCY_LABELS[subscription.frequency] || subscription.frequency}
              </p>
            </div>
          </div>
          <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 capitalize`}>
            {subscription.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <span>Next: {subscription.nextServiceDate || "-"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="capitalize">{subscription.preferredDay || "Flexible"} {subscription.preferredTime || ""}</span>
          </div>
          {subscription.city && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 col-span-2">
              <MapPin className="w-4 h-4" />
              <span>{subscription.city}, {subscription.state} {subscription.zip}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-lg font-bold text-[#F47C20]">
            ${subscription.price}/{subscription.frequency === "weekly" ? "wk" : subscription.frequency === "biweekly" ? "2wk" : "mo"}
          </span>

          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {confirming === "cancel" ? "Cancel?" : "Pause?"}
              </span>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => updateMutation.mutate({ status: confirming === "cancel" ? "cancelled" : "paused" })}
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirming(null)}>
                No
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {subscription.status === "active" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setConfirming("pause")}>
                    <Pause className="w-3 h-3 mr-1" /> Pause
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => setConfirming("cancel")}>
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                </>
              )}
              {subscription.status === "paused" && (
                <Button
                  size="sm"
                  className="bg-[#F47C20] hover:bg-[#e06b10] text-white"
                  disabled={isPending}
                  onClick={() => resumeMutation.mutate()}
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  Resume
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
