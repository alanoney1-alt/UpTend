import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PartsRequest {
  id: string;
  status: string;
  description: string;
  photo_url: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  supplier_source: string | null;
  receipt_url: string | null;
  created_at: string;
}

export function PartsRequestForm({ jobId }: { jobId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ partsRequests: PartsRequest[] }>({
    queryKey: ["parts-requests", jobId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/jobs/${jobId}/parts-requests`);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/parts-request`, {
        description,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        photoUrl: photoUrl || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts-requests", jobId] });
      setShowForm(false);
      setDescription("");
      setEstimatedCost("");
      setPhotoUrl("");
    },
  });

  const sourcedMutation = useMutation({
    mutationFn: async ({ id, actualCost, receiptUrl }: { id: string; actualCost?: number; receiptUrl?: string }) => {
      const res = await apiRequest("PUT", `/api/parts-requests/${id}/sourced`, { actualCost, receiptUrl });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parts-requests", jobId] }),
  });

  const installedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PUT", `/api/parts-requests/${id}/installed`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parts-requests", jobId] }),
  });

  const requests = data?.partsRequests || [];

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
    sourced: "bg-blue-100 text-blue-800",
    installed: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Parts & Materials</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Request Parts/Materials
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50 space-y-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the parts/materials needed..."
            className="w-full border rounded-lg p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="Estimated cost ($)"
              className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-400"
            />
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Photo URL (optional)"
              className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!description || createMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-500">Loading requests...</p>}

      {requests.length === 0 && !isLoading && (
        <p className="text-sm text-gray-400 italic">No parts requests yet.</p>
      )}

      {requests.map((pr) => (
        <div key={pr.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{pr.description}</p>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[pr.status] || "bg-gray-100"}`}>
              {pr.status}
            </span>
          </div>
          {pr.estimated_cost && (
            <p className="text-sm text-gray-600">Est. cost: ${pr.estimated_cost.toFixed(2)}</p>
          )}
          {pr.photo_url && (
            <img src={pr.photo_url} alt="Parts photo" className="w-32 h-32 object-cover rounded-lg" />
          )}
          {pr.status === "approved" && (
            <SourcedForm
              requestId={pr.id}
              onSubmit={(actualCost, receiptUrl) =>
                sourcedMutation.mutate({ id: pr.id, actualCost, receiptUrl })
              }
              isPending={sourcedMutation.isPending}
            />
          )}
          {pr.status === "sourced" && (
            <button
              onClick={() => installedMutation.mutate(pr.id)}
              disabled={installedMutation.isPending}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
            >
              {installedMutation.isPending ? "Updating..." : "Mark Installed"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function SourcedForm({ requestId, onSubmit, isPending }: { requestId: string; onSubmit: (cost?: number, receipt?: string) => void; isPending: boolean }) {
  const [cost, setCost] = useState("");
  const [receipt, setReceipt] = useState("");

  return (
    <div className="flex gap-2 items-end">
      <input
        type="number"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
        placeholder="Actual cost ($)"
        className="border rounded p-1.5 text-sm w-28"
      />
      <input
        type="text"
        value={receipt}
        onChange={(e) => setReceipt(e.target.value)}
        placeholder="Receipt URL"
        className="border rounded p-1.5 text-sm flex-1"
      />
      <button
        onClick={() => onSubmit(cost ? parseFloat(cost) : undefined, receipt || undefined)}
        disabled={isPending}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium whitespace-nowrap"
      >
        {isPending ? "..." : "Mark Sourced"}
      </button>
    </div>
  );
}
