import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Upload,
  X,
  Loader2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  DollarSign,
  Truck,
  Clock,
} from "lucide-react";

interface DiyGuide {
  feasibility: string;
  steps: string[];
  toolsNeeded: string[];
  estimatedTime: string;
  safetyWarnings: string[];
}

interface QuoteResult {
  serviceType: string;
  scope: string;
  estimatedItems: number;
  priceRange: { min: number; max: number };
  estimatedDuration: string;
  confidence: number;
  details: string;
  diyScore?: number;
  diyGuide?: DiyGuide;
}

export default function PhotoToQuote() {
  usePageTitle("AI Photo Quote | UpTend");
  const [, navigate] = useLocation();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addPhotos = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (newFiles.length === 0) return;
    if (photos.length + newFiles.length > 10) {
      toast({ title: "Maximum 10 photos allowed", variant: "destructive" });
      return;
    }
    setPhotos((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }, [photos.length, toast]);

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast({ title: "Please add at least one photo", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      photos.forEach((p) => formData.append("photos", p));
      if (notes) formData.append("notes", notes);

      const res = await fetch("/api/ai/photo-quote", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast({
        title: "Quote failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!result) return;
    const params = new URLSearchParams({
      service: result.serviceType,
      scope: result.scope,
      estimate: `${result.priceRange.min}-${result.priceRange.max}`,
      source: "ai-photo-quote",
    });
    navigate(`/book?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Back nav */}
        <button
          onClick={() => navigate("/ai")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#F47C20] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> AI Features
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#F47C20]/10 text-[#F47C20] rounded-full px-3 py-1 text-sm font-medium mb-3">
            <Sparkles className="w-4 h-4" /> AI-Powered
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Photo-to-Quote
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Snap photos of items and get an instant AI estimate
          </p>
        </div>

        {!result ? (
          <>
            {/* Upload area */}
            <Card className="p-6 mb-6">
              {previews.length === 0 ? (
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-[#F47C20] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                    Drop photos here or click to upload
                  </p>
                  <p className="text-sm text-gray-400">
                    JPG, PNG up to 10 photos
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {previews.length < 10 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-[#F47C20] transition-colors"
                    >
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addPhotos(e.target.files)}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => addPhotos(e.target.files)}
              />

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" /> Camera
                </Button>
              </div>
            </Card>

            {/* Notes */}
            <Card className="p-6 mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Additional notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the items, location, access details..."
                rows={3}
              />
            </Card>

            <Button
              className="w-full bg-[#F47C20] hover:bg-[#e06b10] text-white h-12 text-base"
              onClick={handleSubmit}
              disabled={loading || photos.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing photos...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get AI Quote
                </>
              )}
            </Button>
          </>
        ) : (
          /* Result */
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    AI Estimate Ready
                  </h2>
                  <p className="text-sm text-gray-500">
                    {Math.round(result.confidence * 100)}% confidence
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Truck className="w-4 h-4" /> Service
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {result.serviceType}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4" /> Price Range
                  </div>
                  <p className="font-semibold text-[#F47C20]">
                    ${result.priceRange.min} – ${result.priceRange.max}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Clock className="w-4 h-4" /> Duration
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {result.estimatedDuration}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    Scope
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {result.scope}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {result.details}
              </p>

              {/* DIY Triage Section */}
              {typeof result.diyScore === "number" && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      DIY Feasibility
                    </span>
                    <span className={`text-sm font-semibold ${
                      result.diyScore > 70 ? "text-green-600" :
                      result.diyScore >= 40 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {result.diyScore}/100
                    </span>
                  </div>
                  {/* Meter bar */}
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        result.diyScore > 70 ? "bg-green-500" :
                        result.diyScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${result.diyScore}%` }}
                    />
                  </div>
                  <p className={`text-sm font-medium mb-2 ${
                    result.diyScore > 70 ? "text-green-700 dark:text-green-400" :
                    result.diyScore >= 40 ? "text-yellow-700 dark:text-yellow-400" :
                    "text-red-700 dark:text-red-400"
                  }`}>
                    {result.diyGuide?.feasibility || (
                      result.diyScore > 70 ? "You could probably handle this yourself" :
                      result.diyScore >= 40 ? "Some DIY experience needed" :
                      "Best left to a pro"
                    )}
                  </p>

                  {/* DIY Steps (show when score >= 40) */}
                  {result.diyScore >= 40 && result.diyGuide?.steps && result.diyGuide.steps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick DIY Steps</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {result.diyGuide.steps.map((step, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{step}</li>
                        ))}
                      </ol>
                      {result.diyGuide.toolsNeeded && result.diyGuide.toolsNeeded.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          🔧 Tools: {result.diyGuide.toolsNeeded.join(", ")}
                        </p>
                      )}
                      {result.diyGuide.estimatedTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          ⏱️ Estimated time: {result.diyGuide.estimatedTime}
                        </p>
                      )}
                      {result.diyGuide.safetyWarnings && result.diyGuide.safetyWarnings.length > 0 && (
                        <div className="mt-2">
                          {result.diyGuide.safetyWarnings.map((w, i) => (
                            <p key={i} className="text-xs text-red-600 dark:text-red-400">⚠️ {w}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Book a Pro CTA — always visible */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-[#F47C20] hover:bg-[#e06b10] text-white"
                  onClick={handleBookNow}
                >
                  {result.diyScore && result.diyScore > 70
                    ? <>Or Book a Pro — ${result.priceRange.min}+ <ArrowRight className="w-4 h-4 ml-2" /></>
                    : <>Book a Pro <ArrowRight className="w-4 h-4 ml-2" /></>
                  }
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setPhotos([]);
                    setPreviews([]);
                    setNotes("");
                  }}
                >
                  New Quote
                </Button>
              </div>
            </Card>

            {/* Photo thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
