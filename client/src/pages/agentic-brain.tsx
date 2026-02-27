import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Eye,
  Shield,
  AlertTriangle,
  Truck,
  Recycle,
  Users,
  Leaf,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  MessageSquareWarning,
  ScanEye,
  Route,
  ArrowLeft,
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface DashboardData {
  summary: {
    totalTriageReports: number;
    totalSentimentFlags: number;
    criticalAlerts: number;
    unresolvedFlags: number;
    totalConflictShields: number;
    damageDetected: number;
  };
  recentTriage: TriageReport[];
  recentSentiment: SentimentFlag[];
  recentConflictShields: ConflictShieldReport[];
}

interface TriageReport {
  id: string;
  serviceRequestId?: string;
  overallClassification: string;
  confidence: number;
  inventory: TriageItem[];
  totalEstimatedWeightLbs: number;
  totalItemCount: number;
  hazardousItemCount: number;
  donationItemCount: number;
  recyclableItemCount: number;
  guaranteedPrice: number;
  recommendedCrewSize: number;
  recommendedVehicleType: string;
  specialEquipmentNeeded: string[];
  safetyWarnings: string[];
  createdAt: string;
}

interface TriageItem {
  name: string;
  classification: string;
  estimatedWeightLbs: number;
  quantity: number;
  hazardNotes?: string;
}

interface SentimentFlag {
  id: string;
  sourceType: string;
  rawText: string;
  sentimentScore: number;
  riskLevel: string;
  keyPhrases: string[];
  issues: string[];
  recommendedAction: string;
  urgencyReason?: string;
  status: string;
  createdAt: string;
}

interface ConflictShieldReport {
  id: string;
  serviceRequestId: string;
  preExistingDamage: Array<{ location: string; type: string; severity: string; description: string }>;
  preExistingDamageCount: number;
  newDamageDetected: boolean;
  newDamage: Array<{ location: string; type: string; severity: string; description: string }>;
  confidence: number;
  summary: string;
  recommendation: string;
  createdAt: string;
}

function classificationColor(classification: string) {
  switch (classification) {
    case "junk": return "bg-muted text-muted-foreground";
    case "donation": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "hazardous": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "recyclable": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "e_waste": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "mixed": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default: return "bg-muted text-muted-foreground";
  }
}

function riskBadge(riskLevel: string) {
  switch (riskLevel) {
    case "critical": return <Badge variant="destructive" data-testid="badge-risk-critical">Critical</Badge>;
    case "high": return <Badge variant="destructive" data-testid="badge-risk-high">High</Badge>;
    case "medium": return <Badge variant="secondary" data-testid="badge-risk-medium">Medium</Badge>;
    default: return <Badge variant="outline" data-testid="badge-risk-low">Low</Badge>;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "urgent": return <Badge variant="destructive">Urgent</Badge>;
    case "action_needed": return <Badge variant="secondary">Action Needed</Badge>;
    case "resolved": return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
    default: return <Badge variant="secondary">New</Badge>;
  }
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value)) return value as T;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return fallback;
}

