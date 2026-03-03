import { useState, useRef } from "react";

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
  homeValueEstimate: number;
  sqFootage: number;
  lotSizeAcres: number;
  hasPool: boolean | "uncertain";
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  roofType: string;
  hasGarage: boolean;
  garageSize: string;
  stories: number;
  exteriorType: string;
  propertyType: string;
}

export default function HomeIntelligence() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<HomeIntelligenceReport | null>(null);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || loading) return;
    setLoading(true);
    setError("");
    setReport(null);
    setProperty(null);

    try {
      const res = await fetch("/api/property-intelligence/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan");
      setReport(data.report);
      setProperty(data.property);
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";

  const urgencyStyle = (urgency: string) => {
    if (urgency === "urgent") return { bg: "rgba(239,68,68,0.15)", border: "#ef4444", label: "Urgent" };
    if (urgency === "soon") return { bg: "rgba(234,179,8,0.15)", border: "#eab308", label: "Upcoming" };
    return { bg: "rgba(34,197,94,0.12)", border: "#22c55e", label: "Routine" };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Hero */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "#fff", marginBottom: 16, lineHeight: 1.15 }}>
          Know Your Home in 30 Seconds
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)", color: "#94a3b8", marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
          Type your address. George pulls public records and tells you exactly what your home needs.
        </p>

        <form onSubmit={handleScan} style={{ display: "flex", gap: 12, maxWidth: 600, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Orlando, FL 32801"
            style={{
              flex: 1, minWidth: 250, padding: "16px 20px", fontSize: 16, borderRadius: 12,
              border: "2px solid #1a2940", background: "#0f1d32", color: "#fff",
              outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#F47C20")}
            onBlur={(e) => (e.target.style.borderColor = "#1a2940")}
          />
          <button
            type="submit"
            disabled={loading || !address.trim()}
            style={{
              padding: "16px 32px", fontSize: 16, fontWeight: 700, borderRadius: 12,
              border: "none", background: loading ? "#94a3b8" : "#F47C20", color: "#fff",
              cursor: loading ? "wait" : "pointer", transition: "background 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Scanning..." : "Scan My Home"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#ef4444", marginTop: 16 }}>{error}</p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: "#0f1d32", padding: "24px 32px", borderRadius: 16, border: "1px solid #1a2940" }}>
            <img src="/george-avatar.png" alt="George" style={{ width: 48, height: 48, borderRadius: "50%" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 600, color: "#F47C20", margin: 0 }}>George is scanning public records...</p>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: "4px 0 0" }}>Pulling property data and running maintenance analysis</p>
            </div>
            <div style={{ width: 24, height: 24, border: "3px solid #1a2940", borderTop: "3px solid #F47C20", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Report */}
      {report && property && (
        <div ref={reportRef} style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" }}>
          {/* Health Score + Property Details */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, marginBottom: 32, alignItems: "start" }}>
            {/* Score Circle */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 140, height: 140, borderRadius: "50%",
                border: `6px solid ${scoreColor(report.overallHealthScore)}`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: "#0f1d32",
              }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: scoreColor(report.overallHealthScore) }}>
                  {report.overallHealthScore}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8", marginTop: -4 }}>HEALTH SCORE</span>
              </div>
            </div>

            {/* Property Card */}
            <div style={{ background: "#0f1d32", borderRadius: 16, padding: 24, border: "1px solid #1a2940" }}>
              <h3 style={{ color: "#fff", fontSize: 18, marginTop: 0, marginBottom: 12 }}>{property.address}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
                {[
                  { label: "Year Built", value: report.yearBuilt },
                  { label: "Home Age", value: `${report.homeAge} yrs` },
                  { label: "Beds / Baths", value: `${property.bedrooms} / ${property.bathrooms}` },
                  { label: "Sq Ft", value: property.sqFootage?.toLocaleString() || "N/A" },
                  { label: "Lot", value: property.lotSizeAcres ? `${property.lotSizeAcres} acres` : "N/A" },
                  { label: "Pool", value: property.hasPool === true ? "Yes" : property.hasPool === "uncertain" ? "Unknown" : "No" },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Life Remaining */}
          <div style={{ background: "#0f1d32", borderRadius: 16, padding: 24, border: "1px solid #1a2940", marginBottom: 24 }}>
            <h3 style={{ color: "#fff", fontSize: 16, marginTop: 0, marginBottom: 16 }}>System Life Remaining</h3>
            {[
              { label: "Roof", value: report.roofLifeRemaining },
              { label: "HVAC", value: report.hvacLifeRemaining },
              { label: "Water Heater", value: report.waterHeaterLifeRemaining },
            ].map((sys) => {
              const years = parseInt(sys.value.replace(/[^0-9]/g, "")) || 0;
              const maxYears = sys.label === "Roof" ? 30 : sys.label === "HVAC" ? 20 : 15;
              const pct = Math.min(100, Math.max(5, (years / maxYears) * 100));
              const color = pct > 50 ? "#22c55e" : pct > 25 ? "#eab308" : "#ef4444";
              return (
                <div key={sys.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: "#94a3b8" }}>{sys.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color }}>{sys.value}</span>
                  </div>
                  <div style={{ height: 8, background: "#1a2940", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cost Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#0f1d32", borderRadius: 16, padding: 24, border: "1px solid #1a2940", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Est. Annual Maintenance</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#F47C20" }}>
                ${report.estimatedAnnualMaintenanceCost?.toLocaleString() || "0"}
              </div>
            </div>
            <div style={{ background: "#0f1d32", borderRadius: 16, padding: 24, border: "1px solid #1a2940", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Potential Overspend</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#ef4444" }}>
                ${report.estimatedCurrentOverspend?.toLocaleString() || "0"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>vs proactive maintenance</div>
            </div>
          </div>

          {/* Maintenance Items */}
          {[
            { title: "Needs Attention Now", items: report.urgentItems, urgency: "urgent" as const },
            { title: "Coming Up (6-12 Months)", items: report.upcomingItems, urgency: "soon" as const },
            { title: "Annual Maintenance", items: report.annualItems, urgency: "routine" as const },
          ].filter(g => g.items?.length > 0).map((group) => (
            <div key={group.title} style={{ marginBottom: 24 }}>
              <h3 style={{ color: "#fff", fontSize: 16, marginBottom: 12 }}>{group.title}</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {group.items.map((item, i) => {
                  const s = urgencyStyle(item.urgency);
                  return (
                    <div key={i} style={{ background: s.bg, borderRadius: 12, padding: 20, borderLeft: `4px solid ${s.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, color: s.border, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{item.system}</span>
                          <h4 style={{ color: "#fff", margin: "4px 0 8px", fontSize: 15 }}>{item.task}</h4>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#F47C20", whiteSpace: "nowrap" }}>{item.estimatedCost}</span>
                      </div>
                      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{item.reasoning}</p>
                      {item.canUpTendHelp && item.upTendService && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#F47C20" }}>
                          UpTend can help: {item.upTendService}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* George's Insight */}
          <div style={{ background: "#0f1d32", borderRadius: 16, padding: 24, border: "1px solid #F47C20", marginBottom: 32, display: "flex", gap: 16, alignItems: "start" }}>
            <img src="/george-avatar.png" alt="George" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div>
              <div style={{ fontSize: 13, color: "#F47C20", fontWeight: 700, marginBottom: 6 }}>George says:</div>
              <p style={{ color: "#e2e8f0", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{report.georgeInsight}</p>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <a
              href="/guide"
              style={{
                display: "block", textAlign: "center", padding: "16px 24px",
                background: "#F47C20", color: "#fff", borderRadius: 12,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
              }}
            >
              Want George to handle this? Start a conversation
            </a>
            <a
              href="/discovery"
              style={{
                display: "block", textAlign: "center", padding: "16px 24px",
                background: "transparent", color: "#F47C20", borderRadius: 12,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                border: "2px solid #F47C20",
              }}
            >
              Get this report for your whole neighborhood
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
