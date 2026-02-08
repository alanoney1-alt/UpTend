import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ShieldCheck, FileText, Wrench, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ScoreData {
  totalScore: number;
  maintenanceHealth: number;
  documentationHealth: number;
  safetyHealth: number;
  label: string;
  percentile: number;
  history: Array<{
    id: string;
    pointsChanged: number;
    reason: string;
    category: string;
    createdAt: string;
  }>;
}

export function HomeScoreWidget() {
  const { data: scoreData, isLoading } = useQuery<ScoreData>({
    queryKey: ["/api/home-score"],
  });

  const boostMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/home-score/boost"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-score"] });
    },
  });

  const score = scoreData?.totalScore || 0;
  const history = scoreData?.history || [];

  const getScoreColor = (s: number) => {
    if (s >= 750) return "text-green-600 dark:text-green-400";
    if (s >= 650) return "text-blue-600 dark:text-blue-400";
    if (s >= 550) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-500 dark:text-orange-400";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-12 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-home-score">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          UpTend Property Score
        </CardTitle>
        <ShieldCheck className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <div className={`text-5xl font-bold ${getScoreColor(score)}`} data-testid="text-home-score-value">
            {score}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {scoreData?.label || "Not Rated"} {score > 0 && `\u2022 Top ${scoreData?.percentile || 50}%`}
          </p>
        </div>

        <div className="w-full bg-secondary h-2 rounded-full mb-4 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-1000"
            style={{ width: `${(score / 850) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs mt-4">
          <div className="p-2 bg-muted rounded-md">
            <Wrench className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <span className="text-muted-foreground">Maint.</span>
            <p className="font-bold">{scoreData?.maintenanceHealth || 0}</p>
          </div>
          <div className="p-2 bg-muted rounded-md">
            <FileText className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <span className="text-muted-foreground">Docs</span>
            <p className="font-bold">{scoreData?.documentationHealth || 0}</p>
          </div>
          <div className="p-2 bg-muted rounded-md">
            <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <span className="text-muted-foreground">Safety</span>
            <p className="font-bold">{scoreData?.safetyHealth || 0}</p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold mb-2">Recent Impacts</p>
            {history.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs py-1">
                <span className="text-muted-foreground truncate mr-2">{item.reason}</span>
                <span className="text-green-600 dark:text-green-400 font-bold flex items-center shrink-0">
                  <ArrowUp className="w-3 h-3 mr-0.5" />
                  +{item.pointsChanged}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => boostMutation.mutate()}
          disabled={boostMutation.isPending}
          data-testid="button-boost-score"
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          {boostMutation.isPending ? "Boosting..." : "Boost Score (+50 Pts)"}
        </Button>
      </CardContent>
    </Card>
  );
}
