import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Camera, Tag, Plus, Minus, Package, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomerItem {
  id: string;
  label: string;
  quantity: number;
  price: number;
}

interface PyckerPriceVerificationProps {
  jobId: string;
  aiPriceMin?: number;
  aiPriceMax?: number;
  aiConfidence?: number;
  priceEstimate: number;
  photoUrls?: string[];
  identifiedItems?: string[];
  customerItems?: CustomerItem[];
  loadEstimate?: string;
  serviceType?: string;
  onVerified: () => void;
}

export function PyckerPriceVerification({
  jobId,
  aiPriceMin,
  aiPriceMax,
  aiConfidence,
  priceEstimate,
  photoUrls = [],
  identifiedItems = [],
  customerItems = [],
  loadEstimate,
  serviceType,
  onVerified,
}: PyckerPriceVerificationProps) {
  const hasAiEstimate = aiPriceMin != null && aiPriceMax != null && aiConfidence != null;
  const hasManualItems = customerItems.length > 0;

  const [verifiedItemsList, setVerifiedItemsList] = useState<CustomerItem[]>(
    hasManualItems ? customerItems.map(i => ({ ...i })) : []
  );
  const [finalPrice, setFinalPrice] = useState(
    hasAiEstimate ? (aiPriceMin + aiPriceMax) / 2 : priceEstimate || 0
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();

  const itemsTotal = verifiedItemsList.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateItemQty = (id: string, delta: number) => {
    setVerifiedItemsList(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }).filter(item => item.quantity > 0)
    );
  };

  const getConfidenceVariant = () => {
    if (!aiConfidence) return "outline" as const;
    if (aiConfidence >= 0.8) return "default" as const;
    if (aiConfidence >= 0.6) return "secondary" as const;
    return "outline" as const;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        finalPrice: hasManualItems ? itemsTotal : finalPrice,
        notes,
      };
      if (hasManualItems) {
        payload.verifiedItems = verifiedItemsList;
      }
      await apiRequest("POST", `/api/jobs/${jobId}/verify-price`, payload);
      setVerified(true);
      toast({ title: "Price verified", description: "Final price confirmed successfully" });
      setTimeout(() => onVerified(), 1500);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to verify price", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    const confirmedPrice = hasManualItems ? itemsTotal : finalPrice;
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100" data-testid="text-verified-title">Items & Price Verified</h3>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2" data-testid="text-verified-price">
            Final price of ${confirmedPrice.toFixed(2)} has been confirmed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-verification-title">Verify Items & Price</CardTitle>
        <CardDescription>
          {hasAiEstimate
            ? "Review the AI estimate, verify items on-site, and confirm the final price"
            : hasManualItems
              ? "The customer selected these items. Verify what's actually on-site and adjust if needed"
              : "Review the job details and confirm the final price"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAiEstimate && (
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">AI Estimated Price Range</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-ai-price-range">
              ${aiPriceMin!.toFixed(2)} - ${aiPriceMax!.toFixed(2)}
            </div>
            <Badge className="mt-2" variant={getConfidenceVariant()}>
              {aiConfidence! >= 0.8 ? "High" : aiConfidence! >= 0.6 ? "Medium" : "Low"} Confidence ({(aiConfidence! * 100).toFixed(0)}%)
            </Badge>
          </div>
        )}

        {!hasAiEstimate && priceEstimate > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">Customer's Estimated Price</div>
            <div className="text-3xl font-bold" data-testid="text-customer-price">
              ${priceEstimate.toFixed(2)}
            </div>
            {loadEstimate && (
              <p className="text-sm text-muted-foreground mt-1">Load size: {loadEstimate}</p>
            )}
          </div>
        )}

        {hasManualItems && (
          <div data-testid="container-item-verification">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">Customer-Selected Items</h4>
              </div>
              <Badge variant="outline" data-testid="badge-item-count">
                {verifiedItemsList.reduce((sum, i) => sum + i.quantity, 0)} items
              </Badge>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Adjust quantities to match what you see on-site. Remove items not present, or note any extras below.
                </p>
              </div>
            </div>
            <div className="space-y-2" data-testid="list-verification-items">
              {verifiedItemsList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  data-testid={`row-item-${item.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" data-testid={`text-item-label-${item.id}`}>{item.label}</p>
                    <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateItemQty(item.id, -1)}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-semibold text-sm" data-testid={`text-qty-${item.id}`}>
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateItemQty(item.id, 1)}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <span className="w-16 text-right text-sm font-semibold" data-testid={`text-item-subtotal-${item.id}`}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="font-semibold">Verified Total</span>
              <span className="text-lg font-bold text-primary" data-testid="text-verified-total">
                ${itemsTotal.toFixed(2)}
              </span>
            </div>
            {priceEstimate > 0 && Math.abs(itemsTotal - priceEstimate) > 0.01 && (
              <div className="mt-2">
                <Badge variant={itemsTotal > priceEstimate ? "destructive" : "secondary"} data-testid="badge-price-diff">
                  {itemsTotal > priceEstimate ? "+" : ""}${(itemsTotal - priceEstimate).toFixed(2)} vs customer estimate
                </Badge>
              </div>
            )}
          </div>
        )}

        {identifiedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">AI-Identified Items</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {identifiedItems.map((item, i) => <Badge key={i} variant="outline">{item}</Badge>)}
            </div>
          </div>
        )}

        {photoUrls.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">Customer Photos</h4>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {photoUrls.map((url, i) => <img key={i} src={url} alt="Job photo" className="h-20 w-20 rounded object-cover" />)}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {!hasManualItems && (
            <div>
              <label className="text-sm font-medium">Final Price</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={finalPrice}
                onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                data-testid="input-final-price"
                className="mt-1"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              placeholder={hasManualItems
                ? "e.g., Customer had 2 extra bags not listed, removed items already gone"
                : "e.g., Additional items found, Less than expected"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="textarea-verifier-notes"
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full" data-testid="button-confirm-price">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirming...</>
            ) : hasManualItems ? (
              `Confirm Items & Price ($${itemsTotal.toFixed(2)})`
            ) : (
              "Confirm Price"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
