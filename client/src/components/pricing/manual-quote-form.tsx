import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculatePolishUpPrice,
  getCleanTypeLabel,
  getCleanTypeDescription,
  type PolishUpPricingInput,
} from "@/lib/polishup-pricing";
import { createPricingQuote, type PricingQuote } from "@/lib/pricing-quote";
import { CheckCircle, Users, Clock, Sparkles } from "lucide-react";

interface ManualQuoteFormProps {
  serviceType: 'polishup';
  onQuoteGenerated: (quote: PricingQuote) => void;
}

export function ManualQuoteForm({ serviceType, onQuoteGenerated }: ManualQuoteFormProps) {
  const [formData, setFormData] = useState<PolishUpPricingInput>({
    cleanType: 'standard',
    bedrooms: 2,
    bathrooms: 2,
    stories: 1,
    sqft: undefined,
    hasPets: false,
    lastCleaned: '1_6_months',
    sameDayBooking: false,
  });

  const [specialRequests, setSpecialRequests] = useState('');
  const [quote, setQuote] = useState<ReturnType<typeof calculatePolishUpPrice> | null>(null);

  // Recalculate quote whenever form data changes
  useEffect(() => {
    if (serviceType === 'polishup') {
      const calculatedQuote = calculatePolishUpPrice(formData);
      setQuote(calculatedQuote);
    }
  }, [formData, serviceType]);

  const handleConfirmQuote = () => {
    if (!quote) return;

    const pricingQuote = createPricingQuote(
      'polishup',
      'PolishUp™',
      { ...formData, specialRequests },
      'manual_form',
      quote.basePrice,
      quote.modifiersApplied,
      quote.finalPrice,
      `${quote.estimatedDurationHours} hours`,
      quote.estimatedProsNeeded,
      quote.breakdown
    );

    onQuoteGenerated(pricingQuote);
  };

  return (
    <div className="space-y-6">
      {/* Live Price Display */}
      {quote && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Estimated Price</p>
              <p className="text-5xl font-bold text-primary mb-2">
                ${quote.finalPrice}
              </p>
              <p className="text-sm text-muted-foreground mb-4">{quote.breakdown}</p>
              <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{quote.estimatedProsNeeded} Pro{quote.estimatedProsNeeded > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>~{quote.estimatedDurationHours} hours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clean Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Clean Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.cleanType}
            onValueChange={(value) =>
              setFormData({ ...formData, cleanType: value as PolishUpPricingInput['cleanType'] })
            }
          >
            <div className="grid gap-3">
              {(['standard', 'deep', 'move_out'] as const).map((type) => (
                <label
                  key={type}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.cleanType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value={type} id={type} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{getCleanTypeLabel(type)}</p>
                      {formData.cleanType === type && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getCleanTypeDescription(type)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle>2. Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Select
                value={String(formData.bedrooms)}
                onValueChange={(value) =>
                  setFormData({ ...formData, bedrooms: parseInt(value) as PolishUpPricingInput['bedrooms'] })
                }
              >
                <SelectTrigger id="bedrooms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Studio</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4 Bedrooms</SelectItem>
                  <SelectItem value="5">5+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Select
                value={String(formData.bathrooms)}
                onValueChange={(value) =>
                  setFormData({ ...formData, bathrooms: parseFloat(value) as PolishUpPricingInput['bathrooms'] })
                }
              >
                <SelectTrigger id="bathrooms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bathroom</SelectItem>
                  <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                  <SelectItem value="2">2 Bathrooms</SelectItem>
                  <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                  <SelectItem value="3">3 Bathrooms</SelectItem>
                  <SelectItem value="3.5">3.5 Bathrooms</SelectItem>
                  <SelectItem value="4">4+ Bathrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stories">Stories</Label>
              <RadioGroup
                value={String(formData.stories)}
                onValueChange={(value) =>
                  setFormData({ ...formData, stories: parseInt(value) as PolishUpPricingInput['stories'] })
                }
              >
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="1-story" />
                    <Label htmlFor="1-story">1-Story</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="2-story" />
                    <Label htmlFor="2-story">2-Story</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="3-story" />
                    <Label htmlFor="3-story">3-Story</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sqft">Approximate Square Footage</Label>
              <Select
                value={formData.sqft ? String(formData.sqft) : 'unknown'}
                onValueChange={(value) =>
                  setFormData({ ...formData, sqft: value === 'unknown' ? undefined : parseInt(value) })
                }
              >
                <SelectTrigger id="sqft">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Not sure</SelectItem>
                  <SelectItem value="750">Under 1,000 sqft</SelectItem>
                  <SelectItem value="1250">1,000-1,500 sqft</SelectItem>
                  <SelectItem value="1750">1,500-2,000 sqft</SelectItem>
                  <SelectItem value="2250">2,000-2,500 sqft</SelectItem>
                  <SelectItem value="2750">2,500-3,000 sqft</SelectItem>
                  <SelectItem value="3500">3,000+ sqft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>3. Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lastCleaned">When was it last professionally cleaned?</Label>
            <RadioGroup
              value={formData.lastCleaned}
              onValueChange={(value) =>
                setFormData({ ...formData, lastCleaned: value as PolishUpPricingInput['lastCleaned'] })
              }
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30_days" id="30_days" />
                  <Label htmlFor="30_days">Within 30 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1_6_months" id="1_6_months" />
                  <Label htmlFor="1_6_months">1-6 months ago</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6_plus_months" id="6_plus_months" />
                  <Label htmlFor="6_plus_months">6+ months ago</Label>
                  {formData.lastCleaned === '6_plus_months' && (
                    <Badge variant="secondary">+20% deep cleaning surcharge</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never">Never professionally cleaned</Label>
                  {formData.lastCleaned === 'never' && (
                    <Badge variant="secondary">+20% deep cleaning surcharge</Badge>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <Label htmlFor="pets" className="font-medium">Do you have pets?</Label>
              <p className="text-sm text-muted-foreground">Pet hair removal treatment</p>
            </div>
            <div className="flex items-center gap-3">
              {formData.hasPets && <Badge variant="secondary">+$25</Badge>}
              <Switch
                id="pets"
                checked={formData.hasPets}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasPets: checked })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <Label htmlFor="sameDay" className="font-medium">Same-day booking?</Label>
              <p className="text-sm text-muted-foreground">Service within 24 hours</p>
            </div>
            <div className="flex items-center gap-3">
              {formData.sameDayBooking && <Badge variant="secondary">+$30</Badge>}
              <Switch
                id="sameDay"
                checked={formData.sameDayBooking}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sameDayBooking: checked })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special">Special Requests (Optional)</Label>
            <Textarea
              id="special"
              placeholder="Any specific areas to focus on or special instructions..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Confirm Quote Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleConfirmQuote}
      >
        <Sparkles className="mr-2 h-5 w-5" />
        Confirm Quote & Continue to Booking
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Final price confirmed after your Pro verifies the job scope on-site.
        Adjustments within 10% are applied automatically.
      </p>
    </div>
  );
}
