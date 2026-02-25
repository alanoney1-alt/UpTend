import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RunningTotal } from "./running-total";
import { AiScanToggle } from "./ai-scan-toggle";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

const CLEAN_TYPES = [
  { id: "standard", label: "Standard Clean", pricePerRoom: 50, description: "Hot water extraction. Best for regular maintenance" },
  { id: "deep", label: "Deep Clean", pricePerRoom: 75, description: "Pre-treatment + extraction. For heavy traffic or stains" },
  { id: "pet", label: "Pet Treatment", pricePerRoom: 89, description: "Enzyme treatment + extraction. Eliminates odors & stains" },
];

const WHOLE_HOUSE = [
  { id: "3br", label: "3-Bedroom Whole House Package", price: 129, rooms: 3 },
  { id: "4_5br", label: "4-5 Bedroom Whole House Package", price: 215, rooms: 5 },
];

export function CarpetCleaningFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [quoteMode, setQuoteMode] = useState<"ai" | "manual">("manual");
  const [cleanType, setCleanType] = useState("standard");
  const [rooms, setRooms] = useState(0);
  const [hallways, setHallways] = useState(0);
  const [stairFlights, setStairFlights] = useState(0);
  const [scotchgard, setScotchgard] = useState(false);
  const [wholeHouse, setWholeHouse] = useState<string | null>(null);

  if (quoteMode === "ai") {
    // Redirect to AI photo quote
    window.location.href = `/ai/photo-quote?service=carpet_cleaning`;
    return null;
  }

  const ct = CLEAN_TYPES.find((c) => c.id === cleanType)!;
  const whPkg = WHOLE_HOUSE.find((w) => w.id === wholeHouse);

  let roomsCost = whPkg ? whPkg.price : rooms * ct.pricePerRoom;
  const hallwayCost = hallways * 25;
  const stairCost = stairFlights * 25;
  const scotchgardCost = scotchgard ? (whPkg ? whPkg.rooms : rooms) * 20 : 0;
  const subtotal = roomsCost + hallwayCost + stairCost + scotchgardCost;
  const total = Math.max(subtotal, subtotal > 0 ? 100 : 0);

  const lineItems = [
    ...(whPkg
      ? [{ label: whPkg.label, price: whPkg.price }]
      : rooms > 0
      ? [{ label: `${ct.label} × ${rooms} rooms`, price: ct.pricePerRoom, quantity: rooms }]
      : []),
    ...(hallways > 0 ? [{ label: "Hallways", price: 25, quantity: hallways }] : []),
    ...(stairFlights > 0 ? [{ label: "Stair flights", price: 25, quantity: stairFlights }] : []),
    ...(scotchgardCost > 0 ? [{ label: "Scotchgard protection", price: scotchgardCost }] : []),
  ];

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "carpet_cleaning",
      estimatedPrice: total,
      userInputs: { cleanType, rooms, hallways, stairFlights, scotchgard, wholeHouse },
      requiresHitlValidation: false,
      lineItems,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      <AiScanToggle serviceId="carpet_cleaning" quoteMode={quoteMode} onModeChange={setQuoteMode} />

      {/* Whole house packages */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm">Whole House Packages <Badge variant="outline" className="ml-2">Best Value</Badge></h4>
          <div className="grid gap-2">
            {WHOLE_HOUSE.map((w) => (
              <div
                key={w.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  wholeHouse === w.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
                onClick={() => { setWholeHouse(wholeHouse === w.id ? null : w.id); setRooms(0); }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{w.label}</span>
                  <span className="text-lg font-black text-primary">${w.price}</span>
                </div>
              </div>
            ))}
          </div>
          {wholeHouse && (
            <p className="text-xs text-muted-foreground">Package selected. or pick rooms individually below</p>
          )}
        </CardContent>
      </Card>

      {/* Per-room pricing */}
      {!wholeHouse && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h4 className="font-bold text-sm">Or Pick Rooms Individually</h4>

            {/* Clean type */}
            <div className="space-y-2">
              {CLEAN_TYPES.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    cleanType === c.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  }`}
                  onClick={() => setCleanType(c.id)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">{c.label}</span>
                    <span className="font-bold text-primary">${c.pricePerRoom}/room</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
              ))}
            </div>

            {/* Room count */}
            <div>
              <label className="text-sm font-medium">Number of Rooms</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5, 6].map((r) => (
                  <Button key={r} variant={rooms === r ? "default" : "outline"} size="sm" onClick={() => setRooms(r)}>
                    {r}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extras */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm">Extras</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Hallways ($25 each)</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setHallways(Math.max(0, hallways - 1))}>-</Button>
                <span className="w-6 text-center">{hallways}</span>
                <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setHallways(hallways + 1)}>+</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Stair flights ($25 each)</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setStairFlights(Math.max(0, stairFlights - 1))}>-</Button>
                <span className="w-6 text-center">{stairFlights}</span>
                <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" onClick={() => setStairFlights(stairFlights + 1)}>+</Button>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Checkbox checked={scotchgard} onCheckedChange={(v) => setScotchgard(!!v)} />
              <span className="text-sm">Scotchgard protection ($20/room)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <RunningTotal
        total={total}
        lineItems={lineItems}
        minimumCharge={100}
        onContinue={handleContinue}
        onBack={onBack}
        note="$100 minimum charge. Pro confirms on-site."
      />
    </div>
  );
}
