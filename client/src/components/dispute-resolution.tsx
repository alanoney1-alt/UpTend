import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Camera, FileSearch, Loader2, ThumbsUp, ThumbsDown, Scale, MessageSquare } from "lucide-react";

interface Dispute {
  id: string;
  serviceRequestId: string;
  reason: string;
  description: string;
  status: string;
  aiAnalysisResult: string;
  aiConfidence: number;
  aiRecommendation: string;
  resolution: string;
  refundAmount: number;
  createdAt: string;
  resolvedAt: string;
}

interface DisputeFormProps {
  serviceRequestId: string;
  customerId: string;
  proId: string;
  photosBefore?: string[];
  photosAfter?: string[];
  onDisputeCreated?: (dispute: Dispute) => void;
}

export function DisputeForm({ serviceRequestId, customerId, proId, photosBefore, photosAfter, onDisputeCreated }: DisputeFormProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/disputes", {
      serviceRequestId,
      customerId,
      proId,
      reason,
      description,
      photosBefore: photosBefore || [],
      photosAfter: photosAfter || [],
      damagePhotos: [],
    }),
    onSuccess: async (response: any) => {
      const data = await response.json();
      onDisputeCreated?.(data.dispute);
    },
  });

  return (
    <Card className="border-red-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          Report an Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reason">What happened?</Label>
          <Input
            id="reason"
            placeholder="e.g., Damage to property, missing items, incomplete job"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            data-testid="input-dispute-reason"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Details</Label>
          <Textarea
            id="description"
            placeholder="Describe the issue in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            data-testid="input-dispute-description"
          />
        </div>

        {(photosBefore?.length || 0) > 0 && (photosAfter?.length || 0) > 0 && (
          <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-400">
                AI will automatically compare before & after photos to analyze your claim
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={() => createMutation.mutate()}
          disabled={!reason || createMutation.isPending}
          className="w-full"
          variant="destructive"
          data-testid="button-submit-dispute"
        >
          {createMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting & Analyzing...</>
          ) : (
            "Submit Dispute"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

interface DisputeDetailProps {
  disputeId: string;
  isAdmin?: boolean;
}

export function DisputeDetail({ disputeId, isAdmin }: DisputeDetailProps) {
  const [resolution, setResolution] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const { data: dispute, isLoading } = useQuery<Dispute>({
    queryKey: ["/api/disputes", disputeId],
    queryFn: () => fetch(`/api/disputes/${disputeId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!disputeId,
  });

  const resolveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/disputes/${disputeId}/resolve`, {
      resolution,
      refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes", disputeId] });
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading dispute...</p>;
  if (!dispute) return null;

  const aiResult = dispute.aiAnalysisResult ? JSON.parse(dispute.aiAnalysisResult) : null;

  const statusColors: Record<string, string> = {
    open: "bg-yellow-500/20 text-yellow-400",
    ai_reviewed: "bg-blue-500/20 text-blue-400",
    admin_review: "bg-orange-500/20 text-orange-400",
    closed: "bg-green-500/20 text-green-400",
  };

  const recommendationLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    customer_favor: { label: "Customer Likely Right", icon: <ThumbsUp className="h-4 w-4" />, color: "text-green-400" },
    pro_favor: { label: "Pro Likely Right", icon: <ThumbsDown className="h-4 w-4" />, color: "text-blue-400" },
    needs_review: { label: "Needs Manual Review", icon: <Scale className="h-4 w-4" />, color: "text-yellow-400" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-orange-400" />
            Dispute #{dispute.id.slice(0, 8)}
          </CardTitle>
          <Badge className={statusColors[dispute.status] || ""}>{dispute.status.replace(/_/g, " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium" data-testid="text-dispute-reason">{dispute.reason}</p>
          {dispute.description && <p className="text-sm text-muted-foreground mt-1">{dispute.description}</p>}
        </div>

        {aiResult && (
          <Card className="border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-400" />
                AI Analysis Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dispute.aiRecommendation && recommendationLabels[dispute.aiRecommendation] && (
                <div className={`flex items-center gap-2 ${recommendationLabels[dispute.aiRecommendation].color}`}>
                  {recommendationLabels[dispute.aiRecommendation].icon}
                  <span className="text-sm font-medium" data-testid="text-ai-recommendation">
                    {recommendationLabels[dispute.aiRecommendation].label}
                  </span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {((dispute.aiConfidence || 0) * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              )}

              {aiResult.damageDescription && (
                <p className="text-sm" data-testid="text-ai-damage-desc">{aiResult.damageDescription}</p>
              )}

              {aiResult.reasoning && (
                <p className="text-xs text-muted-foreground">{aiResult.reasoning}</p>
              )}

              {aiResult.newDamage?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-400">New Damage Found:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                    {aiResult.newDamage.map((d: string, i: number) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}

              {aiResult.preExistingDamage?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-yellow-400">Pre-existing Damage:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                    {aiResult.preExistingDamage.map((d: string, i: number) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {dispute.resolution && (
          <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Resolution</span>
            </div>
            <p className="text-sm">{dispute.resolution}</p>
            {dispute.refundAmount > 0 && (
              <p className="text-sm text-green-400 mt-1">Refund: ${dispute.refundAmount.toFixed(2)}</p>
            )}
          </div>
        )}

        {isAdmin && dispute.status !== "closed" && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Describe the resolution..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={2}
                data-testid="input-resolution"
              />
            </div>
            <div className="space-y-2">
              <Label>Refund Amount ($)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                data-testid="input-refund-amount"
              />
            </div>
            <Button
              onClick={() => resolveMutation.mutate()}
              disabled={!resolution || resolveMutation.isPending}
              className="w-full"
              data-testid="button-resolve-dispute"
            >
              {resolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Resolve Dispute
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
