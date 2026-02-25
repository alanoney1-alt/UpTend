import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Camera, Loader2, Shield, CheckCircle, Star, Clock, User, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

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

// Simulated matched pro data (would come from smart-match API in production)
const MATCHED_PROS: Record<string, { name: string; rating: number; reviews: number; arrivalMin: number }> = {
  junk_removal: { name: "Marcus", rating: 4.9, reviews: 127, arrivalMin: 35 },
  home_cleaning: { name: "Sofia", rating: 4.8, reviews: 203, arrivalMin: 45 },
  carpet_cleaning: { name: "Derek", rating: 4.9, reviews: 89, arrivalMin: 40 },
  pressure_washing: { name: "Jason", rating: 4.7, reviews: 156, arrivalMin: 50 },
  landscaping: { name: "Carlos", rating: 4.8, reviews: 174, arrivalMin: 30 },
  pool_cleaning: { name: "Tyler", rating: 4.9, reviews: 62, arrivalMin: 55 },
  handyman: { name: "Mike", rating: 4.8, reviews: 231, arrivalMin: 40 },
  gutter_cleaning: { name: "Trey", rating: 4.7, reviews: 98, arrivalMin: 45 },
  moving_labor: { name: "Andre", rating: 4.9, reviews: 145, arrivalMin: 60 },
  garage_cleanout: { name: "Marcus", rating: 4.9, reviews: 127, arrivalMin: 35 },
  light_demolition: { name: "Jason", rating: 4.7, reviews: 156, arrivalMin: 50 },
  home_consultation: { name: "George", rating: 5.0, reviews: 500, arrivalMin: 20 },
};

