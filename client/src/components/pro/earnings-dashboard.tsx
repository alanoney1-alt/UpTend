import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DollarSign, TrendingUp, Clock, Zap, ArrowRight, CheckCircle,
  AlertCircle, ExternalLink, CreditCard, Loader2,
} from "lucide-react";

interface PayoutDashboardData {
  stats: {
    totalEarned: number;
    thisMonth: number;
    thisWeek: number;
    pending: number;
    pendingCount: number;
    nextPayoutDate: string | null;
    nextPayoutAmount: number;
    instantFeeSaved: number;
  };
  recentPayouts: Array<{
    id: string;
    serviceRequestId: string;
    netPayout: number;
    platformFee: number;
    feeRate: number;
    instantPayout: boolean;
    instantFee: number;
    status: string;
    scheduledFor: string;
    paidAt: string;
    createdAt: string;
    jobServiceType: string;
    jobAddress: string;
  }>;
  account: {
    onboardingComplete: boolean;
    stripeAccountStatus: string;
    payoutSpeed: string;
    instantPayoutEligible: boolean;
    bankLast4: string;
    bankName: string;
  } | null;
}

const SERVICE_LABELS: Record<string, string> = {
  junk_removal: "Junk Removal",
  furniture_moving: "Furniture Moving",
  garage_cleanout: "Garage Cleanout",
  estate_cleanout: "Estate Cleanout",
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  moving_labor: "Moving Labor",
  light_demolition: "Light Demolition",
  home_consultation: "Home Consultation",
  home_cleaning: "Home Cleaning",
  pool_cleaning: "Pool Cleaning",
  carpet_cleaning: "Carpet Cleaning",
  landscaping: "Landscaping",
  handyman: "Handyman Services",
  truck_unloading: "Truck Unloading",
};

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  reversed: { label: "Reversed", variant: "destructive" },
};

function centsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function EarningsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PayoutDashboardData>({
    queryKey: ["/api/pro/payouts/dashboard"],
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pro/payouts/setup");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else if (data.onboardingComplete) {
        toast({ title: "Already set up!", description: "Your payout account is active." });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    },
  });

  const instantPayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const res = await apiRequest("POST", `/api/pro/payouts/${payoutId}/instant`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Instant payout initiated! ⚡", description: "Funds should arrive within minutes." });
      queryClient.invalidateQueries({ queryKey: ["/api/pro/payouts/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Instant payout failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  // Not set up - show CTA
  if (!data?.account) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CreditCard className="w-12 h-12 mx-auto mb-4 text-amber-600" />
        <h3 className="text-xl font-bold mb-2">Set Up Direct Deposit</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Get paid automatically when jobs complete. Standard payouts arrive in 2 business days, or get paid instantly with a debit card.
        </p>
        <Button
          onClick={() => setupMutation.mutate()}
          disabled={setupMutation.isPending}
          className="bg-amber-600 hover:bg-amber-700"
          size="lg"
        >
          {setupMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          Set Up Direct Deposit →
        </Button>
      </Card>
    );
  }

  // Account restricted/pending
  if (!data.account.onboardingComplete) {
    return (
      <Card className="p-8 text-center border-amber-200 bg-amber-50">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
        <h3 className="text-xl font-bold mb-2">Complete Your Payout Setup</h3>
        <p className="text-muted-foreground mb-6">
          Your account setup is incomplete. Finish setting up to start receiving payouts.
        </p>
        <Button
          onClick={() => setupMutation.mutate()}
          disabled={setupMutation.isPending}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {setupMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Continue Setup <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    );
  }

  const { stats, recentPayouts, account } = data;

  // Find pending payouts eligible for instant
  const pendingPayouts = recentPayouts.filter(
    (p) => (p.status === "pending" || p.status === "processing") && !p.instantPayout
  );

  return (
    <div className="space-y-6">
      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">This Week</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold">{centsToDisplay(stats.thisWeek)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">This Month</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold">{centsToDisplay(stats.thisMonth)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">All Time</span>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{centsToDisplay(stats.totalEarned)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Pending</span>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{centsToDisplay(stats.pending)}</p>
          {stats.pendingCount > 0 && (
            <p className="text-xs text-muted-foreground">{stats.pendingCount} payout{stats.pendingCount > 1 ? "s" : ""}</p>
          )}
        </Card>
      </div>

      {/* Next Payout + Instant Payout */}
      {stats.nextPayoutDate && (
        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Next Payout</p>
              <p className="text-xl font-bold">
                {centsToDisplay(stats.nextPayoutAmount)} arriving{" "}
                {new Date(stats.nextPayoutDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            {account.instantPayoutEligible && pendingPayouts.length > 0 && (
              <Button
                onClick={() => instantPayoutMutation.mutate(pendingPayouts[0].id)}
                disabled={instantPayoutMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {instantPayoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Get Paid Now ⚡
                <span className="ml-2 text-xs opacity-80">
                  1.5% fee ({centsToDisplay(Math.max(50, Math.round(pendingPayouts[0].netPayout * 0.015)))})
                </span>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Bank Info */}
      {account.bankName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="w-4 h-4" />
          <span>Payouts to {account.bankName} ••••{account.bankLast4}</span>
          <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
        </div>
      )}

      {/* Recent Payouts */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Payouts</h3>
        {recentPayouts.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p>No payouts yet. Complete jobs to start earning!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentPayouts.map((payout) => {
              const statusInfo = STATUS_BADGES[payout.status] || STATUS_BADGES.pending;
              return (
                <Card key={payout.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {SERVICE_LABELS[payout.jobServiceType] || payout.jobServiceType || "Job"}
                      </span>
                      <Badge variant={statusInfo.variant} className="shrink-0">
                        {statusInfo.label}
                      </Badge>
                      {payout.instantPayout && (
                        <Badge variant="outline" className="shrink-0 text-amber-600 border-amber-200">
                          <Zap className="w-3 h-3 mr-1" /> Instant
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {payout.jobAddress || "—"} •{" "}
                      {new Date(payout.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold">{centsToDisplay(payout.netPayout)}</p>
                    {payout.instantFee > 0 && (
                      <p className="text-xs text-muted-foreground">-{centsToDisplay(payout.instantFee)} fee</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
