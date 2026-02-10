/**
 * Photo-to-Quote Uploader Component
 *
 * Allows customers to upload photos and get instant AI-powered quotes
 * for junk removal, pressure washing, and other visual estimation services
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Image as ImageIcon, Loader2, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PhotoQuoteResult {
  id: string;
  detectedItems: string[];
  estimatedScope: string;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  confidenceScore: number;
}

export function PhotoQuoteUploader({ serviceType }: { serviceType: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [result, setResult] = useState<PhotoQuoteResult | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (photoUrls: string[]) => {
      const res = await fetch("/api/ai/photo-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          photoUrls,
        }),
      });
      if (!res.ok) throw new Error("Failed to analyze photos");
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data.request);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Mock: In production, upload to cloud storage first
    const mockUrls = files.map((file) => URL.createObjectURL(file));
    setPhotos(mockUrls);

    // Auto-submit for analysis
    uploadMutation.mutate(mockUrls);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Get Instant Quote from Photos
        </CardTitle>
        <CardDescription>
          Upload photos and our AI will analyze the job and provide an instant estimate
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Photo Upload */}
        {!result && (
          <div>
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {photos.length === 0 ? (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">Upload Photos</p>
                  <p className="text-xs text-muted-foreground">
                    Up to 10 photos (JPG, PNG, WebP)
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-sm font-medium mb-1">
                    {photos.length} {photos.length === 1 ? "photo" : "photos"} uploaded
                  </p>
                </>
              )}
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadMutation.isPending}
            />
          </div>
        )}

        {/* Analysis Loading */}
        {uploadMutation.isPending && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing photos with AI...
            </div>
            <Progress value={66} />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Confidence Score */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">AI Confidence</span>
              <Badge variant={result.confidenceScore > 0.8 ? "default" : "secondary"}>
                {Math.round(result.confidenceScore * 100)}%
              </Badge>
            </div>

            {/* Price Estimate */}
            <Card className="border-2 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Estimated Price</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  ${result.estimatedPriceMin} - ${result.estimatedPriceMax}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {result.estimatedScope}
                </p>
              </CardContent>
            </Card>

            {/* Detected Items */}
            <div>
              <p className="text-sm font-medium mb-2">Detected Items:</p>
              <div className="flex flex-wrap gap-2">
                {result.detectedItems.map((item, i) => (
                  <Badge key={i} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => {
                // TODO: Convert to service request
                alert("Converting to service request...");
              }}>
                Book This Service
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setPhotos([]);
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
