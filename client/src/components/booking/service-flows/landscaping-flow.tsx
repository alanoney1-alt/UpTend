import { useState } from "react";
import { Redirect } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trees, RefreshCw } from "lucide-react";
import { RunningTotal } from "./running-total";
import { AiScanToggle } from "./ai-scan-toggle";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const ONE_TIME_OPTIONS = [
  { id: "mow_quarter", label: "Mow + Edge + Blow (≤1/4 acre)", price: 49 },
  { id: "mow_half", label: "Mow + Edge + Blow (≤1/2 acre)", price: 79 },
  { id: "yard_cleanup_sm", label: "Yard Cleanup (Small)", price: 149 },
  { id: "yard_cleanup_md", label: "Yard Cleanup (Medium)", price: 199 },
  { id: "yard_cleanup_lg", label: "Yard Cleanup (Large)", price: 299 },
];

const RECURRING_TIERS = [
  {
    id: "mow_go",
    name: "Mow & Go",
    prices: { quarter: 99, half: 149 },
    includes: ["Weekly mow, edge, blow", "Basic cleanup"],
  },
  {
    id: "full_service",
    name: "Full Service",
    prices: { quarter: 159, half: 219 },
    includes: ["Weekly mow, edge, blow", "Shrub trimming (monthly)", "Weed control", "Debris cleanup"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    prices: { quarter: 249, half: 329 },
    includes: ["Everything in Full Service", "Fertilization program", "Mulch refresh (quarterly)", "Priority scheduling", "Seasonal flower rotation"],
  },
];

type Mode = "one_time" | "recurring";
type LotSize = "quarter" | "half";

export function LandscapingFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [quoteMode, setQuoteMode] = useState<"ai" | "manual">("manual");
  const [mode, setMode] = useState<Mode>("one_time");
  const [selectedOneTime, setSelectedOneTime] = useState<Set<string>>(new Set());
  const [recurringTier, setRecurringTier] = useState<string | null>(null);
  const [lotSize, setLotSize] = useState<LotSize>("quarter");

  if (quoteMode === "ai") {
    return <Redirect to="/ai/photo-quote?service=landscaping" />;
  }

  // One-time total
  const oneTimeTotal = [...selectedOneTime].reduce((sum, id) => {
    const opt = ONE_TIME_OPTIONS.find((o) => o.id === id);
    return sum + (opt?.price || 0);
  }, 0);

  // Recurring total
  const tier = RECURRING_TIERS.find((t) => t.id === recurringTier);
  const recurringTotal = tier ? tier.prices[lotSize] : 0;

  const total = mode === "one_time" ? oneTimeTotal : recurringTotal;

  const lineItems =
    mode === "one_time"
      ? [...selectedOneTime].map((id) => {
          const opt = ONE_TIME_OPTIONS.find((o) => o.id === id)!;
          return { label: opt.label, price: opt.price };
        })
      : tier
      ? [{ label: `${tier.name} — ${lotSize === "quarter" ? "≤1/4 acre" : "≤1/2 acre"}`, price: tier.prices[lotSize] }]
      : [];

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "landscaping",
      estimatedPrice: total,
      isRecurring: mode === "recurring",
      monthlyPrice: mode === "recurring" ? total : undefined,
      userInputs: { mode, selectedOneTime: [...selectedOneTime], recurringTier, lotSize },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      <AiScanToggle serviceId="landscaping" quoteMode={quoteMode} onModeChange={setQuoteMode} />

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button variant={mode === "one_time" ? "default" : "outline"} className="flex-1" onClick={() => setMode("one_time")}>
          One-Time Service
        </Button>
        <Button variant={mode === "recurring" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setMode("recurring")}>
          <RefreshCw className="w-4 h-4" /> Recurring Plan
        </Button>
      </div>

      {mode === "one_time" && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-bold text-sm">Select services</h4>
            {ONE_TIME_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedOneTime.has(opt.id) ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
                onClick={() => {
                  setSelectedOneTime((prev) => {
                    const next = new Set(prev);
                    next.has(opt.id) ? next.delete(opt.id) : next.add(opt.id);
                    return next;
                  });
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="font-bold text-primary">${opt.price}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {mode === "recurring" && (
        <>
          {/* Lot size */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-bold text-sm">Lot Size</h4>
              <div className="flex gap-2">
                <Button variant={lotSize === "quarter" ? "default" : "outline"} className="flex-1" onClick={() => setLotSize("quarter")}>
                  ≤ 1/4 Acre
                </Button>
                <Button variant={lotSize === "half" ? "default" : "outline"} className="flex-1" onClick={() => setLotSize("half")}>
                  ≤ 1/2 Acre
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tier selection */}
          <div className="space-y-3">
            {RECURRING_TIERS.map((t) => (
              <Card
                key={t.id}
                className={`cursor-pointer transition-all ${
                  recurringTier === t.id ? "border-2 border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                }`}
                onClick={() => setRecurringTier(t.id)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{t.name}</h3>
                      {t.popular && <Badge className="bg-primary">Popular</Badge>}
                    </div>
                    <span className="text-xl font-black text-primary">
                      ${t.prices[lotSize]}<span className="text-sm font-normal">/mo</span>
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {t.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <RunningTotal
        total={total}
        monthlyTotal={mode === "recurring" ? total : undefined}
        lineItems={lineItems}
        onContinue={handleContinue}
        onBack={onBack}
        note={mode === "recurring" ? "Cancel anytime with 30-day notice." : "Pro confirms scope on-site."}
      />
    </div>
  );
}
