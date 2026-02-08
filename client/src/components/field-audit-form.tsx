import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Plus, Trash2 } from "lucide-react";

interface ExtraItem {
  id: string;
  label: string;
  price: number;
}

const AVAILABLE_EXTRAS: { label: string; price: number; testId: string }[] = [
  { label: "Stairs (Per Flight)", price: 15, testId: "button-add-stairs" },
  { label: "Long Carry (>50ft)", price: 25, testId: "button-add-long-carry" },
  { label: "Disassembly Labor", price: 40, testId: "button-add-disassembly" },
  { label: "Extra Volume (1/4 Truck)", price: 100, testId: "button-add-extra-volume" },
];

interface FieldAuditFormProps {
  job: {
    id: string;
    priceEstimate: number;
    isPriceLocked: boolean;
  };
  onLockPrice: (data: {
    newPrice: number;
    lineItems: ExtraItem[];
    reason: string;
  }) => void;
}

export function FieldAuditForm({ job, onLockPrice }: FieldAuditFormProps) {
  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [reason, setReason] = useState("");

  const basePrice = job.priceEstimate;
  const extrasTotal = extras.reduce((sum, item) => sum + item.price, 0);
  const currentTotal = basePrice + extrasTotal;

  const addExtra = (label: string, price: number) => {
    const id = `${label}-${Date.now()}`;
    setExtras((prev) => [...prev, { id, label, price }]);
  };

  const removeExtra = (id: string) => {
    setExtras((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLockPrice = () => {
    onLockPrice({
      newPrice: currentTotal,
      lineItems: extras,
      reason,
    });
  };

  return (
    <Card data-testid="card-field-audit">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          Field Audit
        </CardTitle>
        <CardDescription>
          Review and adjust the price before starting work
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Base Price</span>
          <span className="text-sm font-semibold">${basePrice.toFixed(2)}</span>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Add Extras</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_EXTRAS.map((extra) => (
              <Button
                key={extra.label}
                variant="outline"
                size="sm"
                onClick={() => addExtra(extra.label, extra.price)}
                data-testid={extra.testId}
              >
                <Plus className="w-3 h-3" />
                {extra.label} (+${extra.price})
              </Button>
            ))}
          </div>
        </div>

        {extras.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Added Extras</p>
            {extras.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                data-testid={`row-extra-${item.id}`}
              >
                <span className="text-sm">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">+${item.price.toFixed(2)}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeExtra(item.id)}
                    data-testid={`button-remove-extra-${item.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {extras.length > 0 && (
          <div>
            <label className="text-sm font-medium">Reason for Adjustment</label>
            <Input
              placeholder="Describe why extras were added"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              data-testid="input-adjustment-reason"
              className="mt-1"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold" data-testid="text-field-audit-total">
            ${currentTotal.toFixed(2)}
          </span>
        </div>

        <Button
          className="w-full"
          onClick={handleLockPrice}
          data-testid="button-lock-price"
        >
          <Lock className="w-4 h-4" />
          Lock Price & Start Job
        </Button>
      </CardContent>
    </Card>
  );
}
