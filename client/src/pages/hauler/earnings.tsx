import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

interface PayoutRecord {
  id: number;
  serviceType: string;
  address: string;
  date: string;
  amount: number;
  status: string;
}

interface EarningsData {
  total: number;
  weekly: number;
  history: PayoutRecord[];
}

export default function EarningsPage() {
  const { data: earnings, isLoading } = useQuery<EarningsData>({
    queryKey: ["/api/hauler/earnings"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-earnings-loading">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const earningsData = earnings || { total: 0, weekly: 0, history: [] };

  const serviceLabels: Record<string, string> = {
    junk_removal: "Junk Removal",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    moving_labor: "Moving Labor",
    light_demolition: "Light Demolition",
    home_consultation: "Home Consultation",
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-earnings">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/hauler/dashboard" data-testid="link-earnings-back">
            <Button variant="ghost" size="icon" data-testid="button-earnings-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-earnings-title">My Earnings</h1>
            <p className="text-sm text-muted-foreground">Track your payouts and job history</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card data-testid="card-earnings-weekly">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-muted-foreground uppercase">This Week</p>
              </div>
              <h2 className="text-3xl font-bold" data-testid="text-earnings-weekly">
                ${(earningsData.weekly / 100).toFixed(2)}
              </h2>
            </CardContent>
          </Card>
          <Card data-testid="card-earnings-lifetime">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground uppercase">Lifetime</p>
              </div>
              <h2 className="text-3xl font-bold" data-testid="text-earnings-lifetime">
                ${(earningsData.total / 100).toFixed(2)}
              </h2>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-earnings-history">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" /> Recent Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {earningsData.history.map((job) => (
                <div
                  key={job.id}
                  className="py-4 flex justify-between items-center gap-4"
                  data-testid={`row-payout-${job.id}`}
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">
                      {serviceLabels[job.serviceType] || job.serviceType}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      +${(job.amount / 100).toFixed(2)}
                    </p>
                    <Badge variant="secondary">{job.status}</Badge>
                  </div>
                </div>
              ))}
              {earningsData.history.length === 0 && (
                <p className="text-center text-muted-foreground py-8" data-testid="text-no-payouts">
                  No completed jobs yet. Go get &apos;em!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
