import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ClipboardList, CheckCircle2 } from "lucide-react";

export default function WorkLogEntry() {
  const { id: contractId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: [`/api/government/contracts/${contractId}`],
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: [`/api/government/contracts/${contractId}/work-orders`],
  });

  const { data: workLogs = [] } = useQuery({
    queryKey: [`/api/government/contracts/${contractId}/work-logs`],
  });

  const contract = (dashboard as any)?.contract;

  const [form, setForm] = useState({
    workOrderId: "",
    workDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/contracts/${contractId}/work-logs`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/work-logs`] });
      toast({ title: "Work log saved" });
      setForm({ ...form, description: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to save work log", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      workOrderId: form.workOrderId || undefined,
      workDate: form.workDate,
      description: form.description,
    });
  };

  // Filter to assigned/in_progress work orders
  const activeWorkOrders = (workOrders as any[]).filter(
    (wo: any) => wo.status === "assigned" || wo.status === "in_progress" || wo.status === "completed"
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/government/contracts/${contractId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Contract
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-amber-600" /> Work Log
          </h1>
        </div>

        {contract && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <strong>{contract.contractNumber}</strong> — {contract.agencyName}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log Work Performed</CardTitle>
            <p className="text-sm text-gray-500">Document what work was performed today. This is for project records and compliance documentation.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Work Order</Label>
                <Select value={form.workOrderId} onValueChange={v => setForm({ ...form, workOrderId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select work order (optional)" /></SelectTrigger>
                  <SelectContent>
                    {activeWorkOrders.map((wo: any) => (
                      <SelectItem key={wo.id} value={wo.id}>{wo.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.workDate} onChange={e => setForm({ ...form, workDate: e.target.value })} required />
              </div>

              <div>
                <Label>Description of Work Performed *</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the work completed today..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Work Log"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Work Logs */}
        {(workLogs as any[]).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Work Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(workLogs as any[]).map((log: any) => (
                  <div key={log.id} className="p-3 border rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.workDate}</span>
                      <Badge className={log.status === "approved" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-gray-700">{log.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
