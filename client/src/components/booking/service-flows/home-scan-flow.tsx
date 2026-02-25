import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Plane } from "lucide-react";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const tiers = [
  {
    id: "standard",
    name: "Home DNA Scan Standard",
    price: 99,
    icon: Sparkles,
    description: "Interior + exterior ground-level walkthrough",
    duration: "~30 minutes",
    includes: [
      "Full interior room-by-room walkthrough with photos",
      "Exterior ground-level assessment",
      "Major systems check (AC, water heater, electrical, plumbing)",
      "Cleanliness rating per room (1-10 scale)",
      "Foundation and structural visual check",
      "Personalized maintenance report",
      "One-tap booking for recommended services",
    ],
  },
  {
    id: "aerial",
    name: "Home DNA Scan Aerial",
    price: 249,
    icon: Plane,
    featured: true,
    description: "Everything in Standard + drone-powered roof & gutter scan",
    duration: "~45 minutes",
    includes: [
      "Everything in Standard",
      "FAA Part 107 certified drone flyover",
      "Aerial roof condition scan",
      "Gutter blockage estimate from above",
      "Chimney and vent inspection",
      "Tree overhang proximity assessment",
      "Siding & paint condition (aerial angle)",
      "Full aerial photo set, GPS-tagged",
    ],
  },
];

export function HomeScanFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const tier = tiers.find((t) => t.id === selected);

  const handleContinue = () => {
    if (!tier) return;
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "home_consultation",
      estimatedPrice: tier.price,
      userInputs: { tier: tier.id },
      requiresHitlValidation: false,
      lineItems: [{ label: tier.name, price: tier.price }],
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center mb-2">
        Select your scan tier
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {tiers.map((t) => (
          <Card
            key={t.id}
            className={`cursor-pointer transition-all p-5 ${
              selected === t.id
                ? "border-2 border-primary ring-2 ring-primary/20"
                : "hover:border-primary/50"
            }`}
            onClick={() => setSelected(t.id)}
          >
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <t.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">{t.name}</h3>
                </div>
                {t.featured && <Badge className="bg-primary">Best Value</Badge>}
              </div>
              <p className="text-2xl font-black text-primary">${t.price}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground"> {t.duration}</p>
              <ul className="space-y-1.5">
                {t.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
           Get a <strong>$25 credit</strong> toward your next booking (valid 90 days)
        </p>
      </div>

      {tier && (
        <RunningTotal
          total={tier.price}
          lineItems={[{ label: tier.name, price: tier.price }]}
          onContinue={handleContinue}
          onBack={onBack}
          note="$25 credit will be applied to your next booking."
        />
      )}
    </div>
  );
}
