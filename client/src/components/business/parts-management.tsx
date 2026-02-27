import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PartsRequest {
  id: string;
  service_request_id: string;
  status: string;
  description: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  supplier_source: string | null;
  pickup_address?: string;
  service_type?: string;
  created_at: string;
}

interface Supplier {
  id: string;
  supplier_name: string;
  supplier_type: string;
  account_number: string | null;
  contact_info: string | null;
  notes: string | null;
  created_at: string;
}

export function PartsManagement() {
  const [activeTab, setActiveTab] = useState<"requests" | "suppliers">("requests");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b">
        {(["requests", "suppliers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "requests" ? "Parts Requests" : "Preferred Suppliers"}
          </button>
        ))}
      </div>

      {activeTab === "requests" ? <PartsRequestsTable /> : <SuppliersSection />}
    </div>
  );
}

function PartsRequestsTable() {
  const { data, isLoading } = useQuery<{ partsRequests: PartsRequest[] }>({
    queryKey: ["business-parts-requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/business/parts-requests");
      return res.json();
    },
  });

  const requests = data?.partsRequests || [];

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  if (!requests.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No parts requests yet</p>
        <p className="text-sm mt-1">Parts requests from active jobs will appear here.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
    sourced: "bg-blue-100 text-blue-800",
    installed: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium">Job / Address</th>
            <th className="pb-2 font-medium">Est. Cost</th>
            <th className="pb-2 font-medium">Actual Cost</th>
            <th className="pb-2 font-medium">Source</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((pr) => (
            <tr key={pr.id} className="border-b hover:bg-gray-50">
              <td className="py-3 max-w-[200px] truncate">{pr.description}</td>
              <td className="py-3 text-gray-600 text-xs">{pr.pickup_address || pr.service_request_id.slice(0, 8)}</td>
              <td className="py-3">{pr.estimated_cost ? `$${pr.estimated_cost.toFixed(2)}` : "-"}</td>
              <td className="py-3">{pr.actual_cost ? `$${pr.actual_cost.toFixed(2)}` : "-"}</td>
              <td className="py-3 text-xs">{pr.supplier_source || "-"}</td>
              <td className="py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[pr.status] || "bg-gray-100"}`}>
                  {pr.status}
                </span>
              </td>
              <td className="py-3 text-xs text-gray-500">{new Date(pr.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuppliersSection() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("general");
  const [account, setAccount] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ suppliers: Supplier[] }>({
    queryKey: ["preferred-suppliers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/business/preferred-suppliers");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/business/preferred-suppliers", {
        supplierName: name,
        supplierType: type,
        accountNumber: account || undefined,
        contactInfo: contact || undefined,
        notes: notes || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferred-suppliers"] });
      setShowForm(false);
      setName("");
      setType("general");
      setAccount("");
      setContact("");
      setNotes("");
    },
  });

  const suppliers = data?.suppliers || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
          >
            Add Supplier
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Supplier name"
              className="border rounded-lg p-2 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border rounded-lg p-2 text-sm"
            >
              <option value="general">General</option>
              <option value="hardware">Hardware</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
            </select>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="Account number (optional)"
              className="border rounded-lg p-2 text-sm"
            />
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Contact info (optional)"
              className="border rounded-lg p-2 text-sm"
            />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full border rounded-lg p-2 text-sm resize-none h-16"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600">
              Cancel
            </button>
            <button
              onClick={() => addMutation.mutate()}
              disabled={!name || addMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {addMutation.isPending ? "Adding..." : "Add Supplier"}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {!isLoading && !suppliers.length && (
        <div className="text-center py-8 text-gray-400">
          <p>No preferred suppliers configured yet.</p>
        </div>
      )}

      {suppliers.map((s) => (
        <div key={s.id} className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{s.supplier_name}</p>
            <p className="text-xs text-gray-500">
              {s.supplier_type} {s.account_number ? `• Acct: ${s.account_number}` : ""}
            </p>
            {s.contact_info && <p className="text-xs text-gray-500">{s.contact_info}</p>}
            {s.notes && <p className="text-xs text-gray-400 mt-1">{s.notes}</p>}
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full capitalize">
            {s.supplier_type}
          </span>
        </div>
      ))}
    </div>
  );
}
