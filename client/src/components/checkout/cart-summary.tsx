/**
 * Cart Summary with Discount Breakdown
 *
 * Displays:
 * - Service line items
 * - DwellScan credit (applied first)
 * - Percentage discounts (multi-service, PM tier, etc.)
 * - Promo codes
 * - Final total with savings message
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  calculateDiscounts,
  getAvailableDiscounts,
  getUpsellSuggestions,
  type CartService,
  type DiscountContext,
} from "@/lib/discount-engine";
import { Check, Tag, TrendingUp, Sparkles, X } from "lucide-react";

interface CartSummaryProps {
  services: CartService[];
  customerId: string;
  isFirstTimeCustomer: boolean;
  isPropertyManager?: boolean;
  pmTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  hasDwellScanCredit?: boolean;
  dwellScanCreditAmount?: number;
  onCheckout: (finalTotal: number, discountBreakdown: any) => void;
}

export function CartSummary({
  services,
  customerId,
  isFirstTimeCustomer,
  isPropertyManager = false,
  pmTier,
  hasDwellScanCredit = false,
  dwellScanCreditAmount = 49,
  onCheckout,
}: CartSummaryProps) {
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>();
  const [showPromoInput, setShowPromoInput] = useState(false);

  const [discountContext, setDiscountContext] = useState<DiscountContext>({
    services,
    customerId,
    isFirstTimeCustomer,
    isPropertyManager,
    pmTier,
    hasDwellScanCredit,
    dwellScanCreditAmount,
    promoCode: appliedPromoCode,
  });

  // Recalculate discounts when context changes
  useEffect(() => {
    setDiscountContext({
      services,
      customerId,
      isFirstTimeCustomer,
      isPropertyManager,
      pmTier,
      hasDwellScanCredit,
      dwellScanCreditAmount,
      promoCode: appliedPromoCode,
    });
  }, [services, customerId, isFirstTimeCustomer, isPropertyManager, pmTier, hasDwellScanCredit, dwellScanCreditAmount, appliedPromoCode]);

  const discountBreakdown = calculateDiscounts(discountContext);
  const availableDiscounts = getAvailableDiscounts({
    serviceCount: services.length,
    isFirstTime: isFirstTimeCustomer,
    isPropertyManager,
    pmTier,
    hasDwellScanCredit,
  });
  const upsellSuggestions = getUpsellSuggestions({
    services,
    currentTotal: discountBreakdown.subtotal,
  });

  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    // Validate promo code
    // For now, just apply it
    setAppliedPromoCode(promoCode.toUpperCase());
    setPromoCode('');
    setPromoError('');
    setShowPromoInput(false);
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Active Discounts Banner */}
      {availableDiscounts.filter(d => d.isActive).length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Active Discounts:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableDiscounts
                    .filter(d => d.isActive)
                    .map((discount, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {discount.name}: {discount.discount}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>{services.length} service{services.length > 1 ? 's' : ''} selected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((service, index) => (
            <div key={index} className="flex justify-between items-start">
              <div>
                <p className="font-medium">{service.serviceBranded}</p>
                <p className="text-sm text-muted-foreground capitalize">{service.serviceType.replace('_', ' ')}</p>
              </div>
              <p className="font-medium">${service.price}</p>
            </div>
          ))}

          <Separator />

          {/* Subtotal */}
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium">Subtotal</span>
            <span className="font-bold">${discountBreakdown.subtotal}</span>
          </div>

          {/* Discounts Applied */}
          {discountBreakdown.discountsApplied.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">Discounts Applied:</p>
                {discountBreakdown.discountsApplied.map((discount, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-muted-foreground">{discount.name}</span>
                    </div>
                    <span className="text-green-600 font-medium">-${discount.amount}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Promo Code Section */}
          <Separator />
          {!appliedPromoCode && !showPromoInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPromoInput(true)}
              className="w-full justify-start"
            >
              <Tag className="w-4 h-4 mr-2" />
              Have a promo code?
            </Button>
          )}

          {showPromoInput && !appliedPromoCode && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromoCode()}
                />
                <Button onClick={handleApplyPromoCode}>Apply</Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowPromoInput(false);
                    setPromoCode('');
                    setPromoError('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {promoError && (
                <p className="text-sm text-destructive">{promoError}</p>
              )}
            </div>
          )}

          {appliedPromoCode && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">{appliedPromoCode}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePromoCode}
              >
                Remove
              </Button>
            </div>
          )}

          <Separator />

          {/* Total Savings */}
          {discountBreakdown.totalDiscount > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-900">Total Savings</span>
                <span className="text-lg font-bold text-green-600">-${discountBreakdown.totalDiscount}</span>
              </div>
              <p className="text-xs text-green-700">{discountBreakdown.savingsMessage}</p>
            </div>
          )}

          {/* Final Total */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total</span>
              <span className="text-3xl font-bold text-primary">${discountBreakdown.finalTotal}</span>
            </div>
            {discountBreakdown.totalDiscount > 0 && (
              <p className="text-xs text-muted-foreground text-right mt-1">
                (Original: ${discountBreakdown.subtotal})
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => onCheckout(discountBreakdown.finalTotal, discountBreakdown)}
          >
            Proceed to Payment
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            5% UpTend Protection Fee included
          </p>
        </CardContent>
      </Card>

      {/* Upsell Suggestions */}
      {upsellSuggestions.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Maximize Your Savings</p>
                <p className="text-sm text-muted-foreground">Consider adding:</p>
              </div>
            </div>
            <div className="space-y-3">
              {upsellSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-background rounded-lg">
                  <div>
                    <p className="font-medium">{suggestion.suggestion}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Save ${suggestion.savings}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Discounts (Inactive) */}
      {availableDiscounts.filter(d => !d.isActive).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Discounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableDiscounts
              .filter(d => !d.isActive)
              .map((discount, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{discount.name}</p>
                    <p className="text-xs text-muted-foreground">{discount.description}</p>
                  </div>
                  <Badge variant="outline">{discount.discount}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
