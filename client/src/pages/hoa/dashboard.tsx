import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ──────────────────────────────────────────────────────────
interface Violation {
  id: string;
  propertyAddress: string;
  communityId: number;
  communityName?: string;
  type: string;
  severity: "warning" | "minor" | "moderate" | "major" | "critical";
  status: "draft" | "pending" | "notified" | "cured" | "escalated" | "disputed" | "cure_submitted";
  photoUrl?: string;
  curePhotoUrl?: string;
  cureDeadline?: string;
  createdAt: string;
  updatedAt?: string;
  description?: string;
  notes?: string;
  notificationHistory?: NotificationEntry[];
  cureAttempts?: CureAttempt[];
  timeline?: TimelineEntry[];
  photos?: string[];
}

interface NotificationEntry {
  date: string;
  method: string;
  message: string;
}

interface CureAttempt {
  date: string;
  photoUrl?: string;
  notes?: string;
  status: "pending" | "accepted" | "rejected";
}

interface TimelineEntry {
  date: string;
  action: string;
  actor?: string;
}

interface Community {
  id: string;
  name: string;
}

// ─── Constants ──────────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, string> = {
  warning: "bg-green-600 text-green-100",
  minor: "bg-yellow-600 text-yellow-100",
  moderate: "bg-orange-600 text-orange-100",
  major: "bg-red-600 text-red-100",
  critical: "bg-purple-600 text-purple-100",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-600 text-gray-200",
  pending: "bg-blue-600 text-blue-100",
  notified: "bg-sky-600 text-sky-100",
  cured: "bg-green-700 text-green-100",
  escalated: "bg-red-700 text-red-100",
  disputed: "bg-amber-700 text-amber-100",
  cure_submitted: "bg-teal-600 text-teal-100",
};

const ALL_STATUSES = ["draft", "pending", "notified", "cured", "escalated", "disputed", "cure_submitted"] as const;
const ALL_SEVERITIES = ["warning", "minor", "moderate", "major", "critical"] as const;

