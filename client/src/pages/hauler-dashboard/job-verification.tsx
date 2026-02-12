/**
 * Job Verification System
 *
 * Pro Dashboard component for on-site job verification
 *
 * Flow:
 * 1. Pro arrives at customer location
 * 2. Takes "before" photos/video of actual property/items
 * 3. AI analyzes and compares to original quote
 * 4. If difference ≤10%, auto-approve
 * 5. If difference >10%, notify customer for approval
 * 6. After work, Pro takes "after" photos for completion verification
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Video,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowRight,
  Eye,
  RefreshCw
} from "lucide-react";

interface JobVerificationProps {
  jobId: string;
  serviceType: string;
  originalQuote: {
    finalPrice: number;
    breakdown: string;
    inputs: Record<string, any>;
    quotePath: 'ai_scan' | 'manual_form' | 'chat_sms_phone';
  };
  onVerificationComplete: (verificationData: VerificationResult) => void;
}

interface VerificationResult {
  verifiedPrice: number;
  priceDifference: number;
  percentageDifference: number;
  requiresCustomerApproval: boolean;
  verificationPhotos: string[];
  verificationMethod: 'photo' | 'video';
  aiAnalysis: {
    detectedParams: Record<string, any>;
    confidence: number;
    reasoning: string;
  };
  proNotes?: string;
  autoApproved: boolean;
}

export function JobVerification({
  jobId,
  serviceType,
  originalQuote,
  onVerificationComplete
}: JobVerificationProps) {
  const [step, setStep] = useState<'capture' | 'analyzing' | 'review' | 'complete'>('capture');
  const [verificationMethod, setVerificationMethod] = useState<'photo' | 'video'>('video');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [proNotes, setProNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    if (verificationMethod === 'photo' && uploadedFiles.length + fileArray.length > 10) {
      setError('Maximum 10 photos allowed');
      return;
    }

    if (verificationMethod === 'video' && fileArray.length > 1) {
      setError('Only one video allowed');
      return;
    }

    setUploadedFiles([...uploadedFiles, ...fileArray]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const analyzeVerificationMedia = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one photo or video');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStep('analyzing');

    try {
      // Upload files
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('serviceType', serviceType);
      formData.append('verificationMethod', verificationMethod);
      formData.append('jobId', jobId);

      const uploadResponse = await fetch('/api/upload/verification', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload verification files');
      }

      const { fileUrls } = await uploadResponse.json();

      // Call verification analysis endpoint
      const verificationResponse = await fetch('/api/jobs/verify-measurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          serviceType,
          verificationMethod,
          fileUrls,
          originalQuote,
        }),
      });

      if (!verificationResponse.ok) {
        throw new Error('Verification analysis failed');
      }

      const result: VerificationResult = await verificationResponse.json();
      setVerificationResult(result);
      setStep('review');

    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to analyze verification media. Please try again.');
      setStep('capture');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmVerification = async () => {
    if (!verificationResult) return;
    setIsConfirming(true);

    try {
      // Add pro notes to verification result
      const finalResult = {
        ...verificationResult,
        proNotes: proNotes || undefined,
      };

      // If requires customer approval, trigger notification
      if (verificationResult.requiresCustomerApproval) {
        await fetch('/api/jobs/request-price-approval', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId,
            originalPrice: originalQuote.finalPrice,
            verifiedPrice: verificationResult.verifiedPrice,
            priceDifference: verificationResult.priceDifference,
            percentageDifference: verificationResult.percentageDifference,
            verificationPhotos: verificationResult.verificationPhotos,
            proNotes: proNotes,
          }),
        });
      }

      // Mark verification as complete
      await fetch(`/api/jobs/${jobId}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified: true,
          verificationData: finalResult,
        }),
      });

      setStep('complete');
      onVerificationComplete(finalResult);

    } catch (err) {
      console.error('Failed to confirm verification:', err);
      setError('Failed to save verification. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const getPriceDifferenceColor = (percentage: number): string => {
    if (percentage <= 10) return 'text-green-600';
    if (percentage <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriceDifferenceIcon = (percentage: number) => {
    if (percentage <= 10) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Step: Capture Verification Media */}
      {step === 'capture' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                On-Site Verification
              </CardTitle>
              <CardDescription>
                Take photos or video of the actual property/items to verify the quote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Original Quote Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Original Quote</p>
                    <p className="text-2xl font-bold">${originalQuote.finalPrice}</p>
                  </div>
                  <Badge variant="outline">
                    {originalQuote.quotePath === 'ai_scan' && 'AI Scan'}
                    {originalQuote.quotePath === 'manual_form' && 'Manual Entry'}
                    {originalQuote.quotePath === 'chat_sms_phone' && 'Chat/SMS'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{originalQuote.breakdown}</p>
              </div>

              {/* Verification Method Selection */}
              <Tabs value={verificationMethod} onValueChange={(value) => setVerificationMethod(value as 'photo' | 'video')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="photo">
                    <Camera className="w-4 h-4 mr-2" />
                    Photos
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Video className="w-4 h-4 mr-2" />
                    Video <Badge className="ml-2" variant="secondary">Recommended</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photo" className="space-y-4">
                  <Alert>
                    <Eye className="w-4 h-4" />
                    <AlertDescription>
                      Take clear photos of the property/items from multiple angles. Include reference objects for scale.
                    </AlertDescription>
                  </Alert>

                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      max={10}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="verification-photos"
                      capture="environment"
                    />
                    <label htmlFor="verification-photos" className="cursor-pointer">
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="font-medium">Tap to take photos</p>
                      <p className="text-sm text-muted-foreground">Up to 10 photos</p>
                    </label>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-4">
                  <Alert>
                    <Video className="w-4 h-4" />
                    <AlertDescription>
                      Record a walkthrough showing the full scope of work. Video provides better accuracy (+5% confidence).
                    </AlertDescription>
                  </Alert>

                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="verification-video"
                      capture="environment"
                    />
                    <label htmlFor="verification-video" className="cursor-pointer">
                      <Video className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="font-medium">Tap to record video</p>
                      <p className="text-sm text-muted-foreground">Max 120 seconds</p>
                    </label>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded ({uploadedFiles.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative border rounded-lg p-2 bg-muted">
                        <p className="text-xs truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={analyzeVerificationMedia}
                disabled={uploadedFiles.length === 0}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Analyze & Verify Quote
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg font-medium mb-2">Analyzing verification media...</p>
            <p className="text-sm text-muted-foreground">
              Our AI is comparing the on-site conditions to the original quote
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step: Review Verification Results */}
      {step === 'review' && verificationResult && (
        <>
          <Card className={verificationResult.requiresCustomerApproval ? 'border-yellow-500' : 'border-green-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPriceDifferenceIcon(verificationResult.percentageDifference)}
                Verification Complete
              </CardTitle>
              <CardDescription>
                {verificationResult.autoApproved
                  ? 'Price verified and auto-approved (within 10%)'
                  : 'Price adjustment requires customer approval (over 10%)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Original Quote</p>
                  <p className="text-2xl font-bold">${originalQuote.finalPrice}</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Verified Price</p>
                  <p className="text-2xl font-bold text-primary">${verificationResult.verifiedPrice}</p>
                </div>
              </div>

              {/* Price Difference */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Price Difference</p>
                  <p className="text-xs text-muted-foreground">
                    {verificationResult.priceDifference > 0 ? 'Higher' : 'Lower'} than original quote
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getPriceDifferenceColor(verificationResult.percentageDifference)}`}>
                    {verificationResult.priceDifference > 0 ? '+' : ''}${verificationResult.priceDifference}
                  </p>
                  <p className={`text-sm ${getPriceDifferenceColor(verificationResult.percentageDifference)}`}>
                    {verificationResult.percentageDifference.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* AI Analysis */}
              <details className="bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium">AI Analysis Details</summary>
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Confidence:</p>
                    <Badge>{Math.round(verificationResult.aiAnalysis.confidence * 100)}%</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Detected Parameters:</p>
                    <pre className="text-xs bg-background p-2 rounded">
                      {JSON.stringify(verificationResult.aiAnalysis.detectedParams, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Reasoning:</p>
                    <p className="text-xs">{verificationResult.aiAnalysis.reasoning}</p>
                  </div>
                </div>
              </details>

              {/* Pro Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notes {verificationResult.requiresCustomerApproval && '(Required for customer)'}
                </label>
                <Textarea
                  placeholder="Explain any differences found or special conditions..."
                  value={proNotes}
                  onChange={(e) => setProNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Customer Approval Warning */}
              {verificationResult.requiresCustomerApproval && (
                <Alert variant="default" className="border-yellow-500">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription>
                    This price adjustment requires customer approval. They will be notified via SMS and app notification.
                    Work cannot begin until they approve the new price.
                  </AlertDescription>
                </Alert>
              )}

              {/* Auto-Approval Message */}
              {verificationResult.autoApproved && (
                <Alert variant="default" className="border-green-500">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription>
                    Price difference is within 10% wiggle room. Auto-approved! You can begin work immediately.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={confirmVerification}
                className="w-full"
                size="lg"
                disabled={(verificationResult.requiresCustomerApproval && !proNotes) || isConfirming}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : verificationResult.requiresCustomerApproval ? (
                  <>
                    Request Customer Approval
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm & Begin Work
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step: Complete */}
      {step === 'complete' && verificationResult && (
        <Card className="border-green-500">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Verification Complete!</h3>
            {verificationResult.autoApproved ? (
              <p className="text-muted-foreground mb-6">
                Price verified and approved. You can begin work now.
              </p>
            ) : (
              <p className="text-muted-foreground mb-6">
                Customer has been notified. You'll receive a notification once they approve the new price.
              </p>
            )}
            <div className="bg-muted p-4 rounded-lg inline-block">
              <p className="text-sm text-muted-foreground">Final Verified Price</p>
              <p className="text-3xl font-bold text-primary">${verificationResult.verifiedPrice}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
