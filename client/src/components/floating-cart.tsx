import { useState } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, X, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceBag } from "@/contexts/service-bag-context";

export function FloatingCart() {
  const { items, removeItem, clearBag, itemCount } = useServiceBag();
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  if (itemCount === 0) return null;

  const total = items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

  return (
    <>
      {/* Floating bag icon. bottom-left (George is bottom-right) */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-[9980] flex items-center justify-center w-14 h-14 rounded-full bg-[#F47C20] text-white shadow-lg shadow-[#F47C20]/30 hover:bg-[#e06910] transition-all hover:scale-105 active:scale-95"
        aria-label={`View cart (${itemCount} items)`}
      >
        <ShoppingBag className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-[#F47C20] text-xs font-black flex items-center justify-center shadow-sm">
          {itemCount}
        </span>
      </button>

      {/* Cart panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9985] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-24 left-6 z-[9990] w-[340px] max-h-[70vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#F47C20]" />
                <h3 className="font-bold text-sm">Your Services ({itemCount})</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.serviceId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{item.serviceName}</p>
                    <p className="text-xs text-[#F47C20] font-medium">{item.price}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.serviceId)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0"
                    aria-label={`Remove ${item.serviceName}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
              {total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimated total</span>
                  <span className="font-bold text-[#F47C20]">
                    From ${total.toLocaleString()}
                  </span>
                </div>
              )}
              <Button
                onClick={() => {
                  const ids = items.map((i) => i.serviceId).join(",");
                  navigate(`/book?services=${ids}`);
                  setOpen(false);
                }}
                className="w-full bg-[#F47C20] hover:bg-[#e06910] text-white font-bold"
                size="lg"
              >
                Continue to Booking <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <button
                onClick={() => { clearBag(); setOpen(false); }}
                className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 py-1"
              >
                <Trash2 className="w-3 h-3" /> Clear all
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
