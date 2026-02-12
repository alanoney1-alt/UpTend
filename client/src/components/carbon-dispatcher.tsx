import { safeFetchJson } from "@/lib/queryClient";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Route, Leaf, Truck, TrendingDown, Zap, MapPin } from "lucide-react";

interface DispatchBatch {
  id: string;
  batchDate: string;
  region: string;
  jobIds: string;
  totalDistanceMiles: number;
  optimizedDistanceMiles: number;
  deadheadMilesSaved: number;
  co2SavedLbs: number;
  discountOffered: number;
  status: string;
}

interface OptimizationResult {
  batches: DispatchBatch[];
  summary: {
    totalBatches: number;
    totalJobsBatched: number;
    totalCo2SavedLbs: number;
    totalDeadheadMilesSaved: number;
    avgDiscountPerJob: number;
  };
}

export function CarbonDispatcher() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const { data: batches = [], isLoading } = useQuery<DispatchBatch[]>({
    queryKey: ["/api/dispatch/batches", today],
    queryFn: () => safeFetchJson(`/api/dispatch/batches?date=${today}`),
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/dispatch/optimize");
      return res.json();
    },
    onSuccess: (data: OptimizationResult) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch/batches"] });
    },
  });

  const acceptBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const res = await apiRequest("PATCH", `/api/dispatch/batches/${batchId}`, { status: "accepted" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch/batches"] });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold">Carbon-Intelligent Dispatch</h3>
        </div>
        <Button
          size="sm"
          onClick={() => optimizeMutation.mutate()}
          disabled={optimizeMutation.isPending}
          data-testid="button-optimize-dispatch"
        >
          <Zap className="w-4 h-4 mr-1" />
          {optimizeMutation.isPending ? "Optimizing..." : "Optimize Routes"}
        </Button>
      </div>

      {result && (
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-400" />
              Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={<Truck className="h-4 w-4 text-primary" />} label="Jobs Batched" value={result.summary.totalJobsBatched.toString()} testId="text-jobs-batched" />
              <StatCard icon={<Route className="h-4 w-4 text-blue-400" />} label="Miles Saved" value={`${result.summary.totalDeadheadMilesSaved.toFixed(1)} mi`} testId="text-miles-saved" />
              <StatCard icon={<Leaf className="h-4 w-4 text-green-400" />} label="CO2 Saved" value={`${result.summary.totalCo2SavedLbs.toFixed(1)} lbs`} testId="text-co2-saved" />
              <StatCard icon={<TrendingDown className="h-4 w-4 text-emerald-400" />} label="Avg Discount" value={`$${result.summary.avgDiscountPerJob.toFixed(0)}`} testId="text-avg-discount" />
            </div>
          </CardContent>
        </Card>
      )}

      {(result?.batches || batches).length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Route Batches</p>
          {(result?.batches || batches).map((batch) => {
            const jobCount = JSON.parse(batch.jobIds || "[]").length;
            return (
              <Card key={batch.id} className="p-3" data-testid={`card-batch-${batch.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <MapPin className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{jobCount} jobs in region</p>
                      <p className="text-xs text-muted-foreground">
                        {batch.deadheadMilesSaved.toFixed(1)} mi saved / {batch.co2SavedLbs.toFixed(1)} lbs CO2 avoided
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {batch.discountOffered > 0 && (
                      <Badge variant="secondary">-${batch.discountOffered} discount</Badge>
                    )}
                    <Badge variant={batch.status === "accepted" ? "default" : "outline"}>
                      {batch.status}
                    </Badge>
                    {batch.status === "proposed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acceptBatchMutation.mutate(batch.id)}
                        disabled={acceptBatchMutation.isPending}
                        data-testid={`button-accept-batch-${batch.id}`}
                      >
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!result && batches.length === 0 && (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click "Optimize Routes" to find carbon-efficient batches</p>
            <p className="text-xs mt-1">The AI groups nearby jobs to minimize deadhead miles and CO2 emissions</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value: string; testId: string }) {
  return (
    <div className="text-center space-y-1">
      <div className="flex justify-center">{icon}</div>
      <p className="text-lg font-bold" data-testid={testId}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
