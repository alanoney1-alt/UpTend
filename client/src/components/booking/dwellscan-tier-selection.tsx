/**
 * Home DNA Scan Tier Selection Component
 *
 * Allows customers to choose between:
 * - Home DNA Scan Standard (Free)
 * - Home DNA Scan Aerial (Free) - RECOMMENDED
 *
 * Both include $25 credit toward next booking
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Plane, Home } from "lucide-react";
import { SERVICES } from "@/constants/services";
import { useState } from "react";

interface DwellScanTierSelectionProps {
  onSelectTier: (tier: 'standard' | 'aerial', price: number) => void;
  defaultTier?: 'standard' | 'aerial';
}

export function DwellScanTierSelection({ onSelectTier, defaultTier = 'standard' }: DwellScanTierSelectionProps) {
  const [selectedTier, setSelectedTier] = useState<'standard' | 'aerial'>(defaultTier);
  const dwellScanService = SERVICES.home_scan;

  const handleSelectTier = (tier: 'standard' | 'aerial') => {
    setSelectedTier(tier);
    const price = tier === 'standard' ? dwellScanService.tiers.standard.price : dwellScanService.tiers.aerial.price;
    onSelectTier(tier, price);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Home DNA Scan</h2>
        <p className="text-muted-foreground">
          Both tiers are completely free and include a <strong>$25 credit</strong> toward your next booking
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Standard Tier */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary ${selectedTier === 'standard' ? 'border-primary border-2 shadow-lg' : ''}`}
          onClick={() => handleSelectTier('standard')}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Home DNA Scan Standard</CardTitle>
                  <p className="text-2xl font-bold text-primary mt-1">Free</p>
                </div>
              </div>
              {selectedTier === 'standard' && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="w-3 h-3 mr-1" /> Selected
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {dwellScanService.tiers.standard.description}
            </p>

            <div className="space-y-2">
              <p className="text-sm font-semibold">What's included:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {dwellScanService.tiers.standard.includes.slice(0, 5).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{dwellScanService.tiers.standard.estimatedDuration}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Team:</span>
                <span className="font-medium">{dwellScanService.tiers.standard.prosNeeded} Pro</span>
              </div>
            </div>

            <Button
              className="w-full"
              variant={selectedTier === 'standard' ? 'default' : 'outline'}
              onClick={() => handleSelectTier('standard')}
            >
              {selectedTier === 'standard' ? 'Selected' : 'Select Standard'}
            </Button>
          </CardContent>
        </Card>

        {/* Aerial Tier - RECOMMENDED */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary relative ${selectedTier === 'aerial' ? 'border-primary border-2 shadow-lg' : ''}`}
          onClick={() => handleSelectTier('aerial')}
        >
          <Badge
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            RECOMMENDED
          </Badge>

          <CardHeader className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Home DNA Scan Aerial</CardTitle>
                  <p className="text-2xl font-bold text-primary mt-1">Free</p>
                </div>
              </div>
              {selectedTier === 'aerial' && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="w-3 h-3 mr-1" /> Selected
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {dwellScanService.tiers.aerial.description}
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-sm text-blue-900 dark:text-blue-100">
               <strong>Value:</strong> Comparable drone inspections cost $290–$350 alone. Yours is free with a <strong>$25 credit</strong> toward your next booking.
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Everything in Standard, plus:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {dwellScanService.tiers.aerial.includes.slice(1, 6).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{dwellScanService.tiers.aerial.estimatedDuration}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Team:</span>
                <span className="font-medium">
                  {typeof dwellScanService.tiers.aerial.prosNeeded === 'object'
                    ? `${dwellScanService.tiers.aerial.prosNeeded.default} Pros (or 1 combined)`
                    : `${dwellScanService.tiers.aerial.prosNeeded} Pro`}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              variant={selectedTier === 'aerial' ? 'default' : 'outline'}
              onClick={() => handleSelectTier('aerial')}
            >
              {selectedTier === 'aerial' ? 'Selected' : 'Select Aerial'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Credit Reminder */}
      <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100">
              ${dwellScanService.credit.amount} Credit Included
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {dwellScanService.credit.description}. Valid for {dwellScanService.credit.expiresInDays} days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
