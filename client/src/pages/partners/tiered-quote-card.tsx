import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Shield, Zap } from "lucide-react";

interface TierItem {
  name: string;
  description: string;
}

interface PricingTier {
  tier: "basic" | "standard" | "premium";
  name: string;
  label: string;
  description: string;
  priceEstimateLow: number;
  priceEstimateHigh: number;
  includedItems: TierItem[];
  recommended: boolean;
}

interface TieredQuoteCardProps {
  tiers: PricingTier[];
  serviceType: string;
  onSelect?: (tier: PricingTier) => void;
}

const tierIcons = {
  basic: <Zap className="w-5 h-5" />,
  standard: <Star className="w-5 h-5" />,
  premium: <Shield className="w-5 h-5" />,
};

const tierColors = {
  basic: "border-muted-foreground/20",
  standard: "border-primary ring-2 ring-primary/20",
  premium: "border-yellow-500/50",
};

export default function TieredQuoteCard({ tiers, serviceType, onSelect }: TieredQuoteCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (tier: PricingTier) => {
    setSelected(tier.tier);
    onSelect?.(tier);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">Choose Your Service Level</h3>
        <p className="text-muted-foreground text-sm mt-1">
          {serviceType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <Card
            key={tier.tier}
            className={`relative cursor-pointer transition-all hover:shadow-lg ${tierColors[tier.tier]} ${
              selected === tier.tier ? "ring-2 ring-primary shadow-lg" : ""
            }`}
            onClick={() => handleSelect(tier)}
          >
            {tier.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-xs px-3">
                  Recommended
                </Badge>
              </div>
            )}

            <CardHeader className="pb-3 pt-6">
              <div className="flex items-center gap-2 mb-1">
                {tierIcons[tier.tier]}
                <CardTitle className="text-lg">{tier.name}</CardTitle>
              </div>
              <Badge variant="outline" className="w-fit text-xs">
                {tier.label}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">
                  ${tier.priceEstimateLow.toLocaleString()}–${tier.priceEstimateHigh.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Estimated range</p>
              </div>

              <p className="text-sm text-muted-foreground">{tier.description}</p>

              <ul className="space-y-2">
                {tier.includedItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground"> — {item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={tier.recommended ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(tier);
                }}
              >
                {selected === tier.tier ? "✓ Selected" : `Choose ${tier.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
