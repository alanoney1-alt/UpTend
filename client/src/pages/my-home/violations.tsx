import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, ChevronUp, Camera, Clock, AlertTriangle, CheckCircle2, XCircle, Send, CalendarPlus, Shield } from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

const VIOLATION_LABELS: Record<string, string> = {
  overgrown_lawn: "Lawn Maintenance Required",
  unapproved_paint: "Unapproved Paint Color",
  trash_cans: "Trash Can Storage",
  broken_fence: "Fence Repair Needed",
  parking_violation: "Parking Violation",
  unapproved_structure: "Unapproved Structure",
  dead_landscaping: "Landscaping Maintenance",
  holiday_decorations: "Holiday Decoration Notice",
  noise_complaint: "Noise Complaint",
  pet_violation: "Pet Policy Notice",
  signage_violation: "Signage Notice",
  roof_damage: "Roof Repair Needed",
  window_modification: "Window Modification Notice",
  driveway_stain: "Driveway Maintenance",
  recreational_vehicle: "Vehicle Storage Notice",
  commercial_vehicle: "Commercial Vehicle Notice",
  exterior_modification: "Exterior Modification Notice",
  pool_safety: "Pool Safety Notice",
  lighting_violation: "Lighting Notice",
  other: "Property Notice",
};

function friendlyType(type: string): string {
  return VIOLATION_LABELS[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function daysRemaining(deadline: string): { text: string; color: string } {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: "OVERDUE", color: "text-red-600 bg-red-50" };
  if (diff <= 3) return { text: `${diff} day${diff !== 1 ? "s" : ""} remaining`, color: "text-red-600 bg-red-50" };
  if (diff <= 7) return { text: `${diff} days remaining`, color: "text-yellow-700 bg-yellow-50" };
  return { text: `${diff} days remaining`, color: "text-green-700 bg-green-50" };
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    cured: { label: "Resolved", cls: "bg-green-100 text-green-700" },
    closed: { label: "Closed", cls: "bg-gray-100 text-gray-600" },
    dismissed: { label: "Dismissed", cls: "bg-gray-100 text-gray-600" },
    disputed: { label: "Under Review", cls: "bg-blue-100 text-blue-700" },
    escalated: { label: "Escalated", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function CureForm({ violationId, onClose }: { violationId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const cureMutation = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Please take or select a photo");
      // Convert to base64 data URL for the API (in production, upload to S3 first)
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      return apiRequest("POST", `/api/violations/${violationId}/cure`, {
        curePhotoUrl: dataUrl,
        note,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["my-violations"] });
    },
  });

  if (submitted) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
        <CheckCircle2 className="inline w-4 h-4 mr-1 -mt-0.5" />
        Your fix has been submitted for review. We'll notify you when it's approved.
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
      <p className="text-sm font-medium text-gray-700">Upload a photo showing the fix</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPreview(URL.createObjectURL(f));
        }}
      />
      {preview && <img src={preview} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />}
      <textarea
        placeholder="Optional note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full text-sm border rounded-lg p-2 resize-none"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          onClick={() => cureMutation.mutate()}
          disabled={cureMutation.isPending}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {cureMutation.isPending ? "Submitting..." : "Submit Fix"}
        </button>
        <button onClick={onClose} className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-200 rounded-lg">
          Cancel
        </button>
      </div>
      {cureMutation.isError && (
        <p className="text-red-600 text-xs">{(cureMutation.error as Error).message}</p>
      )}
    </div>
  );
}

function ExtensionForm({ violationId, onClose }: { violationId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/violations/${violationId}/extend`, { requestedDays: days, reason }),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["my-violations"] });
    },
  });

  if (submitted) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm">
        <CheckCircle2 className="inline w-4 h-4 mr-1 -mt-0.5" />
        Extension request submitted. We'll review it shortly.
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
      <p className="text-sm font-medium text-gray-700">Request an Extension</p>
      <label className="block text-xs text-gray-500">
        Additional days needed
        <input
          type="number"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="mt-1 block w-full border rounded-lg p-2 text-sm"
        />
      </label>
      <textarea
        placeholder="Reason for extension..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full text-sm border rounded-lg p-2 resize-none"
        rows={2}
      />
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Submitting..." : "Request Extension"}
        </button>
        <button onClick={onClose} className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-200 rounded-lg">
          Cancel
        </button>
      </div>
    </div>
  );
}

function DisputeForm({ violationId, onClose }: { violationId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/violations/${violationId}/dispute`, { reason }),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["my-violations"] });
    },
  });

  if (submitted) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm">
        <CheckCircle2 className="inline w-4 h-4 mr-1 -mt-0.5" />
        Your dispute has been submitted. We'll review it and get back to you.
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
      <p className="text-sm font-medium text-gray-700">Dispute this Notice</p>
      <textarea
        placeholder="Please explain why you believe this notice is incorrect..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full text-sm border rounded-lg p-2 resize-none"
        rows={3}
      />
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || reason.length < 10}
          className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Submitting..." : "Submit Dispute"}
        </button>
        <button onClick={onClose} className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-200 rounded-lg">
          Cancel
        </button>
      </div>
      {reason.length > 0 && reason.length < 10 && (
        <p className="text-xs text-gray-400">Please provide at least 10 characters</p>
      )}
    </div>
  );
}

