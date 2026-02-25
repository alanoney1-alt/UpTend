/**
 * MyRates — Pro Dashboard component for setting custom rates
 * 
 * Shows platform recommended rate, min/max range, and pro's current rate.
 * Displays "What you'll earn per job" (rate - 15% = payout).
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Save, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ServiceRate {
  serviceType: string;
  displayName: string;
  description: string;
  unit: string;
  recommendedRate: number;
  minRate: number;
  maxRate: number;
  currentRate: number;
  isCustom: boolean;
  proPayout: number;
  proPayoutPercent: number;
}

export function MyRates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ rates: ServiceRate[] }>({
    queryKey: ["/api/haulers/my-rates"],
  });

  const [editedRates, setEditedRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (data?.rates) {
      const initial: Record<string, number> = {};
      data.rates.forEach((r) => {
        initial[r.serviceType] = r.currentRate;
      });
      setEditedRates(initial);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (rates: { serviceType: string; baseRate: number }[]) => {
      const res = await apiRequest("POST", "/api/haulers/my-rates", { rates });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/haulers/my-rates"] });
      toast({
        title: "Rates saved",
        description: data.errors?.length
          ? `${data.updated.length} saved, ${data.errors.length} errors`
          : `${data.updated.length} rates updated`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveAll = () => {
    const rates = Object.entries(editedRates).map(([serviceType, baseRate]) => ({
      serviceType,
      baseRate,
    }));
    saveMutation.mutate(rates);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const rates = data?.rates || [];

  if (rates.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted-foreground text-center">No services configured. Update your profile to add services.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#ea580c]" />
            My Rates
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set your rate per service. You keep 85% of every job.
          </p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={saveMutation.isPending}
          className="bg-[#ea580c] hover:bg-[#dc4c08] text-white font-semibold"
          size="sm"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          Save All
        </Button>
      </div>

      {/* Rate Cards */}
      {rates.map((rate) => {
        const currentValue = editedRates[rate.serviceType] ?? rate.currentRate;
        const payout = Math.max(50, Math.round(currentValue * 0.85 * 100) / 100);
        const isChanged = currentValue !== rate.currentRate;

        return (
          <Card key={rate.serviceType} className={`${isChanged ? "border-[#ea580c]/30" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-sm">{rate.displayName}</span>
                  <span className="text-xs text-muted-foreground ml-2">/ {rate.unit}</span>
                </div>
                {rate.isCustom && (
                  <Badge variant="secondary" className="text-[10px]">Custom</Badge>
                )}
              </div>

              {/* Slider */}
              <div className="mb-3">
                <input
                  type="range"
                  min={rate.minRate}
                  max={rate.maxRate}
                  step={1}
                  value={currentValue}
                  onChange={(e) =>
                    setEditedRates((prev) => ({
                      ...prev,
                      [rate.serviceType]: Number(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#ea580c]"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>${rate.minRate}</span>
                  <span className="text-[#ea580c] font-semibold">
                    Recommended: ${rate.recommendedRate}
                  </span>
                  <span>${rate.maxRate}</span>
                </div>
              </div>

              {/* Rate + Payout */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                <div>
                  <span className="text-xs text-muted-foreground">Your rate</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    ${currentValue}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">You keep (85%)</span>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${payout.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Info Note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
        <Info className="w-4 h-4 text-[#ea580c] mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          15% platform fee covers payment processing, insurance verification, customer support, and marketing. Minimum payout per job: $50.
        </p>
      </div>
    </div>
  );
}
