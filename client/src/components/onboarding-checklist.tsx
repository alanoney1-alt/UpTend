import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Clock } from "lucide-react";

interface OnboardingUser {
  firstName?: string;
  profileImageUrl?: string | null;
  isVerified?: boolean;
  certifications?: string[];
  payoutSetup?: boolean;
  profileCompleted?: boolean;
}

export function OnboardingChecklist({ user }: { user: OnboardingUser }) {
  const steps = [
    {
      id: "profile",
      label: "Complete Profile",
      subtext: "Upload photo & vehicle details",
      status: user.profileCompleted ? "done" : "action" as const,
      link: "/settings",
    },
    {
      id: "checkr",
      label: "Background Check",
      subtext: user.isVerified ? "Verified" : "Required before your first job",
      status: user.isVerified ? "done" : "action" as const,
      link: "/pro/background-check",
    },
    {
      id: "academy",
      label: "UpTend Academy",
      subtext: "Pass the simulator to unlock jobs",
      status: (user.certifications || []).includes("app_certification") ? "done" : "action" as const,
      link: "/academy",
    },
    {
      id: "bank",
      label: "Link Bank Account",
      subtext: "Connect Stripe to get paid",
      status: user.payoutSetup ? "done" : "action" as const,
      link: "/payment-setup",
    },
  ];

  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = (doneCount / steps.length) * 100;

  if (progress === 100) return null;

  return (
    <Card className="mb-6" data-testid="card-onboarding-checklist">
      <CardContent className="p-6">
        <div className="flex justify-between items-end gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold" data-testid="text-checklist-welcome">
              Welcome, {user.firstName || "Pro"}!
            </h2>
            <p className="text-muted-foreground text-sm">
              Complete these steps to go online.
            </p>
          </div>
          <span className="font-bold text-foreground" data-testid="text-checklist-progress">
            {Math.round(progress)}% Ready
          </span>
        </div>

        <Progress value={progress} className="mb-6 h-2" data-testid="progress-checklist" />

        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border hover-elevate"
              data-testid={`checklist-step-${step.id}`}
            >
              <div className="flex items-center gap-4">
                {step.status === "done" && (
                  <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                )}
                {step.status === "pending" && (
                  <Clock className="w-6 h-6 text-yellow-500 animate-pulse shrink-0" />
                )}
                {step.status === "action" && (
                  <Circle className="w-6 h-6 text-muted-foreground shrink-0" />
                )}
                <div>
                  <h4
                    className={`font-bold text-sm ${
                      step.status === "done" ? "" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-xs text-muted-foreground">{step.subtext}</p>
                </div>
              </div>

              {step.status === "action" && (
                <Link href={step.link}>
                  <Button size="sm" variant="outline" data-testid={`button-start-${step.id}`}>
                    Start
                  </Button>
                </Link>
              )}
              {step.status === "pending" && (
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded">
                  Processing
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
