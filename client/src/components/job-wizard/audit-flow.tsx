import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle, AlertTriangle, XCircle, Camera, ClipboardList,
  ArrowRight, Home,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  type: "upyck" | "referral";
  price?: number;
  partner?: string;
}

const CHECKLIST: ChecklistItem[] = [
  { id: "roof", label: "Roof Condition", type: "referral", partner: "Roofer" },
  { id: "gutters", label: "Gutters", type: "upyck", price: 150 },
  { id: "driveway", label: "Driveway (Algae/Stains)", type: "upyck", price: 99 },
  { id: "hvac", label: "HVAC Unit (Rust/Age)", type: "referral", partner: "HVAC Pro" },
  { id: "garage", label: "Garage Clutter", type: "upyck", price: 250 },
  { id: "trees", label: "Overhanging Trees", type: "referral", partner: "Arborist" },
  { id: "siding", label: "Siding / Exterior Paint", type: "referral", partner: "Painter" },
  { id: "fence", label: "Fence Condition", type: "referral", partner: "Fencing Co." },
  { id: "landscape", label: "Landscaping Overgrowth", type: "upyck", price: 199 },
  { id: "pest", label: "Pest / Termite Signs", type: "referral", partner: "Pest Control" },
];

interface AuditResults {
  [key: string]: "good" | "attention" | "critical";
}

interface AuditFlowProps {
  onComplete: (data: {
    upyckJobs: ChecklistItem[];
    referrals: ChecklistItem[];
    results: AuditResults;
  }) => void;
}

export function AuditFlow({ onComplete }: AuditFlowProps) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<AuditResults>({});

  const currentItem = CHECKLIST[step];
  const progress = ((step) / CHECKLIST.length) * 100;
  const allDone = step >= CHECKLIST.length;

  const handleRating = (status: "good" | "attention" | "critical") => {
    const newResults = { ...results, [currentItem.id]: status };
    setResults(newResults);

    if (step < CHECKLIST.length - 1) {
      setStep((s) => s + 1);
    } else {
      const upyckJobs = CHECKLIST.filter(
        (i) => newResults[i.id] === "attention" && i.type === "upyck"
      );
      const referrals = CHECKLIST.filter(
        (i) => newResults[i.id] === "critical" && i.type === "referral"
      );
      onComplete({ upyckJobs, referrals, results: newResults });
    }
  };

  if (allDone) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 p-4 gap-4" data-testid="audit-flow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold" data-testid="text-audit-title">Home Health Check</h2>
        </div>
        <Badge variant="secondary" data-testid="badge-audit-step">
          {step + 1} / {CHECKLIST.length}
        </Badge>
      </div>

      <Progress value={progress} className="h-2" data-testid="progress-audit" />

      <Card className="flex-1">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2" data-testid="text-checklist-item">
              {currentItem.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentItem.type === "upyck"
                ? "Look for dirt, clutter, or signs of neglect."
                : "Look for visible damage or wear."}
            </p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              onClick={() => handleRating("good")}
              data-testid="button-rating-good"
            >
              <CheckCircle className="w-5 h-5" /> Looks Good
            </Button>

            {currentItem.type === "upyck" ? (
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                onClick={() => handleRating("attention")}
                data-testid="button-rating-attention"
              >
                <AlertTriangle className="w-5 h-5" /> Needs Cleaning (${currentItem.price})
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 border-destructive text-destructive"
                onClick={() => handleRating("critical")}
                data-testid="button-rating-critical"
              >
                <XCircle className="w-5 h-5" /> Needs Repair (Referral to {currentItem.partner})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Camera className="w-3 h-3" />
        Take photos for any items that need attention or repair.
      </p>
    </div>
  );
}
