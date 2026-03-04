import { useState, useEffect, useCallback } from "react";

interface Lead {
  id: string;
  companyName: string | null;
  serviceType: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  collectedData: any;
  proposal: any;
  messages: any;
  auditData: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "consultation_scheduled", label: "Consultation Scheduled" },
  { value: "closed_won", label: "Won" },
  { value: "closed_lost", label: "Lost" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  consultation_scheduled: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  closed_won: "bg-green-500/20 text-green-400 border-green-500/30",
  closed_lost: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  consultation_scheduled: "Consultation Scheduled",
  closed_won: "Won",
  closed_lost: "Lost",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function SalesLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/sales/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/sales/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, status });
    }
    fetchLeads();
  };

  if (selectedLead) {
    return <LeadDetail lead={selectedLead} onBack={() => setSelectedLead(null)} onStatusChange={updateStatus} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Sales Leads{" "}
            <span className="text-gray-500 text-lg font-normal">({leads.length})</span>
          </h1>
        </div>

        <div className="flex gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#12121a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md bg-[#12121a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-20">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="text-gray-500 text-center py-20">No leads found</div>
        ) : (
          <div className="grid gap-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const p = lead.proposal || {};
  const pkg = p.suggestedPackage || p.package || p.recommendedPackage || {};
  const painPoints = p.painPoints || p.challenges || [];
  const topPain = Array.isArray(painPoints) ? painPoints[0] : null;

  return (
    <div
      onClick={onClick}
      className="bg-[#12121a] border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-white truncate">{lead.companyName || "Unknown Company"}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
              {STATUS_LABELS[lead.status] || lead.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
            {lead.serviceType && <span>{lead.serviceType}</span>}
            {lead.contactName && <span>{lead.contactName}</span>}
            {lead.contactPhone && (
              <a href={`tel:${lead.contactPhone}`} className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                {lead.contactPhone}
              </a>
            )}
            {lead.contactEmail && (
              <a href={`mailto:${lead.contactEmail}`} className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                {lead.contactEmail}
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 text-sm">
            {(pkg.name || pkg.tier) && (
              <span className="text-gray-300">
                {pkg.name || pkg.tier}
                {(pkg.price || pkg.monthlyPrice) && <span className="text-green-400 ml-1">${pkg.price || pkg.monthlyPrice}/mo</span>}
              </span>
            )}
            {topPain && typeof topPain === "string" && (
              <span className="text-gray-500 truncate max-w-xs">{topPain}</span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-600 whitespace-nowrap ml-4">
          {lead.createdAt ? timeAgo(lead.createdAt) : ""}
        </span>
      </div>
    </div>
  );
}

function LeadDetail({ lead, onBack, onStatusChange }: { lead: Lead; onBack: () => void; onStatusChange: (id: string, status: string) => void }) {
  const p = lead.proposal || {};
  const pkg = p.suggestedPackage || p.package || p.recommendedPackage || {};
  const painPoints = p.painPoints || p.challenges || [];
  const roi = p.roi || p.projectedROI || {};
  const nextSteps = p.nextSteps || [];
  const audit = lead.auditData || p.auditData || p.audit || {};
  const messages = Array.isArray(lead.messages) ? lead.messages : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-1">
          &larr; Back to leads
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">{lead.companyName || "Unknown Company"}</h1>
            <div className="flex flex-wrap gap-x-4 text-sm text-gray-400">
              {lead.serviceType && <span>{lead.serviceType}</span>}
              {lead.contactName && <span className="font-medium text-white">{lead.contactName}</span>}
              {lead.contactPhone && (
                <a href={`tel:${lead.contactPhone}`} className="text-blue-400 hover:underline text-base font-medium">
                  {lead.contactPhone}
                </a>
              )}
              {lead.contactEmail && (
                <a href={`mailto:${lead.contactEmail}`} className="text-blue-400 hover:underline">
                  {lead.contactEmail}
                </a>
              )}
            </div>
          </div>
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(lead.id, e.target.value)}
            className="bg-[#12121a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Proposal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Summary */}
            {(p.businessSummary || p.summary) && (
              <Section title="Business Summary">
                <p className="text-gray-300 text-sm leading-relaxed">{p.businessSummary || p.summary}</p>
              </Section>
            )}

            {/* Pain Points */}
            {painPoints.length > 0 && (
              <Section title="Pain Points">
                <ul className="space-y-2">
                  {painPoints.map((pt: any, i: number) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">-</span>
                      {typeof pt === "string" ? pt : pt.description || pt.title || JSON.stringify(pt)}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Audit Data */}
            {audit && Object.keys(audit).length > 0 && (
              <Section title="Online Presence Audit">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(audit).map(([key, val]) => (
                    <div key={key} className="bg-[#0a0a0f] rounded-lg p-3">
                      <div className="text-gray-500 text-xs mb-1">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</div>
                      <div className="text-gray-300">{typeof val === "object" ? JSON.stringify(val) : String(val)}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Package */}
            {(pkg.name || pkg.tier) && (
              <Section title="Suggested Package">
                <div className="bg-[#0a0a0f] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{pkg.name || pkg.tier}</span>
                    {(pkg.price || pkg.monthlyPrice) && (
                      <span className="text-green-400 font-bold text-lg">${pkg.price || pkg.monthlyPrice}/mo</span>
                    )}
                  </div>
                  {pkg.description && <p className="text-gray-400 text-sm">{pkg.description}</p>}
                  {pkg.features && Array.isArray(pkg.features) && (
                    <ul className="mt-3 space-y-1">
                      {pkg.features.map((f: string, i: number) => (
                        <li key={i} className="text-gray-300 text-sm">- {f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </Section>
            )}

            {/* ROI */}
            {roi && Object.keys(roi).length > 0 && (
              <Section title="Projected ROI">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(roi).map(([key, val]) => (
                    <div key={key} className="bg-[#0a0a0f] rounded-lg p-3">
                      <div className="text-gray-500 text-xs mb-1">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</div>
                      <div className="text-gray-300 font-medium">{typeof val === "object" ? JSON.stringify(val) : String(val)}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Next Steps */}
            {nextSteps.length > 0 && (
              <Section title="Next Steps">
                <ol className="space-y-2">
                  {nextSteps.map((step: any, i: number) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400 font-medium">{i + 1}.</span>
                      {typeof step === "string" ? step : step.description || step.title || JSON.stringify(step)}
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {/* Raw collected data fallback */}
            {lead.collectedData && Object.keys(lead.collectedData).length > 0 && (
              <Section title="Collected Data">
                <pre className="text-xs text-gray-400 overflow-auto max-h-60 bg-[#0a0a0f] rounded-lg p-3">
                  {JSON.stringify(lead.collectedData, null, 2)}
                </pre>
              </Section>
            )}
          </div>

          {/* Right: Conversation */}
          <div className="lg:col-span-1">
            <Section title="Conversation Transcript">
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm">No transcript available</p>
                ) : (
                  messages.map((msg: any, i: number) => {
                    const isGeorge = msg.role === "assistant" || msg.sender === "george" || msg.from === "george";
                    return (
                      <div key={i} className={`text-sm ${isGeorge ? "pr-4" : "pl-4"}`}>
                        <div className={`rounded-lg p-3 ${isGeorge ? "bg-[#1a1a2e] text-gray-300" : "bg-blue-900/30 text-blue-200"}`}>
                          <div className="text-xs text-gray-500 mb-1">{isGeorge ? "George" : "Customer"}</div>
                          {msg.content || msg.text || msg.message || ""}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#12121a] border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}
