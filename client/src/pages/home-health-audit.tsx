import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Home,
  Upload,
  Video,
  FileText,
  Calendar,
  DollarSign,
  ExternalLink,
  Download,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HomeHealthAuditResult {
  id?: string;
  uptendServices: Array<{
    service: string;
    description: string;
    estimatedPrice: number;
    priority: "urgent" | "recommended" | "optional";
    reasoning: string;
  }>;
  referralNeeds: Array<{
    category: string;
    issues: string[];
    priority: "urgent" | "recommended" | "optional";
    estimatedCost: number;
    reasoning: string;
  }>;
  propertyCondition: {
    overall: "excellent" | "good" | "fair" | "poor";
    urgentIssues: string[];
    maintenanceScore: number;
    safetyScore: number;
  };
  detailedFindings: Record<string, any>;
  confidence: number;
}

const SERVICE_LABELS: Record<string, string> = {
  material_recovery: "Junk Removal / Material Recovery",
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
};

const CATEGORY_LABELS: Record<string, string> = {
  landscaping: "Landscaping",
  roofing: "Roofing",
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  tree_service: "Tree Service",
  pest_control: "Pest Control",
  structural: "Structural",
};

const PRIORITY_CONFIG = {
  urgent: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    badge: "destructive",
  },
  recommended: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    badge: "default",
  },
  optional: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    badge: "secondary",
  },
} as const;

