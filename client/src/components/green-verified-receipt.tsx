import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Leaf, Recycle, TreeDeciduous, Truck, Zap, Droplets,
  AlertTriangle, CheckCircle, Download, Share2, Shield,
  Route, Flame, Award, FileText, Info
} from "lucide-react";

interface GreenVerifiedReceiptProps {
  serviceRequestId: string;
}

interface TaxCreditAlert {
  code: string;
  title: string;
  description: string;
  potentialSavings?: string;
}

interface ReceiptData {
  serviceRequestId: string;
  serviceType: string;
  serviceDescription: string;
  status: string;
  carbonFootprintKg: number;
  carbonFootprintLbs: number;
  proofGreenOptimization: {
    routingSavingsKg: number;
    routingSavingsPct: number;
    description: string;
  };
  breakdown: {
    transportEmissions: number;
    disposalEmissions: number;
    offsetCredits: number;
    methaneEquivalentLbs?: number;
    metalDiversionCreditLbs?: number;
    avoidedEmissionsKg?: number;
    waterSavedGallons?: number;
    cleanerOffset?: number;
  };
  serviceFactors?: {
    methaneFactorApplied?: boolean;
    methaneCo2EquivalentLbs?: number;
    metalDivertedLbs?: number;
    avoidedEmissionsKg?: number;
    seerRatingOld?: number;
    seerRatingNew?: number;
    cleanerType?: string;
    waterUsedGallons?: number;
    waterSavedGallons?: number;
  };
  taxCreditAlerts: TaxCreditAlert[];
  carbonOffsetCost: number;
  carbonOffsetPurchased: boolean;
  treesEquivalent: number;
  disposalBreakdown: {
    recycled: number;
    donated: number;
    landfilled: number;
    eWaste: number;
  };
  distanceMiles: number;
  totalWeightLbs: number;
  diversionRate: number;
  greenVerified: boolean;
  issuedAt: string;
}

