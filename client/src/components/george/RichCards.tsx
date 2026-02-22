/**
 * George AI — Rich Card Components
 * Premium, dark-themed cards for the full-screen AI conversation.
 * Designed for immersive dark UI (#111110 background).
 */

import { Home, Lock, Package, BarChart3, Calendar, TrendingUp } from "lucide-react";

// ─── PropertyCard ────────────────────────────────────────────────────────────

export function PropertyCard({ data }: { data: any }) {
  const value = data.homeValueEstimate;
  return (
    <div className="geo-card geo-card-in geo-card-amber">
      <div className="geo-card-header">
        <Home className="w-4 h-4 text-amber-500" />
        <span>Property Scan</span>
      </div>
      {value && (
        <div className="geo-card-value text-amber-400">
          ${typeof value === "number" ? value.toLocaleString() : value}
        </div>
      )}
      <div className="geo-card-grid">
        {data.sqFootage && (
          <div className="geo-card-stat">
            <span className="geo-card-label">Size</span>
            <span className="geo-card-data">{data.sqFootage?.toLocaleString()} sqft</span>
          </div>
        )}
        {data.bedrooms && (
          <div className="geo-card-stat">
            <span className="geo-card-label">Beds / Bath</span>
            <span className="geo-card-data">{data.bedrooms} / {data.bathrooms || "—"}</span>
          </div>
        )}
        {data.yearBuilt && (
          <div className="geo-card-stat">
            <span className="geo-card-label">Built</span>
            <span className="geo-card-data">{data.yearBuilt}</span>
          </div>
        )}
        {data.hasPool !== undefined && (
          <div className="geo-card-stat">
            <span className="geo-card-label">Pool</span>
            <span className="geo-card-data">{data.hasPool === true ? "Yes" : data.hasPool === "uncertain" ? "Unknown" : "No"}</span>
          </div>
        )}
        {data.stories && (
          <div className="geo-card-stat">
            <span className="geo-card-label">Stories</span>
            <span className="geo-card-data">{data.stories}</span>
          </div>
        )}
        {data.roofType && (
          <div className="geo-card-stat">
            <span className="geo-card-label">Roof</span>
            <span className="geo-card-data">{data.roofType}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QuoteCard ───────────────────────────────────────────────────────────────

export function QuoteCard({ data }: { data: any }) {
  const validDate = data.validUntil ? new Date(data.validUntil) : null;
  const daysLeft = validDate ? Math.max(0, Math.ceil((validDate.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="geo-card geo-card-in geo-card-green">
      <div className="geo-card-header">
        <Lock className="w-4 h-4 text-green-400" />
        <span>Locked Quote</span>
        {daysLeft !== null && (
          <span className="ml-auto text-[11px] text-green-400/70">
            {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
          </span>
        )}
      </div>
      <div className="geo-card-value text-green-400 geo-price-in">
        ${data.price}
      </div>
      <div className="geo-card-details">
        <div><span className="geo-card-label">Service</span> {data.service}</div>
        {data.address && <div><span className="geo-card-label">Address</span> {data.address}</div>}
        {validDate && <div><span className="geo-card-label">Valid until</span> {validDate.toLocaleDateString()}</div>}
      </div>
      <a
        href={`/book?service=${data.serviceId || data.service?.replace(/\s+/g, "_").toLowerCase() || ""}`}
        className="geo-card-cta geo-card-cta-green"
      >
        Confirm & Book &rarr;
      </a>
    </div>
  );
}

// ─── BundleCard ──────────────────────────────────────────────────────────────

export function BundleCard({ data }: { data: any }) {
  return (
    <div className="geo-card geo-card-in geo-card-purple">
      <div className="geo-card-header">
        <Package className="w-4 h-4 text-purple-400" />
        <span>Bundle Estimate</span>
      </div>
      {data.breakdown?.length > 0 && (
        <div className="geo-card-rows">
          {data.breakdown.map((item: any, i: number) => (
            <div key={i} className="geo-card-row">
              <span>{item.service}</span>
              <span className="text-stone-400">${item.rate}{item.frequency ? `/${item.frequency}` : ""}</span>
            </div>
          ))}
        </div>
      )}
      <div className="geo-card-divider" />
      <div className="geo-card-rows">
        {data.subtotal && (
          <div className="geo-card-row text-stone-500">
            <span>Subtotal</span><span>${data.subtotal}</span>
          </div>
        )}
        {data.discount && (
          <div className="geo-card-row text-green-400 font-medium">
            <span>Bundle Discount ({data.discountPercent || 10}%)</span>
            <span>-${data.discount}</span>
          </div>
        )}
        {data.total && (
          <div className="geo-card-row font-bold text-white">
            <span>Total</span><span>${data.total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BreakdownCard ───────────────────────────────────────────────────────────

export function BreakdownCard({ data }: { data: any }) {
  return (
    <div className="geo-card geo-card-in geo-card-amber">
      <div className="geo-card-header">
        <BarChart3 className="w-4 h-4 text-amber-500" />
        <span>Price Breakdown</span>
      </div>
      <div className="geo-card-details">
        {data.items && (
          <div><span className="geo-card-label">Items</span> {Array.isArray(data.items) ? data.items.join(", ") : data.items}</div>
        )}
        {data.volume && <div><span className="geo-card-label">Volume</span> {data.volume}</div>}
        {data.laborHours && <div><span className="geo-card-label">Labor</span> ~{data.laborHours} hours</div>}
        {data.baseRate && (
          <div className="font-medium text-white">
            <span className="geo-card-label">Base rate</span> ${data.baseRate}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BookingCard ─────────────────────────────────────────────────────────────

export function BookingCard({ data }: { data: any }) {
  return (
    <div className="geo-card geo-card-in geo-card-blue">
      <div className="geo-card-header">
        <Calendar className="w-4 h-4 text-blue-400" />
        <span>Booking Draft</span>
      </div>
      {data.serviceName && (
        <div className="text-[15px] font-semibold text-white">{data.serviceName}</div>
      )}
      {(data.price || data.estimatedPrice || data.quote?.totalPrice) && (
        <div className="geo-card-value text-blue-400 geo-price-in">
          ${data.price || data.estimatedPrice || data.quote?.totalPrice}
        </div>
      )}
      <div className="geo-card-details">
        {data.address && <div><span className="geo-card-label">Address</span> {data.address}</div>}
        {data.scheduledDate && <div><span className="geo-card-label">Date</span> {data.scheduledDate}</div>}
      </div>
      {(data.draftId || data.serviceRequestId) && (
        <a
          href={`/book?service=${data.serviceId || ""}&draft=${data.draftId || data.serviceRequestId || ""}`}
          className="geo-card-cta geo-card-cta-blue"
        >
          Confirm & Book &rarr;
        </a>
      )}
    </div>
  );
}

// ─── HomeScoreCard ───────────────────────────────────────────────────────────

export function HomeScoreCard({ data }: { data: any }) {
  const score = data.overallScore || data.score || 0;
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#34D399" : score >= 60 ? "#FBBF24" : score >= 40 ? "#FB923C" : "#EF4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Attention";

  return (
    <div className="geo-card geo-card-in geo-card-teal">
      <div className="geo-card-header">
        <TrendingUp className="w-4 h-4 text-teal-400" />
        <span>Home Health Score</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="geo-ring-fill"
              style={{ "--ring-offset": `${offset}` } as React.CSSProperties}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{score}</span>
            <span className="text-[10px] text-stone-500">/ 100</span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-sm font-semibold" style={{ color }}>{label}</div>
          {data.categories && (
            <div className="space-y-0.5">
              {Object.entries(data.categories).slice(0, 4).map(([key, val]: [string, any]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500 capitalize w-16 truncate">{key}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${val}%`, backgroundColor: val >= 70 ? "#34D399" : val >= 40 ? "#FBBF24" : "#EF4444" }}
                    />
                  </div>
                  <span className="text-stone-500 w-6 text-right">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
