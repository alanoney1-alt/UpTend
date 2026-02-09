/**
 * DwellScan Upsell Component
 *
 * Shows after service completion to encourage customers to book DwellScan
 * Two variants:
 * 1. After DwellScan Standard - upgrade to Aerial
 * 2. After any other service - book DwellScan
 *
 * Highlights the $49 credit benefit
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drone, Home, ArrowRight, Gift } from "lucide-react";
import { useLocation } from "wouter";

interface DwellScanUpsellProps {
  variant: 'upgrade_to_aerial' | 'book_dwellscan';
  onDismiss?: () => void;
}

export function DwellScanUpsell({ variant, onDismiss }: DwellScanUpsellProps) {
  const [, setLocation] = useLocation();

  const handleBookDwellScan = (tier: 'standard' | 'aerial') => {
    // Navigate to booking page with DwellScan pre-selected
    setLocation(`/book?service=home_consultation&tier=${tier}`);
  };

  if (variant === 'upgrade_to_aerial') {
    return (
      <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Drone className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Want to See Your Roof?</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade to DwellScan™ Aerial
                </p>
              </div>
            </div>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                ✕
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-600 text-white">
                Special Upgrade Price
              </Badge>
              <p className="text-2xl font-bold text-primary">Just $100 more</p>
            </div>
            <p className="text-sm text-muted-foreground">
              (Regular price $149 — save $49 since you already have Standard)
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">What you'll get:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Drone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>FAA-certified drone flyover of your roof</span>
              </li>
              <li className="flex items-start gap-2">
                <Drone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Aerial gutter blockage assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <Drone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Tree overhang & drainage analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <Drone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Full aerial photo set (GPS-tagged)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Worth it?</strong> Comparable drone roof inspections cost $290-$350 elsewhere.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => handleBookDwellScan('aerial')}
            >
              Upgrade to Aerial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss}>
                Maybe Later
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant: book_dwellscan (after any other service)
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Not Sure What Your Home Needs Next?</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Get a complete DwellScan™ home audit
              </p>
            </div>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Standard Option */}
          <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">DwellScan™ Standard</p>
                <p className="text-2xl font-bold text-primary">$49</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Full interior and exterior walkthrough with maintenance report
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleBookDwellScan('standard')}
            >
              Book Standard
            </Button>
          </div>

          {/* Aerial Option */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800 relative">
            <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
              RECOMMENDED
            </Badge>
            <div className="flex items-center gap-2 mb-2">
              <Drone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold">DwellScan™ Aerial</p>
                <p className="text-2xl font-bold text-blue-600">$149</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Everything in Standard plus drone-powered roof & gutter scan
            </p>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => handleBookDwellScan('aerial')}
            >
              Book Aerial
            </Button>
          </div>
        </div>

        {/* Credit Highlight */}
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                $49 Credit Included with Both Options
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Use toward your next UpTend service. Valid for 90 days.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="link"
            onClick={onDismiss}
            className="text-sm text-muted-foreground"
          >
            No thanks, I'll pass for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to determine when to show DwellScan upsell
 */
export function useDwellScanUpsell(
  completedServiceType: string | null,
  hasCompletedDwellScan: boolean
): { shouldShow: boolean; variant: 'upgrade_to_aerial' | 'book_dwellscan' | null } {
  if (!completedServiceType) {
    return { shouldShow: false, variant: null };
  }

  // If they just completed DwellScan Standard, offer Aerial upgrade
  if (completedServiceType === 'home_consultation' && !hasCompletedDwellScan) {
    return { shouldShow: true, variant: 'upgrade_to_aerial' };
  }

  // If they completed any other service and haven't done DwellScan, offer it
  if (completedServiceType !== 'home_consultation' && !hasCompletedDwellScan) {
    return { shouldShow: true, variant: 'book_dwellscan' };
  }

  return { shouldShow: false, variant: null };
}
