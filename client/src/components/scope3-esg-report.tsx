import { safeFetchJson } from "@/lib/queryClient";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { FileBarChart, Leaf, Droplets, DollarSign, Recycle, Download, Shield, TrendingUp, Scale } from "lucide-react";
import { ServiceBreakdownChart, ServiceBreakdownData } from "@/components/esg/service-breakdown-chart";

interface EsgReport {
  id: string;
  reportMonth: number;
  reportYear: number;
  totalJobsCount: number;
  co2SavedKg: number;
  landfillDiversionLbs: number;
  taxCreditsUnlockedUsd: number;
  waterSavedGallons: number;
  energySavedKwh: number;
  totalCarbonFootprintLbs: number;
  deadheadMilesSaved: number;
  circularEconomyLbs: number;
  auditReady: boolean;
  reportData: string;
  generatedAt: string;
}

interface Scope3EsgReportProps {
  businessAccountId: string;
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function Scope3EsgReport({ businessAccountId }: Scope3EsgReportProps) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { data: reports = [], isLoading } = useQuery<EsgReport[]>({
    queryKey: ["/api/esg/reports", businessAccountId],
    queryFn: () => safeFetchJson(`/api/esg/reports/${businessAccountId}`),
  });

  // Fetch service breakdown data
  const { data: serviceBreakdown } = useQuery<{ success: boolean; data: ServiceBreakdownData[] }>({
    queryKey: [`/api/business/${businessAccountId}/esg-metrics/by-service`],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessAccountId}/esg-metrics?groupBy=service_type`, {
        credentials: "include",
      });
      if (!response.ok) return { success: false, data: [] };
      const result = await response.json();
      return {
        success: true,
        data: result.serviceTypeBreakdown || []
      };
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/esg/generate-report", {
        businessAccountId,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esg/reports", businessAccountId] });
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const latestReport = reports[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold">Scope 3 ESG Reports</h3>
          <Badge variant="outline" className="text-green-400 border-green-500/30">GHG Protocol</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Month</p>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-36" data-testid="select-report-month"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Year</p>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24" data-testid="select-report-year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(currentYear)}>{currentYear}</SelectItem>
                  <SelectItem value={String(currentYear - 1)}>{currentYear - 1}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} data-testid="button-generate-report">
              <FileBarChart className="h-4 w-4 mr-1" />
              {generateMutation.isPending ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generateMutation.data && (
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              ESG Ledger
              <Badge variant="outline" className="text-green-400 border-green-500/30">Audit-Ready</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <LedgerCard
                icon={<Scale className="h-5 w-5 text-emerald-400" />}
                label="CO2 Saved"
                value={`${generateMutation.data.ledger.co2_saved_kg.toFixed(1)} kg`}
                testId="text-ledger-co2"
              />
              <LedgerCard
                icon={<Recycle className="h-5 w-5 text-green-400" />}
                label="Landfill Diversion"
                value={`${generateMutation.data.ledger.landfill_diversion_lbs.toFixed(0)} lbs`}
                testId="text-ledger-diversion"
              />
              <LedgerCard
                icon={<DollarSign className="h-5 w-5 text-primary" />}
                label="Tax Credits Unlocked"
                value={`$${generateMutation.data.ledger.tax_credits_unlocked_usd.toFixed(2)}`}
                testId="text-ledger-credits"
              />
              <LedgerCard
                icon={<Droplets className="h-5 w-5 text-blue-400" />}
                label="Water Saved"
                value={`${generateMutation.data.ledger.water_saved_gallons.toFixed(0)} gal`}
                testId="text-ledger-water"
              />
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <pre className="text-xs overflow-auto" data-testid="text-ledger-json">
{JSON.stringify(generateMutation.data.ledger, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Breakdown Chart */}
      {serviceBreakdown?.data && serviceBreakdown.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Service Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceBreakdownChart data={serviceBreakdown.data} metric="co2" />
          </CardContent>
        </Card>
      )}

      {reports.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Report History</p>
          {reports.map((report) => {
            let reportMeta: any = {};
            try { reportMeta = JSON.parse(report.reportData || "{}"); } catch {}

            return (
              <Card key={report.id} className="p-3" data-testid={`card-report-${report.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <FileBarChart className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {monthNames[report.reportMonth - 1]} {report.reportYear}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.totalJobsCount} jobs / {report.co2SavedKg.toFixed(1)} kg CO2 saved
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.auditReady && (
                      <Badge variant="outline" className="text-green-400 border-green-500/30">
                        <Shield className="h-3 w-3 mr-1" /> Audit-Ready
                      </Badge>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">${report.taxCreditsUnlockedUsd.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">tax credits</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LedgerCard({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value: string; testId: string }) {
  return (
    <div className="text-center space-y-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex justify-center">{icon}</div>
      <p className="text-xl font-bold" data-testid={testId}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
