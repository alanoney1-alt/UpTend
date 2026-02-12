import { safeFetchJson } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Droplets, Zap, TreePine, Recycle, Scale, TrendingUp } from "lucide-react";

interface EsgImpactLog {
  id: string;
  serviceRequestId: string;
  carbonFootprintLbs: number;
  carbonOffsetCost: number;
  carbonOffsetPurchased: boolean;
  haulDistanceMiles: number;
  totalWeightLbs: number;
  disposalBreakdown: string;
  aiCategorization: string;
  recycledWeightLbs: number;
  donatedWeightLbs: number;
  landfilledWeightLbs: number;
  eWasteWeightLbs: number;
  diversionRate: number;
  treesEquivalent: number;
  waterSavedGallons: number;
  energySavedKwh: number;
  createdAt: string;
}

interface EsgSummary {
  totalJobs: number;
  totalCarbonLbs: number;
  totalDivertedLbs: number;
  avgDiversionRate: number;
}

interface EsgImpactDashboardProps {
  customerId?: string;
  serviceRequestId?: string;
}

export function EsgImpactDashboard({ customerId, serviceRequestId }: EsgImpactDashboardProps) {
  const { data: summary } = useQuery<EsgSummary>({
    queryKey: ["/api/esg/summary"],
  });

  const { data: impactLog } = useQuery<EsgImpactLog>({
    queryKey: ["/api/esg/impact", serviceRequestId],
    queryFn: () => fetch(`/api/esg/impact/${serviceRequestId}`, { credentials: "include" }).then(r => {
      if (!r.ok) return null;
      return r.json();
    }),
    enabled: !!serviceRequestId,
  });

  const { data: customerLogs = [] } = useQuery<EsgImpactLog[]>({
    queryKey: ["/api/esg/customer", customerId],
    queryFn: () => safeFetchJson(`/api/esg/customer/${customerId}`),
    enabled: !!customerId,
  });

  const totalCustomerCarbon = customerLogs.reduce((sum, log) => sum + (log.carbonFootprintLbs || 0), 0);
  const totalCustomerDiverted = customerLogs.reduce((sum, log) => sum + (log.recycledWeightLbs || 0) + (log.donatedWeightLbs || 0), 0);
  const avgDiversion = customerLogs.length > 0
    ? customerLogs.reduce((sum, log) => sum + (log.diversionRate || 0), 0) / customerLogs.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-green-400" />
        <h3 className="text-lg font-semibold">Environmental Impact</h3>
      </div>

      {serviceRequestId && impactLog && (
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Job Impact Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ImpactStat
                icon={<Scale className="h-4 w-4 text-orange-400" />}
                label="Carbon Footprint"
                value={`${impactLog.carbonFootprintLbs.toFixed(1)} lbs`}
                testId="text-carbon-footprint"
              />
              <ImpactStat
                icon={<Recycle className="h-4 w-4 text-green-400" />}
                label="Diversion Rate"
                value={`${(impactLog.diversionRate * 100).toFixed(0)}%`}
                testId="text-diversion-rate"
              />
              <ImpactStat
                icon={<TreePine className="h-4 w-4 text-emerald-400" />}
                label="Trees Equivalent"
                value={impactLog.treesEquivalent.toFixed(2)}
                testId="text-trees-equiv"
              />
              <ImpactStat
                icon={<Droplets className="h-4 w-4 text-blue-400" />}
                label="Water Saved"
                value={`${impactLog.waterSavedGallons.toFixed(0)} gal`}
                testId="text-water-saved"
              />
            </div>

            {impactLog.disposalBreakdown && (
              <div className="mt-4" data-testid="disposal-breakdown">
                <p className="text-sm font-medium mb-2">Disposal Breakdown</p>
                <DisposalBar
                  recycled={impactLog.recycledWeightLbs}
                  donated={impactLog.donatedWeightLbs}
                  landfilled={impactLog.landfilledWeightLbs}
                  eWaste={impactLog.eWasteWeightLbs}
                  total={impactLog.totalWeightLbs}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card className="border-green-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              Platform-Wide Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ImpactStat
                icon={<Leaf className="h-4 w-4 text-green-400" />}
                label="Jobs Tracked"
                value={summary.totalJobs.toString()}
                testId="text-esg-total-jobs"
              />
              <ImpactStat
                icon={<Scale className="h-4 w-4 text-orange-400" />}
                label="Total Carbon"
                value={`${summary.totalCarbonLbs.toFixed(0)} lbs`}
                testId="text-esg-total-carbon"
              />
              <ImpactStat
                icon={<Recycle className="h-4 w-4 text-green-400" />}
                label="Waste Diverted"
                value={`${summary.totalDivertedLbs.toFixed(0)} lbs`}
                testId="text-esg-diverted"
              />
              <ImpactStat
                icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
                label="Avg Diversion"
                value={`${(summary.avgDiversionRate * 100).toFixed(0)}%`}
                testId="text-esg-avg-diversion"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {customerId && customerLogs.length > 0 && (
        <Card className="border-green-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Environmental Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <ImpactStat
                icon={<Scale className="h-4 w-4 text-orange-400" />}
                label="Your Carbon"
                value={`${totalCustomerCarbon.toFixed(0)} lbs`}
                testId="text-customer-carbon"
              />
              <ImpactStat
                icon={<Recycle className="h-4 w-4 text-green-400" />}
                label="Diverted"
                value={`${totalCustomerDiverted.toFixed(0)} lbs`}
                testId="text-customer-diverted"
              />
              <ImpactStat
                icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
                label="Diversion Rate"
                value={`${(avgDiversion * 100).toFixed(0)}%`}
                testId="text-customer-diversion"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ImpactStat({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value: string; testId: string }) {
  return (
    <div className="text-center space-y-1">
      <div className="flex justify-center">{icon}</div>
      <p className="text-lg font-bold" data-testid={testId}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DisposalBar({ recycled, donated, landfilled, eWaste, total }: { recycled: number; donated: number; landfilled: number; eWaste: number; total: number }) {
  if (total === 0) return null;
  const pRecycled = (recycled / total) * 100;
  const pDonated = (donated / total) * 100;
  const pEWaste = (eWaste / total) * 100;
  const pLandfilled = (landfilled / total) * 100;

  return (
    <div className="space-y-2">
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        {pRecycled > 0 && <div className="bg-green-500 h-full" style={{ width: `${pRecycled}%` }} />}
        {pDonated > 0 && <div className="bg-blue-500 h-full" style={{ width: `${pDonated}%` }} />}
        {pEWaste > 0 && <div className="bg-yellow-500 h-full" style={{ width: `${pEWaste}%` }} />}
        {pLandfilled > 0 && <div className="bg-red-500/60 h-full" style={{ width: `${pLandfilled}%` }} />}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {pRecycled > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Recycled {pRecycled.toFixed(0)}%</span>}
        {pDonated > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Donated {pDonated.toFixed(0)}%</span>}
        {pEWaste > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />E-Waste {pEWaste.toFixed(0)}%</span>}
        {pLandfilled > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/60" />Landfill {pLandfilled.toFixed(0)}%</span>}
      </div>
    </div>
  );
}
