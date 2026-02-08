/**
 * PolishUp Cross-Sell Prompt
 *
 * Shown after LiftCrew, GarageReset, BulkSnap bookings
 * Offers 10% discount for returning customers
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, CheckCircle, Home } from "lucide-react";

interface PolishUpCrossSellProps {
  serviceJustBooked: "junk_removal" | "garage_cleanout" | "moving_labor";
  onDismiss: () => void;
  onBook: () => void;
}

const SERVICE_TO_PITCH = {
  junk_removal: {
    headline: "Space cleared. Now keep it spotless.",
    description: "You just freed up space with BulkSnap™. Now keep your home looking its best with PolishUp™ recurring cleaning.",
    benefit: "Perfect timing to establish a cleaning routine in your refreshed space.",
  },
  garage_cleanout: {
    headline: "Garage reset. Home next?",
    description: "Your garage is pristine thanks to GarageReset™. Extend that clean feeling to your entire home with PolishUp™.",
    benefit: "Maintain the momentum—clean garage, clean house.",
  },
  moving_labor: {
    headline: "Moved in. Time to settle.",
    description: "LiftCrew™ got you unpacked. Now let PolishUp™ make your new place feel like home with a deep clean.",
    benefit: "Start fresh in your new space with a professional clean.",
  },
};

export function PolishUpCrossSell({ serviceJustBooked, onDismiss, onBook }: PolishUpCrossSellProps) {
  const [dismissed, setDismissed] = useState(false);

  const pitch = SERVICE_TO_PITCH[serviceJustBooked];

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  const handleBook = () => {
    onBook();
  };

  return (
    <Card className="relative border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3"
        onClick={handleDismiss}
      >
        <X className="w-4 h-4" />
      </Button>

      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">{pitch.headline}</CardTitle>
            <Badge variant="default" className="mt-1">
              10% off for returning customers
            </Badge>
          </div>
        </div>
        <CardDescription className="text-base">{pitch.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm">{pitch.benefit}</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm">Room-by-room checklist with before/after photo verification</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm">Save 10-15% with recurring plans (weekly/biweekly/monthly)</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm">Your dedicated Pro learns your preferences over time</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleBook} className="flex-1">
            <Home className="w-4 h-4 mr-2" />
            Book PolishUp<sup>™</sup> Clean
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Starting at $99 • 10% returning customer discount applied at checkout
        </p>
      </CardContent>
    </Card>
  );
}
