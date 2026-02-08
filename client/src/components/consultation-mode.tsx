import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clipboard, Check, DollarSign, ArrowRight } from "lucide-react";

interface Recommendation {
  id: string;
  label: string;
  avgPrice: number;
  deferred: boolean;
}

const commonIssues = [
  { id: "garage", label: "Garage Cleanout", avgPrice: 250 },
  { id: "gutters", label: "Gutter Cleaning", avgPrice: 150 },
  { id: "filters", label: "Replace HVAC Filters", avgPrice: 75 },
  { id: "donation", label: "Furniture Donation Run", avgPrice: 120 },
  { id: "safety", label: "Remove Fire Hazards (Chemicals)", avgPrice: 99 },
  { id: "junk_pile", label: "Backyard Junk Removal", avgPrice: 180 },
  { id: "attic", label: "Attic Cleanout", avgPrice: 300 },
  { id: "appliance", label: "Old Appliance Removal", avgPrice: 85 },
];

interface ConsultationModeProps {
  onComplete: (recommendations: Recommendation[]) => void;
  isPending?: boolean;
}

export function ConsultationMode({ onComplete, isPending }: ConsultationModeProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const toggleIssue = (issue: typeof commonIssues[0]) => {
    const existing = recommendations.find((r) => r.id === issue.id);
    if (existing) {
      setRecommendations(recommendations.filter((r) => r.id !== issue.id));
    } else {
      setRecommendations([
        ...recommendations,
        { id: issue.id, label: issue.label, avgPrice: issue.avgPrice, deferred: true },
      ]);
    }
  };

  const calculateTotal = () =>
    recommendations.reduce((sum, r) => sum + r.avgPrice, 0);

  const isSelected = (id: string) => recommendations.some((r) => r.id === id);

  return (
    <div className="space-y-4" data-testid="consultation-mode">
      <div className="flex items-center gap-2">
        <Clipboard className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Home Health Checkup</h2>
      </div>
      <p className="text-muted-foreground text-sm">
        Select issues found during walkthrough. Each selection becomes part of
        the customer's Treatment Plan.
      </p>

      <div className="grid gap-3">
        {commonIssues.map((issue) => (
          <Card
            key={issue.id}
            className={`p-3 flex justify-between items-center cursor-pointer hover-elevate ${
              isSelected(issue.id) ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => toggleIssue(issue)}
            data-testid={`card-issue-${issue.id}`}
          >
            <div className="flex items-center gap-2">
              {isSelected(issue.id) ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <div className="w-4 h-4 rounded-sm border border-muted-foreground" />
              )}
              <span className="font-medium">{issue.label}</span>
            </div>
            <Badge variant="outline">${issue.avgPrice}+</Badge>
          </Card>
        ))}
      </div>

      {recommendations.length > 0 && (
        <Card className="p-4 mt-4">
          <div className="flex justify-between font-bold text-lg mb-2 gap-2 flex-wrap">
            <span>Potential Value Add:</span>
            <span className="text-green-600 dark:text-green-400">
              <DollarSign className="w-4 h-4 inline" />
              {calculateTotal()}
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground gap-2 flex-wrap">
            <span>Consultation Credit:</span>
            <span className="text-destructive">-$49.00</span>
          </div>
        </Card>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={() => onComplete(recommendations)}
        disabled={recommendations.length === 0 || isPending}
        data-testid="button-generate-plan"
      >
        {isPending ? "Generating..." : "Generate Treatment Plan"}
        {!isPending && <ArrowRight className="w-4 h-4 ml-1" />}
      </Button>
    </div>
  );
}