// ─── Violation Card ─────────────────────────────────────────────────────────

function ViolationCard({ v }: { v: any }) {
  const [openForm, setOpenForm] = useState<"cure" | "extend" | "dispute" | null>(null);
  const deadline = daysRemaining(v.cure_deadline);
  const isActive = ["pending", "notified", "draft"].includes(v.status);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {v.photo_url && (
        <img src={v.photo_url} alt="Property photo" className="w-full h-48 object-cover" />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{friendlyType(v.violation_type)}</h3>
          {!isActive && statusBadge(v.status)}
        </div>

        <p className="text-sm text-gray-600">{v.description?.split("\n[")[0]}</p>

        {v.ccr_section && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Community Guidelines — {v.ccr_section}
          </p>
        )}

        {isActive && v.cure_deadline && (
          <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${deadline.color}`}>
            <Clock className="w-3 h-3" />
            {deadline.text}
          </div>
        )}

        {isActive && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setOpenForm(openForm === "cure" ? null : "cure")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
            >
              <Camera className="w-4 h-4" /> I've Fixed It
            </button>
            <button
              onClick={() => setOpenForm(openForm === "extend" ? null : "extend")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" /> Request Extension
            </button>
            <button
              onClick={() => setOpenForm(openForm === "dispute" ? null : "dispute")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-50 text-orange-700 rounded-xl font-medium text-sm hover:bg-orange-100 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Dispute
            </button>
          </div>
        )}

        {openForm === "cure" && <CureForm violationId={v.id} onClose={() => setOpenForm(null)} />}
        {openForm === "extend" && <ExtensionForm violationId={v.id} onClose={() => setOpenForm(null)} />}
        {openForm === "dispute" && <DisputeForm violationId={v.id} onClose={() => setOpenForm(null)} />}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MyHomeViolations() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [showResolved, setShowResolved] = useState(false);

  // For now, use a simple approach: fetch violations for the user's property
  // The API needs the propertyId — we'll look it up from the user's profile
  const propertyQuery = useQuery({
    queryKey: ["my-property", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/community-properties/by-user/${user?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.id,
  });

  const propertyId = propertyQuery.data?.id;

  const violationsQuery = useQuery({
    queryKey: ["my-violations", propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/violations/property/${propertyId}`);
      if (!res.ok) throw new Error("Failed to load violations");
      return res.json();
    },
    enabled: !!propertyId,
  });

  const violations = violationsQuery.data?.violations || [];
  const active = violations.filter((v: any) => ["draft", "pending", "notified"].includes(v.status));
  const resolved = violations.filter((v: any) => !["draft", "pending", "notified"].includes(v.status));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-600">Please sign in to view your property notices.</p>
          <a href="/auth" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Notices</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and respond to notices about your property
          </p>
        </div>

        {/* Loading state */}
        {(propertyQuery.isLoading || violationsQuery.isLoading) && (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* No property found */}
        {!propertyQuery.isLoading && !propertyId && (
          <div className="text-center py-12 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <p className="text-gray-600">No property linked to your account yet.</p>
            <p className="text-sm text-gray-400">Contact your community manager to get set up.</p>
          </div>
        )}

        {/* Active violations */}
        {active.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Active Notices ({active.length})
            </h2>
            {active.map((v: any) => (
              <ViolationCard key={v.id} v={v} />
            ))}
          </div>
        )}

        {/* No active violations */}
        {propertyId && !violationsQuery.isLoading && active.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <p className="text-gray-900 font-medium">All clear!</p>
            <p className="text-sm text-gray-500">You have no active property notices.</p>
          </div>
        )}

        {/* Resolved violations */}
        {resolved.length > 0 && (
          <div>
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700"
            >
              Past Notices ({resolved.length})
              {showResolved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showResolved && (
              <div className="space-y-4 mt-4">
                {resolved.map((v: any) => (
                  <ViolationCard key={v.id} v={v} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