export default function HomeHealthAuditPage() {
  usePageTitle("AI Home Scan | UpTend");
  const [, setLocation] = useLocation();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [propertyAddress, setPropertyAddress] = useState<string>("");
  const [auditResult, setAuditResult] = useState<HomeHealthAuditResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { videoUrl: string; propertyAddress: string }) => {
      const response = await fetch("/api/home-health-audit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze video");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAuditResult(data);
    },
  });

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("Video file too large. Maximum size is 50MB.");
      return;
    }

    setVideoFile(file);
    setIsUploading(true);

    try {
      // Upload video to object storage
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      const { url } = await response.json();
      setVideoUrl(url);
    } catch (error) {
      console.error("Video upload error:", error);
      alert("Failed to upload video. Please try again.");
      setVideoFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = () => {
    if (!videoUrl || !propertyAddress) {
      alert("Please provide both video and property address");
      return;
    }

    analyzeMutation.mutate({ videoUrl, propertyAddress });
  };

  const handleBookService = (service: string) => {
    // Navigate to booking page with service pre-selected
    setLocation(`/book?service=${service}&source=home_health_audit${auditResult?.id ? `&auditId=${auditResult.id}` : ""}`);
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    alert("PDF download will be available after your audit is complete.");
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Upload View
  if (!auditResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Home className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Home Health Audit</h1>
          <p className="text-muted-foreground text-lg">
            Get a comprehensive AI-powered analysis of your property's condition
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Video Walkthrough</CardTitle>
            <CardDescription>
              Record a 30-60 second video walking through your property. Our AI will analyze
              it to identify maintenance needs, service opportunities, and potential issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, Orlando, FL 32801"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Video Upload</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {videoFile ? (
                  <div className="space-y-4">
                    <Video className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="font-medium">{videoFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {isUploading && (
                      <p className="text-sm text-blue-600">Uploading...</p>
                    )}
                    {videoUrl && !isUploading && (
                      <p className="text-sm text-green-600">✓ Uploaded successfully</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVideoFile(null);
                        setVideoUrl("");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your video, or click to browse
                    </p>
                    <input
                      id="video"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("video")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Video
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 50MB. Recommended length: 30-60 seconds.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tips for best results:</strong> Walk through all areas slowly, show exterior
                and interior, include roof, gutters, yard, driveways, and any visible issues. Good
                lighting helps!
              </AlertDescription>
            </Alert>

            <Button
              className="w-full"
              size="lg"
              disabled={!videoUrl || !propertyAddress || analyzeMutation.isPending}
              onClick={handleAnalyze}
            >
              {analyzeMutation.isPending ? (
                "Analyzing your property..."
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Home Health Report
                </>
              )}
            </Button>

            {analyzeMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to analyze video. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Comprehensive</h3>
                <p className="text-sm text-muted-foreground">
                  Covers all major systems: roof, HVAC, plumbing, electrical, and more
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Instant Results</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered analysis delivers results in under 2 minutes
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Cost Estimates</h3>
                <p className="text-sm text-muted-foreground">
                  Get pricing for recommended repairs and services
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results View
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Home Health Audit Report</h1>
          <p className="text-muted-foreground">{propertyAddress}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setAuditResult(null);
              setVideoFile(null);
              setVideoUrl("");
              setPropertyAddress("");
            }}
          >
            New Audit
          </Button>
        </div>
      </div>

      {/* Overall Property Condition */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Overall Condition</p>
              <p className={`text-2xl font-bold capitalize ${getConditionColor(auditResult.propertyCondition.overall)}`}>
                {auditResult.propertyCondition.overall}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Maintenance Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(auditResult.propertyCondition.maintenanceScore)}`}>
                {auditResult.propertyCondition.maintenanceScore}/100
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Safety Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(auditResult.propertyCondition.safetyScore)}`}>
                {auditResult.propertyCondition.safetyScore}/100
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Issues Alert */}
      {auditResult.propertyCondition.urgentIssues.length > 0 && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Urgent Issues Detected:</strong>
            <ul className="list-disc list-inside mt-2">
              {auditResult.propertyCondition.urgentIssues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="uptend" className="space-y-6">
        <TabsList>
          <TabsTrigger value="uptend">
            UpTend Services ({auditResult.uptendServices.length})
          </TabsTrigger>
          <TabsTrigger value="referrals">
            Referral Partners ({auditResult.referralNeeds.length})
          </TabsTrigger>
          <TabsTrigger value="details">Detailed Findings</TabsTrigger>
        </TabsList>

        {/* UpTend Services Tab */}
        <TabsContent value="uptend" className="space-y-4">
          {auditResult.uptendServices.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No UpTend services needed at this time. Your property looks great!
                </p>
              </CardContent>
            </Card>
          ) : (
            auditResult.uptendServices.map((service, idx) => {
              const priorityConfig = PRIORITY_CONFIG[service.priority];
              const PriorityIcon = priorityConfig.icon;

              return (
                <Card key={idx} className={priorityConfig.bg}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">
                            {SERVICE_LABELS[service.service] || service.service}
                          </CardTitle>
                          <Badge variant={priorityConfig.badge as any}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {service.priority}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {service.description}
                        </CardDescription>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-muted-foreground">Estimated Cost</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${service.estimatedPrice}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Why this is needed:</p>
                        <p className="text-sm text-muted-foreground">{service.reasoning}</p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleBookService(service.service)}
                      >
                        Book This Service
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {auditResult.uptendServices.length > 0 && (
            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Total UpTend Services</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${auditResult.uptendServices.reduce((sum, s) => sum + s.estimatedPrice, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save 10% by booking all services together
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Referral Partners Tab */}
        <TabsContent value="referrals" className="space-y-4">
          {auditResult.referralNeeds.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No specialist referrals needed. All systems appear to be in good condition!
                </p>
              </CardContent>
            </Card>
          ) : (
            auditResult.referralNeeds.map((referral, idx) => {
              const priorityConfig = PRIORITY_CONFIG[referral.priority];
              const PriorityIcon = priorityConfig.icon;

              return (
                <Card key={idx} className={priorityConfig.bg}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">
                            {CATEGORY_LABELS[referral.category] || referral.category}
                          </CardTitle>
                          <Badge variant={priorityConfig.badge as any}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {referral.priority}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Issues Detected:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {referral.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-muted-foreground">Estimated Cost</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${referral.estimatedCost}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Recommendation:</p>
                        <p className="text-sm text-muted-foreground">{referral.reasoning}</p>
                      </div>
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Connect with Verified Partner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {auditResult.referralNeeds.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>UpTend Referral Partners:</strong> We connect you with vetted, licensed
                professionals for specialized services. All referrals come with our quality guarantee.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Detailed Findings Tab */}
        <TabsContent value="details" className="space-y-4">
          {Object.entries(auditResult.detailedFindings).map(([category, findings]: [string, any]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {CATEGORY_LABELS[category] || category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {findings.condition && (
                  <div>
                    <p className="text-sm font-medium mb-1">Condition:</p>
                    <p className="text-sm text-muted-foreground">{findings.condition}</p>
                  </div>
                )}

                {findings.issues && findings.issues.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Issues:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {findings.issues.map((issue: string, idx: number) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {findings.recommendations && findings.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Recommendations:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {findings.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {findings.evidence !== undefined && (
                  <div>
                    <p className="text-sm font-medium mb-1">Evidence Detected:</p>
                    <p className="text-sm text-muted-foreground">
                      {findings.evidence ? "Yes" : "No"}
                    </p>
                    {findings.type && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Type: {findings.type.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {Object.keys(auditResult.detailedFindings).length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No detailed findings available for this audit.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Confidence Score Footer */}
      <Card className="mt-8 bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">AI Analysis Confidence</p>
            <p className="text-lg font-semibold">
              {Math.round(auditResult.confidence * 100)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This report was generated by AI analysis. For complex issues, we recommend
              consulting with a licensed professional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
