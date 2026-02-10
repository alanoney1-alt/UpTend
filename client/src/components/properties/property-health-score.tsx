import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  Wind,
  PaintBucket,
  Sofa,
  Trees,
  Waves,
  Zap,
  Wrench,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyHealthScoreProps {
  propertyId: string;
}

interface HealthScore {
  overallScore: number;
  categoryScores: {
    roof: { score: number; weight: number; factors: string[] };
    hvac: { score: number; weight: number; factors: string[] };
    exterior: { score: number; weight: number; factors: string[] };
    interior: { score: number; weight: number; factors: string[] };
    landscape: { score: number; weight: number; factors: string[] };
    pool: { score: number; weight: number; factors: string[] };
    appliances: { score: number; weight: number; factors: string[] };
    maintenance: { score: number; weight: number; factors: string[] };
  };
  trend?: "up" | "down" | "stable";
  lastUpdated: string;
}

const categoryIcons = {
  roof: Home,
  hvac: Wind,
  exterior: PaintBucket,
  interior: Sofa,
  landscape: Trees,
  pool: Waves,
  appliances: Zap,
  maintenance: Wrench,
};

const categoryLabels = {
  roof: "Roof",
  hvac: "HVAC",
  exterior: "Exterior",
  interior: "Interior",
  landscape: "Landscape",
  pool: "Pool",
  appliances: "Appliances",
  maintenance: "Maintenance",
};

export function PropertyHealthScore({ propertyId }: PropertyHealthScoreProps) {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchHealthScore();
  }, [propertyId]);

  async function fetchHealthScore() {
    try {
      const response = await fetch(`/api/properties/${propertyId}/health-score`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setHealthScore(data);
      }
    } catch (error) {
      console.error("Failed to fetch health score:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateHealthScore() {
    setUpdating(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/health-score/update`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setHealthScore(data);
      }
    } catch (error) {
      console.error("Failed to update health score:", error);
    } finally {
      setUpdating(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  }

  function getScoreBgColor(score: number) {
    if (score >= 90) return "bg-green-100 border-green-300";
    if (score >= 75) return "bg-blue-100 border-blue-300";
    if (score >= 60) return "bg-yellow-100 border-yellow-300";
    if (score >= 40) return "bg-orange-100 border-orange-300";
    return "bg-red-100 border-red-300";
  }

  function getScoreLabel(score: number) {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 40) return "Needs Attention";
    return "Critical";
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthScore) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No health score data available yet</p>
            <Button onClick={updateHealthScore} disabled={updating}>
              {updating ? "Calculating..." : "Calculate Health Score"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Property Health Score</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={updateHealthScore}
            disabled={updating}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", updating && "animate-spin")} />
            Update
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Circular Score Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Background circle */}
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  className="text-gray-200"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthScore.overallScore / 100) * 553} 553`}
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    healthScore.overallScore >= 90 && "text-green-500",
                    healthScore.overallScore >= 75 && healthScore.overallScore < 90 && "text-blue-500",
                    healthScore.overallScore >= 60 && healthScore.overallScore < 75 && "text-yellow-500",
                    healthScore.overallScore >= 40 && healthScore.overallScore < 60 && "text-orange-500",
                    healthScore.overallScore < 40 && "text-red-500"
                  )}
                />
              </svg>
              {/* Score text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-5xl font-bold", getScoreColor(healthScore.overallScore))}>
                  {healthScore.overallScore}
                </span>
                <span className="text-sm text-muted-foreground mt-1">out of 100</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge
                variant="secondary"
                className={cn("text-base px-4 py-1", getScoreBgColor(healthScore.overallScore))}
              >
                {getScoreLabel(healthScore.overallScore)}
              </Badge>
              {healthScore.trend && (
                <div className="flex items-center justify-center gap-1 mt-2 text-sm">
                  {healthScore.trend === "up" && (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Improving</span>
                    </>
                  )}
                  {healthScore.trend === "down" && (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Declining</span>
                    </>
                  )}
                  {healthScore.trend === "stable" && (
                    <span className="text-muted-foreground">Stable</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-semibold text-lg mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(healthScore.categoryScores).map(([key, category]) => {
                const Icon = categoryIcons[key as keyof typeof categoryIcons];
                const label = categoryLabels[key as keyof typeof categoryLabels];

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(category.weight * 100).toFixed(0)}% weight)
                        </span>
                      </div>
                      <span className={cn("font-bold", getScoreColor(category.score))}>
                        {category.score}/100
                      </span>
                    </div>
                    <Progress
                      value={category.score}
                      className="h-2"
                    />
                    {category.factors.length > 0 && (
                      <ul className="text-xs text-muted-foreground ml-6 space-y-1">
                        {category.factors.map((factor, idx) => (
                          <li key={idx}>• {factor}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
          Last updated: {new Date(healthScore.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