export function GreenVerifiedReceipt({ serviceRequestId }: GreenVerifiedReceiptProps) {
  const { data: receipt, isLoading, error } = useQuery<ReceiptData>({
    queryKey: ["/api/receipts/green-verified", serviceRequestId],
    queryFn: () => fetch(`/api/receipts/green-verified/${serviceRequestId}`, { credentials: "include" }).then(r => {
      if (!r.ok) throw new Error("Failed to load receipt");
      return r.json();
    }),
    enabled: !!serviceRequestId,
  });

  if (isLoading) {
    return (
      <Card className="p-6" data-testid="receipt-loading">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-24 w-full mb-2" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (error || !receipt) {
    return (
      <Card className="p-6 border-dashed border-2" data-testid="receipt-error">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Impact Summary Unavailable</h3>
          <p className="text-sm text-muted-foreground">
            Environmental impact data is not yet available for this service.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="card-green-verified-receipt">
      <div className="bg-gradient-to-r from-[#3B1D5A] to-[#2a1340] p-6 text-white">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F47C20]/20 rounded-full">
              <Shield className="w-6 h-6 text-[#F47C20]" />
            </div>
            <div>
              <h3 className="font-bold text-lg" data-testid="text-receipt-title">UpTend Impact Summary</h3>
              <p className="text-sm text-white/70">Green Verified Receipt</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-0 shrink-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Service</p>
            <p className="font-semibold text-base" data-testid="text-service-description">
              {receipt.serviceDescription}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0" data-testid="badge-service-type">
            {receipt.serviceType.replace(/_/g, ' ')}
          </Badge>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-[#F47C20]" />
            <h4 className="font-semibold text-sm">Carbon Footprint</h4>
          </div>
          <div className="bg-muted/50 rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Total Carbon Footprint</span>
              <span className="font-bold text-base" data-testid="text-carbon-footprint-kg">
                {receipt.carbonFootprintKg.toFixed(2)} kg CO&#x2082;
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Transport Emissions</span>
              <span className="text-sm">{receipt.breakdown.transportEmissions.toFixed(1)} lbs</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Disposal Impact</span>
              <span className="text-sm">{receipt.breakdown.disposalEmissions.toFixed(1)} lbs</span>
            </div>
            {receipt.breakdown.methaneEquivalentLbs !== undefined && receipt.breakdown.methaneEquivalentLbs > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Methane (CH&#x2084;) Equivalent
                </span>
                <span className="text-sm text-amber-600 dark:text-amber-400" data-testid="text-methane-equivalent">
                  +{receipt.breakdown.methaneEquivalentLbs.toFixed(1)} lbs CO&#x2082;e
                </span>
              </div>
            )}
            {receipt.breakdown.metalDiversionCreditLbs !== undefined && receipt.breakdown.metalDiversionCreditLbs > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Recycle className="w-3 h-3 text-green-500" />
                  Metal Diversion Credit
                </span>
                <span className="text-sm text-green-600 dark:text-green-400" data-testid="text-metal-credit">
                  -{receipt.breakdown.metalDiversionCreditLbs.toFixed(1)} lbs CO&#x2082;
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Route className="w-4 h-4 text-green-500" />
            <h4 className="font-semibold text-sm">ProofGreen Optimization</h4>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-4">
            <p className="text-sm font-medium text-green-700 dark:text-green-400" data-testid="text-proofgreen-description">
              {receipt.proofGreenOptimization.description}
            </p>
            {receipt.proofGreenOptimization.routingSavingsKg > 0 && (
              <div className="flex items-center gap-4 mt-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600" data-testid="text-routing-savings-kg">
                    {receipt.proofGreenOptimization.routingSavingsKg} kg
                  </p>
                  <p className="text-xs text-muted-foreground">CO&#x2082; Saved</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600" data-testid="text-routing-savings-pct">
                    {receipt.proofGreenOptimization.routingSavingsPct}%
                  </p>
                  <p className="text-xs text-muted-foreground">Reduction</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {receipt.serviceFactors && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#F47C20]" />
                <h4 className="font-semibold text-sm">Service-Specific Impact</h4>
              </div>
              <div className="space-y-2">
                {receipt.serviceFactors.methaneFactorApplied && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md" data-testid="factor-methane">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Landfill Methane Factor Applied</p>
                      <p className="text-xs text-muted-foreground">
                        Landfill waste emits methane (CH&#x2084;), which is 25x more potent than CO&#x2082;.
                        This receipt accounts for {receipt.serviceFactors.methaneCo2EquivalentLbs?.toFixed(1)} lbs CO&#x2082;-equivalent methane emissions.
                      </p>
                    </div>
                  </div>
                )}
                {receipt.serviceFactors.metalDivertedLbs && receipt.serviceFactors.metalDivertedLbs > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md" data-testid="factor-metal-diversion">
                    <Award className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Green Win: Metal Diversion</p>
                      <p className="text-xs text-muted-foreground">
                        {receipt.serviceFactors.metalDivertedLbs} lbs of metal diverted from landfill, saving significant CO&#x2082; emissions.
                      </p>
                    </div>
                  </div>
                )}
                {receipt.serviceFactors.avoidedEmissionsKg && receipt.serviceFactors.avoidedEmissionsKg > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md" data-testid="factor-avoided-emissions">
                    <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">10-Year Avoided Emissions</p>
                      <p className="text-xs text-muted-foreground">
                        Upgrading from SEER {receipt.serviceFactors.seerRatingOld} to SEER2 {receipt.serviceFactors.seerRatingNew} avoids
                        an estimated {receipt.serviceFactors.avoidedEmissionsKg.toFixed(0)} kg CO&#x2082; over the next 10 years.
                      </p>
                    </div>
                  </div>
                )}
                {receipt.serviceFactors.cleanerType && (
                  <div className="flex items-start gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-md" data-testid="factor-cleaner">
                    <Droplets className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {receipt.serviceFactors.cleanerType === 'bio_based' ? 'Bio-Based Cleaners Used' : 'Chemical Cleaners Used'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Water used: {receipt.serviceFactors.waterUsedGallons?.toFixed(0) || 0} gallons.
                        {receipt.serviceFactors.waterSavedGallons && receipt.serviceFactors.waterSavedGallons > 0 && (
                          <> Saved {receipt.serviceFactors.waterSavedGallons.toFixed(0)} gallons vs. industry average.</>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {receipt.taxCreditAlerts && receipt.taxCreditAlerts.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#F47C20]" />
                <h4 className="font-semibold text-sm">Tax Credit Alerts</h4>
              </div>
              <div className="space-y-2">
                {receipt.taxCreditAlerts.map((alert, idx) => (
                  <div
                    key={alert.code || idx}
                    className="flex items-start gap-3 p-3 border rounded-md"
                    data-testid={`tax-alert-${alert.code}`}
                  >
                    <Info className="w-4 h-4 text-[#F47C20] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium">{alert.title}</p>
                        {alert.potentialSavings && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {alert.potentialSavings}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-muted/50 rounded-md">
            <TreeDeciduous className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold" data-testid="text-trees-equivalent">{receipt.treesEquivalent}</p>
            <p className="text-xs text-muted-foreground">Trees Equivalent</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <Truck className="w-5 h-5 text-[#F47C20] mx-auto mb-1" />
            <p className="text-lg font-bold" data-testid="text-distance">{Math.round(receipt.distanceMiles)}</p>
            <p className="text-xs text-muted-foreground">Miles</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <Recycle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold" data-testid="text-diversion-rate">{receipt.diversionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Diverted</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Carbon Offset: {receipt.carbonOffsetPurchased ? "Purchased" : `$${receipt.carbonOffsetCost.toFixed(2)}`}
            </span>
          </div>
          {receipt.greenVerified && (
            <Badge className="bg-green-600 text-white border-0 shrink-0">
              <Shield className="w-3 h-3 mr-1" />
              Green Verified
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" data-testid="button-download-receipt">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="flex-1" data-testid="button-share-receipt">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center" data-testid="text-issued-at">
          Issued: {new Date(receipt.issuedAt).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}