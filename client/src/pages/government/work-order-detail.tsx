import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Briefcase, MapPin, Calendar, Shield, DollarSign,
  Send, CheckCircle2, Play, ClipboardList
} from "lucide-react";

function cents(amount: number | null | undefined) {
  return `$${((amount || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  posted: "bg-blue-100 text-blue-800",
  quoted: "bg-amber-100 text-amber-800",
  assigned: "bg-green-100 text-green-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-teal-100 text-teal-800",
  verified: "bg-green-100 text-green-800",
  submitted: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quoteForm, setQuoteForm] = useState({ quoteAmount: "", estimatedDays: "", message: "" });
  const [logForm, setLogForm] = useState({ workDate: new Date().toISOString().split("T")[0], description: "" });

  const { data, isLoading } = useQuery({
    queryKey: [`/api/government/work-orders/${id}`],
  });

  const detail = data as any;
  const wo = detail?.workOrder;
  const quotes = (detail?.quotes || []) as any[];
  const workLogs = (detail?.workLogs || []) as any[];

  const submitQuoteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/work-orders/${id}/quotes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/government/work-orders/${id}`] });
      toast({ title: "Quote submitted" });
      setQuoteForm({ quoteAmount: "", estimatedDays: "", message: "" });
    },
    onError: (error: any) => toast({ title: "Error", description: error?.message, variant: "destructive" }),
  });

  const startMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/government/work-orders/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/government/work-orders/${id}`] });
      toast({ title: "Work order started" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/government/work-orders/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/government/work-orders/${id}`] });
      toast({ title: "Work order marked complete. pending verification" });
    },
  });

  if (isLoading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (!wo) return <div className="p-6 text-red-500">Work order not found</div>;

  const isAssigned = wo.status === "assigned" || wo.status === "in_progress" || wo.status === "completed";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/government/work-orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{wo.title}</h1>
            <Badge className={STATUS_COLORS[wo.status] || "bg-gray-100"}>{wo.status}</Badge>
          </div>
          {wo.acceptedQuoteAmount > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Job Price</p>
              <p className="text-xl font-bold text-amber-700">{cents(wo.acceptedQuoteAmount)}</p>
            </div>
          )}
        </div>

        {/* Work Order Details */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {wo.description && <div><p className="text-sm font-medium text-gray-700">Description</p><p className="text-gray-600">{wo.description}</p></div>}
            {wo.scopeOfWork && <div><p className="text-sm font-medium text-gray-700">Scope of Work</p><p className="text-gray-600">{wo.scopeOfWork}</p></div>}
            {wo.deliverables && <div><p className="text-sm font-medium text-gray-700">Deliverables (what defines "done")</p><p className="text-gray-600">{wo.deliverables}</p></div>}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {wo.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {wo.location}</span>}
              {wo.deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Due: {wo.deadline}</span>}
              {wo.serviceType && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {wo.serviceType}</span>}
            </div>

            {wo.requiredCertifications && (wo.requiredCertifications as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-sm font-medium text-gray-700 mr-2">Required:</span>
                {(wo.requiredCertifications as string[]).map((cert: string) => (
                  <Badge key={cert} variant="outline"><Shield className="h-3 w-3 mr-1" /> {cert}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions based on status */}
        {wo.status === "assigned" && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 mb-4">You've been assigned this job at <strong>{cents(wo.acceptedQuoteAmount)}</strong>. Ready to begin?</p>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => startMutation.mutate()}>
                <Play className="h-4 w-4 mr-2" /> Start Work
              </Button>
            </CardContent>
          </Card>
        )}

        {wo.status === "in_progress" && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 mb-4">When all deliverables are complete, mark this job as done.</p>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => completeMutation.mutate()}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
              </Button>
            </CardContent>
          </Card>
        )}

        {wo.status === "completed" && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <p className="font-medium text-teal-800">Work Complete. Pending Verification</p>
            <p className="text-sm text-teal-600">Payment of {cents(wo.acceptedQuoteAmount)} will be processed after admin verification.</p>
          </div>
        )}

        {wo.status === "verified" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-800">Verified & Complete</p>
            <p className="text-sm text-green-600">Payment of {cents(wo.acceptedQuoteAmount)} has been approved.</p>
          </div>
        )}

        {/* Quote Submission (if not yet assigned) */}
        {(wo.status === "posted" || wo.status === "quoted") && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-600" /> Submit Your Quote</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={e => { e.preventDefault(); submitQuoteMutation.mutate({
                quoteAmount: Math.round(parseFloat(quoteForm.quoteAmount || "0") * 100),
                estimatedDays: parseInt(quoteForm.estimatedDays || "0") || undefined,
                message: quoteForm.message || undefined,
              }); }} className="space-y-4">
                <div>
                  <Label>Your Price for This Job ($) *</Label>
                  <Input type="number" step="0.01" value={quoteForm.quoteAmount}
                    onChange={e => setQuoteForm({ ...quoteForm, quoteAmount: e.target.value })}
                    placeholder="Total flat-rate price" required />
                  <p className="text-xs text-gray-500 mt-1">Enter your total price to complete all deliverables. You'll be paid this exact amount on completion.</p>
                </div>
                <div>
                  <Label>Estimated Timeline (days)</Label>
                  <Input type="number" value={quoteForm.estimatedDays}
                    onChange={e => setQuoteForm({ ...quoteForm, estimatedDays: e.target.value })}
                    placeholder="Days to complete" />
                  <p className="text-xs text-gray-500 mt-1">For scheduling only. your payment is your quoted price, not time-based.</p>
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={quoteForm.message} onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })}
                    placeholder="Describe your approach..." rows={3} />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={submitQuoteMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" /> {submitQuoteMutation.isPending ? "Submitting..." : "Submit Flat-Rate Quote"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Your Quotes */}
        {quotes.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Your Quotes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quotes.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div>
                      <span className="font-medium">{cents(q.quoteAmount)}</span>
                      {q.estimatedDays && <span className="text-gray-500 ml-2">• {q.estimatedDays} days</span>}
                      <Badge className={`ml-2 ${STATUS_COLORS[q.status]}`}>{q.status}</Badge>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(q.submittedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Logs (if assigned) */}
        {isAssigned && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-amber-600" /> Work Log</CardTitle></CardHeader>
            <CardContent>
              {workLogs.length > 0 && (
                <div className="space-y-2 mb-4">
                  {workLogs.map((log: any) => (
                    <div key={log.id} className="p-3 border rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.workDate}</span>
                        <Badge className={log.status === "approved" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{log.status}</Badge>
                      </div>
                      <p className="text-gray-600 mt-1">{log.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">Work logs document progress for project records. They don't affect your payment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
