import { useState, useRef } from "react";
import { Link } from "wouter";

interface MaintenanceItem {
  system: string;
  task: string;
  urgency: "urgent" | "soon" | "routine";
  estimatedCost: string;
  reasoning: string;
  canUpTendHelp: boolean;
  upTendService?: string;
}

interface HomeIntelligenceReport {
  overallHealthScore: number;
  yearBuilt: number;
  homeAge: number;
  urgentItems: MaintenanceItem[];
  upcomingItems: MaintenanceItem[];
  annualItems: MaintenanceItem[];
  estimatedAnnualMaintenanceCost: number;
  estimatedCurrentOverspend: number;
  roofLifeRemaining: string;
  hvacLifeRemaining: string;
  waterHeaterLifeRemaining: string;
  georgeInsight: string;
}

interface PropertyData {
  address: string;
  sqFootage: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  stories: number;
  roofType: string;
  exteriorType: string;
  hasPool: boolean | "uncertain";
  hasGarage: boolean;
  garageSize: string;
  lotSizeAcres: number;
  propertyType: string;
  dataSource: string;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#F47C20" : "#ef4444";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a2940" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function LifeBar({ label, value }: { label: string; value: string }) {
  const years = parseInt(value.replace(/[^0-9]/g, "")) || 0;
  const maxYears = 30;
  const pct = Math.min(100, (years / maxYears) * 100);
  const color = pct > 50 ? "#22c55e" : pct > 25 ? "#F47C20" : "#ef4444";

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-2 bg-[#1a2940] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: MaintenanceItem }) {
  const colors = {
    urgent: { bg: "bg-red-500/10", border: "border-red-500/30", badge: "bg-red-500", text: "text-red-400" },
    soon: { bg: "bg-[#F47C20]/10", border: "border-[#F47C20]/30", badge: "bg-[#F47C20]", text: "text-[#F47C20]" },
    routine: { bg: "bg-green-500/10", border: "border-green-500/30", badge: "bg-green-500", text: "text-green-400" },
  };
  const c = colors[item.urgency];

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 mb-3`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className={`text-xs font-semibold ${c.text} uppercase`}>{item.system}</span>
          <h4 className="text-white font-medium mt-0.5">{item.task}</h4>
        </div>
        <span className="text-white font-semibold text-sm whitespace-nowrap">{item.estimatedCost}</span>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">{item.reasoning}</p>
      {item.canUpTendHelp && item.upTendService && (
        <Link href="/book" className="inline-block mt-2 text-xs font-medium text-[#F47C20] hover:underline">
          Book {item.upTendService} with UpTend →
        </Link>
      )}
    </div>
  );
}

export default function HomeIntelligence() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [report, setReport] = useState<HomeIntelligenceReport | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || address.trim().length < 5) return;

    setLoading(true);
    setError("");
    setProperty(null);
    setReport(null);

    try {
      const res = await fetch("/api/property-intelligence/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Try again.");
      }

      const data = await res.json();
      setProperty(data.property);
      setReport(data.report);

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err: any) {
      setError(err.message || "Failed to scan property.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F47C20]/5 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center relative z-10">
          <img src="/george-avatar.png" alt="George" className="w-16 h-16 rounded-full mx-auto mb-6 ring-2 ring-[#F47C20]/40" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Know Your Home in 30 Seconds</h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Type your address. George pulls public records and tells you exactly what your home needs.
          </p>

          <form onSubmit={handleScan} className="max-w-xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your home address..."
                className="flex-1 px-5 py-4 rounded-xl bg-[#0f1d32] border border-[#1a2940] text-white placeholder-gray-500 text-lg focus:outline-none focus:border-[#F47C20]/60 transition"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || address.trim().length < 5}
                className="px-8 py-4 rounded-xl bg-[#F47C20] text-white font-semibold text-lg hover:bg-[#e06b15] disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
              >
                {loading ? "Scanning..." : "Scan"}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-3">Free. No signup. Uses public property records.</p>
          </form>

          {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <img src="/george-avatar.png" alt="George" className="w-20 h-20 rounded-full mx-auto mb-4 ring-2 ring-[#F47C20]/60" />
            <p className="text-white text-lg font-medium">George is scanning public records...</p>
            <p className="text-gray-500 mt-2">Pulling property data and analyzing maintenance needs</p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#F47C20] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {report && property && (
        <div ref={resultsRef} className="max-w-4xl mx-auto px-4 pb-20">
          {/* Health Score + Property Overview */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#0f1d32] border border-[#1a2940] rounded-2xl p-6 text-center">
              <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Home Health Score</h2>
              <ScoreCircle score={report.overallHealthScore} />
              <p className="text-gray-400 text-sm mt-3">
                {report.overallHealthScore >= 80
                  ? "Your home is in great shape"
                  : report.overallHealthScore >= 60
                    ? "Some systems need attention soon"
                    : "Multiple items need urgent attention"}
              </p>
            </div>

            <div className="bg-[#0f1d32] border border-[#1a2940] rounded-2xl p-6">
              <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-4">Property Details</h2>
              <p className="text-white font-medium mb-3">{property.address}</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                {property.yearBuilt > 0 && <Detail label="Built" value={`${property.yearBuilt} (${report.homeAge} yrs)`} />}
                {property.sqFootage > 0 && <Detail label="Size" value={`${property.sqFootage.toLocaleString()} sqft`} />}
                {property.bedrooms > 0 && <Detail label="Beds / Baths" value={`${property.bedrooms} / ${property.bathrooms}`} />}
                <Detail label="Stories" value={String(property.stories || 1)} />
                {property.roofType !== "Unknown" && <Detail label="Roof" value={property.roofType} />}
                {property.exteriorType !== "Unknown" && <Detail label="Exterior" value={property.exteriorType} />}
                <Detail label="Pool" value={property.hasPool === true ? "Yes" : property.hasPool === "uncertain" ? "Unknown" : "No"} />
                <Detail label="Garage" value={property.hasGarage ? property.garageSize || "Yes" : "No"} />
              </div>
              {property.dataSource === "estimated" && (
                <p className="text-yellow-500/70 text-xs mt-3">* Estimated from address. For a more accurate report, talk to George.</p>
              )}
            </div>
          </div>

          {/* System Life Remaining */}
          <div className="bg-[#0f1d32] border border-[#1a2940] rounded-2xl p-6 mb-8">
            <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-4">System Life Remaining</h2>
            <LifeBar label="Roof" value={report.roofLifeRemaining} />
            <LifeBar label="HVAC System" value={report.hvacLifeRemaining} />
            <LifeBar label="Water Heater" value={report.waterHeaterLifeRemaining} />
          </div>

          {/* Cost Summary */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#0f1d32] border border-[#1a2940] rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm">Estimated Annual Maintenance</p>
              <p className="text-3xl font-bold text-white mt-2">${report.estimatedAnnualMaintenanceCost.toLocaleString()}</p>
              <p className="text-gray-500 text-xs mt-1">proactive maintenance cost</p>
            </div>
            <div className="bg-[#0f1d32] border border-[#1a2940] rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm">You're Probably Overspending</p>
              <p className="text-3xl font-bold text-red-400 mt-2">${report.estimatedCurrentOverspend.toLocaleString()}</p>
              <p className="text-gray-500 text-xs mt-1">per year vs proactive approach</p>
            </div>
          </div>

          {/* Urgent Items */}
          {report.urgentItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-red-400 font-semibold text-lg mb-4">Needs Attention Now ({report.urgentItems.length})</h2>
              {report.urgentItems.map((item, i) => <ItemCard key={i} item={item} />)}
            </div>
          )}

          {/* Upcoming Items */}
          {report.upcomingItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[#F47C20] font-semibold text-lg mb-4">Coming Up (Next 6-12 Months)</h2>
              {report.upcomingItems.map((item, i) => <ItemCard key={i} item={item} />)}
            </div>
          )}

          {/* Annual Maintenance */}
          {report.annualItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-green-400 font-semibold text-lg mb-4">Annual Maintenance</h2>
              {report.annualItems.map((item, i) => <ItemCard key={i} item={item} />)}
            </div>
          )}

          {/* George's Insight */}
          <div className="bg-[#0f1d32] border border-[#F47C20]/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <img src="/george-avatar.png" alt="George" className="w-12 h-12 rounded-full ring-2 ring-[#F47C20]/40 flex-shrink-0" />
              <div>
                <p className="text-[#F47C20] font-semibold text-sm mb-2">George's Take</p>
                <p className="text-gray-300 leading-relaxed">{report.georgeInsight}</p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/book" className="block bg-[#F47C20] text-white text-center font-semibold py-4 rounded-xl hover:bg-[#e06b15] transition">
              Want George to handle this? Book a service
            </Link>
            <Link href="/discovery" className="block bg-[#0f1d32] border border-[#1a2940] text-white text-center font-semibold py-4 rounded-xl hover:border-[#F47C20]/40 transition">
              Get this report for your whole neighborhood
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-gray-500">{label}</span>
      <span className="text-white">{value}</span>
    </>
  );
}
