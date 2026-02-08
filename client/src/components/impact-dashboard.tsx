import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Leaf, Recycle, TreePine, Droplets, TrendingUp, Award
} from "lucide-react";

interface ImpactData {
  totalJobs: number;
  totalWeightDiverted: number;
  totalCo2Saved: number;
  landfillDiversionRate: number;
  treesEquivalent: number;
  donationItems: number;
}

export function ImpactDashboard() {
  const { user } = useAuth();

  const { data: impact, isLoading } = useQuery<ImpactData>({
    queryKey: ["/api/impact"],
    enabled: !!user,
  });

  const stats = impact || {
    totalJobs: 0,
    totalWeightDiverted: 0,
    totalCo2Saved: 0,
    landfillDiversionRate: 0,
    treesEquivalent: 0,
    donationItems: 0,
  };

  const impactItems = [
    {
      icon: Recycle,
      label: "Landfill Diverted",
      value: `${stats.totalWeightDiverted.toLocaleString()} lbs`,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      icon: Leaf,
      label: "CO2 Saved",
      value: `${stats.totalCo2Saved.toFixed(1)} kg`,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      icon: TreePine,
      label: "Trees Equivalent",
      value: `${stats.treesEquivalent}`,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-100 dark:bg-teal-900/30",
    },
    {
      icon: Droplets,
      label: "Items Donated",
      value: `${stats.donationItems}`,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
  ];

  if (isLoading) {
    return (
      <Card className="p-6" data-testid="card-impact-dashboard-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid="card-impact-dashboard">
      <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg" data-testid="text-impact-title">Your Proven Impact</h3>
            <p className="text-xs text-muted-foreground">Tracked across {stats.totalJobs} completed jobs</p>
          </div>
        </div>
        {stats.totalJobs > 0 && (
          <Badge variant="secondary" data-testid="badge-diversion-rate">
            <Leaf className="w-3 h-3 mr-1" />
            {stats.landfillDiversionRate}% Diversion Rate
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {impactItems.map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-lg bg-muted/50"
            data-testid={`stat-impact-${item.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${item.bg} rounded-md flex items-center justify-center`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold" data-testid={`value-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {stats.totalJobs === 0 ? (
        <div className="text-center py-4 bg-muted/30 rounded-lg" data-testid="text-impact-empty">
          <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Complete your first job to start tracking your environmental impact.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800" data-testid="card-impact-summary">
          <p className="text-sm text-green-800 dark:text-green-300">
            <strong>Your impact matters.</strong> By choosing UpTend, you've helped divert {stats.totalWeightDiverted.toLocaleString()} lbs from landfills
            and saved the equivalent of {stats.treesEquivalent} trees in carbon emissions.
          </p>
        </div>
      )}
    </Card>
  );
}
