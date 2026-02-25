import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Clock, Wrench } from "lucide-react";
import { RunningTotal } from "./running-total";
import type { ServiceFlowProps, ServiceFlowResult } from "./types";

interface Task {
  id: string;
  name: string;
  price: number;
  category: string;
}

const TASKS: Task[] = [
  { id: "tv_mount", name: "TV Mounting (up to 65\")", category: "Mounting", price: 89 },
  { id: "shelf_install", name: "Shelf Installation", category: "Mounting", price: 45 },
  { id: "curtain_rod", name: "Curtain Rod Installation", category: "Mounting", price: 39 },
  { id: "mirror_hang", name: "Mirror/Art Hanging", category: "Mounting", price: 35 },
  { id: "assembly_small", name: "Furniture Assembly (Small)", category: "Assembly", price: 49 },
  { id: "assembly_medium", name: "Furniture Assembly (Medium)", category: "Assembly", price: 89 },
  { id: "assembly_large", name: "Furniture Assembly (Large/Complex)", category: "Assembly", price: 129 },
  { id: "faucet", name: "Faucet Replacement", category: "Repairs", price: 109 },
  { id: "toilet_repair", name: "Toilet Repair", category: "Repairs", price: 79 },
  { id: "drywall_patch", name: "Drywall Patch (per hole)", category: "Repairs", price: 69 },
  { id: "ceiling_fan", name: "Ceiling Fan Installation", category: "Installation", price: 139 },
  { id: "light_fixture", name: "Light Fixture Installation", category: "Installation", price: 89 },
  { id: "smart_lock", name: "Smart Lock Installation", category: "Installation", price: 99 },
  { id: "doorknob", name: "Doorknob/Deadbolt Replacement", category: "Installation", price: 59 },
  { id: "paint_room", name: "Paint a Room (up to 12x12)", category: "Painting", price: 149 },
  { id: "paint_accent", name: "Accent Wall Painting", category: "Painting", price: 89 },
  { id: "fence_repair", name: "Fence Repair (per section)", category: "Outdoor", price: 129 },
  { id: "mailbox_install", name: "Mailbox Installation", category: "Outdoor", price: 69 },
];

const CATEGORIES = [...new Set(TASKS.map((t) => t.category))];
const HOURLY_RATE = 75;

type Mode = "tasks" | "hourly";

export function HandymanFlow({ onComplete, onBack }: ServiceFlowProps) {
  const [mode, setMode] = useState<Mode>("tasks");
  const [selectedTasks, setSelectedTasks] = useState<Record<string, number>>({});
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["Mounting"]));
  const [hours, setHours] = useState(2);

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleTask = (id: string) => {
    setSelectedTasks((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) {
      const { [id]: _, ...rest } = selectedTasks;
      setSelectedTasks(rest);
    } else {
      setSelectedTasks((prev) => ({ ...prev, [id]: qty }));
    }
  };

  // Calculate task-based total
  const taskCount = Object.values(selectedTasks).reduce((a, b) => a + b, 0);
  const subtotal = Object.entries(selectedTasks).reduce((sum, [id, qty]) => {
    const task = TASKS.find((t) => t.id === id);
    return sum + (task?.price || 0) * qty;
  }, 0);
  const discountPct = taskCount >= 3 ? 0.1 : 0;
  const discountAmt = Math.round(subtotal * discountPct);
  const taskTotal = subtotal - discountAmt;

  // Hourly total
  const hourlyTotal = hours * HOURLY_RATE;

  const lineItems =
    mode === "tasks"
      ? Object.entries(selectedTasks).map(([id, qty]) => {
          const t = TASKS.find((t) => t.id === id)!;
          return { label: t.name, price: t.price, quantity: qty };
        })
      : [{ label: `Handyman Labor (${hours}hr × $${HOURLY_RATE}/hr)`, price: hourlyTotal }];

  const discounts =
    mode === "tasks" && discountAmt > 0
      ? [{ label: "Multi-task discount (10% off 3+ tasks)", amount: discountAmt }]
      : [];

  const total = mode === "tasks" ? taskTotal : hourlyTotal;

  const handleContinue = () => {
    const result: ServiceFlowResult = {
      quoteMethod: "manual",
      serviceType: "handyman",
      estimatedPrice: total,
      userInputs: mode === "tasks" ? { mode, selectedTasks } : { mode, hours },
      requiresHitlValidation: false,
      lineItems,
      discounts,
    };
    onComplete(result);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "tasks" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("tasks")}
        >
          <Wrench className="w-4 h-4 mr-2" /> Pick Tasks
        </Button>
        <Button
          variant={mode === "hourly" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("hourly")}
        >
          <Clock className="w-4 h-4 mr-2" /> Hourly Booking
        </Button>
      </div>

      {mode === "tasks" && (
        <Card>
          <CardContent className="p-4 space-y-2">
            {taskCount >= 3 && (
              <Badge className="bg-green-600 mb-2"> 10% multi-task discount applied!</Badge>
            )}
            {CATEGORIES.map((cat) => (
              <div key={cat} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 text-left font-semibold text-sm hover:bg-muted/50"
                  onClick={() => toggleCat(cat)}
                >
                  {cat}
                  {expandedCats.has(cat) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedCats.has(cat) && (
                  <div className="border-t">
                    {TASKS.filter((t) => t.category === cat).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/30 border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={!!selectedTasks[task.id]}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                          <div>
                            <Label className="font-medium text-sm cursor-pointer">{task.name}</Label>
                            <p className="text-xs text-muted-foreground">${task.price}</p>
                          </div>
                        </div>
                        {selectedTasks[task.id] && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] min-w-[44px]"
                              onClick={() => setQty(task.id, selectedTasks[task.id] - 1)}
                            >
                              -
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {selectedTasks[task.id]}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-[44px] min-w-[44px]"
                              onClick={() => setQty(task.id, selectedTasks[task.id] + 1)}
                            >
                              +
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {mode === "hourly" && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label className="text-base font-bold">Estimated Hours</Label>
              <p className="text-xs text-muted-foreground mb-3">
                ${HOURLY_RATE}/hr. 1-hour minimum, billed by the minute after
              </p>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <Button
                    key={h}
                    variant={hours === h ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHours(h)}
                  >
                    {h}h
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
               Not sure what you need done? Book hourly and let the Pro handle multiple small tasks.
            </p>
          </CardContent>
        </Card>
      )}

      <RunningTotal
        total={total}
        lineItems={lineItems}
        discounts={discounts}
        onContinue={handleContinue}
        onBack={onBack}
        note="Fixed-price tasks are guaranteed. Hourly billing starts after first hour."
      />
    </div>
  );
}