export default function AgenticBrain() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: authStatus, isLoading: authLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !authStatus?.isAdmin) {
      setLocation("/admin-login");
    }
  }, [authLoading, authStatus, setLocation]);

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/agentic/dashboard"],
    enabled: authStatus?.isAdmin === true,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/agentic/sentiment-flags/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agentic/dashboard"] });
      toast({ title: "Flag updated", description: "Sentiment flag status updated." });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="agentic-brain-loading">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const summary = dashboard?.summary || {
    totalTriageReports: 0,
    totalSentimentFlags: 0,
    criticalAlerts: 0,
    unresolvedFlags: 0,
    totalConflictShields: 0,
    damageDetected: 0,
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-agentic-brain">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back-admin">
              <ArrowLeft />
            </Button>
          </Link>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F47C20] to-[#0f172a] flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-agentic-brain-title">Agentic Brain</h1>
            <p className="text-sm text-muted-foreground">AI-powered operations intelligence</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-stat-triage">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">AI Triage Reports</p>
                <p className="text-2xl font-bold" data-testid="text-triage-count">{summary.totalTriageReports}</p>
              </div>
              <ScanEye className="w-8 h-8 text-[#F47C20]" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-sentiment">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Sentiment Flags</p>
                <p className="text-2xl font-bold" data-testid="text-sentiment-count">{summary.totalSentimentFlags}</p>
              </div>
              <MessageSquareWarning className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-critical">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-critical-count">{summary.criticalAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-shield">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Conflict Shields</p>
                <p className="text-2xl font-bold" data-testid="text-shield-count">{summary.totalConflictShields}</p>
              </div>
              <Shield className="w-8 h-8 text-[#0f172a]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-agentic-brain">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Eye className="w-4 h-4 mr-1" /> Overview
          </TabsTrigger>
          <TabsTrigger value="triage" data-testid="tab-triage">
            <ScanEye className="w-4 h-4 mr-1" /> Instant Triage
          </TabsTrigger>
          <TabsTrigger value="sentiment" data-testid="tab-sentiment">
            <MessageSquareWarning className="w-4 h-4 mr-1" /> Revenue Protector
          </TabsTrigger>
          <TabsTrigger value="shield" data-testid="tab-shield">
            <Shield className="w-4 h-4 mr-1" /> Conflict Shield
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card data-testid="card-agent-triage">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <ScanEye className="w-5 h-5 text-[#F47C20]" />
                <CardTitle className="text-base">Instant Triage AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Identifies items as Junk, Donation, Hazardous, or Recyclable from photos. Generates a Visual Bill of Lading with guaranteed pricing.
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="outline">{summary.totalTriageReports} reports</Badge>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("triage")} data-testid="button-view-triage">
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-agent-sentiment">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <MessageSquareWarning className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-base">Revenue Protector</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Scans reviews and messages to catch unhappy customers before they post a bad review. AI recommends recovery actions.
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant={summary.criticalAlerts > 0 ? "destructive" : "outline"}>
                    {summary.criticalAlerts} critical
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("sentiment")} data-testid="button-view-sentiment">
                    View Flags
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-agent-shield">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Shield className="w-5 h-5 text-[#0f172a]" />
                <CardTitle className="text-base">Conflict Shield</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Scans "Before" photos for existing damage. If a customer claims worker-caused damage, AI flags it was pre-existing.
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant={summary.damageDetected > 0 ? "destructive" : "outline"}>
                    {summary.damageDetected} damage found
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("shield")} data-testid="button-view-shield">
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-smart-dispatch">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Route className="w-5 h-5 text-green-600" />
              <CardTitle className="text-base">Smart Dispatch Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically matches the right crew size and vehicle to each job based on AI triage results. Prioritizes fuel-efficient crews and EV/newer trucks for the "Green Match" badge. Calculates optimal routing to minimize deadhead miles.
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Crew sizing</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Vehicle matching</span>
                </div>
                <div className="flex items-center gap-1">
                  <Leaf className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Green priority</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triage" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">AI Triage Reports</h2>
              <p className="text-sm text-muted-foreground">Visual Bill of Lading with item classification</p>
            </div>

            {(!dashboard?.recentTriage || dashboard.recentTriage.length === 0) ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ScanEye className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground" data-testid="text-no-triage">No triage reports yet. Upload photos to a service request to trigger AI triage.</p>
                </CardContent>
              </Card>
            ) : (
              dashboard.recentTriage.map((report) => (
                <Card key={report.id} data-testid={`card-triage-${report.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={classificationColor(report.overallClassification)}>
                          {report.overallClassification}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {report.totalItemCount} items - {Math.round(report.totalEstimatedWeightLbs)} lbs
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-[#F47C20]">${report.guaranteedPrice}</span>
                        <span className="text-xs text-muted-foreground">guaranteed</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      {report.hazardousItemCount > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">{report.hazardousItemCount} hazardous</span>
                        </div>
                      )}
                      {report.donationItemCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Recycle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{report.donationItemCount} donatable</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{report.recommendedCrewSize} crew</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{report.recommendedVehicleType?.replace(/_/g, " ")}</span>
                      </div>
                    </div>

                    {(() => {
                      const inventory = parseJsonField<TriageItem[]>(report.inventory, []);
                      return inventory.length > 0 ? (
                      <div className="border rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">VISUAL BILL OF LADING</p>
                        <div className="space-y-1">
                          {inventory.slice(0, 8).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 text-sm flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-xs ${classificationColor(item.classification)}`}>
                                  {item.classification}
                                </Badge>
                                <span>{item.name}</span>
                                {item.quantity > 1 && <span className="text-muted-foreground">x{item.quantity}</span>}
                              </div>
                              <span className="text-muted-foreground">{item.estimatedWeightLbs} lbs</span>
                            </div>
                          ))}
                          {inventory.length > 8 && (
                            <p className="text-xs text-muted-foreground">+{inventory.length - 8} more items</p>
                          )}
                        </div>
                      </div>
                    ) : null;
                    })()}

                    {(() => {
                      const warnings = parseJsonField<string[]>(report.safetyWarnings, []);
                      return warnings.length > 0 ? (
                      <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 rounded-md">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Safety Warnings
                        </p>
                        {warnings.map((w, i) => (
                          <p key={i} className="text-xs text-red-600 dark:text-red-400 mt-1">{w}</p>
                        ))}
                      </div>
                    ) : null;
                    })()}

                    <p className="text-xs text-muted-foreground mt-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {report.createdAt ? new Date(report.createdAt).toLocaleString() : "-"} - Confidence: {Math.round(report.confidence * 100)}%
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">Revenue Protector - Sentiment Flags</h2>
              <p className="text-sm text-muted-foreground">Catch unhappy customers before bad reviews</p>
            </div>

            {(!dashboard?.recentSentiment || dashboard.recentSentiment.length === 0) ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquareWarning className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground" data-testid="text-no-sentiment">No sentiment flags yet. Customer reviews and messages will be automatically scanned.</p>
                </CardContent>
              </Card>
            ) : (
              dashboard.recentSentiment.map((flag) => (
                <Card key={flag.id} data-testid={`card-sentiment-${flag.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {riskBadge(flag.riskLevel)}
                        {statusBadge(flag.status)}
                        <Badge variant="outline">{flag.sourceType}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Score: {flag.sentimentScore.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-sm bg-muted p-2 rounded-md mb-2 italic">"{flag.rawText.slice(0, 200)}{flag.rawText.length > 200 ? "..." : ""}"</p>

                    {flag.issues && flag.issues.length > 0 && (
                      <div className="flex items-center gap-1 mb-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">Issues:</span>
                        {flag.issues.map((issue, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{issue}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded-md mb-2">
                      <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        Recommended: {flag.recommendedAction}
                      </p>
                      {flag.urgencyReason && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{flag.urgencyReason}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {flag.createdAt ? new Date(flag.createdAt).toLocaleString() : "-"}
                      </p>
                      {flag.status !== "resolved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveMutation.mutate({ id: flag.id, status: "resolved" })}
                          disabled={resolveMutation.isPending}
                          data-testid={`button-resolve-${flag.id}`}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="shield" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">Conflict Shield Reports</h2>
              <p className="text-sm text-muted-foreground">Pre-existing damage documentation</p>
            </div>

            {(!dashboard?.recentConflictShields || dashboard.recentConflictShields.length === 0) ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground" data-testid="text-no-shield">No conflict shield reports yet. "Before" photos from jobs will be automatically scanned.</p>
                </CardContent>
              </Card>
            ) : (
              dashboard.recentConflictShields.map((report) => (
                <Card key={report.id} data-testid={`card-shield-${report.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={report.newDamageDetected ? "destructive" : "outline"}>
                          {report.newDamageDetected ? "New Damage Detected" : "No New Damage"}
                        </Badge>
                        <Badge variant="outline">
                          {report.preExistingDamageCount} pre-existing
                        </Badge>
                      </div>
                      <Badge variant={
                        report.recommendation === "clear" ? "outline" :
                        report.recommendation === "new_damage_found" ? "destructive" : "secondary"
                      }>
                        {report.recommendation?.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <p className="text-sm mb-2">{report.summary}</p>

                    {(() => {
                      const preExisting = parseJsonField<Array<{ location: string; type: string; severity: string; description: string }>>(report.preExistingDamage, []);
                      return preExisting.length > 0 ? (
                      <div className="border rounded-md p-3 mb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">PRE-EXISTING DAMAGE LOG</p>
                        <div className="space-y-1">
                          {preExisting.map((d, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm flex-wrap">
                              <Badge variant="outline" className="text-xs">{d.severity}</Badge>
                              <span className="text-muted-foreground">{d.location}:</span>
                              <span>{d.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                    })()}

                    {(() => {
                      const newDmg = parseJsonField<Array<{ location: string; type: string; severity: string; description: string }>>(report.newDamage, []);
                      return newDmg.length > 0 ? (
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-md mb-2">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">NEW DAMAGE DETECTED</p>
                        <div className="space-y-1">
                          {newDmg.map((d, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm flex-wrap">
                              <Badge variant="destructive" className="text-xs">{d.severity}</Badge>
                              <span>{d.location}: {d.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                    })()}

                    <p className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {report.createdAt ? new Date(report.createdAt).toLocaleString() : "-"} - Confidence: {Math.round(report.confidence * 100)}%
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
