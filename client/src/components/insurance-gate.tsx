import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface InsuranceGateProps {
  job: {
    insurancePurchaseLink?: string;
  };
  onPolicyVerified: () => void;
}

export function InsuranceGate({ job, onPolicyVerified }: InsuranceGateProps) {
  const handleBuyInsurance = () => {
    if (job.insurancePurchaseLink) {
      window.open(job.insurancePurchaseLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className="border-amber-300 dark:border-amber-700"
      data-testid="card-insurance-gate"
    >
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          Insurance Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This job requires active liability coverage before you can begin work.
          Purchase a short-term policy through our partner to get covered
          instantly.
        </p>

        <Button
          className="w-full"
          onClick={handleBuyInsurance}
          disabled={!job.insurancePurchaseLink}
          data-testid="button-buy-insurance"
        >
          <Shield className="w-4 h-4" />
          Buy Coverage (~$14) via Thimble
        </Button>

        <div className="rounded-md bg-muted/50 p-3 space-y-1">
          <p className="text-sm font-medium">How it works</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Instant verification. coverage active in minutes</li>
            <li>2-hour policy covers the duration of this job</li>
            <li>Proof of coverage is sent directly to the platform</li>
          </ul>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={onPolicyVerified}
          data-testid="button-verify-policy"
        >
          I already purchased coverage
        </Button>
      </CardContent>
    </Card>
  );
}
