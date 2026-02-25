import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, Upload, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InsuranceRequirement {
  tier: 1 | 2 | 3;
  required: false | "recommended" | true;
  covered: "platform" | "per-job" | "self";
  message: string;
  earningsTotal: number;
}

interface InsuranceStatusData {
  hasInsurance: boolean;
  provider: string;
  policyNumber: string;
  expirationDate: string;
  coverageAmount: number;
  tier: string;
  verified: boolean;
}

interface InsuranceAlert {
  type: string;
  message: string;
  urgency: "low" | "medium" | "high";
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

export function InsuranceStatusCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showWhySection, setShowWhySection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Upload form state
  const [formProvider, setFormProvider] = useState("");
  const [formPolicyNumber, setFormPolicyNumber] = useState("");
  const [formExpiration, setFormExpiration] = useState("");
  const [formCoverageAmount, setFormCoverageAmount] = useState("");

  const { data, isLoading } = useQuery<{ requirement: InsuranceRequirement; status: InsuranceStatusData }>({
    queryKey: ["/api/insurance/tiered/status"],
  });

  const { data: alertsData } = useQuery<{ alerts: InsuranceAlert[] }>({
    queryKey: ["/api/insurance/tiered/alerts"],
  });

  const { data: thimbleData } = useQuery<{ link: string }>({
    queryKey: ["/api/insurance/tiered/thimble-link"],
  });

  const updateMutation = useMutation({
    mutationFn: async (insuranceData: any) => {
      const res = await fetch("/api/insurance/tiered/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insuranceData),
      });
      if (!res.ok) throw new Error("Failed to update insurance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/tiered/status"] });
      setShowUploadForm(false);
      toast({ title: "Insurance Updated", description: "Your insurance information has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update insurance", variant: "destructive" });
    },
  });

  if (isLoading || !data) return null;

  const { requirement, status } = data;
  const alerts = alertsData?.alerts || [];
  const thimbleLink = thimbleData?.link || "https://www.thimble.com/get-a-quote?partner=uptend";
  const earnings = requirement.earningsTotal;

  const handleSubmitInsurance = () => {
    if (!formProvider || !formPolicyNumber) {
      toast({ title: "Missing Info", description: "Provider and policy number are required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      provider: formProvider,
      policyNumber: formPolicyNumber,
      expirationDate: formExpiration,
      coverageAmount: formCoverageAmount ? parseFloat(formCoverageAmount) : 0,
    });
  };

  // Card color based on tier and status
  let cardBorder = "border-green-300 bg-green-50/50 dark:bg-green-950/20";
  let cardTitle = "You're Covered";
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";

  if (requirement.tier === 2) {
    cardBorder = "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20";
    cardTitle = "Per-Job Coverage Recommended";
    badgeVariant = "secondary";
  } else if (requirement.tier === 3 && !status.hasInsurance) {
    cardBorder = "border-red-300 bg-red-50/50 dark:bg-red-950/20";
    cardTitle = "Insurance Required to Accept Jobs";
    badgeVariant = "destructive";
  } else if (requirement.tier === 3 && status.hasInsurance) {
    cardBorder = "border-green-300 bg-green-50/50 dark:bg-green-950/20";
    cardTitle = "Insured";
    badgeVariant = "default";
  }

  return (
    <Card className={`p-5 ${cardBorder}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#ea580c]" />
          Insurance. {cardTitle}
        </h3>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                    alert.urgency === "high"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : alert.urgency === "medium"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {/* Tier 1: Platform covered */}
          {requirement.tier === 1 && (
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Every job is insured through UpTend's platform policy while you build your business.
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Earnings: {formatCurrency(earnings)}</span>
                  <span>$1,000</span>
                </div>
                <Progress value={Math.min(100, (earnings / 1000) * 100)} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                When you reach $1,000, we'll help you get your own coverage in 60 seconds.
              </p>
            </div>
          )}

          {/* Tier 2: Recommended */}
          {requirement.tier === 2 && (
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                You've earned {formatCurrency(earnings)}! Time to level up your coverage.
              </p>
              <div className="mt-3 space-y-2">
                <a
                  href={thimbleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-between text-[#ea580c] border-[#ea580c]/30 hover:bg-[#ea580c]/5">
                    Get insured for as little as $5 per job
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <a
                  href={thimbleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-between">
                    Or get a monthly policy starting at $40/month
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Earnings: {formatCurrency(earnings)}</span>
                  <span>$5,000</span>
                </div>
                <Progress value={Math.min(100, (earnings / 5000) * 100)} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Monthly coverage will be required at $5,000.
              </p>
            </div>
          )}

          {/* Tier 3: Required */}
          {requirement.tier === 3 && status.hasInsurance && (
            <div>
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Provider:</span>{" "}
                    <span className="font-medium">{status.provider}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Policy:</span>{" "}
                    <span className="font-medium">{status.policyNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expires:</span>{" "}
                    <span className="font-medium">
                      {status.expirationDate ? new Date(status.expirationDate).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {status.verified ? (
                      <Badge variant="default" className="bg-green-600 text-xs">Verified</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Pending Verification</Badge>
                    )}
                  </div>
                </div>
              </div>
              <a href={thimbleLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="mt-3">
                  Renew Coverage <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </a>
            </div>
          )}

          {requirement.tier === 3 && !status.hasInsurance && (
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-3">
                Insurance is required to accept new jobs at your earnings level.
              </p>
              <a href={thimbleLink} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white">
                  Get Covered in 60 Seconds
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Starting at $40/month for full GL coverage
              </p>
            </div>
          )}

          {/* Upload Insurance Form */}
          <div>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-2 text-sm font-medium text-[#ea580c] hover:underline"
            >
              <Upload className="w-4 h-4" />
              {showUploadForm ? "Hide Upload Form" : "Upload Your Insurance"}
            </button>

            {showUploadForm && (
              <div className="mt-3 p-4 border rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Provider Name</Label>
                    <Input
                      placeholder="State Farm"
                      value={formProvider}
                      onChange={(e) => setFormProvider(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Policy Number</Label>
                    <Input
                      placeholder="GL-123456789"
                      value={formPolicyNumber}
                      onChange={(e) => setFormPolicyNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Expiration Date</Label>
                    <Input
                      type="date"
                      value={formExpiration}
                      onChange={(e) => setFormExpiration(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Coverage Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="500000"
                      value={formCoverageAmount}
                      onChange={(e) => setFormCoverageAmount(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSubmitInsurance}
                  disabled={updateMutation.isPending}
                  className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Insurance Info"}
                </Button>
              </div>
            )}
          </div>

          {/* Why Insurance Matters */}
          <div>
            <button
              onClick={() => setShowWhySection(!showWhySection)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showWhySection ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Why Insurance Matters
            </button>
            {showWhySection && (
              <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-muted-foreground space-y-1">
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  Protects you from liability claims on the job
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  Protects customers and builds trust
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  Earns you an "Independently Insured" badge and priority matching
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  Required by Florida law for jobs over $2,500
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
