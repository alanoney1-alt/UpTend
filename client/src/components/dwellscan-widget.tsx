import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ShieldCheck, FileText, Wrench, Info, ChevronDown, ChevronUp } from "lucide-react";

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

export function DwellScanWidget() {
  const { data: scoreData, isLoading } = useQuery<ScoreData>({
    queryKey: ["/api/home-score"],
  });

  const [showExplainer, setShowExplainer] = useState(false);

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
            {scoreData?.label || "Not Rated"}{score > 0 && scoreData?.percentile ? ` \u2022 Top ${scoreData.percentile}%` : ""}
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

        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 mx-auto"
          onClick={() => setShowExplainer(!showExplainer)}
          data-testid="button-score-explainer-toggle"
        >
          <Info className="w-3.5 h-3.5" />
          <span>How does this work?</span>
          {showExplainer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showExplainer && (
          <div className="mt-3 p-4 bg-muted/50 rounded-lg text-xs space-y-3 text-left" data-testid="section-score-explainer">
            <div>
              <p className="font-semibold text-sm mb-1">What is the UpTend Home Score?</p>
              <p className="text-muted-foreground">
                Your Home Score is like a credit score for your property. It tracks how well-maintained,
                documented, and safe your home is. A higher score means better insurance claim support,
                higher resale value, and peace of mind.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">How to increase your score:</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>📷 <strong>Book an Home DNA Scan</strong> (+100-200 pts) — Get a professional assessment of your home's condition</li>
                <li>🔧 <strong>Complete maintenance services</strong> (+25-50 pts each) — Every completed job boosts your Maintenance score</li>
                <li>📄 <strong>Upload home documents</strong> (+15-30 pts each) — Insurance policies, warranties, receipts, inspection reports</li>
                <li>🛡️ <strong>Safety checks</strong> (+20-40 pts) — Smoke detectors, carbon monoxide, fire extinguishers verified</li>
                <li>⭐ <strong>Keep a regular schedule</strong> (+10 pts/month) — Consistent maintenance shows your home is cared for</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Score ranges:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li><strong>0–199:</strong> Not Yet Scored — Get started with a Home DNA Scan!</li>
                <li><strong>200–549:</strong> Building — You're on your way</li>
                <li><strong>550–649:</strong> Fair — Regular maintenance is paying off</li>
                <li><strong>650–749:</strong> Good — Your home is well-maintained</li>
                <li><strong>750–850:</strong> Excellent — Top-tier home care</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
