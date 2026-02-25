import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Camera, Upload, Loader2, Shield, CheckCircle, AlertTriangle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteAdjustment {
  label: string;
  amount: number;
}

interface SnapQuoteResult {
  success: boolean;
  confidence: "high" | "medium" | "low";
  analysis: {
    serviceType: string;
    serviceLabel: string;
    problemDescription: string;
    scopeEstimate: string;
    estimatedHours: number;
  };
  quote: {
    basePrice: number;
    adjustments: QuoteAdjustment[];
    totalPrice: number;
    priceDisplay: string;
    guarantee: string;
  };
  bookingUrl: string;
  snapQuoteId: string;
  fallbackMessage?: string;
}

interface SnapQuoteProps {
  inline?: boolean;
  onQuoteReceived?: (result: SnapQuoteResult) => void;
  className?: string;
}

export function SnapQuote({ inline, onQuoteReceived, className }: SnapQuoteProps) {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SnapQuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Convert to base64
    const base64Reader = new FileReader();
    base64Reader.onload = async () => {
      const base64 = (base64Reader.result as string).split(",")[1];
      setLoading(true);
      try {
        const resp = await fetch("/api/snap-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await resp.json();
        if (data.success) {
          setResult(data);
          onQuoteReceived?.(data);
        } else {
          setError(data.error || "Failed to analyze photo");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    base64Reader.readAsDataURL(file);
  }, [onQuoteReceived]);

  const handleClick = () => fileRef.current?.click();

  const confidenceColor = {
    high: "bg-green-100 text-green-800 border-green-300",
    medium: "bg-amber-100 text-amber-800 border-amber-300",
    low: "bg-red-100 text-red-800 border-red-300",
  };

  const confidenceLabel = {
    high: "High Confidence",
    medium: "Medium Confidence",
    low: "Low Confidence",
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* Upload Area */}
      {!result && !loading && (
        <button
          onClick={handleClick}
          className={cn(
            "w-full border-2 border-dashed border-slate-300 rounded-2xl transition-all hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer flex flex-col items-center justify-center gap-3",
            inline ? "p-6" : "p-12"
          )}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Camera className="w-8 h-8 text-amber-700" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-800">
                  {inline ? "Upload a photo" : "Take or upload a photo"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Snap a picture of any home issue
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          {preview && (
            <img src={preview} alt="Analyzing" className="max-h-32 rounded-lg object-cover opacity-75" />
          )}
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="text-slate-700 font-medium">George is analyzing your photo...</p>
          <p className="text-sm text-slate-500">This takes just a few seconds</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={handleClick}
            className="mt-3 text-sm text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {preview && (
            <img src={preview} alt="Analyzed" className="w-full max-h-48 object-cover" />
          )}

          <div className="p-5 space-y-4">
            {/* Service & Confidence */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {result.analysis.serviceLabel}
              </h3>
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border",
                confidenceColor[result.confidence]
              )}>
                {confidenceLabel[result.confidence]}
              </span>
            </div>

            {/* Description */}
            <p className="text-slate-600 text-sm">{result.analysis.problemDescription}</p>

            {/* Price Breakdown */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Base price</span>
                <span>${result.quote.basePrice}</span>
              </div>
              {result.quote.adjustments.map((adj, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-600">
                  <span>{adj.label}</span>
                  <span>{adj.amount >= 0 ? "+" : ""}${adj.amount}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                <span>Your price</span>
                <span className="text-xl">{result.quote.priceDisplay}</span>
              </div>
            </div>

            {/* Guarantee Badge */}
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{result.quote.guarantee}</span>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              {result.confidence === "high" && (
                <button
                  onClick={() => navigate(result.bookingUrl)}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Book Now — Price Locked at {result.quote.priceDisplay}
                </button>
              )}
              {result.confidence === "medium" && (
                <>
                  <button
                    onClick={() => navigate(result.bookingUrl)}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Book at {result.quote.priceDisplay}
                  </button>
                  <button
                    onClick={() => navigate("/meet-george")}
                    className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Refine Quote with George
                  </button>
                </>
              )}
              {result.confidence === "low" && (
                <button
                  onClick={() => navigate("/meet-george")}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Talk to George for a Custom Quote
                </button>
              )}
            </div>

            {result.fallbackMessage && (
              <p className="text-sm text-slate-500 text-center">{result.fallbackMessage}</p>
            )}

            {/* New Photo */}
            <button
              onClick={() => {
                setResult(null);
                setPreview(null);
                setError(null);
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-700 py-1"
            >
              Try a different photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SnapQuote;
