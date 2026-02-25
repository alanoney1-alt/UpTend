import { useEffect, useState } from "react";
import { SERVICE_PRICE_RANGES } from "@/constants/service-price-ranges";
import { TrendingUp } from "lucide-react";

interface NeighborhoodPriceContextProps {
  serviceType: string;
  zipCode?: string;
}

export function NeighborhoodPriceContext({ serviceType, zipCode }: NeighborhoodPriceContextProps) {
  const [avgPrice, setAvgPrice] = useState<number | null>(null);
  const [area, setArea] = useState("Orlando");

  useEffect(() => {
    // Try API first, fall back to static data
    let cancelled = false;
    async function fetchMarketRate() {
      try {
        const params = new URLSearchParams({ serviceType });
        if (zipCode) params.set("zipCode", zipCode);
        const res = await fetch(`/api/pricing/market-rate?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.avgPrice) {
            setAvgPrice(Math.round(data.avgPrice));
            if (data.area) setArea(data.area);
            return;
          }
        }
      } catch {}

      // Fallback to static Orlando data
      if (!cancelled) {
        const range = SERVICE_PRICE_RANGES[serviceType];
        if (range) {
          setAvgPrice(range.recommended);
        }
      }
    }
    fetchMarketRate();
    return () => { cancelled = true; };
  }, [serviceType, zipCode]);

  if (!avgPrice) return null;

  const displayName = SERVICE_PRICE_RANGES[serviceType]?.displayName || serviceType.replace(/_/g, " ");

  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
      <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Homeowners in <span className="font-semibold">{area}</span> paid an average of{" "}
        <span className="font-bold text-slate-900 dark:text-white">${avgPrice}</span> for{" "}
        <span className="font-semibold">{displayName}</span> this month.
      </p>
    </div>
  );
}
