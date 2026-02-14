import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { MultiPhotoUpload } from "@/components/photo-upload";
import { AIQuoteDisplay } from "./ai-quote-display";
import { ManualQuoteForm } from "./manual-quote-form";
import { HandymanTaskSelector } from "./handyman-task-selector";
import { ServiceFlowRouter, type ServiceFlowResult } from "./service-flows";
import { ServiceScheduling, type SchedulingData } from "./service-scheduling";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight, ShieldCheck, Leaf, Sparkles, Pencil,
  Truck, Waves, ArrowUpFromLine, Package, Search, TrendingUp,
  Loader2, Home, BedDouble, Bath, Ruler, Calendar, Droplets,
  Camera, CheckCircle, Video, ClipboardCheck, Trees, Wrench,
} from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

interface ServicePricing {
  id: string;
  name: string;
  price: string;
  description: string;
  benefit: string;
  icon: typeof Truck;
  featured?: boolean;
}

const pricingServices: ServicePricing[] = [
  {
    id: "home_consultation",
    name: "AI Home Scan",
    price: "$99 / $249",
    description: "Complete home documentation: Standard ($99) interior walkthrough or Aerial ($249) with drone footage. $49 back on your next booking.",
    benefit: "Protects property value • Insurance-ready documentation • $49 credit with first booking",
    icon: ClipboardCheck,
    featured: true,
  },
  {
    id: "handyman",
    name: "Handyman Services",
    price: "$75/hr • 1hr min",
    description: "Verified local handyman for repairs, assembly, mounting, painting, and home improvements. Billed by the minute after first hour.",
    benefit: "No task too small • Same-day available • Background checked pros",
    icon: Wrench,
  },
  {
    id: "junk_removal",
    name: "Junk Removal",
    price: "From $99",
    description: "Professional debris removal with verified ESG tracking and sustainability reporting.",
    benefit: "Clears yard hazards & storm-risk items • Eco-friendly disposal",
    icon: Truck,
  },
  {
    id: "garage_cleanout",
    name: "Garage Cleanout",
    price: "From $299",
    description: "Complete garage cleanout with sorting, hauling, and organization assistance.",
    benefit: "Reclaim valuable space • Prepare for sale or storage",
    icon: Home,
  },
  {
    id: "moving_labor",
    name: "Moving Labor",
    price: "$80/hr",
    description: "Hourly labor for loading, unloading, packing, and heavy lifting assistance.",
    benefit: "Flexible hourly rates • Professional muscle when needed",
    icon: Package,
  },
  {
    id: "home_cleaning",
    name: "Home Cleaning",
    price: "From $99",
    description: "Deep cleaning services for your entire home with eco-friendly products.",
    benefit: "Maintains home health • Move-in/out ready",
    icon: Sparkles,
  },
  {
    id: "carpet_cleaning",
    name: "Carpet Cleaning",
    price: "Professional deep cleaning",
    description: "Professional carpet and upholstery cleaning with advanced extraction methods.",
    benefit: "Removes allergens • Extends carpet life",
    icon: Home,
  },
  {
    id: "landscaping",
    name: "Landscaping",
    price: "Competitive rates",
    description: "Professional lawn care, trimming, edging, and yard maintenance services.",
    benefit: "Maintains curb appeal • Prevents code violations",
    icon: Trees,
  },
  {
    id: "gutter_cleaning",
    name: "Gutter Cleaning",
    price: "From $129",
    description: "Complete gutter cleaning with flow testing and debris removal for all perimeters.",
    benefit: "Prevents foundation erosion • Protects against water damage",
    icon: Waves,
  },
  {
    id: "pressure_washing",
    name: "Pressure Washing",
    price: "From $120",
    description: "Eco-friendly pressure washing for driveways, siding, decks, and patios.",
    benefit: "Prevents mold & mildew • Identifies structural issues early",
    icon: Droplets,
  },
  {
    id: "pool_cleaning",
    name: "Pool Cleaning",
    price: "From $89/mo",
    description: "Basic ($89/mo), Standard ($129/mo), Full Service ($169/mo), or One-Time Deep Clean ($199).",
    benefit: "Crystal clear water • Equipment longevity",
    icon: Droplets,
  },
  {
    id: "light_demolition",
    name: "Light Demolition",
    price: "From $199",
    description: "Light demolition services for sheds, decks, fencing, and small structures.",
    benefit: "Safe removal • Permits handled • Debris hauled",
    icon: Truck,
  },
];


