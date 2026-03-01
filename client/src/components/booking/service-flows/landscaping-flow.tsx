import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Trees, RefreshCw } from "lucide-react";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const ONE_TIME_OPTIONS = [
  { id: "mow_quarter", label: "Mow + Edge + Blow (up to 1/4 acre)", price: 59 },
  { id: "mow_half", label: "Mow + Edge + Blow (up to 1/2 acre)", price: 89 },
  { id: "yard_cleanup_sm", label: "Yard Cleanup (Small)", price: 149 },
  { id: "yard_cleanup_md", label: "Yard Cleanup (Medium)", price: 199 },
  { id: "yard_cleanup_lg", label: "Yard Cleanup (Large)", price: 299 },
  { id: "hedge_trim_sm", label: "Hedge/Shrub Trimming (up to 10 bushes)", price: 89 },
  { id: "hedge_trim_lg", label: "Hedge/Shrub Trimming (10+ bushes)", price: 149 },
  { id: "mulch_sm", label: "Mulch Install (up to 5 yards)", price: 199 },
  { id: "mulch_lg", label: "Mulch Install (5-10 yards)", price: 349 },
  { id: "sod_sm", label: "Sod Installation (up to 500 sqft)", price: 399 },
  { id: "sod_lg", label: "Sod Installation (500-1000 sqft)", price: 699 },
  { id: "tree_trim_sm", label: "Tree Trimming (small tree, under 15ft)", price: 149 },
  { id: "tree_trim_md", label: "Tree Trimming (medium tree, 15-30ft)", price: 299 },
  { id: "tree_trim_lg", label: "Tree Trimming (large tree, 30ft+)", price: 499 },
  { id: "palm_trim", label: "Palm Tree Trimming (per tree)", price: 75 },
  { id: "stump_removal", label: "Stump Grinding (per stump)", price: 149 },
  { id: "flower_bed", label: "Flower Bed Design + Planting (small)", price: 199 },
  { id: "flower_bed_lg", label: "Flower Bed Design + Planting (large)", price: 399 },
  { id: "irrigation_repair", label: "Irrigation/Sprinkler Repair", price: 99, note: "Parts extra if needed" },
  { id: "irrigation_install", label: "Irrigation Zone Install (per zone)", price: 249 },
  { id: "leaf_removal", label: "Leaf Removal (full yard)", price: 129 },
  { id: "weed_treat", label: "Weed Treatment (full yard)", price: 79 },
  { id: "fertilize", label: "Fertilization Application", price: 69 },
];

const RECURRING_TIERS = [
  {
    id: "mow_go",
    name: "Mow & Go",
    prices: { quarter: 99, half: 149 },
    includes: ["Weekly mow, edge, blow", "Basic debris cleanup"],
  },
  {
    id: "full_service",
    name: "Full Service",
    prices: { quarter: 159, half: 219 },
    includes: [
      "Weekly mow, edge, blow",
      "Shrub trimming (monthly)",
      "Weed control",
      "Debris cleanup",
      "Edging all beds",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    prices: { quarter: 249, half: 329 },
    includes: [
      "Everything in Full Service",
      "Fertilization program (quarterly)",
      "Mulch refresh (quarterly)",
      "Priority scheduling",
      "Seasonal flower rotation",
      "Irrigation check (monthly)",
      "Palm trimming (as needed)",
    ],
  },
];

const YARD_AREAS = [
  { id: "front", label: "Front Yard" },
  { id: "back", label: "Backyard" },
  { id: "side", label: "Side Yard" },
  { id: "all", label: "Entire Property" },
];

type Mode = "one_time" | "recurring";
type LotSize = "quarter" | "half";

export function LandscapingFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [mode, setMode] = useState<Mode>("one_time");
  const [selectedOneTime, setSelectedOneTime] = useState<Set<string>>(new Set());
  const [recurringTier, setRecurringTier] = useState<string | null>(null);
  const [lotSize, setLotSize] = useState<LotSize>("quarter");
  const [yardArea, setYardArea] = useState<string>("all");

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
      ? [{ label: `${tier.name}: ${lotSize === "quarter" ? "up to 1/4 acre" : "up to 1/2 acre"}`, price: tier.prices[lotSize] }]
      : [];

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "landscaping",
      estimatedPrice: total,
      isRecurring: mode === "recurring",
      monthlyPrice: mode === "recurring" ? total : undefined,
      userInputs: { mode, selectedOneTime: [...selectedOneTime], recurringTier, lotSize, yardArea },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      {/* Yard details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h4 className="font-bold text-sm flex items-center gap-2"><Trees className="w-4 h-4" /> Yard Details</h4>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">What area needs work?</label>
            <div className="flex flex-wrap gap-2">
              {YARD_AREAS.map(a => (
                <Button key={a.id} variant={yardArea === a.id ? "default" : "outline"} size="sm" onClick={() => setYardArea(a.id)}>
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Lot Size</label>
            <div className="flex gap-2">
              <Button variant={lotSize === "quarter" ? "default" : "outline"} className="flex-1" size="sm" onClick={() => setLotSize("quarter")}>
                Up to 1/4 Acre
              </Button>
              <Button variant={lotSize === "half" ? "default" : "outline"} className="flex-1" size="sm" onClick={() => setLotSize("half")}>
                Up to 1/2 Acre
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button variant={mode === "one_time" ? "default" : "outline"} className="flex-1" onClick={() => setMode("one_time")}>
          One-Time Services
        </Button>
        <Button variant={mode === "recurring" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setMode("recurring")}>
          <RefreshCw className="w-4 h-4" /> Recurring Plan
        </Button>
      </div>

      {mode === "one_time" && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-bold text-sm mb-1">Select services (pick multiple)</h4>
            <p className="text-xs text-muted-foreground mb-3">Tap everything you need, we will bundle it.</p>
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
                  <div>
                    <span className="text-sm font-medium">{opt.label}</span>
                    {opt.note && <span className="text-xs text-muted-foreground ml-1">({opt.note})</span>}
                  </div>
                  <span className="font-bold text-primary">${opt.price}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {mode === "recurring" && (
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
