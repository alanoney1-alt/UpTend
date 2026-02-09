import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CheckCircle,
  Circle,
  Clock,
  Camera,
  Package,
  FileText,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { BeforePhotosCapture } from "./before-photos-capture";
import { DisposalTracking } from "./disposal-tracking";
import { AfterPhotosCapture } from "./after-photos-capture";
import { SustainabilityReport } from "./sustainability-report";

interface VerificationWorkflowProps {
  jobId: string;
  serviceType: string;
}

interface VerificationStatusResponse {
  canReleasePayment: boolean;
  canComplete: boolean;
  missingSteps: string[];
  verification: {
    id: string;
    serviceRequestId: string;
    verificationStatus: string;
    stepsCompleted: {
      step1: boolean;
      step2: boolean;
      step3: boolean;
      step4: boolean;
      step5: boolean;
    };
    customerConfirmedAt: string | null;
  } | null;
  autoApprovalEligible: boolean;
  hoursRemaining: number;
  message: string;
}

interface DisposalStatusResponse {
  success: boolean;
  verification: any;
  disposalRecords: any[];
  categoriesUsed: string[];
  missingReceipts: number;
  isComplete: boolean;
  nextStep: string;
}

export function VerificationWorkflow({ jobId, serviceType }: VerificationWorkflowProps) {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Fetch verification status
  const { data: verification, isLoading } = useQuery<VerificationStatusResponse>({
    queryKey: [`/api/jobs/${jobId}/verification/status`],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch disposal records for step 2
  const { data: disposalStatus } = useQuery<DisposalStatusResponse>({
    queryKey: [`/api/jobs/${jobId}/verification/disposal-status`],
    enabled: verification?.verification?.verificationStatus !== "step_1_before_photos",
  });

  const steps = [
    {
      id: 1,
      title: "Before Photos",
      description: "Take photos before starting work",
      icon: Camera,
      status: verification?.verification?.stepsCompleted?.step1 ? "completed" : "pending",
      component: BeforePhotosCapture,
    },
    {
      id: 2,
      title: "Track Items",
      description: "Log each item and disposal method",
      icon: Package,
      status: verification?.verification?.stepsCompleted?.step2 ? "completed" : "pending",
      component: DisposalTracking,
      disabled: !verification?.verification?.stepsCompleted?.step1,
    },
    {
      id: 3,
      title: "After Photos",
      description: "Take photos after completing work",
      icon: Camera,
      status: verification?.verification?.stepsCompleted?.step3 ? "completed" : "pending",
      component: AfterPhotosCapture,
      disabled: !verification?.verification?.stepsCompleted?.step2,
    },
    {
      id: 4,
      title: "Disposal Receipts",
      description: "Upload proof for each category",
      icon: FileText,
      status: verification?.verification?.stepsCompleted?.step4 ? "completed" : "pending",
      disabled: !verification?.verification?.stepsCompleted?.step3,
      hideComponent: true, // Handled within disposal tracking
    },
    {
      id: 5,
      title: "Generate Report",
      description: "Create sustainability report",
      icon: FileText,
      status: verification?.verification?.stepsCompleted?.step5 ? "completed" : "pending",
      component: SustainabilityReport,
      disabled: !verification?.verification?.stepsCompleted?.step4,
    },
    {
      id: 6,
      title: "Customer Confirmation",
      description: "Waiting for customer approval",
      icon: Users,
      status: verification?.verification?.customerConfirmedAt ? "completed" : "pending",
      disabled: !verification?.verification?.stepsCompleted?.step5,
    },
  ];

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = (completedSteps / steps.length) * 100;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If verification complete, show success state
  if (verification?.canReleasePayment) {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Verification Complete!</CardTitle>
              <p className="text-sm text-muted-foreground">
                You can now mark this job as complete and receive payment
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Show active step's component
  const ActiveStepComponent = activeStep ? steps[activeStep - 1]?.component : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Verification</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete all steps to release payment
              </p>
            </div>
            <Badge variant={verification?.canComplete ? "default" : "secondary"}>
              {completedSteps}/{steps.length} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progress} className="h-2" />

          {/* Blocking Warning */}
          {!verification?.canComplete && (verification?.missingSteps?.length || 0) > 0 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
                  Verification Required
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This job type requires verification. Complete all steps before marking the job as complete.
                </p>
              </div>
            </div>
          )}

          {/* Payment Release Warning */}
          {verification?.canComplete && !verification?.canReleasePayment && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-800 dark:text-blue-200">
                  Waiting for Customer Confirmation
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {verification?.autoApprovalEligible
                    ? "Auto-approval period has elapsed. Payment will be released."
                    : `Payment will be released after customer confirms or in ${verification?.hoursRemaining || 48} hours.`}
                </p>
              </div>
            </div>
          )}

          {/* Step List */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  step.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : step.status === "completed"
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "hover:bg-accent cursor-pointer"
                }`}
                onClick={() => {
                  if (!step.disabled && step.status !== "completed" && step.component) {
                    setActiveStep(step.id);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.status === "completed"
                        ? "bg-green-500"
                        : step.disabled
                        ? "bg-muted"
                        : "bg-primary"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <step.icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>

                {step.status === "completed" ? (
                  <Badge variant="default" className="bg-green-500">
                    Complete
                  </Badge>
                ) : step.disabled ? (
                  <Badge variant="outline">Locked</Badge>
                ) : step.component ? (
                  <Button size="sm" variant="outline">
                    Start
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Step Component */}
      {ActiveStepComponent && activeStep && (
        <ActiveStepComponent
          jobId={jobId}
          serviceType={serviceType}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/verification/status`] });
            setActiveStep(null);
            toast({
              title: "Step complete!",
              description: `${steps[activeStep - 1].title} completed successfully`,
            });
          }}
          onCancel={() => setActiveStep(null)}
        />
      )}
    </div>
  );
}
