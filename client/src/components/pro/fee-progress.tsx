import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, ArrowRight, Check, Lock, Sparkles, DollarSign } from "lucide-react";
import { Link } from "wouter";

interface FeeStatusData {
  feeRate: number;
  feePercent: number;
  tier: string;
  activeCertCount: number;
  isLlc: boolean;
  nextTierCertsNeeded: number;
  nextTierRate: number | null;
  nextTierPercent: number | null;
  monthlySavings: number;
  projectedNextTierSavings: number;
  recentEarnings: number;
  tiers: Array<{
    name: string;
    minCerts: number;
    rate: number;
    percent: number;
    isCurrent: boolean;
    isUnlocked: boolean;
  }>;
}

export function FeeProgressWidget() {
  const { data, isLoading } = useQuery<FeeStatusData>({
    queryKey: ["/api/pro/fee-status"],
  });

  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-20 bg-gray-200 rounded" />
      </Card>
    );
  }

  if (!data) return null;

  const {
    feePercent,
    tier,
    activeCertCount,
    isLlc,
    nextTierCertsNeeded,
    nextTierPercent,
    monthlySavings,
    projectedNextTierSavings,
    recentEarnings,
    tiers,
  } = data;

  const baselinePercent = 15;
  const hasDiscount = feePercent < baselinePercent;
  const isElite = tier === "Elite";

  // Color based on how good the rate is
  const rateColor = isElite
    ? "text-green-600"
    : hasDiscount
    ? "text-amber-600"
    : "text-gray-600";

  const rateBg = isElite
    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
    : hasDiscount
    ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
    : "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700";

  return (
    <Card className={`p-5 ${rateBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingDown className={`h-5 w-5 ${rateColor}`} />
          <h3 className="font-bold text-lg">Platform Fee</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-black ${rateColor}`}>{feePercent}%</span>
          {hasDiscount && (
            <Badge className="bg-amber-500 text-white text-xs">
              {baselinePercent - feePercent}% off
            </Badge>
          )}
        </div>
      </div>

      {/* Tier Ladder */}
      <div className="space-y-1.5 mb-4">
        {tiers.map((t, i) => {
          const isActive = t.isCurrent;
          const unlocked = t.isUnlocked;
          return (
            <div
              key={t.name}
              className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-white dark:bg-gray-800 shadow-sm border border-amber-300 dark:border-amber-700"
                  : unlocked
                  ? "bg-white/50 dark:bg-gray-800/50"
                  : "opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {unlocked ? (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isActive ? "bg-amber-500" : "bg-green-500"
                  }`}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <Lock className="h-3 w-3 text-gray-500" />
                  </div>
                )}
                <span className={`text-sm font-medium ${isActive ? "text-amber-900 dark:text-amber-200" : ""}`}>
                  {t.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.minCerts === 0 ? "Default" : `${t.minCerts}+ certs`}
                </span>
              </div>
              <span className={`text-sm font-bold ${isActive ? rateColor : "text-gray-500"}`}>
                {t.percent}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Savings Display */}
      {monthlySavings > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg mb-3">
          <DollarSign className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              You saved ${monthlySavings.toFixed(2)} this month
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              vs. the standard {baselinePercent}% rate
            </p>
          </div>
        </div>
      )}

      {/* Next Tier CTA */}
      {nextTierPercent !== null && nextTierCertsNeeded > 0 && (
        <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-dashed border-amber-300 dark:border-amber-700">
          <div>
            <p className="text-sm font-medium">
              Earn {nextTierCertsNeeded} more cert{nextTierCertsNeeded !== 1 ? "s" : ""} to drop to{" "}
              <span className="font-bold text-amber-600">{nextTierPercent}%</span>
            </p>
            {projectedNextTierSavings > 0 && (
              <p className="text-xs text-muted-foreground">
                That would save you ~${projectedNextTierSavings.toFixed(2)}/month
              </p>
            )}
          </div>
          <Link href="/academy">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              Get Certified <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Fully Certified Celebration */}
      {isElite && (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-100 to-green-100 dark:from-amber-950/50 dark:to-green-950/50 rounded-lg">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
               Elite Pro. Lowest fee rate unlocked!
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              You're paying the minimum {feePercent}% platform fee
            </p>
          </div>
        </div>
      )}

      {/* LLC info */}
      {isLlc && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          LLC + Insurance verified. baseline rate starts at 20%
        </p>
      )}
    </Card>
  );
}
