/**
 * Checkout Receipt Display
 *
 * Comprehensive receipt showing:
 * - Service line items with details
 * - DwellScan credit (applied first)
 * - Percentage discounts
 * - Promo codes
 * - Subtotal calculations
 * - 5% UpTend Protection Fee
 * - Final total
 * - Payment method
 * - Booking details
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Shield, Calendar, MapPin, Users, Clock } from "lucide-react";
import type { DiscountBreakdown } from "@/lib/discount-engine";

interface CheckoutReceiptProps {
  services: Array<{
    serviceBranded: string;
    serviceType: string;
    price: number;
    details?: string;
    prosNeeded?: number;
    estimatedDuration?: string;
  }>;
  discountBreakdown: DiscountBreakdown;
  bookingDetails: {
    scheduledFor: string;
    address: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  };
  paymentMethod?: {
    brand: string;
    last4: string;
  };
  protectionFeePercent: number; // Default 0.05 (5%)
}

export function CheckoutReceipt({
  services,
  discountBreakdown,
  bookingDetails,
  paymentMethod,
  protectionFeePercent: 0.05,
}: CheckoutReceiptProps) {
  const protectionFeeAmount = Math.round(discountBreakdown.finalTotal * protectionFeePercent);
  const grandTotal = discountBreakdown.finalTotal + protectionFeeAmount;

  const totalProsNeeded = services.reduce((sum, s) => sum + (s.prosNeeded || 1), 0);
  const averageDuration = services.length > 0
    ? services.reduce((sum, s) => {
        const match = s.estimatedDuration?.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 2);
      }, 0) / services.length
    : 2;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle>Booking Summary</CardTitle>
          <Badge variant="default">Confirmed</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Booking Details */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {new Date(bookingDetails.scheduledFor).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Service Location</p>
              <p className="text-sm text-muted-foreground">
                {bookingDetails.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Team Size</p>
              <p className="text-sm text-muted-foreground">
                {totalProsNeeded} Pro{totalProsNeeded > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Est. Duration</p>
              <p className="text-sm text-muted-foreground">
                ~{Math.round(averageDuration)} hours
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Service Line Items */}
        <div className="space-y-4">
          <h3 className="font-semibold">Services</h3>
          {services.map((service, index) => (
            <div key={index} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <p className="font-medium">{service.serviceBranded}</p>
                </div>
                {service.details && (
                  <p className="text-sm text-muted-foreground ml-6">
                    {service.details}
                  </p>
                )}
                {(service.prosNeeded || service.estimatedDuration) && (
                  <div className="flex items-center gap-4 ml-6 mt-1">
                    {service.prosNeeded && (
                      <span className="text-xs text-muted-foreground">
                        {service.prosNeeded} Pro{service.prosNeeded > 1 ? 's' : ''}
                      </span>
                    )}
                    {service.estimatedDuration && (
                      <span className="text-xs text-muted-foreground">
                        ~{service.estimatedDuration}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="font-medium">${service.price}</p>
            </div>
          ))}
        </div>

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
            <div className="space-y-3">
              <h3 className="font-semibold text-green-600">Discounts Applied</h3>
              {discountBreakdown.discountsApplied.map((discount, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{discount.name}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    -{discount.type === 'credit' ? '$' : '$'}{discount.amount}
                  </span>
                </div>
              ))}

              {/* Total Savings Box */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-900">
                    Total Savings
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    -${discountBreakdown.totalDiscount}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  {discountBreakdown.savingsMessage}
                </p>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Subtotal After Discounts */}
        <div className="flex justify-between items-center">
          <span className="font-medium">
            Subtotal After Discounts
          </span>
          <span className="font-bold">${discountBreakdown.finalTotal}</span>
        </div>

        {/* UpTend Protection Fee */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3 mb-2">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="font-medium text-blue-900">
                  UpTend Protection Fee ({Math.round(protectionFeePercent * 100)}%)
                </p>
                <span className="font-bold text-blue-900">
                  ${protectionFeeAmount}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                Covers $1M liability insurance, background checks, 24/7 support,
                and satisfaction guarantee
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Grand Total */}
        <div className="bg-primary/10 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold">Total</span>
            <span className="text-3xl font-bold text-primary">
              ${grandTotal}
            </span>
          </div>
          {discountBreakdown.totalDiscount > 0 && (
            <p className="text-xs text-muted-foreground text-right mt-1">
              (Original: ${discountBreakdown.subtotal + protectionFeeAmount})
            </p>
          )}
        </div>

        {/* Payment Method */}
        {paymentMethod && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Method</span>
              <div className="flex items-center gap-2">
                <span className="text-sm capitalize">{paymentMethod.brand}</span>
                <span className="text-sm text-muted-foreground">
                  ****{paymentMethod.last4}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Customer Info */}
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer Name</span>
            <span className="font-medium">{bookingDetails.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">{bookingDetails.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{bookingDetails.customerEmail}</span>
          </div>
        </div>

        {/* Footer Notes */}
        <Separator />
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            • Your verified Pro will contact you 30 minutes before arrival
          </p>
          <p>
            • Final price confirmed after on-site verification (within 10% wiggle room)
          </p>
          <p>
            • Cancellation free up to 24 hours before scheduled time
          </p>
          <p>
            • Satisfaction guaranteed or your money back
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
