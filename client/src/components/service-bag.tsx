import { useState } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useServiceBag } from "@/contexts/service-bag-context";

function BagItemCard({ item, onRemove }: { item: import("@/contexts/service-bag-context").BagItem; onRemove: () => void }) {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-white truncate">{item.serviceName}</h4>
          <p className="text-amber-400 font-semibold text-sm">{item.price}</p>
        </div>
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-red-400 transition-colors p-1"
          aria-label="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => setNotesOpen(!notesOpen)}
        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 w-fit"
      >
        {notesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Notes
      </button>

      {notesOpen && (
        <Textarea
          placeholder="Add notes for this service..."
          defaultValue={item.notes || ""}
          className="bg-slate-900/50 border-slate-700 text-white text-xs min-h-[60px] resize-none"
        />
      )}
    </div>
  );
}

export function ServiceBagSheet() {
  const { items, removeItem, clearBag, itemCount } = useServiceBag();
  const [, navigate] = useLocation();

  const handleBookAll = () => {
    const ids = items.map((i) => i.serviceId).join(",");
    navigate(`/booking?services=${ids}`);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
          aria-label="View service bag"
          data-testid="button-service-bag"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>View Cart ({itemCount})</span>
        </button>
      </SheetTrigger>
      <SheetContent className="bg-slate-900 border-slate-800 text-white w-[340px] sm:w-[400px] flex flex-col" side="right">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            Service Bag
            {itemCount > 0 && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 ml-auto">
                {itemCount} {itemCount === 1 ? "service" : "services"}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-3">
            <ShoppingBag className="w-12 h-12 text-slate-600" />
            <p className="text-slate-400">Your service bag is empty.</p>
            <p className="text-slate-500 text-sm">Browse services to get started.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
              {items.map((item) => (
                <BagItemCard
                  key={item.serviceId}
                  item={item}
                  onRemove={() => removeItem(item.serviceId)}
                />
              ))}
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              {items.some((i) => i.estimatedPrice) && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Estimated total</span>
                  <span className="text-amber-400 font-bold">
                    ${items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0).toLocaleString()}+
                  </span>
                </div>
              )}
              <Button
                onClick={handleBookAll}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
                size="lg"
              >
                Book All Services
              </Button>
              <button
                onClick={clearBag}
                className="w-full text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear bag
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
