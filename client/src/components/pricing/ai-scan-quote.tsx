/**
 * AI Scan Quote Component (Path A)
 *
 * Allows customers to upload photos or video of their property/items
 * and receive an AI-generated quote. Works for multiple services:
 * - PolishUp (home cleaning): Analyzes home size, condition
 * - BulkSnap (junk removal): Identifies items, estimates volume
 * - FreshWash (pressure washing): Calculates square footage from images
 * - GutterFlush: Identifies story count, roof complexity
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPricingQuote, type PricingQuote } from "@/lib/pricing-quote";
import { calculatePolishUpPrice, type PolishUpPricingInput } from "@/lib/polishup-pricing";
import {
  Upload,
  Camera,
  Video,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Users,
  Clock
} from "lucide-react";

interface AIScanQuoteProps {
  serviceType: 'polishup' | 'bulksnap' | 'freshwash' | 'gutterflush';
  onQuoteGenerated: (quote: PricingQuote) => void;
  onBack?: () => void;
}

interface AIAnalysisResult {
  // PolishUp specific
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  sqft?: number;
  estimatedCondition?: 'good' | 'fair' | 'poor';

  // BulkSnap specific
  identifiedItems?: string[];
  estimatedVolume?: number;
  loadSize?: 'small' | 'medium' | 'large' | 'full';

  // FreshWash specific
  totalSqft?: number;
  surfaces?: Array<{
    type: string;
    sqft: number;
  }>;

  // Common fields
  confidence: number;
  reasoning: string;
  suggestedPrice?: number;
  suggestedPriceMin?: number;
  suggestedPriceMax?: number;
}

export function AIScanQuote({ serviceType, onQuoteGenerated, onBack }: AIScanQuoteProps) {
  const [uploadMethod, setUploadMethod] = useState<'photo' | 'video'>('photo');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowManualOverride, setAllowManualOverride] = useState(false);

  // Manual override state for PolishUp
  const [manualBedrooms, setManualBedrooms] = useState<number>(2);
  const [manualBathrooms, setManualBathrooms] = useState<number>(2);
  const [manualStories, setManualStories] = useState<number>(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    if (uploadMethod === 'photo' && uploadedFiles.length + fileArray.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    if (uploadMethod === 'video' && fileArray.length > 1) {
      setError('Only one video allowed');
      return;
    }

    setUploadedFiles([...uploadedFiles, ...fileArray]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const analyzeWithAI = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one photo or video');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Upload files to storage
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('serviceType', serviceType);
      formData.append('uploadMethod', uploadMethod);

      const uploadResponse = await fetch('/api/upload/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload files');
      }

      const { fileUrls } = await uploadResponse.json();

      // Call AI analysis endpoint
      const endpoint = uploadMethod === 'video'
        ? '/api/ai/analyze-video'
        : '/api/ai/analyze-photos';

      const analysisResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [uploadMethod === 'video' ? 'videoUrl' : 'photoUrls']: fileUrls,
          serviceType,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('AI analysis failed');
      }

      const result: AIAnalysisResult = await analysisResponse.json();

      // Add confidence boost for video (+5%)
      if (uploadMethod === 'video') {
        result.confidence = Math.min(result.confidence + 0.05, 1.0);
      }

      setAnalysisResult(result);

      // If confidence is low, allow manual override
      if (result.confidence < 0.7) {
        setAllowManualOverride(true);
      }

    } catch (err) {
      console.error('AI analysis error:', err);
      setError('Failed to analyze images. Please try again or use manual entry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateQuoteFromAI = () => {
    if (!analysisResult) return;

    let quote: PricingQuote;

    if (serviceType === 'polishup') {
      // Use AI-detected or manually overridden values
      const pricingInput: PolishUpPricingInput = {
        cleanType: 'standard', // Default, can be changed by customer
        bedrooms: (allowManualOverride ? manualBedrooms : analysisResult.bedrooms || 2) as 0 | 1 | 2 | 3 | 4 | 5,
        bathrooms: (allowManualOverride ? manualBathrooms : analysisResult.bathrooms || 2) as 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4,
        stories: (allowManualOverride ? manualStories : analysisResult.stories || 1) as 1 | 2 | 3,
        sqft: analysisResult.sqft,
        hasPets: false, // Customer can adjust
        lastCleaned: '1_6_months', // Customer can adjust
        sameDayBooking: false,
      };

      const polishUpQuote = calculatePolishUpPrice(pricingInput);

      quote = createPricingQuote(
        'polishup',
        'Home Cleaning',
        pricingInput,
        'ai_scan',
        polishUpQuote.basePrice,
        polishUpQuote.modifiersApplied,
        polishUpQuote.finalPrice,
        `${polishUpQuote.estimatedDurationHours} hours`,
        polishUpQuote.estimatedProsNeeded,
        polishUpQuote.breakdown
      );
    } else {
      // For other services, use the AI-suggested price
      quote = createPricingQuote(
        serviceType,
        getServiceBrandedName(serviceType),
        analysisResult,
        'ai_scan',
        analysisResult.suggestedPrice || 0,
        [],
        analysisResult.suggestedPrice || 0,
        '2-3 hours',
        1,
        analysisResult.reasoning
      );
    }

    onQuoteGenerated(quote);
  };

  const getServiceBrandedName = (service: string): string => {
    const names = {
      polishup: 'Home Cleaning',
      bulksnap: 'Junk Removal',
      freshwash: 'Pressure Washing',
      gutterflush: 'Gutter Cleaning',
    };
    return names[service as keyof typeof names] || service;
  };

  const getUploadInstructions = () => {
    const instructions = {
      polishup: {
        photo: 'Take photos of each room, focusing on overall cleanliness and size. Include a few wide-angle shots.',
        video: ' Walk through each room slowly, showing the overall condition. Include all main areas.',
      },
      bulksnap: {
        photo: 'Take photos of all items to be removed. Include multiple angles for large items.',
        video: ' Do a walkthrough showing all items from multiple angles. Show scale with a reference object.',
      },
      freshwash: {
        photo: 'Capture each surface to be cleaned (driveway, siding, deck). Stand back to show full area with a reference object for scale.',
        video: ' Walk around the property showing all surfaces. Include a person or car for scale.',
      },
      gutterflush: {
        photo: 'Take photos of your roofline from different angles. Include photos showing story count.',
        video: ' Walk around the property showing the full roofline and structure.',
      },
    };

    return instructions[serviceType][uploadMethod];
  };

  return (
    <div className="space-y-6">
      {/* Upload Method Selection */}
      {!analysisResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Get AI-Powered Quote</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'photo' | 'video')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="photo">
                    <Camera className="w-4 h-4 mr-2" />
                    Photos
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Video className="w-4 h-4 mr-2" />
                    Video <Badge className="ml-2" variant="secondary">+5% accuracy</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photo" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">{getUploadInstructions()}</p>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      max={5}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium">Click to upload photos</p>
                      <p className="text-sm text-muted-foreground">Up to 5 photos, max 10MB each</p>
                    </label>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">{getUploadInstructions()}</p>
                    <p className="text-sm mt-2"><strong>Max duration:</strong> 60 seconds</p>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium">Click to upload video</p>
                      <p className="text-sm text-muted-foreground">Max 60 seconds, up to 100MB</p>
                    </label>
                  </div>
                </TabsContent>
              </Tabs>

              {/* File Preview */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative border rounded-lg p-2">
                        <p className="text-xs truncate">{file.name}</p>
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
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg mt-4">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                {onBack && (
                  <Button variant="outline" onClick={onBack}>
                    Back
                  </Button>
                )}
                <Button
                  onClick={analyzeWithAI}
                  disabled={uploadedFiles.length === 0 || isAnalyzing}
                  className="ml-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* AI Analysis Result */}
      {analysisResult && (
        <>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <p className="text-sm text-muted-foreground">AI Analysis Complete</p>
                </div>

                {/* Confidence Badge */}
                <div className="flex justify-center mb-4">
                  <Badge
                    variant={analysisResult.confidence >= 0.9 ? "default" : analysisResult.confidence >= 0.7 ? "secondary" : "outline"}
                  >
                    {Math.round(analysisResult.confidence * 100)}% Confidence
                    {uploadMethod === 'video' && ' (+5% video boost)'}
                  </Badge>
                </div>

                {/* PolishUp specific results */}
                {serviceType === 'polishup' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{analysisResult.bedrooms || manualBedrooms}</p>
                        <p className="text-sm text-muted-foreground">Bedrooms</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analysisResult.bathrooms || manualBathrooms}</p>
                        <p className="text-sm text-muted-foreground">Bathrooms</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analysisResult.stories || manualStories}</p>
                        <p className="text-sm text-muted-foreground">Stories</p>
                      </div>
                    </div>

                    {analysisResult.sqft && (
                      <p className="text-sm text-muted-foreground">
                        Estimated: ~{analysisResult.sqft} sqft
                      </p>
                    )}

                    {/* Manual Override for low confidence */}
                    {allowManualOverride && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-yellow-800 mb-3">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Low confidence detected. Please verify the details:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Bedrooms</Label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={manualBedrooms}
                              onChange={(e) => setManualBedrooms(parseInt(e.target.value))}
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Bathrooms</Label>
                            <input
                              type="number"
                              min="1"
                              max="4"
                              step="0.5"
                              value={manualBathrooms}
                              onChange={(e) => setManualBathrooms(parseFloat(e.target.value))}
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Stories</Label>
                            <input
                              type="number"
                              min="1"
                              max="3"
                              value={manualStories}
                              onChange={(e) => setManualStories(parseInt(e.target.value))}
                              className="w-full p-2 border rounded"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BulkSnap specific results */}
                {serviceType === 'bulksnap' && analysisResult.identifiedItems && (
                  <div className="text-left">
                    <p className="font-semibold mb-2">Identified Items:</p>
                    <ul className="text-sm space-y-1">
                      {analysisResult.identifiedItems.slice(0, 5).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                      {analysisResult.identifiedItems.length > 5 && (
                        <li className="text-muted-foreground">
                          + {analysisResult.identifiedItems.length - 5} more items
                        </li>
                      )}
                    </ul>
                    {analysisResult.estimatedVolume && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Estimated: ~{analysisResult.estimatedVolume} cubic ft
                      </p>
                    )}
                  </div>
                )}

                {/* Price Estimate */}
                {analysisResult.suggestedPrice && (
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-2">Estimated Price</p>
                    {analysisResult.suggestedPriceMin && analysisResult.suggestedPriceMax ? (
                      <p className="text-4xl font-bold text-primary">
                        ${analysisResult.suggestedPriceMin} - ${analysisResult.suggestedPriceMax}
                      </p>
                    ) : (
                      <p className="text-4xl font-bold text-primary">
                        ${analysisResult.suggestedPrice}
                      </p>
                    )}
                  </div>
                )}

                {/* AI Reasoning */}
                <details className="mt-4 text-left">
                  <summary className="text-sm cursor-pointer text-muted-foreground">
                    How was this calculated?
                  </summary>
                  <p className="text-xs text-muted-foreground mt-2">
                    {analysisResult.reasoning}
                  </p>
                </details>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setAnalysisResult(null)}>
              Start Over
            </Button>
            <Button onClick={generateQuoteFromAI}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm & Continue
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
