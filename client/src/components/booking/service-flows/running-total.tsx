import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { formatCurrency } from "./types";

interface RunningTotalProps {
  total: number;
  monthlyTotal?: number;
  lineItems: Array<{ label: string; price: number; quantity?: number }>;
  discounts?: Array<{ label: string; amount: number }>;
  minimumCharge?: number;
  onContinue: () => void;
  onBack?: () => void;
  continueLabel?: string;
  note?: string;
}

export function RunningTotal({
  total,
  monthlyTotal,
  lineItems,
  discounts,
  minimumCharge,
  onContinue,
  onBack,
  continueLabel = "Continue with This Quote",
  note,
}: RunningTotalProps) {
  const displayTotal = minimumCharge ? Math.max(total, minimumCharge) : total;
  const isMinimumApplied = minimumCharge ? total < minimumCharge && total > 0 : false;

  return (
    <Card className="mt-6 border-2 border-primary/30">
      <CardContent className="p-5 space-y-4">
        {lineItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Quote Summary
            </h4>
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.label}
                  {item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="font-medium">{formatCurrency(item.price * (item.quantity || 1))}</span>
              </div>
            ))}
          </div>
        )}

        {discounts && discounts.length > 0 && (
          <div className="space-y-1 border-t pt-2">
            {discounts.map((d, i) => (
              <div key={i} className="flex justify-between text-sm text-green-600">
                <span>{d.label}</span>
                <span>-{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {isMinimumApplied && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Minimum charge of {formatCurrency(minimumCharge!)} applied
          </p>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium text-muted-foreground">
              {monthlyTotal ? "Monthly Total" : "Estimated Total"}
            </span>
            <span className="text-3xl font-black text-primary">
              {formatCurrency(monthlyTotal || displayTotal)}
              {monthlyTotal ? <span className="text-sm font-normal">/mo</span> : ""}
            </span>
          </div>
        </div>

        {note && (
          <p className="text-xs text-muted-foreground italic">{note}</p>
        )}

        <div className="flex gap-3">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <Button
            onClick={onContinue}
            disabled={displayTotal === 0}
            className="flex-1"
            size="lg"
          >
            {continueLabel} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
