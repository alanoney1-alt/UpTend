import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, CheckSquare, DollarSign, Upload, Loader2 } from "lucide-react";

interface VisualFlowProps {
  onComplete: () => void;
  onUpsell?: () => void;
  serviceLabel: string;
}

export function VisualFlow({ onComplete, onUpsell, serviceLabel }: VisualFlowProps) {
  const [step, setStep] = useState<"before" | "working" | "after">("before");
  const [uploading, setUploading] = useState(false);

  const handleBeforePhoto = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setStep("working");
    }, 1500);
  };

  const handleAfterPhoto = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      onComplete();
    }, 2000);
  };

  if (step === "before") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6" data-testid="visual-step-before">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
          <Camera className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center" data-testid="text-visual-before-title">
          Step 1: The Evidence
        </h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          Take a clear photo of the area BEFORE you start. This protects you from liability.
        </p>

        <Input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          id="before-photo"
          onChange={handleBeforePhoto}
          data-testid="input-before-photo"
        />
        <label htmlFor="before-photo" className="w-full max-w-sm">
          <Button
            size="lg"
            className="w-full gap-2 pointer-events-none"
            tabIndex={-1}
            data-testid="button-take-before-photo"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
            ) : (
              <><Camera className="w-5 h-5" /> Take &lsquo;Before&rsquo; Photo</>
            )}
          </Button>
        </label>
      </div>
    );
  }

  if (step === "working") {
    return (
      <div className="flex flex-col flex-1 p-4 gap-4" data-testid="visual-step-working">
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-bold text-emerald-700 dark:text-emerald-300" data-testid="text-job-in-progress">
              {serviceLabel} In Progress
            </span>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full justify-start border-2 border-dashed gap-2"
          data-testid="button-scope-creep"
        >
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Customer Added Items? (+$$$)
        </Button>

        {onUpsell && (
          <Button
            variant="outline"
            className="w-full justify-start border-2 border-dashed gap-2"
            onClick={onUpsell}
            data-testid="button-upsell"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Upsell: Dirty Driveway / Gutters
          </Button>
        )}

        <div className="mt-auto">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => setStep("after")}
            data-testid="button-finish-job"
          >
            <CheckSquare className="w-5 h-5" /> Finish Job
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6" data-testid="visual-step-after">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
        <CheckSquare className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-center" data-testid="text-visual-after-title">
        Step 2: The Proof
      </h2>
      <p className="text-muted-foreground mb-8 text-center max-w-sm">
        Take a photo of the CLEAN space. Make sure no debris is left behind.
      </p>

      <Input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        id="after-photo"
        onChange={handleAfterPhoto}
        data-testid="input-after-photo"
      />
      <label htmlFor="after-photo" className="w-full max-w-sm">
        <Button
          size="lg"
          variant="default"
          className="w-full gap-2 pointer-events-none"
          tabIndex={-1}
          data-testid="button-take-after-photo"
        >
          {uploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
          ) : (
            <><Camera className="w-5 h-5" /> Take &lsquo;After&rsquo; Photo &amp; Complete</>
          )}
        </Button>
      </label>
    </div>
  );
}