interface ZillowProperty {
  zpid: number;
  address: string;
  zestimate: number | null;
  rentZestimate: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  livingArea: number | null;
  lotAreaValue: number | null;
  lotAreaUnit: string | null;
  yearBuilt: number | null;
  homeType: string | null;
  homeStatus: string | null;
  imgSrc: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface FloridaEstimatorProps {
  preselectedService?: string;
  preselectedTiming?: string;
}

export function FloridaEstimator({ preselectedService, preselectedTiming }: FloridaEstimatorProps = {}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [propertyData, setPropertyData] = useState<ZillowProperty | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(false);
  const [, setLocation] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Property details (user-entered)
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sqft, setSqft] = useState("");
  const [stories, setStories] = useState("");

  // New state for quote flow
  const [selectedService, setSelectedService] = useState<string | null>(preselectedService ?? null);
  const [schedulingData, setSchedulingData] = useState<SchedulingData | null>(null);
  const [quoteMethod, setQuoteMethod] = useState<"ai" | "manual" | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"photos" | "video">("photos");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [aiQuote, setAiQuote] = useState<any | null>(null);
  const [manualEstimate, setManualEstimate] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);


  // Restore booking state after auth flow
  useEffect(() => {
    const saved = sessionStorage.getItem('pendingBooking');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.address) setAddress(state.address);
        if (state.selectedService) setSelectedService(state.selectedService);
        if (state.manualEstimate) setManualEstimate(state.manualEstimate);
        if (state.aiQuote) setAiQuote(state.aiQuote);
        if (state.propertyData) setPropertyData(state.propertyData);
        if (state.bedrooms) setBedrooms(state.bedrooms);
        if (state.bathrooms) setBathrooms(state.bathrooms);
        if (state.sqft) setSqft(state.sqft);
        if (state.stories) setStories(state.stories);
        setStep(6);
        sessionStorage.removeItem('pendingBooking');
      } catch (e) {
        console.error('Failed to restore booking state:', e);
      }
    }
  }, []);

  // Scroll to top on step change — immediate jump, no smooth scroll
  useEffect(() => {
    window.scrollTo(0, 0);
    // Also reset any scrollable containers
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [step]);

  const fetchPropertyValue = async (addr: string) => {
    setPropertyLoading(true);
    try {
      const params = new URLSearchParams({ address: addr });
      const res = await fetch(`/api/property/zillow?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.property) {
          setPropertyData(data.property);
          // Auto-fill property details from Zillow data
          const p = data.property as ZillowProperty;
          if (p.bedrooms && !bedrooms) {
            setBedrooms(p.bedrooms >= 5 ? "5+" : String(p.bedrooms));
          }
          if (p.bathrooms && !bathrooms) {
            setBathrooms(p.bathrooms >= 4 ? "4+" : String(p.bathrooms));
          }
          if (p.livingArea && !sqft) {
            const area = p.livingArea;
            if (area < 1000) setSqft("<1000");
            else if (area < 1500) setSqft("1000-1500");
            else if (area < 2000) setSqft("1500-2000");
            else if (area < 2500) setSqft("2000-2500");
            else if (area < 3000) setSqft("2500-3000");
            else setSqft("3000+");
          }
        }
      }
    } catch (err) {
      console.error("Property lookup failed:", err);
    } finally {
      setPropertyLoading(false);
    }
  };

  const handleScan = () => {
    if (address.trim().length > 5) {
      window.scrollTo(0, 0);
      setStep(2);
      fetchPropertyValue(address);
    }
  };


  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    window.scrollTo(0, 0);
    setStep(3);
  };

  const extractVideoFrames = async (videoFile: File, maxFrames = 12): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];

      video.preload = 'metadata';
      video.src = URL.createObjectURL(videoFile);

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const interval = duration / maxFrames;
        let currentTime = 0;

        const captureFrame = () => {
          if (currentTime >= duration || frames.length >= maxFrames) {
            URL.revokeObjectURL(video.src);
            resolve(frames);
            return;
          }

          video.currentTime = currentTime;
        };

        video.onseeked = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          currentTime += interval;
          captureFrame();
        };

        captureFrame();
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };
    });
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, MOV, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be under 100MB. Try recording a shorter video.",
        variant: "destructive",
      });
      return;
    }

    setUploadedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleAnalyzeVideo = async () => {
    if (!uploadedVideo) {
      toast({
        title: "No video uploaded",
        description: "Please upload a video to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Extract frames from video
      const frames = await extractVideoFrames(uploadedVideo);

      if (frames.length === 0) {
        throw new Error("No frames could be extracted from video");
      }

      const response = await fetch("/api/ai/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames,
          serviceType: selectedService === "material-recovery" ? "junk_removal" : selectedService,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze video");
      }

      const quoteData = await response.json();
      setAiQuote(quoteData); // Backend returns ID for video too
    } catch (error) {
      console.error("AI video analysis error:", error);
      setAnalysisError("Failed to analyze video. Please try again or use photos instead.");
      toast({
        title: "Analysis failed",
        description: "Unable to analyze video. Please try photos or manual entry.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzePhotos = async () => {
    if (uploadedPhotos.length === 0) {
      toast({
        title: "No photos uploaded",
        description: "Please upload at least one photo to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/ai/analyze-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls: uploadedPhotos,
          serviceType: selectedService === "material-recovery" ? "junk_removal" : selectedService,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze photos");
      }

      const quoteData = await response.json();
      setAiQuote(quoteData); // Use backend-generated ID, don't overwrite it
    } catch (error) {
      console.error("AI analysis error:", error);
      setAnalysisError("Failed to analyze photos. Please try again or use manual entry.");
      toast({
        title: "Analysis failed",
        description: "Unable to analyze photos. Please try again or choose manual entry.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveBookingState = () => {
    const bookingState = {
      address,
      selectedService,
      step: 5,
      manualEstimate,
      aiQuote,
      propertyData,
      bedrooms,
      bathrooms,
      sqft,
      stories,
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingState));
  };

  const goToAuthGate = () => {
    saveBookingState();
    const params = new URLSearchParams({ redirect: "/book" });
    if (selectedService) params.set("service", selectedService);
    setLocation("/customer-signup?" + params.toString());
  };

  const goToLoginFromAuthGate = () => {
    saveBookingState();
    const params = new URLSearchParams({ redirect: "/book" });
    if (selectedService) params.set("service", selectedService);
    setLocation("/customer-login?" + params.toString());
  };

  if (step === 1) {
    return (
      <div className="w-full max-w-2xl mx-auto" data-testid="widget-florida-estimator" ref={wrapperRef}>
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight" data-testid="text-explainer-headline">
            {t("estimator.explainer_headline")}
          </h2>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed" data-testid="text-explainer-details">
            {t("estimator.explainer_details")}
          </p>
        </div>

        <div
          className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200 dark:border-slate-700"
          data-testid="form-address-input"
        >
          <div className="flex-1 w-full">
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelectAddress={(selectedAddress) => {
                setAddress(selectedAddress);
                // Auto-advance to step 2 after address selection
                if (selectedAddress.trim().length > 5) {
                  window.scrollTo(0, 0);
                  setStep(2);
                  fetchPropertyValue(selectedAddress);
                }
              }}
              placeholder={t("estimator.enter_address")}
              inputClassName="border-none shadow-none focus-visible:ring-0 text-lg bg-transparent h-12"
              icon={true}
            />
          </div>
          <Button
            onClick={handleScan}
            className="bg-primary text-primary-foreground border-primary font-bold w-full sm:w-auto"
            size="lg"
            data-testid="button-scan-property"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t("estimator.scan_property")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-6 justify-center mt-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium" data-testid="trust-no-login">
            <ShieldCheck className="w-4 h-4 text-primary" /> {t("estimator.no_login_required")}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium" data-testid="trust-free">
            <Leaf className="w-4 h-4 text-green-500" /> {t("estimator.free_estimate")}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium" data-testid="trust-instant">
            <TrendingUp className="w-4 h-4 text-primary" /> {t("estimator.instant_results")}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Service Scheduling
  if (step === 3) {
    const selectedServiceName = pricingServices.find(s => s.id === selectedService)?.name || "Service";

    return (
      <ServiceScheduling
        serviceName={selectedServiceName}
        defaultTiming={preselectedTiming}
        onComplete={(data) => {
          setSchedulingData(data);
          setStep(4);
        }}
        onBack={() => setStep(2)}
      />
    );
  }

  // Step 4: Quote Method Selection
  if (step === 4) {
    return (
      <div className="w-full max-w-2xl mx-auto" data-testid="widget-quote-method-selection">
        <div className="text-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(3)}
            className="mb-4"
          >
            ← Back to scheduling
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            How would you like your quote?
          </h2>
          <p className="text-base md:text-lg text-slate-300">
            Choose the method that works best for you
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* AI Quote Option */}
          <Card
            className="cursor-pointer hover:border-primary transition-all p-6"
            onClick={() => {
              setQuoteMethod("ai");
              setStep(5);
            }}
            data-testid="card-ai-quote"
          >
            <CardContent className="p-0">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">AI Quote from Photos</h3>
                  <Badge className="mb-3">Recommended</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload photos or video and get an instant AI-powered quote with itemized breakdown
                  </p>
                  <ul className="text-xs text-left space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Most accurate pricing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Sustainability metrics included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Instant results in seconds</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Quote Option */}
          <Card
            className="cursor-pointer hover:border-primary transition-all p-6"
            onClick={() => {
              setQuoteMethod("manual");
              setStep(5);
            }}
            data-testid="card-manual-quote"
          >
            <CardContent className="p-0">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <Pencil className="w-8 h-8 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Manual Entry</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Describe what you need and get a preliminary estimate
                  </p>
                  <ul className="text-xs text-left space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span>No photos required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span>Quick estimate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span>Pro confirms on-site</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 5: Quote Generation (AI or Manual)
  if (step === 5) {
    if (quoteMethod === "ai" && !aiQuote) {
      return (
        <div className="w-full max-w-2xl mx-auto" data-testid="widget-ai-quote-upload">
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(4)}
              className="mb-4"
            >
              ← Back to quote method
            </Button>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Upload Photos or Video
            </h2>
            <p className="text-base md:text-lg text-slate-300">
              Show us what needs to be removed and our AI will analyze it instantly
            </p>
          </div>

          <Card className="p-6">
            <CardContent className="p-0 space-y-6">
              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "photos" | "video")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="photos" className="gap-2">
                    <Camera className="w-4 h-4" />
                    Photos
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2">
                    <Video className="w-4 h-4" />
                    Video ⭐
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photos" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Upload Photos</h3>
                    <p className="text-sm text-muted-foreground">
                      Take photos of items to be removed. Best for individual items or specific areas.
                    </p>
                  </div>

                  <MultiPhotoUpload
                    label="Upload up to 5 photos"
                    description="Our AI will analyze them and provide an itemized quote."
                    onPhotosChange={setUploadedPhotos}
                    maxPhotos={5}
                    accept="image/*"
                    testId="photo-upload-ai-quote"
                  />

                  {uploadedPhotos.length > 0 && (
                    <Button
                      onClick={handleAnalyzePhotos}
                      disabled={isAnalyzing}
                      className="w-full"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing photos...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyze Photos & Get Quote
                        </>
                      )}
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="video" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Video Walkthrough</h3>
                      <Badge className="bg-primary">Recommended</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Record a 30-60 second walkthrough. Better for large spaces, shows scale, gives +5% confidence boost.
                    </p>
                  </div>

                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Recording Tips:
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                      <li>Walk through the space slowly, panning across all items</li>
                      <li>Show the full area (garage, yard, room)</li>
                      <li>Include a person or doorway for scale reference</li>
                      <li>Narrate if helpful: "This pile is about 6 feet tall"</li>
                      <li>Max 60 seconds, under 100MB</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => document.getElementById('video-upload')?.click()}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        {uploadedVideo ? "Change Video" : "Select Video"}
                      </Button>
                    </label>

                    {videoPreview && (
                      <div className="space-y-3">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full rounded-lg border"
                          style={{ maxHeight: "300px" }}
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Preview • {uploadedVideo?.name}
                        </p>
                      </div>
                    )}

                    {uploadedVideo && (
                      <Button
                        onClick={handleAnalyzeVideo}
                        disabled={isAnalyzing}
                        className="w-full"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing video...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analyze Video & Get Quote
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {analysisError && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
                  {analysisError}
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {uploadMethod === "video"
                      ? "Our AI is extracting frames and analyzing your video..."
                      : "Our AI is analyzing your photos..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploadMethod === "video"
                      ? "Extracting frames • De-duplicating items • Calculating volume • Estimating price"
                      : "Identifying items • Calculating volume • Estimating price"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (quoteMethod === "ai" && aiQuote) {
      return (
        <div className="w-full max-w-2xl mx-auto" data-testid="widget-ai-quote-display">
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiQuote(null)}
              className="mb-4"
            >
              ← Back to upload
            </Button>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Your AI-Powered Quote
            </h2>
            <p className="text-base md:text-lg text-slate-300">
              Based on analysis of your photos
            </p>
          </div>

          <AIQuoteDisplay
            quote={aiQuote}
            serviceType={selectedService || ""}
            onBook={() => setStep(6)}
          />
        </div>
      );
    }

    if (quoteMethod === "manual") {
      const serviceName = pricingServices.find(s => s.id === selectedService)?.name || "Service";
      return (
        <div className="w-full max-w-2xl mx-auto" data-testid="widget-manual-quote">
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(4)}
              className="mb-4"
            >
              ← Back to quote method
            </Button>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Build Your {serviceName} Quote
            </h2>
          </div>

          <ServiceFlowRouter
            serviceId={selectedService || ""}
            propertyData={{
              bedrooms: bedrooms ? (bedrooms === '5+' ? 5 : Number(bedrooms)) : propertyData?.bedrooms ?? null,
              bathrooms: bathrooms ? (bathrooms === '4+' ? 4 : Number(bathrooms)) : propertyData?.bathrooms ?? null,
              livingArea: sqft ? null : propertyData?.livingArea ?? null,
              sqftRange: sqft || undefined,
              stories: stories || undefined,
            }}
            onComplete={(result: ServiceFlowResult) => {
              setManualEstimate({
                quoteMethod: "manual",
                serviceType: selectedService,
                estimatedPrice: result.estimatedPrice,
                monthlyPrice: result.monthlyPrice,
                isRecurring: result.isRecurring,
                userInputs: result.userInputs,
                lineItems: result.lineItems,
                discounts: result.discounts,
                requiresHitlValidation: result.requiresHitlValidation,
              });
              setStep(6);
            }}
            onBack={() => setStep(4)}
          />
        </div>
      );
    }
  }

  // Step 6: Auth Gate
  if (step === 6) {
    return (
      <div className="w-full max-w-2xl mx-auto" data-testid="widget-auth-gate">
        <div className="text-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(5)}
            className="mb-4 text-slate-300 hover:text-white"
            data-testid="button-back-edit-selections"
          >
            ← Edit Selections
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to Book Your Service
          </h2>
          <p className="text-base md:text-lg text-slate-300">
            Create an account to book your verified UpTend Pro
          </p>
        </div>

        <Card className="p-6">
          <CardContent className="p-0 space-y-6">
            {/* Show quote summary */}
            {aiQuote && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your AI Quote</p>
                <p className="text-3xl font-bold text-primary">
                  ${aiQuote.suggestedPriceMin} - ${aiQuote.suggestedPriceMax}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  for {selectedService}
                </p>
              </div>
            )}

            {manualEstimate && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {manualEstimate.isRecurring ? "Your Monthly Quote" : "Your Preliminary Estimate"}
                </p>
                <p className="text-3xl font-bold text-primary">
                  ${manualEstimate.monthlyPrice || manualEstimate.estimatedPrice}
                  {manualEstimate.isRecurring && <span className="text-sm font-normal">/mo</span>}
                </p>
                {manualEstimate.lineItems?.length > 0 && (
                  <div className="text-left mt-3 space-y-1 border-t pt-2">
                    {manualEstimate.lineItems.slice(0, 5).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.label}</span>
                        {item.price > 0 && <span>${item.price * (item.quantity || 1)}</span>}
                      </div>
                    ))}
                    {manualEstimate.lineItems.length > 5 && (
                      <p className="text-xs text-muted-foreground">+{manualEstimate.lineItems.length - 5} more items</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Pro will confirm final price on-site
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium">What happens next:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Verified Pro dispatched to your location</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Track your job live with real-time updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Eco-friendly disposal with verified tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Digital receipt with ESG impact certificate</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={goToAuthGate}
                className="flex-1"
                size="lg"
                data-testid="button-book-quote"
              >
                Create Account & Book <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                onClick={goToLoginFromAuthGate}
                variant="outline"
                className="flex-1"
                size="lg"
                data-testid="button-login-book"
              >
                Log In & Book
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <>
      <div
        className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700"
        data-testid="widget-estimate-results"
      >
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="text-center flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2" data-testid="text-report-label">
              {t("estimator.available_services")}
            </h2>
            <p className="text-muted-foreground font-medium" data-testid="text-report-address">{address}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStep(1); setPropertyData(null); }}
            data-testid="button-edit-address"
          >
            <Pencil className="w-3 h-3 mr-1" /> {t("estimator.edit")}
          </Button>
        </div>

        {/* Property Details Form */}
        <Card className="mb-6" data-testid="card-property-details">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Home className="w-4 h-4" /> Property Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Bedrooms</label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-bedrooms"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Bathrooms</label>
                <select
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-bathrooms"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3</option>
                  <option value="3.5">3.5</option>
                  <option value="4+">4+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Approx. Sq Ft</label>
                <select
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-sqft"
                >
                  <option value="">Select</option>
                  <option value="<1000">&lt;1,000</option>
                  <option value="1000-1500">1,000–1,500</option>
                  <option value="1500-2000">1,500–2,000</option>
                  <option value="2000-2500">2,000–2,500</option>
                  <option value="2500-3000">2,500–3,000</option>
                  <option value="3000+">3,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stories</label>
                <select
                  value={stories}
                  onChange={(e) => setStories(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-stories"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured: AI Home Scan */}
        {pricingServices.filter(s => s.featured).map((service) => (
          <div
            key={service.id}
            className="mb-6 p-6 rounded-lg border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl"
            data-testid={`card-service-${service.id}`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <service.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <Badge className="mb-2 bg-primary">Featured</Badge>
                    <h3 className="text-xl font-bold">{service.name}</h3>
                    <p className="text-lg font-semibold text-primary mt-1">{service.price}</p>
                  </div>
                </div>
                <p className="text-sm mb-2 text-muted-foreground">{service.description}</p>
                <p className="text-xs text-primary font-medium">✓ {service.benefit}</p>
                <Button
                  onClick={() => handleServiceSelect(service.id)}
                  className="mt-4 w-full"
                  size="lg"
                >
                  Select AI Home Scan <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-sm text-muted-foreground font-medium">All Services</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricingServices.filter(s => !s.featured).map((service) => (
            <div
              key={service.id}
              className="p-4 md:p-5 rounded-md border transition-all flex flex-col items-start justify-between gap-3 bg-card border-border hover:border-primary cursor-pointer"
              data-testid={`card-service-${service.id}`}
              onClick={() => handleServiceSelect(service.id)}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-md shrink-0 bg-muted">
                  <service.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-black text-sm md:text-base" data-testid={`text-service-name-${service.id}`}>{service.name}</h4>
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    {service.description}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1 text-primary">
                    {service.benefit}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 w-full border-t pt-3 border-border">
                <div className="text-left">
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                    {t("estimator.investment")}
                  </span>
                  <span className="text-xl md:text-2xl font-black" data-testid={`text-service-price-${service.id}`}>{service.price}</span>
                </div>
                <Button
                  onClick={(e) => { e.stopPropagation(); handleServiceSelect(service.id); }}
                  size="sm"
                  className="font-bold min-h-[44px]"
                  data-testid={`button-book-${service.id}`}
                >
                  {t("common.get_quote")} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]" data-testid="text-dispatch-notice">
          {t("estimator.dispatch_notice")}
        </p>
      </div>
    </>
  );
}
