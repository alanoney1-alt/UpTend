import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, ShieldCheck, ShieldAlert, Check, Loader2 } from "lucide-react";

interface SafetyAlert {
  id: string;
  alertType: string;
  severity: "info" | "warning" | "danger";
  description: string;
  safetyInstructions: string;
  disposalGuideUrl?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

interface SafetyCopilotProps {
  serviceRequestId: string;
  haulerId: string;
  photoUrls: string[];
  serviceType: string;
  onAnalysisComplete?: (alerts: SafetyAlert[]) => void;
}

export function SafetyCopilot({ serviceRequestId, haulerId, photoUrls, serviceType, onAnalysisComplete }: SafetyCopilotProps) {
  const [analyzed, setAnalyzed] = useState(false);

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery<SafetyAlert[]>({
    queryKey: ["/api/jobs", serviceRequestId, "safety-alerts"],
    queryFn: () => fetch(`/api/jobs/${serviceRequestId}/safety-alerts`, { credentials: "include" }).then(r => r.json()),
    enabled: !!serviceRequestId,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/safety-check", {
      photoUrls,
      serviceType,
      serviceRequestId,
      haulerId,
    }),
    onSuccess: () => {
      setAnalyzed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", serviceRequestId, "safety-alerts"] });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest("POST", `/api/safety-alerts/${alertId}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", serviceRequestId, "safety-alerts"] });
    },
  });

  const severityConfig = {
    info: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Shield },
    warning: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
    danger: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldAlert },
  };

  const alertTypeLabels: Record<string, string> = {
    hazmat: "Hazardous Material",
    sharp_objects: "Sharp Objects",
    heavy_item: "Heavy Item",
    biohazard: "Biohazard",
    electrical: "Electrical Hazard",
    structural: "Structural Risk",
  };

  const displayAlerts = alerts.length > 0 ? alerts : [];
  const hasUnacknowledged = displayAlerts.some(a => !a.acknowledged);

  return (
    <Card className="border-orange-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            AI Safety Co-Pilot
          </CardTitle>
          {!analyzed && displayAlerts.length === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending || photoUrls.length === 0}
              data-testid="button-run-safety-check"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Scanning...</>
              ) : (
                "Run Safety Scan"
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingAlerts && <p className="text-sm text-muted-foreground">Loading alerts...</p>}

        {!loadingAlerts && displayAlerts.length === 0 && !analyzed && (
          <p className="text-sm text-muted-foreground" data-testid="text-safety-no-scan">
            Take or upload on-site photos, then run a safety scan before starting work.
          </p>
        )}

        {!loadingAlerts && displayAlerts.length === 0 && analyzed && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/30" data-testid="text-safety-all-clear">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            <span className="text-sm text-green-400 font-medium">All clear - no hazards detected. Safe to proceed.</span>
          </div>
        )}

        {displayAlerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const IconComponent = config.icon;
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-md border ${config.color} ${alert.acknowledged ? "opacity-60" : ""}`}
              data-testid={`safety-alert-${alert.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <IconComponent className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {alertTypeLabels[alert.alertType] || alert.alertType}
                      </Badge>
                      <Badge variant="outline" className="text-xs uppercase">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium" data-testid={`text-alert-desc-${alert.id}`}>{alert.description}</p>
                    <p className="text-xs opacity-80">{alert.safetyInstructions}</p>
                    {alert.disposalGuideUrl && (
                      <a href={alert.disposalGuideUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 underline">
                        View Disposal Guide
                      </a>
                    )}
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => acknowledgeMutation.mutate(alert.id)}
                    disabled={acknowledgeMutation.isPending}
                    data-testid={`button-ack-alert-${alert.id}`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {hasUnacknowledged && (
          <p className="text-xs text-yellow-400">
            Please acknowledge all safety alerts before starting work.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
