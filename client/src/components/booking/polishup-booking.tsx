/**
 * PolishUp (Home Cleaning) Booking Flow
 *
 * Steps:
 * 1. Home size (bedrooms/bathrooms)
 * 2. Clean type (Standard/Deep/Move-In-Move-Out)
 * 3. Add-ons
 * 4. One-time vs Recurring
 * 5. If recurring: frequency and schedule
 * 6. Special instructions
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Home, Sparkles, Package, Calendar, Clock, CheckCircle, DollarSign } from "lucide-react";
import {
  calculatePolishUpPrice,
  type PolishUpPricingInput
} from "@/lib/polishup-pricing";

interface PolishUpBookingProps {
  onComplete: (bookingDetails: PolishUpBookingDetails) => void;
  onBack?: () => void;
}

export interface PolishUpBookingDetails {
  bedrooms: number;
  bathrooms: number;
  stories: number;
  sqft?: number;
  hasPets: boolean;
  lastCleaned: '30_days' | '1_6_months' | '6_plus_months' | 'never';
  cleanType: "standard" | "deep" | "move_out";
  addOns: string[];
  bookingType: "onetime" | "recurring";
  recurringFrequency?: "weekly" | "biweekly" | "monthly";
  preferredDay?: string;
  preferredTimeWindow?: "morning" | "afternoon" | "evening";
  specialInstructions?: string;
  bringsSupplies: boolean;
  estimatedPrice: number;
}

const HOME_SIZES = [
  { bedrooms: 1, bathrooms: 1, label: "1 Bed / 1 Bath" },
  { bedrooms: 2, bathrooms: 1, label: "2 Bed / 1 Bath" },
  { bedrooms: 2, bathrooms: 2, label: "2 Bed / 2 Bath" },
  { bedrooms: 3, bathrooms: 2, label: "3 Bed / 2 Bath" },
  { bedrooms: 3, bathrooms: 3, label: "3 Bed / 3 Bath" },
  { bedrooms: 4, bathrooms: 2, label: "4 Bed / 2 Bath" },
  { bedrooms: 4, bathrooms: 3, label: "4 Bed / 3 Bath" },
  { bedrooms: 5, bathrooms: 3, label: "5+ Bed / 3 Bath" },
];

const CLEAN_TYPES = [
  {
    id: "standard" as const,
    name: "Standard Clean",
    description: "Regular cleaning for maintained homes",
    includes: ["Dust all surfaces", "Vacuum/mop floors", "Clean bathrooms", "Clean kitchen", "Empty trash"],
  },
  {
    id: "deep" as const,
    name: "Deep Clean",
    description: "Thorough cleaning including often-missed areas",
    includes: ["Everything in Standard", "Inside appliances", "Baseboards", "Ceiling fans", "Window sills", "Inside cabinets"],
  },
  {
    id: "move_out" as const,
    name: "Move-Out Clean",
    description: "Comprehensive cleaning for empty homes",
    includes: ["Everything in Deep Clean", "Inside closets", "Garage sweep", "All fixtures detailed", "Interior windows"],
    badge: "Cross-sell after LiftCrew",
  },
];

const ADD_ONS = [
  { id: "inside_oven", name: "Inside Oven", price: 35 },
  { id: "inside_refrigerator", name: "Inside Refrigerator", price: 35 },
  { id: "interior_windows", name: "Interior Windows", price: 5, unit: "per window" },
  { id: "laundry", name: "Laundry (2 loads)", price: 30 },
  { id: "organize_closet", name: "Organize One Closet", price: 40 },
  { id: "pet_hair_treatment", name: "Pet Hair Deep Treatment", price: 25 },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function PolishUpBooking({ onComplete, onBack }: PolishUpBookingProps) {
  const [step, setStep] = useState(1);
  const [homeSize, setHomeSize] = useState<typeof HOME_SIZES[0] | null>(null);
  const [cleanType, setCleanType] = useState<typeof CLEAN_TYPES[0] | null>(null);
  const [stories, setStories] = useState<1 | 2 | 3>(1);
  const [sqft, setSqft] = useState<number | undefined>(undefined);
  const [hasPets, setHasPets] = useState(false);
  const [lastCleaned, setLastCleaned] = useState<'30_days' | '1_6_months' | '6_plus_months' | 'never'>('1_6_months');
  const [sameDayBooking, setSameDayBooking] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [bookingType, setBookingType] = useState<"onetime" | "recurring">("onetime");
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly">("biweekly");
  const [preferredDay, setPreferredDay] = useState<string>("");
  const [preferredTimeWindow, setPreferredTimeWindow] = useState<"morning" | "afternoon" | "evening">("morning");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [bringsSupplies, setBringsSupplies] = useState(true);
  const [basePrice, setBasePrice] = useState(0);

  // Calculate price using the new dynamic pricing engine
  useEffect(() => {
    if (!homeSize || !cleanType) return;

    const pricingInput: PolishUpPricingInput = {
      cleanType: cleanType.id,
      bedrooms: homeSize.bedrooms as 0 | 1 | 2 | 3 | 4 | 5,
      bathrooms: homeSize.bathrooms as 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4,
      stories,
      sqft,
      hasPets,
      lastCleaned,
      sameDayBooking,
    };

    const quote = calculatePolishUpPrice(pricingInput);
    setBasePrice(quote.finalPrice);
  }, [homeSize, cleanType, stories, sqft, hasPets, lastCleaned, sameDayBooking]);

  const calculatePrice = () => {
    let total = basePrice;

    // Add-ons
    const addOnsTotal = selectedAddOns.reduce((sum, addonId) => {
      const addon = ADD_ONS.find(a => a.id === addonId);
      return sum + (addon?.price || 0);
    }, 0);

    total += addOnsTotal;

    // Recurring discount
    if (bookingType === "recurring") {
      const discounts = { weekly: 0.15, biweekly: 0.10, monthly: 0.05 };
      total *= (1 - discounts[recurringFrequency]);
    }

    return Math.round(total);
  };

  const handleComplete = () => {
    if (!homeSize || !cleanType) return;

    const bookingDetails: PolishUpBookingDetails = {
      bedrooms: homeSize.bedrooms,
      bathrooms: homeSize.bathrooms,
      stories,
      sqft,
      hasPets,
      lastCleaned,
      cleanType: cleanType.id,
      addOns: selectedAddOns,
      bookingType,
      recurringFrequency: bookingType === "recurring" ? recurringFrequency : undefined,
      preferredDay: bookingType === "recurring" ? preferredDay : undefined,
      preferredTimeWindow: bookingType === "recurring" ? preferredTimeWindow : undefined,
      specialInstructions,
      bringsSupplies,
      estimatedPrice: calculatePrice(),
    };

    onComplete(bookingDetails);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">What's your home size?</h3>
        <p className="text-sm text-muted-foreground mb-4">Select bedrooms, bathrooms, and property details</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Bedrooms & Bathrooms</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HOME_SIZES.map((size) => (
              <Card
                key={size.label}
                className={`cursor-pointer transition-all hover:border-primary ${
                  homeSize?.label === size.label ? "border-primary ring-2 ring-primary/20" : ""
                }`}
                onClick={() => setHomeSize(size)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{size.label}</span>
                    {homeSize?.label === size.label && <CheckCircle className="w-5 h-5 text-primary" />}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Stories</Label>
            <RadioGroup value={String(stories)} onValueChange={(value) => setStories(parseInt(value) as 1 | 2 | 3)}>
              <div className="flex gap-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="1-story" />
                  <Label htmlFor="1-story" className="cursor-pointer">1-Story</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="2-story" />
                  <Label htmlFor="2-story" className="cursor-pointer">2-Story</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="3-story" />
                  <Label htmlFor="3-story" className="cursor-pointer">3-Story</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="sqft" className="mb-2 block">Square Footage (Optional)</Label>
            <select
              id="sqft"
              className="w-full p-2 border rounded"
              value={sqft || "unknown"}
              onChange={(e) => setSqft(e.target.value === "unknown" ? undefined : parseInt(e.target.value))}
            >
              <option value="unknown">Not sure</option>
              <option value="750">Under 1,000 sqft</option>
              <option value="1250">1,000-1,500 sqft</option>
              <option value="1750">1,500-2,000 sqft</option>
              <option value="2250">2,000-2,500 sqft</option>
              <option value="2750">2,500-3,000 sqft</option>
              <option value="3500">3,000+ sqft</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button onClick={() => setStep(2)} disabled={!homeSize}>
          Next: Clean Type
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Clean type & additional details</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose your clean type and property details</p>
      </div>

      {/* Clean Type Selection */}
      <div className="space-y-4">
        <Label>Clean Type</Label>
        {CLEAN_TYPES.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:border-primary ${
              cleanType?.id === type.id ? "border-primary ring-4 ring-primary/10" : ""
            }`}
            onClick={() => setCleanType(type)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {type.name}
                    {type.badge && <Badge variant="secondary">{type.badge}</Badge>}
                    {cleanType?.id === type.id && <CheckCircle className="w-5 h-5 text-primary ml-auto" />}
                  </CardTitle>
                  <CardDescription className="mt-1">{type.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {type.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Details */}
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">When was it last professionally cleaned?</Label>
          <RadioGroup value={lastCleaned} onValueChange={(value) => setLastCleaned(value as typeof lastCleaned)}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30_days" id="30_days" />
                <Label htmlFor="30_days" className="cursor-pointer">Within 30 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1_6_months" id="1_6_months" />
                <Label htmlFor="1_6_months" className="cursor-pointer">1-6 months ago</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6_plus_months" id="6_plus_months" />
                <Label htmlFor="6_plus_months" className="cursor-pointer flex items-center gap-2">
                  6+ months ago
                  {lastCleaned === '6_plus_months' && <Badge variant="secondary">+20% deep cleaning surcharge</Badge>}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never" className="cursor-pointer flex items-center gap-2">
                  Never professionally cleaned
                  {lastCleaned === 'never' && <Badge variant="secondary">+20% deep cleaning surcharge</Badge>}
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex-1">
            <Label htmlFor="pets" className="font-medium cursor-pointer">Do you have pets?</Label>
            <p className="text-sm text-muted-foreground">Pet hair removal treatment</p>
          </div>
          <div className="flex items-center gap-3">
            {hasPets && <Badge variant="secondary">+$25</Badge>}
            <Checkbox
              id="pets"
              checked={hasPets}
              onCheckedChange={(checked) => setHasPets(!!checked)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex-1">
            <Label htmlFor="sameDay" className="font-medium cursor-pointer">Same-day booking?</Label>
            <p className="text-sm text-muted-foreground">Service within 24 hours</p>
          </div>
          <div className="flex items-center gap-3">
            {sameDayBooking && <Badge variant="secondary">+$30</Badge>}
            <Checkbox
              id="sameDay"
              checked={sameDayBooking}
              onCheckedChange={(checked) => setSameDayBooking(!!checked)}
            />
          </div>
        </div>
      </div>

      {/* Live Price Display */}
      {basePrice > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Estimated Price</p>
              <p className="text-4xl font-bold text-primary">${basePrice}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button onClick={() => setStep(3)} disabled={!cleanType}>
          Next: Add-Ons
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Any add-ons?</h3>
        <p className="text-sm text-muted-foreground mb-4">Optional extras to enhance your clean</p>
      </div>

      <div className="space-y-3">
        {ADD_ONS.map((addon) => (
          <div key={addon.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedAddOns.includes(addon.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedAddOns([...selectedAddOns, addon.id]);
                  } else {
                    setSelectedAddOns(selectedAddOns.filter(id => id !== addon.id));
                  }
                }}
              />
              <div>
                <p className="font-medium">{addon.name}</p>
                {addon.unit && <p className="text-xs text-muted-foreground">{addon.unit}</p>}
              </div>
            </div>
            <p className="font-bold">+${addon.price}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button onClick={() => setStep(4)}>
          Next: Booking Type
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">One-time or recurring?</h3>
        <p className="text-sm text-muted-foreground mb-4">Save up to 15% with recurring service</p>
      </div>

      <RadioGroup value={bookingType} onValueChange={(value) => setBookingType(value as "onetime" | "recurring")}>
        <Card className={bookingType === "onetime" ? "border-primary ring-4 ring-primary/10" : ""}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="onetime" id="onetime" />
              <Label htmlFor="onetime" className="flex-1 cursor-pointer">
                <CardTitle>One-Time Clean</CardTitle>
                <CardDescription>Book this cleaning once</CardDescription>
              </Label>
              {homeSize && cleanType && (
                <p className="text-xl font-bold">${calculatePrice()}</p>
              )}
            </div>
          </CardHeader>
        </Card>

        <Card className={bookingType === "recurring" ? "border-primary ring-4 ring-primary/10" : ""}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="recurring" id="recurring" />
              <Label htmlFor="recurring" className="flex-1 cursor-pointer">
                <CardTitle className="flex items-center gap-2">
                  Recurring Service
                  <Badge variant="secondary">Save 10-15%</Badge>
                </CardTitle>
                <CardDescription>Set up automatic cleanings</CardDescription>
              </Label>
            </div>
          </CardHeader>
          {bookingType === "recurring" && (
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Frequency</Label>
                <RadioGroup value={recurringFrequency} onValueChange={(value) => setRecurringFrequency(value as typeof recurringFrequency)}>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span>Weekly</span>
                        <Badge>Save 15%</Badge>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="biweekly" id="biweekly" />
                    <Label htmlFor="biweekly" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span>Biweekly (Every 2 Weeks)</span>
                        <Badge>Save 10%</Badge>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span>Monthly</span>
                        <Badge>Save 5%</Badge>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-2 block">Preferred Day</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={preferredDay}
                  onChange={(e) => setPreferredDay(e.target.value)}
                >
                  <option value="">Select a day...</option>
                  {DAYS.map((day) => (
                    <option key={day} value={day.toLowerCase()}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-2 block">Preferred Time Window</Label>
                <RadioGroup value={preferredTimeWindow} onValueChange={(value) => setPreferredTimeWindow(value as typeof preferredTimeWindow)}>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="morning" id="morning" />
                    <Label htmlFor="morning" className="flex-1 cursor-pointer">Morning (8am - 12pm)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="afternoon" id="afternoon" />
                    <Label htmlFor="afternoon" className="flex-1 cursor-pointer">Afternoon (12pm - 4pm)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="evening" id="evening" />
                    <Label htmlFor="evening" className="flex-1 cursor-pointer">Evening (4pm - 8pm)</Label>
                  </div>
                </RadioGroup>
              </div>

              <p className="text-sm text-muted-foreground">
                3-booking minimum commitment, then month-to-month. Same Pro every time for consistency.
              </p>

              {homeSize && cleanType && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Your recurring price:</p>
                  <p className="text-2xl font-bold">${calculatePrice()}</p>
                  <p className="text-sm text-muted-foreground">per clean</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </RadioGroup>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(3)}>
          Back
        </Button>
        <Button onClick={() => setStep(5)}>
          Next: Details
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Special instructions</h3>
        <p className="text-sm text-muted-foreground mb-4">Help your Pro do their best work</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Do we need to bring supplies?</Label>
          <RadioGroup value={bringsSupplies ? "yes" : "no"} onValueChange={(value) => setBringsSupplies(value === "yes")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="supplies-yes" />
              <Label htmlFor="supplies-yes" className="cursor-pointer">
                Yes, Pro brings everything (recommended)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="supplies-no" />
              <Label htmlFor="supplies-no" className="cursor-pointer">
                No, I'll provide supplies
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="instructions" className="mb-2 block">
            Special Instructions (Optional)
          </Label>
          <Textarea
            id="instructions"
            placeholder="Pets? Alarm code? Gate code? Areas to avoid? Anything else we should know..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Total Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>PolishUp™ {cleanType?.name}</span>
              <span>${basePrice}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              • {homeSize?.label}
              {stories > 1 && `, ${stories}-story`}
              {sqft && `, ~${sqft} sqft`}
              {hasPets && ", pet-friendly"}
              {sameDayBooking && ", same-day"}
            </div>
            {selectedAddOns.length > 0 && (
              <div className="flex justify-between">
                <span>Add-ons</span>
                <span>
                  +${selectedAddOns.reduce((sum, addonId) => {
                    const addon = ADD_ONS.find(a => a.id === addonId);
                    return sum + (addon?.price || 0);
                  }, 0)}
                </span>
              </div>
            )}
            {bookingType === "recurring" && (
              <div className="flex justify-between text-green-600">
                <span>Recurring Discount ({recurringFrequency})</span>
                <span>
                  -{recurringFrequency === "weekly" ? "15%" : recurringFrequency === "biweekly" ? "10%" : "5%"}
                </span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>${calculatePrice()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(4)}>
          Back
        </Button>
        <Button onClick={handleComplete} className="gap-2">
          <CheckCircle className="w-4 h-4" />
          Book PolishUp<sup>™</sup> Clean
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full mx-1 ${
                s <= step ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Size</span>
          <span>Type</span>
          <span>Add-ons</span>
          <span>Schedule</span>
          <span>Details</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
}
