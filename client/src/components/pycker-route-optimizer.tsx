import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, RefreshCw, Navigation, Loader2 } from "lucide-react";

interface Job {
  id: string;
  pickupAddress: string;
  pickupCity: string;
  pickupZip: string;
  serviceType: string;
  status: string;
  scheduledFor: string;
  priceEstimate: number;
  routeOrder: number;
}

interface PyckerRouteOptimizerProps {
  haulerId: string;
}

export function PyckerRouteOptimizer({ haulerId }: PyckerRouteOptimizerProps) {
  const { data, isLoading, refetch } = useQuery<{
    jobs: Job[];
    optimized: boolean;
    totalJobs: number;
    message?: string;
  }>({
    queryKey: [`/api/haulers/${haulerId}/optimized-route`],
  });

  if (isLoading) {
    return (
      <Card data-testid="container-route-optimizer" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <h3 className="font-semibold">Optimizing route...</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </Card>
    );
  }
  const jobs = data?.jobs || [];
  if (!data?.optimized || jobs.length <= 1) return (
      <Card data-testid="container-route-optimizer" className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Navigation className="w-5 h-5" />
          <span>{data?.message || "No route optimization needed"}</span>
        </div>
      </Card>
    );

  const formatServiceType = (type: string) =>
    type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "N/A";
    }
  };

  return (
    <Card data-testid="container-route-optimizer" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg">Optimized Route</h3>
          <p className="text-sm text-muted-foreground">
            {data.totalJobs} stop{data.totalJobs !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          data-testid="button-reoptimize"
          size="sm"
          variant="outline"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-optimize
        </Button>
      </div>
      <div className="space-y-3">
        {jobs.map((job, i) => (
          <Card key={job.id} data-testid={`card-route-stop-${i}`} className="p-4 border border-border/50">
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
                {job.routeOrder || i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {job.pickupAddress}
                    </p>
                    <p className="text-xs text-muted-foreground">{job.pickupCity}, {job.pickupZip}</p>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">{job.status}</Badge>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-xs">
                  <span className="text-muted-foreground">{formatServiceType(job.serviceType)}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(job.scheduledFor)}
                  </span>
                  <span className="font-semibold text-primary">${job.priceEstimate.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
