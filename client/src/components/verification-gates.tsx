import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Shield, Camera, FileText, Car, AlertTriangle, Lock } from "lucide-react";

interface VerificationGates {
  identity: {
    status: string;
    selfieUploaded: boolean;
    idUploaded: boolean;
  };
  backgroundCheck: {
    status: string;
    completedAt: string | null;
  };
  insurance: {
    generalLiability: {
      status: string;
      provider: string | null;
      expiration: string | null;
      isExpired: boolean;
    };
    vehicleInsurance: {
      status: string;
      provider: string | null;
      expiration: string | null;
      isExpired: boolean;
    };
  };
  nda: {
    signed: boolean;
    version: string | null;
    signedAt: string | null;
  };
  canAcceptJobs: boolean;
  pyckerTier: string;
  payoutPercentage: number;
}

interface VerificationGatesDisplayProps {
  haulerId: string;
  compact?: boolean;
}

export function VerificationGatesDisplay({ haulerId, compact }: VerificationGatesDisplayProps) {
  const { data: gates, isLoading } = useQuery<VerificationGates>({
    queryKey: ["/api/verification-gates", haulerId],
    queryFn: () => fetch(`/api/verification-gates/${haulerId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!haulerId,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading verification status...</p>;
  if (!gates) return null;

  const gateItems = [
    {
      label: "Identity Verification",
      icon: Camera,
      status: gates.identity.status,
      detail: gates.identity.selfieUploaded && gates.identity.idUploaded
        ? "Selfie + ID uploaded"
        : `Missing: ${!gates.identity.selfieUploaded ? "Selfie" : ""} ${!gates.identity.idUploaded ? "ID" : ""}`.trim(),
    },
    {
      label: "Background Check",
      icon: Shield,
      status: gates.backgroundCheck.status,
      detail: gates.backgroundCheck.completedAt
        ? `Completed ${new Date(gates.backgroundCheck.completedAt).toLocaleDateString()}`
        : "Pending review",
    },
    {
      label: "General Liability Insurance",
      icon: FileText,
      status: gates.insurance.generalLiability.isExpired ? "expired" : gates.insurance.generalLiability.status,
      detail: gates.insurance.generalLiability.provider
        ? `${gates.insurance.generalLiability.provider}${gates.insurance.generalLiability.expiration ? ` (exp: ${gates.insurance.generalLiability.expiration})` : ""}`
        : "Not uploaded (optional - higher commission without it)",
    },
    {
      label: "Vehicle Insurance",
      icon: Car,
      status: gates.insurance.vehicleInsurance.isExpired ? "expired" : gates.insurance.vehicleInsurance.status,
      detail: gates.insurance.vehicleInsurance.provider
        ? `${gates.insurance.vehicleInsurance.provider}${gates.insurance.vehicleInsurance.expiration ? ` (exp: ${gates.insurance.vehicleInsurance.expiration})` : ""}`
        : "Not uploaded (optional)",
    },
    {
      label: "Non-Solicitation Agreement",
      icon: Lock,
      status: gates.nda.signed ? "verified" : "pending",
      detail: gates.nda.signed
        ? `Signed v${gates.nda.version} on ${new Date(gates.nda.signedAt!).toLocaleDateString()}`
        : "Must be signed before accepting jobs",
    },
  ];

  const statusConfig: Record<string, { badge: string; icon: React.ReactNode }> = {
    verified: { badge: "bg-green-500/20 text-green-400 border-green-500/30", icon: <Check className="h-3 w-3" /> },
    clear: { badge: "bg-green-500/20 text-green-400 border-green-500/30", icon: <Check className="h-3 w-3" /> },
    uploaded: { badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Check className="h-3 w-3" /> },
    pending: { badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
    missing: { badge: "bg-muted text-muted-foreground", icon: <X className="h-3 w-3" /> },
    expired: { badge: "bg-red-500/20 text-red-400 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  };

  const completedGates = gateItems.filter(g => g.status === "verified" || g.status === "clear" || g.status === "uploaded").length;
  const totalGates = gateItems.length;

  return (
    <Card data-testid="verification-gates-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-400" />
            Verification Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={gates.pyckerTier === "verified_pro" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : ""}>
              {gates.pyckerTier === "verified_pro" ? "Verified Pro" : "Independent"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {(gates.payoutPercentage * 100).toFixed(0)}% payout
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${(completedGates / totalGates) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{completedGates}/{totalGates}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {gateItems.map((gate) => {
          const config = statusConfig[gate.status] || statusConfig.pending;
          const Icon = gate.icon;
          return (
            <div
              key={gate.label}
              className={`flex items-center gap-3 p-2 rounded-md ${compact ? "" : "border border-border/50"}`}
              data-testid={`gate-${gate.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{gate.label}</p>
                {!compact && <p className="text-xs text-muted-foreground truncate">{gate.detail}</p>}
              </div>
              <Badge className={`${config.badge} shrink-0`} data-testid={`badge-${gate.label.toLowerCase().replace(/\s+/g, "-")}`}>
                {config.icon}
                <span className="ml-1 text-xs capitalize">{gate.status}</span>
              </Badge>
            </div>
          );
        })}

        <div className={`mt-3 p-3 rounded-md ${gates.canAcceptJobs ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
          <div className="flex items-center gap-2">
            {gates.canAcceptJobs ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <span className={`text-sm font-medium ${gates.canAcceptJobs ? "text-green-400" : "text-red-400"}`} data-testid="text-job-acceptance-status">
              {gates.canAcceptJobs ? "Cleared to accept jobs" : "Complete required verifications to accept jobs"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
