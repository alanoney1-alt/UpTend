/**
 * Quote Path Selector
 *
 * Allows customers to choose between:
 * - Path A: AI scan (photos/video)
 * - Path B: Manual form entry
 *
 * Path C (chat/SMS/phone) is handled separately by the chatbot/SMS systems
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIScanQuote } from "./ai-scan-quote";
import { ManualQuoteForm } from "./manual-quote-form";
import { type PricingQuote } from "@/lib/pricing-quote";
import { Camera, FileText, Sparkles, Clock } from "lucide-react";

interface QuotePathSelectorProps {
  serviceType: 'polishup' | 'bulksnap' | 'freshwash' | 'gutterflush';
  onQuoteGenerated: (quote: PricingQuote) => void;
  onBack?: () => void;
}

type QuotePath = 'select' | 'ai_scan' | 'manual_form';

export function QuotePathSelector({ serviceType, onQuoteGenerated, onBack }: QuotePathSelectorProps) {
  const [selectedPath, setSelectedPath] = useState<QuotePath>('select');

  if (selectedPath === 'ai_scan') {
    return (
      <AIScanQuote
        serviceType={serviceType}
        onQuoteGenerated={onQuoteGenerated}
        onBack={() => setSelectedPath('select')}
      />
    );
  }

  if (selectedPath === 'manual_form') {
    // Only PolishUp supports manual form currently
    if (serviceType === 'polishup') {
      return (
        <ManualQuoteForm
          serviceType={serviceType}
          onQuoteGenerated={onQuoteGenerated}
        />
      );
    }

    // For other services, show a message
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
          <CardDescription>
            Manual entry is not available for this service yet. Please use AI scan or contact us for a quote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setSelectedPath('select')}>
              Back
            </Button>
            <Button onClick={() => setSelectedPath('ai_scan')}>
              Try AI Scan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Path selection screen
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">How would you like your quote?</h2>
        <p className="text-muted-foreground">
          Choose the method that works best for you
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* AI Scan Path */}
        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-lg relative overflow-hidden"
          onClick={() => setSelectedPath('ai_scan')}
        >
          <Badge className="absolute top-4 right-4" variant="default">
            <Sparkles className="w-3 h-3 mr-1" />
            Recommended
          </Badge>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>AI Quote from Photos/Video</CardTitle>
            <CardDescription>
              Most accurate • Instant results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                Upload photos or record a quick video
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                Our AI analyzes and calculates instantly
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                Get precise pricing instantly
              </li>
            </ul>

            {serviceType === 'polishup' && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>For Home Cleaning:</strong> AI detects room count, square footage, and condition from your photos
                </p>
              </div>
            )}

            {serviceType === 'bulksnap' && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>For Junk Removal:</strong> AI identifies all items and estimates volume automatically
                </p>
              </div>
            )}

            {serviceType === 'freshwash' && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>For Pressure Washing:</strong> AI calculates square footage from your surface photos
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Quick &amp; easy</span>
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry Path */}
        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
          onClick={() => setSelectedPath('manual_form')}
        >
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <CardTitle>Manual Entry</CardTitle>
            <CardDescription>
              No photos needed • Quick estimate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5" />
                Fill out a simple form
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5" />
                Enter property details manually
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-1.5" />
                See live pricing as you type
              </li>
            </ul>

            {serviceType === 'polishup' ? (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>For Home Cleaning:</strong> Enter bedrooms, bathrooms, and home details
                </p>
              </div>
            ) : (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">Coming soon</Badge>
                  <span className="ml-2">Manual entry for this service</span>
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">~2 minutes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alternative: Chat/SMS mention */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            Prefer to talk? Text us at{" "}
            <a href="sms:+1234567890" className="text-primary hover:underline font-medium">
              (123) 456-7890
            </a>{" "}
            or use our chat for a personalized quote
          </p>
        </CardContent>
      </Card>

      {onBack && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={onBack}>
            Back to Service Selection
          </Button>
        </div>
      )}
    </div>
  );
}
