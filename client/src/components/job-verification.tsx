import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MultiPhotoUpload } from "@/components/photo-upload";
import { VideoUpload } from "@/components/video-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Video,
  CheckCircle,
  AlertTriangle,
  Loader2,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ServiceRequest } from "@shared/schema";

interface JobVerificationProps {
  job: ServiceRequest;
  onVerificationComplete: (verificationData: any) => void;
  phase: "before" | "after";
}

export function JobVerification({
  job,
  onVerificationComplete,
  phase,
}: JobVerificationProps) {
  const { toast } = useToast();
  const [mediaMode, setMediaMode] = useState<"photo" | "video">("video");
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [beforeVideo, setBeforeVideo] = useState<string | null>(null);
  const [afterVideo, setAfterVideo] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [proposedPrice, setProposedPrice] = useState<number | null>(null);

  const currentPhotos = phase === "before" ? beforePhotos : afterPhotos;
  const setCurrentPhotos = phase === "before" ? setBeforePhotos : setAfterPhotos;
  const currentVideo = phase === "before" ? beforeVideo : afterVideo;
  const setCurrentVideo = phase === "before" ? setBeforeVideo : setAfterVideo;

  const handleAnalyze = async () => {
    if (mediaMode === "photo" && currentPhotos.length === 0) {
      toast({
        title: "No photos uploaded",
        description: "Please upload at least one photo to verify the job.",
        variant: "destructive",
      });
      return;
    }

    if (mediaMode === "video" && !currentVideo) {
      toast({
        title: "No video uploaded",
        description: "Please upload a video to verify the job.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const endpoint =
        mediaMode === "video"
          ? "/api/jobs/verify-video"
          : "/api/jobs/verify-photos";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobId: job.id,
          phase,
          mediaUrls: mediaMode === "photo" ? currentPhotos : [currentVideo],
          originalEstimate: job.estimatedPrice,
          serviceType: job.serviceType,
        }),
      });

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const result = await response.json();
      setVerificationResult(result);

      // If difference > 10%, suggest adjustment
      if (result.priceDifference && Math.abs(result.priceDifferencePercent) > 10) {
        setProposedPrice(result.verifiedPrice);
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification failed",
        description: "Unable to analyze media. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptEstimate = () => {
    onVerificationComplete({
      phase,
      accepted: true,
      originalPrice: job.estimatedPrice,
      verifiedPrice: job.estimatedPrice,
      mediaUrls: mediaMode === "photo" ? currentPhotos : [currentVideo],
      verificationResult,
    });
  };

  const handleProposeAdjustment = () => {
    if (!proposedPrice) {
      toast({
        title: "Enter adjusted price",
        description: "Please specify the adjusted price before submitting.",
        variant: "destructive",
      });
      return;
    }

    onVerificationComplete({
      phase,
      accepted: false,
      originalPrice: job.estimatedPrice,
      proposedPrice,
      adjustmentReason,
      mediaUrls: mediaMode === "photo" ? currentPhotos : [currentVideo],
      verificationResult,
      requiresCustomerApproval: true,
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {phase === "before" ? (
              <>
                <Camera className="w-5 h-5 text-primary" />
                Before Work Verification
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                After Work Verification
              </>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {phase === "before"
              ? "Document the initial state and verify measurements against the customer's estimate"
              : "Document completed work to show before/after transformation"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Show original estimate */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Customer's Estimate</span>
              <Badge variant="outline">
                {job.quoteMethod === "ai" ? "AI Quote" : "Manual Estimate"}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(job.estimatedPrice || 0)}
            </div>
            {job.quoteMethod === "manual" && (
              <p className="text-xs text-muted-foreground mt-1">
                 Manual estimate - verify actual measurements
              </p>
            )}
          </div>

          {/* Media upload tabs */}
          <Tabs value={mediaMode} onValueChange={(v) => setMediaMode(v as "photo" | "video")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="photo">
                <Camera className="w-4 h-4 mr-2" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="w-4 h-4 mr-2" />
                Video (Recommended)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photo" className="space-y-4">
              <Alert>
                <Camera className="w-4 h-4" />
                <AlertDescription>
                  Take clear photos from multiple angles. Include reference objects for
                  scale (doorways, people, cars).
                </AlertDescription>
              </Alert>

              <MultiPhotoUpload
                label={`${phase === "before" ? "Before" : "After"} Photos`}
                description="Upload up to 5 photos"
                onPhotosChange={setCurrentPhotos}
                maxPhotos={5}
                accept="image/*"
                testId="verification-photos"
              />
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <Alert>
                <Video className="w-4 h-4" />
                <AlertDescription>
                  <strong>Video provides +5% confidence boost</strong>
                  <br />
                  Record a 30-60 second walkthrough showing the full area. Narrate to
                  explain what you're seeing.
                </AlertDescription>
              </Alert>

              <VideoUpload
                label={`${phase === "before" ? "Before" : "After"} Video`}
                description="Max 2 minutes. Our AI will analyze automatically."
                onVideoUpload={setCurrentVideo}
                maxDuration={120}
              />
            </TabsContent>
          </Tabs>

          {/* Analyze button */}
          {((mediaMode === "photo" && currentPhotos.length > 0) ||
            (mediaMode === "video" && currentVideo)) && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Measurements
                </>
              )}
            </Button>
          )}

          {/* Verification result */}
          {verificationResult && (
            <div className="space-y-4">
              <Card className="border-2 border-primary">
                <CardContent className="p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    AI Verification Complete
                  </h3>

                  <div className="space-y-3">
                    {/* Measurement comparison */}
                    {verificationResult.measurements && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Customer Said:</p>
                          <p className="font-medium">
                            {verificationResult.originalMeasurements}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">AI Measured:</p>
                          <p className="font-medium">
                            {verificationResult.verifiedMeasurements}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Price difference */}
                    {verificationResult.priceDifference && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Verified Price
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(verificationResult.verifiedPrice)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            Math.abs(verificationResult.priceDifferencePercent) > 10
                              ? "destructive"
                              : "default"
                          }
                        >
                          {verificationResult.priceDifferencePercent > 0 ? "+" : ""}
                          {verificationResult.priceDifferencePercent.toFixed(1)}%
                        </Badge>
                      </div>
                    )}

                    {/* Recommendation */}
                    {Math.abs(verificationResult.priceDifferencePercent || 0) > 10 ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>
                          <strong>Price adjustment recommended</strong>
                          <br />
                          Actual measurements differ by{" "}
                          {Math.abs(verificationResult.priceDifferencePercent).toFixed(1)}
                          %. Customer approval required.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <CheckCircle className="w-4 h-4" />
                        <AlertDescription>
                          Measurements match estimate within acceptable range. Proceed with
                          original price.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="space-y-3">
                {Math.abs(verificationResult.priceDifferencePercent || 0) <= 10 ? (
                  <Button
                    onClick={handleAcceptEstimate}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Original Estimate
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Proposed Price Adjustment
                      </label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="number"
                          value={proposedPrice || ""}
                          onChange={(e) =>
                            setProposedPrice(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Enter adjusted price"
                        />
                      </div>
                    </div>

                    <Textarea
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="Explain why the price adjustment is needed (customer will see this)"
                      rows={3}
                    />

                    <Button
                      onClick={handleProposeAdjustment}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Propose Adjustment (Customer Approval Required)
                    </Button>

                    <Button
                      onClick={handleAcceptEstimate}
                      variant="ghost"
                      className="w-full"
                    >
                      Accept Original Estimate Anyway
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