export function SnapQuote({ inline, onQuoteReceived, className }: SnapQuoteProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [result, setResult] = useState<SnapQuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [awaitingDescription, setAwaitingDescription] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitForAnalysis = useCallback(async (base64: string, desc: string) => {
    setLoading(true);
    setAwaitingDescription(false);
    try {
      const resp = await fetch("/api/snap-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, description: desc }),
      });
      const data = await resp.json();
      if (data.success) {
        setResult(data);
        onQuoteReceived?.(data);
      } else if (resp.status === 429) {
        setError(data.error || "Daily limit reached. Try again tomorrow.");
      } else {
        setError(data.error || "Failed to analyze photo");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [onQuoteReceived]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setBooked(false);
    setDescription("");

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    const base64Reader = new FileReader();
    base64Reader.onload = async () => {
      const base64 = (base64Reader.result as string).split(",")[1];
      setPendingBase64(base64);
      setAwaitingDescription(true);
    };
    base64Reader.readAsDataURL(file);
  }, []);

  // Legacy direct-submit path removed. now goes through description step
  const handleSubmitWithDescription = useCallback(() => {
    if (pendingBase64) {
      submitForAnalysis(pendingBase64, description);
    }
  }, [pendingBase64, description, submitForAnalysis]);

  const handleBookNow = useCallback(async () => {
    if (!result) return;

    if (!user) {
      navigate(`/customer-login?redirect=/snap-quote`);
      return;
    }

    setBooking(true);
    try {
      const resp = await fetch(`/api/snap-quote/${result.snapQuoteId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      if (data.success) {
        setBooked(true);
      } else if (resp.status === 401) {
        navigate(`/customer-login?redirect=/snap-quote`);
      } else {
        setError(data.error || "Booking failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBooking(false);
    }
  }, [result, user, navigate]);

  const handleClick = () => fileRef.current?.click();

  const matchedPro = result
    ? MATCHED_PROS[result.analysis.serviceType] || MATCHED_PROS.handyman
    : null;

  const reset = () => {
    setResult(null);
    setPreview(null);
    setError(null);
    setBooked(false);
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

      {/* Description Step. after photo, before analysis */}
      {awaitingDescription && preview && !loading && !result && (
        <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <img src={preview} alt="Your photo" className="w-full max-h-56 object-cover" />
          <div className="p-5 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">What's the issue?</h3>
            <p className="text-sm text-slate-500">Help George understand what you're seeing. A quick description makes the quote more accurate.</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Faucet leaks when turned off, stain on ceiling won't go away, need this junk removed..."
              className="w-full h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSubmitWithDescription}
                className="flex-1 bg-[#F47C20] hover:bg-[#e06910] text-white font-bold py-3 rounded-xl transition-colors"
              >
                Get My Quote
              </button>
              <button
                onClick={() => { setAwaitingDescription(false); setPendingBase64(null); setPreview(null); }}
                className="px-4 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Retake
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center">George uses your photo + description to identify the service and estimate pricing</p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!result && !loading && !booked && !awaitingDescription && (
        <button
          onClick={handleClick}
          className={cn(
            "w-full border-2 border-dashed border-slate-300 rounded-2xl transition-all hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer flex flex-col items-center justify-center gap-3 bg-white",
            inline ? "p-6" : "p-12"
          )}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                <Camera className="w-10 h-10 text-amber-700" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">
                  {inline ? "Upload a photo" : "Snap a Photo"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Take a picture of any home issue
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          {preview && (
            <img src={preview} alt="Analyzing" className="w-full max-h-56 rounded-xl object-cover" />
          )}
          <div className="w-full space-y-3 animate-pulse py-4">
            <div className="h-5 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-16 bg-muted rounded-xl w-full" />
            <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
          </div>
          <p className="text-sm text-slate-500">Analyzing your photo...</p>
        </div>
      )}

      {/* Error */}
      {error && !result && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => { setError(null); handleClick(); }}
            className="mt-3 text-sm text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Booked Confirmation */}
      {booked && result && matchedPro && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden">
          <div className="bg-green-50 p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-slate-900">You're Booked!</h3>
            <p className="text-slate-600 mt-1">
              {matchedPro.name} is on the way
            </p>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{result.analysis.serviceLabel}</span>
              <span className="text-2xl font-bold text-slate-900">{result.quote.priceDisplay}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Estimated arrival: ~{matchedPro.arrivalMin} min</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4" />
              <span>Price locked. you'll never pay more than {result.quote.priceDisplay}</span>
            </div>
            <button
              onClick={() => navigate("/my-jobs")}
              className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl mt-2"
            >
              View My Jobs
            </button>
          </div>
        </div>
      )}

      {/* Result Card. 1-Tap Book */}
      {result && !booked && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Photo preview */}
          {preview && (
            <div className="relative">
              <img src={preview} alt="Your photo" className="w-full max-h-56 object-cover" />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-slate-700">
                {result.analysis.serviceLabel}
              </div>
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Issue description */}
            <p className="text-slate-600 text-sm">{result.analysis.problemDescription}</p>

            {/* Big price */}
            <div className="text-center py-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Guaranteed Maximum Price</p>
              <p className="text-5xl font-bold text-slate-900 mt-1">{result.quote.priceDisplay}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-amber-700">
                <Shield className="w-4 h-4" />
                <span>Price Protection. you'll never pay more</span>
              </div>
            </div>

            {/* Matched Pro Card */}
            {matchedPro && (
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{matchedPro.name}</span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Available now
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{matchedPro.rating} ({matchedPro.reviews} reviews)</span>
                    <span className="text-slate-300">·</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{matchedPro.arrivalMin} min</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error display within result */}
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            {/* Book Now Button */}
            <button
              onClick={handleBookNow}
              disabled={booking}
              className={cn(
                "w-full py-4 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25",
                booking && "opacity-70 cursor-not-allowed"
              )}
            >
              {booking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Book Now. {result.quote.priceDisplay}
                </>
              )}
            </button>

            {result.confidence === "low" && result.fallbackMessage && (
              <p className="text-sm text-slate-500 text-center">{result.fallbackMessage}</p>
            )}

            {/* Try different photo */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try a different photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SnapQuote;
