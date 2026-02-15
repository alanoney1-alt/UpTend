import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Loader2, ArrowRight, CreditCard, Zap, Clock, ExternalLink } from "lucide-react";

export default function ProPayoutSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"setup" | "checking" | "speed">("checking");

  const { data: status, isLoading, refetch } = useQuery<{
    status: string;
    onboardingComplete: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirements: string[];
    instantPayoutEligible: boolean;
  }>({
    queryKey: ["/api/pro/payouts/setup/status"],
  });

  useEffect(() => {
    if (!isLoading && status) {
      if (status.status === "not_setup") setStep("setup");
      else if (status.onboardingComplete) setStep("speed");
      else setStep("setup");
    }
  }, [status, isLoading]);

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pro/payouts/setup");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else if (data.onboardingComplete) {
        setStep("speed");
        refetch();
      }
    },
    onError: (err: Error) => {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    },
  });

  const speedMutation = useMutation({
    mutationFn: async (speed: string) => {
      const res = await apiRequest("PUT", "/api/pro/payouts/settings", { payoutSpeed: speed });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Settings saved!" });
      setLocation("/pro/dashboard");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-amber-600" />
          <h1 className="text-2xl font-bold">Get Paid for Your Work</h1>
          <p className="text-muted-foreground mt-2">
            Set up your bank account to receive automatic payouts when jobs are completed.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Bank Setup", "Verification", "Payout Speed"].map((label, i) => {
            const stepIdx = step === "setup" ? 0 : step === "checking" ? 1 : 2;
            const isActive = i <= stepIdx;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i < stepIdx ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm ${isActive ? "text-amber-800 font-medium" : "text-gray-400"}`}>
                  {label}
                </span>
                {i < 2 && <div className={`w-8 h-px ${isActive ? "bg-amber-400" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>

        {step === "setup" && (
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-3">Set up your bank account</h2>
            <p className="text-muted-foreground mb-6">
              You'll be redirected to Stripe's secure portal to add your bank details and verify your identity.
              This typically takes 2-3 minutes.
            </p>
            <Button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 w-full"
              size="lg"
            >
              {setupMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Set Up Bank Account
            </Button>
            <Button
              variant="ghost"
              className="mt-4 text-muted-foreground"
              onClick={() => setLocation("/pro/dashboard")}
            >
              Skip for now — I'll do this later
            </Button>
          </Card>
        )}

        {step === "checking" && (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-amber-600" />
            <h2 className="text-lg font-semibold mb-2">Checking your account...</h2>
            <p className="text-muted-foreground">Verifying your setup with Stripe.</p>
          </Card>
        )}

        {step === "speed" && (
          <Card className="p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
              <h2 className="text-lg font-semibold">Bank Account Connected!</h2>
              <p className="text-muted-foreground mt-1">Choose your default payout speed:</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => speedMutation.mutate("standard")}
                disabled={speedMutation.isPending}
                className="w-full p-5 border-2 rounded-xl text-left hover:border-amber-400 transition-colors flex items-start gap-4"
              >
                <Clock className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Standard</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">Free</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payouts arrive in 2 business days. No extra fees.
                  </p>
                </div>
              </button>

              <button
                onClick={() => speedMutation.mutate("instant")}
                disabled={speedMutation.isPending || !status?.instantPayoutEligible}
                className={`w-full p-5 border-2 rounded-xl text-left transition-colors flex items-start gap-4 ${
                  status?.instantPayoutEligible
                    ? "hover:border-amber-400"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <Zap className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Instant</span>
                    <Badge variant="outline" className="text-amber-600 border-amber-200">1.5% fee</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get paid within minutes. 1.5% fee (min $0.50) per payout.
                    {!status?.instantPayoutEligible && " Requires a debit card on file."}
                  </p>
                </div>
              </button>
            </div>

            {speedMutation.isPending && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
