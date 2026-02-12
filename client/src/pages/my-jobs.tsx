import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { Loader2, Package, ArrowRight, Clock, MapPin } from "lucide-react";
import { formatServiceType, safeFormatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  matching: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const statusLabels: Record<string, string> = {
  matching: "Finding Pro",
  assigned: "Pro Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function MyJobs() {
  const [, navigate] = useLocation();

  const { data: jobs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/my-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/my-jobs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load jobs");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">My Jobs</h1>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Jobs Yet</h2>
              <p className="text-muted-foreground mb-4">Book your first service to get started.</p>
              <Button onClick={() => navigate("/book")}>Book Now</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job: any) => (
                <Card
                  key={job.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/track/${job.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {formatServiceType(job.serviceType || "")}
                        </span>
                        <Badge className={statusColors[job.status] || ""}>
                          {statusLabels[job.status] || job.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{job.pickupAddress || `${job.pickupCity || ""} ${job.pickupZip || ""}`.trim() || "—"}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {safeFormatDate(job.createdAt)}
                        </span>
                        {(job.livePrice || job.priceEstimate) && (
                          <span className="font-medium text-foreground">
                            ${(job.livePrice || job.priceEstimate || 0).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
