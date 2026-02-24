/**
 * Pro Quality Score Display Component
 *
 * Shows AI-calculated quality score with tier badge, component scores,
 * strengths, improvement areas, and training recommendations
 */

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Award, AlertCircle, BookOpen, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const tierConfig = {
  platinum: { color: "bg-gradient-to-r from-blue-400 to-purple-600", icon: "" },
  gold: { color: "bg-gradient-to-r from-yellow-400 to-orange-500", icon: "" },
  silver: { color: "bg-gradient-to-r from-gray-300 to-gray-400", icon: "" },
  bronze: { color: "bg-gradient-to-r from-orange-700 to-yellow-700", icon: "" },
};

export function ProQualityScore() {
  const { data, isLoading } = useQuery({
    queryKey: ["pro-quality-score"],
    queryFn: async () => {
      const res = await fetch("/api/ai/pro/quality/score");
      if (!res.ok) throw new Error("Failed to load quality score");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quality Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading score...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = data?.score;

  if (!score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quality Score</CardTitle>
          <CardDescription>Complete more jobs to unlock your quality score!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tierStyle = tierConfig[score.tier as keyof typeof tierConfig];

  return (
    <div className="space-y-4">
      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Quality Score
                <Badge className={tierStyle.color + " text-white"}>
                  {tierStyle.icon} {score.tier.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>Based on your last {score.jobsAnalyzed} jobs</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{score.overallScore}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={score.overallScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Component Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(score.componentScores || {}).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="font-medium">{String(value)}%</span>
              </div>
              <Progress
                value={value as number}
                className="h-2"
                style={{
                  //@ts-ignore
                  "--progress-foreground":
                    (value as number) >= 90
                      ? "hsl(142, 76%, 36%)"
                      : (value as number) >= 80
                      ? "hsl(45, 93%, 47%)"
                      : "hsl(0, 84%, 60%)",
                } as React.CSSProperties}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths */}
      {score.strengths && score.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score.strengths.map((strength: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500"></span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Improvement Areas */}
      {score.improvementAreas && score.improvementAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score.improvementAreas.map((area: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500">→</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Training Recommendations */}
      {score.trainingRecommendations && score.trainingRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Recommended Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {score.trainingRecommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next Tier Requirements */}
      {score.nextTierRequirements && (
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              Path to Next Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score.nextTierRequirements.map((req: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">□</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
