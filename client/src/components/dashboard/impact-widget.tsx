import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, Leaf, Users, TrendingUp, Zap, Download } from "lucide-react";

interface ImpactStats {
  totalJobs: number;
  totalWeightDiverted: number;
  totalCo2Saved: number;
  landfillDiversionRate: number;
  treesEquivalent: number;
  donationItems: number;
  valueProtected?: number;
  prosSupported?: number;
}

export function ImpactWidget() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<ImpactStats>({
    queryKey: ["/api/impact"],
    enabled: !!user,
  });

  const valueProtected = stats?.valueProtected ?? 0;
  const co2Saved = stats?.totalCo2Saved ?? 0;
  const weightDiverted = stats?.totalWeightDiverted ?? 0;
  const prosSupported = stats?.prosSupported ?? stats?.totalJobs ?? 0;

  if (isLoading) {
    return (
      <Card className="p-8" data-testid="card-impact-widget-loading">
        <div className="animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-7 bg-muted rounded w-56" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-muted rounded w-28" />
                <div className="h-9 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-40" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const pillars = [
    {
      id: "protect",
      icon: ShieldCheck,
      label: "Protected Value",
      value: `$${valueProtected.toLocaleString()}`,
      description: "Insurance Shield Active",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      id: "sustain",
      icon: Leaf,
      label: "CO2 Avoided",
      value: `${co2Saved.toFixed(1)} kg`,
      description: "Verified ESG Credits",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      id: "recover",
      icon: TrendingUp,
      label: "Materials Recovered",
      value: `${weightDiverted.toLocaleString()} lbs`,
      description: "Circular Economy Impact",
      color: "text-secondary dark:text-purple-400",
      bg: "bg-secondary/10",
    },
    {
      id: "connect",
      icon: Zap,
      label: "Pro Empowerment",
      value: `${prosSupported} hr${prosSupported !== 1 ? "s" : ""}`,
      description: "Local Jobs Created",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-4" data-testid="card-impact-widget">
      <Card className="p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3
              className="text-sm font-bold text-muted-foreground uppercase tracking-widest"
              data-testid="text-impact-widget-label"
            >
              Proven Impact
            </h3>
          </div>
          <p className="text-2xl font-black" data-testid="text-impact-widget-title">
            Home Intelligence Summary
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className={`p-4 rounded-lg ${pillar.bg}`}
              data-testid={`stat-pillar-${pillar.id}`}
            >
              <div className={`flex items-center gap-2 mb-2 ${pillar.color}`}>
                <pillar.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                {pillar.label}
              </p>
              <p
                className="text-2xl font-black"
                data-testid={`value-pillar-${pillar.id}`}
              >
                {pillar.value}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {(stats?.totalJobs ?? 0) > 0 && (
        <Card className="bg-card-foreground dark:bg-slate-900 text-card dark:text-white p-6" data-testid="card-climate-champion">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Leaf className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-black mb-1" data-testid="text-climate-champion-title">Climate Champion</h3>
                <p className="text-sm opacity-60 leading-relaxed">
                  Your residence has avoided {co2Saved.toFixed(0)}kg of CO2 emissions through verified material recovery and sustainable practices.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-green-400/50 text-green-400 flex-shrink-0"
              data-testid="button-download-esg-report"
            >
              <Download className="w-3 h-3 mr-1" />
              ESG Report
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
