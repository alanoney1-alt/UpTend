import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { ArrowRight, ShieldCheck, Leaf, Sparkles, Pencil } from "lucide-react";
import { useLocation } from "wouter";
import { PreStormChecklist } from "./pre-storm-checklist";

interface EstimateData {
  spaceRejuvenation: string;
  pressureWash: string;
  homeAudit: string;
  gutterCare: string;
  totalImpact: string;
  materialRecovery: string;
}

function getEstimates(_addr: string): EstimateData {
  return {
    spaceRejuvenation: "$149 – $299",
    pressureWash: "$199 – $350",
    homeAudit: "$49 (Essential)",
    gutterCare: "$120 – $180",
    totalImpact: "Verified & Insured Pros",
    materialRecovery: "~40 lbs verified recovery",
  };
}

export function InstantEstimator() {
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [showChecklist, setShowChecklist] = useState(false);
  const [, setLocation] = useLocation();

  const estimates = getEstimates(address);

  const handleScan = () => {
    if (address.trim().length > 5) {
      setStep(2);
      setTimeout(() => setShowChecklist(true), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleScan();
  };

  if (step === 1) {
    return (
      <div
        className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 p-2 rounded-md shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200 dark:border-slate-700"
        data-testid="widget-instant-estimator"
      >
        <div className="flex-1 w-full">
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onSelectAddress={(selectedAddress) => setAddress(selectedAddress)}
            placeholder="Enter your property address..."
            inputClassName="border-none shadow-none focus-visible:ring-0 text-lg bg-transparent h-12"
            icon={true}
          />
        </div>
        <Button
          onClick={handleScan}
          className="bg-primary text-primary-foreground border-primary font-bold w-full sm:w-auto"
          size="lg"
          data-testid="button-scan-property"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Scan Property
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card
        className="w-full max-w-3xl mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        data-testid="widget-estimate-results"
      >
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1" data-testid="text-report-label">
                Preliminary Report For
              </p>
              <p className="text-lg font-bold" data-testid="text-report-address">{address}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStep(1); setShowChecklist(false); }}
              data-testid="button-edit-address"
            >
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-muted/50 rounded-md" data-testid="card-estimate-rejuvenation">
              <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Space Rejuvenation</p>
              <div className="flex flex-wrap justify-between items-end gap-2">
                <span className="font-black text-xl">{estimates.spaceRejuvenation}</span>
                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">{estimates.materialRecovery}</span>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-md" data-testid="card-estimate-audit">
              <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Asset Protection (Audit)</p>
              <div className="flex flex-wrap justify-between items-end gap-2">
                <span className="font-black text-xl">{estimates.homeAudit}</span>
                <span className="text-[10px] text-primary font-bold">Insurance Shield Included</span>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-md" data-testid="card-estimate-pressure">
              <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Pressure Wash</p>
              <div className="flex flex-wrap justify-between items-end gap-2">
                <span className="font-black text-xl">{estimates.pressureWash}</span>
                <span className="text-[10px] text-muted-foreground font-bold">Exterior clean + seal</span>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-md" data-testid="card-estimate-gutter">
              <p className="text-xs font-bold text-muted-foreground mb-2 uppercase">Gutter Care</p>
              <div className="flex flex-wrap justify-between items-end gap-2">
                <span className="font-black text-xl">{estimates.gutterCare}</span>
                <span className="text-[10px] text-muted-foreground font-bold">Debris clear + flow test</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-800 rounded-md p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold opacity-80 uppercase tracking-tighter">Estimated Impact</p>
                <p className="text-2xl font-black" data-testid="text-estimated-impact">{estimates.totalImpact}</p>
              </div>
            </div>

            <Button
              onClick={() => setLocation("/book?address=" + encodeURIComponent(address))}
              variant="outline"
              size="lg"
              className="border-white/30 text-white backdrop-blur-sm w-full md:w-auto font-bold"
              data-testid="button-secure-price"
            >
              Secure this Price <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest">
            <span className="flex items-center gap-1" data-testid="text-verified-notice">
              <ShieldCheck className="w-3 h-3" /> Verified Pro scan required for final quote
            </span>
            <span className="flex items-center gap-1" data-testid="text-diversion-notice">
              <Leaf className="w-3 h-3" /> 70% landfill diversion tracked
            </span>
          </div>
        </CardContent>
      </Card>

      {showChecklist && (
        <PreStormChecklist
          address={address}
          onClose={() => setShowChecklist(false)}
          onGreenLight={() => {
            setShowChecklist(false);
            setLocation("/book?address=" + encodeURIComponent(address) + "&bundle=storm-prep");
          }}
        />
      )}
    </>
  );
}
