import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, TreePine, Recycle, Droplets, Zap, Truck, Scale, TrendingUp } from "lucide-react";

interface PlatformStats {
  totalJobsAudited: number;
  totalCo2SavedKg: number;
  totalCo2SavedTonnes: number;
  totalCo2EmittedKg: number;
  totalLandfillDivertedLbs: number;
  totalRecycledLbs: number;
  totalDonatedLbs: number;
  totalEwasteLbs: number;
  treesEquivalent: number;
  waterSavedGallons: number;
  energySavedKwh: number;
  avgDiversionRate: number;
  deadheadMilesSaved: number;
  lastAuditedAt: string | null;
}

function AnimatedCounter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  return (
    <span className="tabular-nums">
      {value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, suffix, decimals, color, testId }: {
  icon: typeof Leaf;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  color: string;
  testId: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-4" data-testid={testId}>
      <div className={`p-2 rounded-md ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold font-mono tracking-tight">
        <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
      </p>
      <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

export function SustainabilityDashboard() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/platform/sustainability-stats"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <section className="py-16 px-4" data-testid="section-sustainability">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="text-green-400 border-green-500/30 mb-3">
              <Leaf className="h-3 w-3 mr-1" /> Live Impact Tracker
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight font-heading">Our Sustainability Impact</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-20 bg-muted rounded" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const co2Tonnes = stats?.totalCo2SavedTonnes || 0;
  const diverted = stats?.totalLandfillDivertedLbs || 0;
  const trees = stats?.treesEquivalent || 0;
  const water = stats?.waterSavedGallons || 0;
  const jobs = stats?.totalJobsAudited || 0;
  const deadhead = stats?.deadheadMilesSaved || 0;
  const recycled = stats?.totalRecycledLbs || 0;
  const donated = stats?.totalDonatedLbs || 0;
  const diversionRate = stats?.avgDiversionRate || 0;

  return (
    <section className="py-16 px-4" data-testid="section-sustainability">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="outline" className="text-green-400 border-green-500/30 mb-3">
            <Leaf className="h-3 w-3 mr-1" /> Live Impact Tracker
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight font-heading">
            Our Sustainability Impact
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Every UpTend job is audited nightly by our ESG Auditor. Here's how much good we've done for the planet.
          </p>
        </div>

        <Card className="p-6 md:p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-6 w-6 text-green-400" />
              <span className="text-4xl md:text-5xl font-bold font-mono text-green-400" data-testid="text-co2-tonnes">
                <AnimatedCounter value={co2Tonnes} decimals={2} />
              </span>
            </div>
            <p className="text-lg text-muted-foreground">
              Tonnes of CO<sub>2</sub> Saved
            </p>
            {jobs > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Across {jobs.toLocaleString()} audited jobs
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              icon={TreePine}
              label="Trees Equivalent"
              value={trees}
              decimals={0}
              color="bg-green-500/10 text-green-400"
              testId="stat-trees"
            />
            <StatCard
              icon={Recycle}
              label="Lbs Diverted from Landfill"
              value={diverted}
              decimals={0}
              color="bg-primary/10 text-primary"
              testId="stat-diverted"
            />
            <StatCard
              icon={Droplets}
              label="Gallons of Water Saved"
              value={water}
              decimals={0}
              color="bg-secondary/10 text-secondary"
              testId="stat-water"
            />
            <StatCard
              icon={Truck}
              label="Deadhead Miles Saved"
              value={deadhead}
              decimals={0}
              color="bg-orange-500/10 text-orange-400"
              testId="stat-deadhead"
            />
          </div>

          {(recycled > 0 || donated > 0) && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div data-testid="stat-recycled">
                  <p className="text-lg font-bold font-mono">{recycled.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Lbs Recycled</p>
                </div>
                <div data-testid="stat-donated">
                  <p className="text-lg font-bold font-mono">{donated.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Lbs Donated</p>
                </div>
                <div data-testid="stat-diversion-rate">
                  <p className="text-lg font-bold font-mono text-green-400">
                    {diversionRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Diversion Rate</p>
                </div>
              </div>
            </div>
          )}

          {stats?.lastAuditedAt && (
            <p className="text-xs text-muted-foreground text-center mt-4" data-testid="text-last-audited">
              Last audited: {new Date(stats.lastAuditedAt).toLocaleString()}
            </p>
          )}
        </Card>
      </div>
    </section>
  );
}
