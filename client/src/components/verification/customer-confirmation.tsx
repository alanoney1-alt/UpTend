import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  FileText,
  Leaf,
  TreePine,
  Droplet,
  BarChart3,
  AlertCircle,
} from "lucide-react";

interface CustomerConfirmationProps {
  jobId: string;
}

interface VerificationStatusResponse {
  canComplete: boolean;
  canReleasePayment: boolean;
  missingSteps: string[];
  verification: {
    id: string;
    serviceRequestId: string;
    beforePhotos: string[] | null;
    afterPhotos: string[] | null;
    verificationStatus: string;
    customerConfirmedAt: string | null;
    totalWeightLbs: number | null;
    totalRecycledLbs: number | null;
    diversionRate: number | null;
    carbonOffsetTons: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  autoApprovalEligible: boolean;
  message: string;
}

export function CustomerConfirmation({ jobId }: CustomerConfirmationProps) {
  const { toast } = useToast();
  const [showBeforePhotos, setShowBeforePhotos] = useState(false);
  const [showAfterPhotos, setShowAfterPhotos] = useState(false);

  // Fetch verification status
  const { data: verification, isLoading } = useQuery<VerificationStatusResponse>({
    queryKey: [`/api/jobs/${jobId}/verification/status`],
  });

  // Confirm job
  const confirmMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/jobs/${jobId}/verification/customer-confirm`, {});
    },
    onSuccess: () => {
      toast({
        title: "Job confirmed!",
        description: "Payment will be released to your Pro",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/verification/status`] });
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If already confirmed
  if (verification?.verification?.customerConfirmedAt) {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Job Confirmed!</CardTitle>
              <p className="text-sm text-muted-foreground">
                Thank you for confirming. Payment has been released.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // If not ready for confirmation
  if (!verification?.canComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Verification In Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your Pro is currently documenting the job completion. You'll be notified when it's ready for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  const verificationData = verification.verification;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Review & Confirm Job Completion</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your Pro has completed the work. Please review the documentation below.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Auto-approval Notice */}
      {verification.autoApprovalEligible && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
              Auto-Approval Period Elapsed
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              This job will be automatically approved. You can still review the details below.
            </p>
          </div>
        </div>
      )}

      {/* Before Photos */}
      {verificationData.beforePhotos && verificationData.beforePhotos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <CardTitle className="text-lg">Before Photos</CardTitle>
                <Badge variant="secondary">{verificationData.beforePhotos.length} photos</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBeforePhotos(!showBeforePhotos)}
              >
                {showBeforePhotos ? "Hide" : "View"}
              </Button>
            </div>
          </CardHeader>
          {showBeforePhotos && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {verificationData.beforePhotos.map((photo: string, index: number) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Before photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  </div>
                ))}
              </div>
              {verificationData.beforePhotosGps && (
                <p className="text-xs text-muted-foreground mt-3">
                  📍 Location: {verificationData.beforePhotosGps}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* After Photos */}
      {verificationData.afterPhotos && verificationData.afterPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <CardTitle className="text-lg">After Photos</CardTitle>
                <Badge variant="secondary">{verificationData.afterPhotos.length} photos</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAfterPhotos(!showAfterPhotos)}
              >
                {showAfterPhotos ? "Hide" : "View"}
              </Button>
            </div>
          </CardHeader>
          {showAfterPhotos && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {verificationData.afterPhotos.map((photo: string, index: number) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`After photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  </div>
                ))}
              </div>
              {verificationData.afterPhotosGps && (
                <p className="text-xs text-muted-foreground mt-3">
                  📍 Location: {verificationData.afterPhotosGps}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Sustainability Report Summary */}
      {verificationData.totalWeightLbs > 0 && (
        <Card className="border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Sustainability Report</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white dark:bg-background border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Weight</p>
                <p className="text-xl font-bold">{verificationData.totalWeightLbs.toFixed(0)} lbs</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-background border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Diversion Rate</p>
                <p className="text-xl font-bold text-green-600">
                  {(verificationData.diversionRate * 100).toFixed(0)}%
                </p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-background border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Carbon Offset</p>
                <p className="text-xl font-bold">{verificationData.carbonOffsetTons.toFixed(2)} tons</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-background border rounded-lg">
                <TreePine className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{(verificationData.carbonOffsetTons * 16.5).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Trees Worth</p>
              </div>
            </div>

            <div className="bg-white dark:bg-background border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm mb-2">Environmental Impact</p>
                  <ul className="text-sm space-y-1">
                    <li>♻️ {verificationData.totalRecycledLbs.toFixed(0)} lbs recycled</li>
                    <li>🌳 Equivalent to {(verificationData.carbonOffsetTons * 16.5).toFixed(1)} trees planted</li>
                    <li>💧 ~{(verificationData.totalWeightLbs * 0.5).toFixed(0)} gallons water saved</li>
                    <li>🌍 {verificationData.carbonOffsetTons.toFixed(2)} metric tons CO2 avoided</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Actions */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                Review Complete?
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                By confirming, you verify that the work has been completed satisfactorily. Payment will be released to your Pro.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm & Release Payment
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you don't confirm within 48 hours, the job will be automatically approved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
