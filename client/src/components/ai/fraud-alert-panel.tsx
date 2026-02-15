/**
 * Fraud Alert Panel Component (Admin)
 *
 * Displays pending fraud alerts with severity badges,
 * detected patterns, and review actions for admins
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, XCircle, Eye, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

const severityConfig = {
  critical: { color: "bg-red-600", icon: "🚨" },
  high: { color: "bg-orange-500", icon: "⚠️" },
  medium: { color: "bg-yellow-500", icon: "⚡" },
  low: { color: "bg-blue-500", icon: "ℹ️" },
};

interface FraudAlert {
  id: string;
  alertType: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  detectedPatterns: string[];
  evidenceData: Record<string, any>;
  confidenceScore: number;
  serviceRequestId?: string;
  proId?: string;
  createdAt: string;
}

export function FraudAlertPanel() {
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"cleared" | "flagged" | "suspended">("cleared");
  const [resolution, setResolution] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["fraud-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/ai/admin/fraud/alerts");
      if (!res.ok) throw new Error("Failed to load fraud alerts");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAlert) return;
      const res = await fetch(`/api/ai/admin/fraud/alerts/${selectedAlert.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus,
          resolution,
        }),
      });
      if (!res.ok) throw new Error("Failed to review alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud-alerts"] });
      setSelectedAlert(null);
      setResolution("");
    },
    onError: (err: Error) => { console.error(err); },
  });

  const alerts: FraudAlert[] = data?.alerts || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Fraud Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading alerts...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Fraud Detection Alerts
              </CardTitle>
              <CardDescription>AI-powered fraud and quality monitoring</CardDescription>
            </div>
            {alerts.length > 0 && (
              <Badge variant="destructive" className="text-lg px-3">
                {alerts.length}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>No pending fraud alerts</p>
              <p className="text-xs mt-1">System is monitoring all activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity];
                return (
                  <Card key={alert.id} className="border-l-4" style={{ borderLeftColor: config.color }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{config.icon}</span>
                            <Badge className={config.color + " text-white"}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.alertType.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(alert.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm font-medium mb-2">{alert.description}</p>

                          {/* Detected Patterns */}
                          <div className="space-y-1 mb-3">
                            {alert.detectedPatterns.map((pattern, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span>{pattern}</span>
                              </div>
                            ))}
                          </div>

                          {/* Evidence */}
                          {alert.evidenceData && Object.keys(alert.evidenceData).length > 0 && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View Evidence Data
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(alert.evidenceData, null, 2)}
                              </pre>
                            </details>
                          )}

                          {/* Confidence */}
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">AI Confidence:</span>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(alert.confidenceScore * 100)}%
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Fraud Alert</DialogTitle>
            <DialogDescription>
              Review the alert and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* Alert Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={severityConfig[selectedAlert.severity].color + " text-white"}>
                    {selectedAlert.severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{selectedAlert.description}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Confidence: {Math.round(selectedAlert.confidenceScore * 100)}%
                </div>
              </div>

              {/* Review Decision */}
              <div className="space-y-2">
                <Label>Review Decision</Label>
                <RadioGroup value={reviewStatus} onValueChange={(v: any) => setReviewStatus(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cleared" id="cleared" />
                    <Label htmlFor="cleared" className="font-normal flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Clear - False alarm
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flagged" id="flagged" />
                    <Label htmlFor="flagged" className="font-normal flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Flag - Monitor closely
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="suspended" id="suspended" />
                    <Label htmlFor="suspended" className="font-normal flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Suspend - Take action
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Resolution Notes */}
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Notes</Label>
                <Textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Explain your decision..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => reviewMutation.mutate()}
              disabled={!resolution.trim() || reviewMutation.isPending}
            >
              {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
