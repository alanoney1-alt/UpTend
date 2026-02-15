import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PartsRequest {
  id: string;
  status: string;
  description: string;
  photo_url: string | null;
  estimated_cost: number | null;
  supplier_source: string | null;
  created_at: string;
}

export function PartsApproval({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ partsRequests: PartsRequest[] }>({
    queryKey: ["parts-requests", jobId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/jobs/${jobId}/parts-requests`);
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, supplierSource }: { id: string; supplierSource: string }) => {
      const res = await apiRequest("PUT", `/api/parts-requests/${id}/approve`, { supplierSource });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parts-requests", jobId] }),
  });

  const denyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PUT", `/api/parts-requests/${id}/deny`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["parts-requests", jobId] }),
  });

  const pendingRequests = (data?.partsRequests || []).filter((pr) => pr.status === "pending");
  const otherRequests = (data?.partsRequests || []).filter((pr) => pr.status !== "pending");

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!data?.partsRequests?.length) return null;

  return (
    <div className="space-y-4">
      {pendingRequests.map((pr) => (
        <PendingCard
          key={pr.id}
          request={pr}
          onApprove={(source) => approveMutation.mutate({ id: pr.id, supplierSource: source })}
          onDeny={() => denyMutation.mutate(pr.id)}
          isPending={approveMutation.isPending || denyMutation.isPending}
        />
      ))}

      {otherRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Previous Requests</h4>
          {otherRequests.map((pr) => (
            <div key={pr.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">{pr.description}</p>
                {pr.estimated_cost && <p className="text-xs text-gray-500">${pr.estimated_cost.toFixed(2)}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                pr.status === "approved" ? "bg-green-100 text-green-800" :
                pr.status === "denied" ? "bg-red-100 text-red-800" :
                pr.status === "sourced" ? "bg-blue-100 text-blue-800" :
                pr.status === "installed" ? "bg-gray-100 text-gray-600" :
                "bg-gray-100 text-gray-600"
              }`}>
                {pr.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingCard({
  request,
  onApprove,
  onDeny,
  isPending,
}: {
  request: PartsRequest;
  onApprove: (source: string) => void;
  onDeny: () => void;
  isPending: boolean;
}) {
  const [supplyMethod, setSupplyMethod] = useState("pro");

  return (
    <div className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">Parts/Materials Requested</h4>
          <p className="text-sm text-gray-700 mt-1">{request.description}</p>
          {request.estimated_cost && (
            <p className="text-sm font-medium text-amber-700 mt-1">
              Estimated Cost: ${request.estimated_cost.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {request.photo_url && (
        <img src={request.photo_url} alt="Evidence" className="w-full max-w-xs rounded-lg" />
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Supply Method:</p>
        <div className="space-y-1.5">
          {[
            { value: "pm", label: "I'll provide it" },
            { value: "pro", label: "Pro sources it (reimbursement)" },
            { value: "uptend_partner", label: "Use preferred supplier" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={`supply-${request.id}`}
                value={opt.value}
                checked={supplyMethod === opt.value}
                onChange={() => setSupplyMethod(opt.value)}
                className="text-amber-500 focus:ring-amber-400"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onApprove(supplyMethod)}
          disabled={isPending}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          Approve
        </button>
        <button
          onClick={onDeny}
          disabled={isPending}
          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
