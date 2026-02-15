import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, MapPin, Calendar, Shield, DollarSign, Send } from "lucide-react";

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
};

export default function WorkOrders() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quoteWorkOrderId, setQuoteWorkOrderId] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState({ quoteAmount: "", estimatedDays: "", message: "" });

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["/api/government/work-orders/available"],
  });

  const submitQuoteMutation = useMutation({
    mutationFn: (data: { workOrderId: string; quoteAmount: number; estimatedDays: number; message: string }) =>
      apiRequest("POST", `/api/government/work-orders/${data.workOrderId}/quotes`, {
        quoteAmount: data.quoteAmount,
        estimatedDays: data.estimatedDays || undefined,
        message: data.message || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/government/work-orders/available"] });
      toast({ title: "Quote submitted", description: "Your flat-rate quote has been submitted for review." });
      setQuoteWorkOrderId(null);
      setQuoteForm({ quoteAmount: "", estimatedDays: "", message: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to submit quote", variant: "destructive" });
    },
  });

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteWorkOrderId) return;
    submitQuoteMutation.mutate({
      workOrderId: quoteWorkOrderId,
      quoteAmount: Math.round(parseFloat(quoteForm.quoteAmount || "0") * 100),
      estimatedDays: parseInt(quoteForm.estimatedDays || "0"),
      message: quoteForm.message,
    });
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading available work orders...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-amber-600" /> Government Work Orders
          </h1>
          <p className="text-gray-500 mt-1">Browse available work orders and submit your flat-rate quote for jobs you're qualified for.</p>
        </div>

        {(workOrders as any[]).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No work orders available right now. Check back soon!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(workOrders as any[]).map((wo: any) => (
              <Card key={wo.id} className="hover:border-amber-300 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{wo.title}</h3>
                        <Badge className={STATUS_COLORS[wo.status] || "bg-gray-100 text-gray-800"}>{wo.status}</Badge>
                      </div>

                      {wo.description && <p className="text-gray-600 mb-3">{wo.description}</p>}

                      {wo.scopeOfWork && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Scope of Work:</p>
                          <p className="text-sm text-gray-600">{wo.scopeOfWork}</p>
                        </div>
                      )}

                      {wo.deliverables && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Deliverables:</p>
                          <p className="text-sm text-gray-600">{wo.deliverables}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                        {wo.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {wo.location}</span>
                        )}
                        {wo.deadline && (
                          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Due: {wo.deadline}</span>
                        )}
                        {wo.serviceType && (
                          <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {wo.serviceType}</span>
                        )}
                      </div>

                      {wo.requiredCertifications && (wo.requiredCertifications as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(wo.requiredCertifications as string[]).map((cert: string) => (
                            <Badge key={cert} variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" /> {cert}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Dialog open={quoteWorkOrderId === wo.id} onOpenChange={open => { if (!open) setQuoteWorkOrderId(null); }}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() => setQuoteWorkOrderId(wo.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" /> Submit Quote
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submit Quote for: {wo.title}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmitQuote} className="space-y-4">
                            <div>
                              <Label>Your Price for This Job ($) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={quoteForm.quoteAmount}
                                onChange={e => setQuoteForm({ ...quoteForm, quoteAmount: e.target.value })}
                                placeholder="Flat rate for the complete job"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">Enter your total flat-rate price to complete all deliverables.</p>
                            </div>

                            <div>
                              <Label>Estimated Timeline (days)</Label>
                              <Input
                                type="number"
                                value={quoteForm.estimatedDays}
                                onChange={e => setQuoteForm({ ...quoteForm, estimatedDays: e.target.value })}
                                placeholder="How many days to complete"
                              />
                              <p className="text-xs text-gray-500 mt-1">For scheduling purposes only — you're paid your quoted price regardless.</p>
                            </div>

                            <div>
                              <Label>Message (optional)</Label>
                              <Textarea
                                value={quoteForm.message}
                                onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })}
                                placeholder="Explain your approach, qualifications, etc."
                                rows={3}
                              />
                            </div>

                            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={submitQuoteMutation.isPending}>
                              <Send className="h-4 w-4 mr-2" />
                              {submitQuoteMutation.isPending ? "Submitting..." : "Submit Flat-Rate Quote"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