// ─── API helpers ────────────────────────────────────────────────────
async function fetchViolations(communityId?: string, status?: string): Promise<Violation[]> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (communityId) {
    const res = await fetch(`/api/violations/community/${communityId}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  // If no community filter, get pending (drafts) + all statuses
  const res = await fetch(`/api/violations/pending?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchViolationDetail(id: string): Promise<Violation> {
  const res = await fetch(`/api/violations/${id}`);
  if (!res.ok) throw new Error("Failed to fetch violation");
  return res.json();
}

// ─── Component ──────────────────────────────────────────────────────
export default function HOADashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Filters
  const [communityFilter, setCommunityFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCureReview, setShowCureReview] = useState(false);

  // Fetch violations
  const { data: violations = [], isLoading, refetch } = useQuery({
    queryKey: ["hoa-violations", communityFilter, statusFilter],
    queryFn: () => fetchViolations(communityFilter, statusFilter),
    refetchInterval: 30000,
  });

  // Fetch detail
  const { data: violationDetail } = useQuery({
    queryKey: ["hoa-violation-detail", selectedId],
    queryFn: () => fetchViolationDetail(selectedId!),
    enabled: !!selectedId && showDetail,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/violations/${id}/approve`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hoa-violations"] }); },
  });

  // Board report
  const [reportLoading, setReportLoading] = useState(false);
  const generateReport = async () => {
    if (!communityFilter) { alert("Select a community first"); return; }
    setReportLoading(true);
    try {
      const res = await fetch(`/api/violations/report/${communityFilter}`);
      if (!res.ok) throw new Error("Report generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Auto-escalation
  const [escalationLoading, setEscalationLoading] = useState(false);
  const runAutoEscalation = async () => {
    setEscalationLoading(true);
    try {
      await fetch("/api/violations/auto-escalate");
      refetch();
    } catch {
      alert("Auto-escalation failed");
    } finally {
      setEscalationLoading(false);
    }
  };

  // Filtered + sorted violations
  const filtered = useMemo(() => {
    let list = Array.isArray(violations) ? [...violations] : [];
    if (severityFilter !== "all") list = list.filter(v => v.severity === severityFilter);
    if (dateFrom) list = list.filter(v => v.createdAt >= dateFrom);
    if (dateTo) list = list.filter(v => v.createdAt <= dateTo + "T23:59:59");
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [violations, severityFilter, dateFrom, dateTo]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return {
      open: violations.filter(v => !["cured"].includes(v.status)).length,
      pending: violations.filter(v => v.status === "draft" || v.status === "pending").length,
      overdue: violations.filter(v => v.cureDeadline && new Date(v.cureDeadline) < now && v.status !== "cured").length,
      curedThisMonth: violations.filter(v => v.status === "cured" && v.updatedAt && v.updatedAt >= monthStart).length,
    };
  }, [violations]);

  const isOverdue = (v: Violation) => v.cureDeadline && new Date(v.cureDeadline) < new Date() && v.status !== "cured";

  const openDetail = (id: string) => { setSelectedId(id); setShowDetail(true); setShowCureReview(false); };
  const closeDetail = () => { setShowDetail(false); setSelectedId(null); };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center font-bold text-sm">H</div>
            <h1 className="text-lg font-semibold">HOA Violation Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/hoa/inspections")}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
            >
              🔍 Start Inspection
            </button>
            <button
              onClick={generateReport}
              disabled={reportLoading}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
            >
              {reportLoading ? "Generating…" : "📊 Board Report"}
            </button>
            <button
              onClick={runAutoEscalation}
              disabled={escalationLoading}
              className="px-3 py-1.5 text-sm bg-red-700 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50"
            >
              {escalationLoading ? "Running…" : "⚡ Auto-Escalate"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Open Violations", value: stats.open, color: "text-orange-400" },
            { label: "Pending Review", value: stats.pending, color: "text-blue-400" },
            { label: "Overdue", value: stats.overdue, color: "text-red-400" },
            { label: "Cured This Month", value: stats.curedThisMonth, color: "text-green-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 items-center bg-gray-900 border border-gray-800 rounded-lg p-3">
          <select
            value={communityFilter ?? ""}
            onChange={e => setCommunityFilter(e.target.value || undefined)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          >
            <option value="">All Communities</option>
            {/* Communities would be fetched; placeholder options */}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All Severities</option>
            {ALL_SEVERITIES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span>From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200" />
            <span>To</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200" />
          </div>
          <div className="ml-auto text-xs text-gray-500">{filtered.length} violations</div>
        </div>

        {/* Violations Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No violations found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Photo</th>
                  <th className="text-left px-4 py-3">Property</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Severity</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Cure Deadline</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-gray-800/40 cursor-pointer transition-colors"
                    onClick={() => openDetail(v.id)}
                  >
                    <td className="px-4 py-3">
                      {v.photoUrl ? (
                        <img src={v.photoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center text-gray-600">📷</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{v.propertyAddress}</td>
                    <td className="px-4 py-3 text-gray-300">{v.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[v.severity] || "bg-gray-600"}`}>
                        {v.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[v.status] || "bg-gray-600"}`}>
                        {v.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {v.cureDeadline ? (
                        <span className="flex items-center gap-1.5">
                          <span>{new Date(v.cureDeadline).toLocaleDateString()}</span>
                          {isOverdue(v) && (
                            <span className="px-1.5 py-0.5 bg-red-600 text-red-100 rounded text-[10px] font-bold uppercase">Overdue</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <ActionButtons violation={v} onApprove={() => approveMutation.mutate(v.id)} onCureReview={() => { setSelectedId(v.id); setShowCureReview(true); setShowDetail(true); }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedId && (
        <DetailModal
          violation={violationDetail || filtered.find(v => v.id === selectedId)}
          showCureReview={showCureReview}
          onClose={closeDetail}
        />
      )}
    </div>
  );
}

// ─── Action Buttons ─────────────────────────────────────────────────
function ActionButtons({ violation: v, onApprove, onCureReview }: { violation: Violation; onApprove: () => void; onCureReview: () => void }) {
  const btnBase = "px-2 py-1 rounded text-xs font-medium transition-colors";
  switch (v.status) {
    case "draft":
      return (
        <div className="flex gap-1.5 justify-end">
          <button onClick={onApprove} className={`${btnBase} bg-green-700 hover:bg-green-600`}>Approve & Send</button>
          <button className={`${btnBase} bg-gray-700 hover:bg-gray-600`}>Edit</button>
          <button className={`${btnBase} bg-gray-700 hover:bg-gray-600 text-red-400`}>Dismiss</button>
        </div>
      );
    case "notified":
      return (
        <div className="flex gap-1.5 justify-end">
          <button className={`${btnBase} bg-gray-700 hover:bg-gray-600`}>View</button>
          <button className={`${btnBase} bg-green-700 hover:bg-green-600`}>Mark Cured</button>
          <button className={`${btnBase} bg-red-700 hover:bg-red-600`}>Escalate</button>
        </div>
      );
    case "cure_submitted":
      return (
        <div className="flex gap-1.5 justify-end">
          <button onClick={onCureReview} className={`${btnBase} bg-teal-700 hover:bg-teal-600`}>Review Cure</button>
        </div>
      );
    case "disputed":
      return (
        <div className="flex gap-1.5 justify-end">
          <button className={`${btnBase} bg-amber-700 hover:bg-amber-600`}>Review Dispute</button>
        </div>
      );
    default:
      return null;
  }
}

// ─── Detail Modal ───────────────────────────────────────────────────
function DetailModal({ violation, showCureReview, onClose }: { violation?: Violation; showCureReview: boolean; onClose: () => void }) {
  if (!violation) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-xl bg-gray-900 border-l border-gray-800 h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Violation #{violation.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Property & Meta */}
          <div>
            <div className="text-lg font-medium">{violation.propertyAddress}</div>
            <div className="flex gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[violation.severity]}`}>{violation.severity}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[violation.status]}`}>{violation.status.replace("_", " ")}</span>
            </div>
            <div className="mt-2 text-sm text-gray-400">Type: {violation.type}</div>
            {violation.description && <div className="mt-2 text-sm text-gray-300">{violation.description}</div>}
            {violation.cureDeadline && (
              <div className="mt-2 text-sm">
                Cure deadline: <span className={violation.cureDeadline && new Date(violation.cureDeadline) < new Date() ? "text-red-400 font-bold" : "text-gray-300"}>
                  {new Date(violation.cureDeadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Photos</h3>
            <div className="grid grid-cols-2 gap-2">
              {violation.photoUrl && <img src={violation.photoUrl} alt="Violation" className="rounded-lg w-full aspect-video object-cover" />}
              {violation.photos?.map((p, i) => (
                <img key={i} src={p} alt={`Photo ${i + 1}`} className="rounded-lg w-full aspect-video object-cover" />
              ))}
              {!violation.photoUrl && !violation.photos?.length && (
                <div className="col-span-2 py-8 text-center text-gray-600">No photos</div>
              )}
            </div>
          </div>

          {/* Cure Review: Side-by-side */}
          {showCureReview && (violation.status === "cure_submitted") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Cure Review</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Original Violation</div>
                  {violation.photoUrl ? (
                    <img src={violation.photoUrl} alt="Violation" className="rounded-lg w-full aspect-video object-cover" />
                  ) : (
                    <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center text-gray-600">No photo</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Homeowner's Cure</div>
                  {violation.curePhotoUrl ? (
                    <img src={violation.curePhotoUrl} alt="Cure" className="rounded-lg w-full aspect-video object-cover" />
                  ) : (
                    <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center text-gray-600">No photo</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-md text-sm font-medium transition-colors">
                  ✓ Accept Cure
                </button>
                <button className="flex-1 py-2 bg-red-700 hover:bg-red-600 rounded-md text-sm font-medium transition-colors">
                  ✕ Reject Cure
                </button>
              </div>
            </div>
          )}

          {/* Notification History */}
          {violation.notificationHistory && violation.notificationHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Notification History</h3>
              <div className="space-y-2">
                {violation.notificationHistory.map((n, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">{n.method}</span>
                      <span className="text-gray-500 text-xs">{new Date(n.date).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-400 mt-1">{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cure Attempts */}
          {violation.cureAttempts && violation.cureAttempts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Cure Attempts</h3>
              <div className="space-y-2">
                {violation.cureAttempts.map((c, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">{new Date(c.date).toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${c.status === "accepted" ? "bg-green-700" : c.status === "rejected" ? "bg-red-700" : "bg-gray-700"}`}>
                        {c.status}
                      </span>
                    </div>
                    {c.notes && <div className="text-gray-400 mt-1">{c.notes}</div>}
                    {c.photoUrl && <img src={c.photoUrl} alt="Cure attempt" className="mt-2 rounded w-32 aspect-video object-cover" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {violation.timeline && violation.timeline.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Timeline</h3>
              <div className="relative pl-4 border-l border-gray-700 space-y-3">
                {violation.timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-600 border-2 border-gray-900" />
                    <div className="text-xs text-gray-500">{new Date(t.date).toLocaleString()}</div>
                    <div className="text-sm text-gray-300">{t.action}</div>
                    {t.actor && <div className="text-xs text-gray-500">{t.actor}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
