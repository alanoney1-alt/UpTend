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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Home, Sparkles, Package, Calendar, Clock, CheckCircle, DollarSign } from "lucide-react";

interface PolishUpBookingProps {
  onComplete: (bookingDetails: PolishUpBookingDetails) => void;
  onBack?: () => void;
}

export interface PolishUpBookingDetails {
  bedrooms: string;
  bathrooms: string;
  cleanType: "standard" | "deep" | "moveInOut";
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
  { bedrooms: "1-2", bathrooms: "1", price: 99, label: "1-2 Bed / 1 Bath" },
  { bedrooms: "3", bathrooms: "2", price: 149, label: "3 Bed / 2 Bath" },
  { bedrooms: "4", bathrooms: "2-3", price: 199, label: "4 Bed / 2-3 Bath" },
  { bedrooms: "5+", bathrooms: "3+", price: 249, label: "5+ Bed / 3+ Bath" },
];

const CLEAN_TYPES = [
  {
    id: "standard",
    name: "Standard Clean",
    description: "Regular cleaning for maintained homes",
    multiplier: 1,
    includes: ["Dust all surfaces", "Vacuum/mop floors", "Clean bathrooms", "Clean kitchen", "Empty trash"],
  },
  {
    id: "deep",
    name: "Deep Clean",
    description: "Thorough cleaning including often-missed areas",
    multiplier: 1.5,
    includes: ["Everything in Standard", "Inside appliances", "Baseboards", "Ceiling fans", "Window sills", "Inside cabinets"],
  },
  {
    id: "moveInOut",
    name: "Move-In/Move-Out",
    description: "Comprehensive cleaning for empty homes",
    multiplier: 2,
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
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [bookingType, setBookingType] = useState<"onetime" | "recurring">("onetime");
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly">("biweekly");
  const [preferredDay, setPreferredDay] = useState<string>("");
  const [preferredTimeWindow, setPreferredTimeWindow] = useState<"morning" | "afternoon" | "evening">("morning");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [bringsSupplies, setBringsSupplies] = useState(true);

  const calculatePrice = () => {
    if (!homeSize || !cleanType) return 0;

    let basePrice = homeSize.price * cleanType.multiplier;

    // Add-ons
    const addOnsTotal = selectedAddOns.reduce((sum, addonId) => {
      const addon = ADD_ONS.find(a => a.id === addonId);
      return sum + (addon?.price || 0);
    }, 0);

    let total = basePrice + addOnsTotal;

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
      cleanType: cleanType.id as "standard" | "deep" | "moveInOut",
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
        <p className="text-sm text-muted-foreground mb-4">Select the number of bedrooms and bathrooms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HOME_SIZES.map((size) => (
          <Card
            key={size.label}
            className={`cursor-pointer transition-all hover:border-primary ${
              homeSize?.label === size.label ? "border-primary ring-4 ring-primary/10" : ""
            }`}
            onClick={() => setHomeSize(size)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{size.label}</span>
                {homeSize?.label === size.label && <CheckCircle className="w-5 h-5 text-primary" />}
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground">
                ${size.price}
                <span className="text-sm text-muted-foreground ml-1">starting</span>
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
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
        <h3 className="text-xl font-bold mb-2">What type of clean?</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose the level of cleaning you need</p>
      </div>

      <div className="space-y-4">
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
                  {homeSize && (
                    <p className="text-lg font-bold mt-2">
                      ${Math.round(homeSize.price * type.multiplier)}
                    </p>
                  )}
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
              <span>Base Price ({homeSize?.label})</span>
              <span>${homeSize?.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Clean Type ({cleanType?.name})</span>
              <span>{cleanType?.multiplier}x</span>
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
