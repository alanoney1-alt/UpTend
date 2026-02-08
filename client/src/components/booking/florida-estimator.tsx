import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { MultiPhotoUpload } from "@/components/photo-upload";
import { AIQuoteDisplay } from "./ai-quote-display";
import { ManualQuoteForm } from "./manual-quote-form";
import {
  ArrowRight, ShieldCheck, Leaf, Sparkles, Pencil,
  Truck, Waves, ArrowUpFromLine, Package, Search, TrendingUp,
  Loader2, Home, BedDouble, Bath, Ruler, Calendar, Droplets,
  Camera, CheckCircle, Video,
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
    id: "health-audit",
    name: "Home Health Audit",
    price: "$49",
    description: "Comprehensive 360\u00B0 Video Manifest & Insurance Asset Log.",
    benefit: "Shields your property value for future claims.",
    icon: ShieldCheck,
    featured: true,
  },
  {
    id: "material-recovery",
    name: "Material Recovery",
    price: "From $99",
    description: "Professional debris removal with verified ESG tracking.",
    benefit: "Clears yard hazards & storm-risk missiles.",
    icon: Truck,
  },
  {
    id: "gutter-flush",
    name: "Gutter Protection",
    price: "From $120",
    description: "Flow testing and debris clearing for all perimeters.",
    benefit: "Prevents foundation erosion and water damage.",
    icon: Waves,
  },
  {
    id: "surface-wash",
    name: "Surface Rejuvenation",
    price: "From $150",
    description: "Eco-friendly pressure washing for siding and driveways.",
    benefit: "Reflects heat and identifies structural cracks early.",
    icon: Droplets,
  },
  {
    id: "staging-labor",
    name: "Staging & Moving",
    price: "From $80/hr",
    description: "Professional labor for heavy lifting or storm staging.",
    benefit: "Protects your furniture and high-value interior assets.",
    icon: Package,
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

export function FloridaEstimator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [propertyData, setPropertyData] = useState<ZillowProperty | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(false);
  const [, setLocation] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // New state for quote flow
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [quoteMethod, setQuoteMethod] = useState<"ai" | "manual" | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [aiQuote, setAiQuote] = useState<any | null>(null);
  const [manualEstimate, setManualEstimate] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const serviceNameKey: Record<string, string> = {
    "health-audit": "services.service_health_audit",
    "material-recovery": "services.service_material_recovery",
    "gutter-flush": "services.service_gutter",
    "surface-wash": "services.service_surface",
    "staging-labor": "services.service_staging",
  };
  const serviceDescKey: Record<string, string> = {
    "health-audit": "services.service_health_audit_desc",
    "material-recovery": "services.service_material_recovery_desc",
    "gutter-flush": "services.service_gutter_desc",
    "surface-wash": "services.service_surface_desc",
    "staging-labor": "services.service_staging_desc",
  };
  const serviceBenefitKey: Record<string, string> = {
    "health-audit": "services.service_health_audit_benefit",
    "material-recovery": "services.service_material_recovery_benefit",
    "gutter-flush": "services.service_gutter_benefit",
    "surface-wash": "services.service_surface_benefit",
    "staging-labor": "services.service_staging_benefit",
  };

  const fetchPropertyValue = async (addr: string) => {
    setPropertyLoading(true);
    try {
      const params = new URLSearchParams({ address: addr });
      const res = await fetch(`/api/property/zillow?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.property) {
          setPropertyData(data.property);
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
      setStep(2);
      fetchPropertyValue(address);
    }
  };


  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep(3);
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
      setAiQuote({ ...quoteData, id: crypto.randomUUID() });
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

  const goToAuthGate = () => {
    const params = new URLSearchParams({ redirect: "booking", address });
    if (selectedService) params.set("service", selectedService);
    if (aiQuote?.id) params.set("quoteId", aiQuote.id);
    if (uploadedPhotos.length > 0) {
      params.set("photos", encodeURIComponent(JSON.stringify(uploadedPhotos)));
    }
    setLocation("/auth?" + params.toString());
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

        {propertyLoading && (
          <div className="flex items-center justify-center gap-3 py-6 mb-6 bg-muted/30 rounded-md" data-testid="loading-property">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">{t("estimator.fetching_property")}</span>
          </div>
        )}

        {propertyData && (
          <Card className="mb-6" data-testid="card-home-value">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {propertyData.imgSrc && (
                  <img
                    src={propertyData.imgSrc}
                    alt="Property"
                    className="w-full sm:w-32 h-24 object-cover rounded-md shrink-0"
                    data-testid="img-property"
                  />
                )}
                <div className="flex-1">
                  {/* Show home value for single-family homes and townhouses (homeowners) */}
                  {propertyData.zestimate &&
                   (propertyData.homeType === "SINGLE_FAMILY" ||
                    propertyData.homeType === "TOWNHOUSE" ||
                    propertyData.homeType === "SINGLE FAMILY" ||
                    !propertyData.homeType) && (
                    <>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("estimator.estimated_home_value")}</p>
                      <p className="text-3xl md:text-4xl font-black text-primary" data-testid="text-home-value">
                        {formatCurrency(propertyData.zestimate)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                        Protect your asset with verified maintenance
                      </p>
                    </>
                  )}

                  {/* For apartments/condos, show property details without emphasizing value */}
                  {(propertyData.homeType === "APARTMENT" ||
                    propertyData.homeType === "CONDO" ||
                    propertyData.homeType === "CONDOMINIUM") && (
                    <p className="text-lg font-bold text-foreground mb-2">Property Details</p>
                  )}
                  {propertyData.rentZestimate && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-rent-estimate">
                      {t("estimator.rent_estimate")}: {formatCurrency(propertyData.rentZestimate)}/mo
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {propertyData.bedrooms && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-bedrooms">
                        <BedDouble className="w-3 h-3" /> {propertyData.bedrooms} {t("estimator.bed")}
                      </span>
                    )}
                    {propertyData.bathrooms && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-bathrooms">
                        <Bath className="w-3 h-3" /> {propertyData.bathrooms} {t("estimator.bath")}
                      </span>
                    )}
                    {propertyData.livingArea && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-sqft">
                        <Ruler className="w-3 h-3" /> {propertyData.livingArea.toLocaleString()} {t("estimator.sqft")}
                      </span>
                    )}
                    {propertyData.yearBuilt && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-year-built">
                        <Calendar className="w-3 h-3" /> {t("estimator.built")} {propertyData.yearBuilt}
                      </span>
                    )}
                    {propertyData.homeType && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-home-type">
                        <Home className="w-3 h-3" /> {propertyData.homeType.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-right">
                {(propertyData as any)?.source === "census_estimate" ? t("estimator.based_on_local") : t("estimator.property_estimate")}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {pricingServices.map((service) => (
            <div
              key={service.id}
              className={`p-5 md:p-6 rounded-md border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 ${
                service.featured
                  ? "bg-[#3B1D5A] text-white border-[#3B1D5A]/80 shadow-xl"
                  : "bg-card border-border"
              }`}
              data-testid={`card-service-${service.id}`}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-md shrink-0 ${service.featured ? "bg-white/10" : "bg-muted"}`}>
                  <service.icon className={`w-5 h-5 ${service.featured ? "text-primary" : "text-primary"}`} />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-black text-base md:text-lg" data-testid={`text-service-name-${service.id}`}>{t(serviceNameKey[service.id])}</h4>
                  <p className={`text-sm mt-0.5 ${service.featured ? "text-slate-300" : "text-muted-foreground"}`}>
                    {t(serviceDescKey[service.id])}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                    service.featured ? "text-primary" : "text-primary"
                  }`}>
                    {t(serviceBenefitKey[service.id])}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-4 md:gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 ${service.featured ? "border-white/20" : "border-border"}`}>
                <div className="text-left md:text-right">
                  <span className={`block text-[10px] font-bold uppercase ${service.featured ? "opacity-60" : "text-muted-foreground"}`}>
                    {t("estimator.investment")}
                  </span>
                  <span className="text-2xl font-black" data-testid={`text-service-price-${service.id}`}>{service.price}</span>
                </div>
                <Button
                  onClick={() => handleServiceSelect(service.id)}
                  className={`flex-1 md:flex-none font-bold ${
                    service.featured
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
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

  // Step 3: Quote Method Selection
  if (step === 3) {
    return (
      <div className="w-full max-w-2xl mx-auto" data-testid="widget-quote-method-selection">
        <div className="text-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(2)}
            className="mb-4"
          >
            ← Back to services
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
              setStep(4);
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
              setStep(4);
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

  // Step 4: Quote Generation (AI or Manual)
  if (step === 4) {
    if (quoteMethod === "ai" && !aiQuote) {
      return (
        <div className="w-full max-w-2xl mx-auto" data-testid="widget-ai-quote-upload">
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(3)}
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
              <MultiPhotoUpload
                label="Upload up to 5 photos"
                description="Take photos of items to be removed. Our AI will analyze them and provide an itemized quote."
                onPhotosChange={setUploadedPhotos}
                maxPhotos={5}
                accept="image/*"
                testId="photo-upload-ai-quote"
              />

              {analysisError && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
                  {analysisError}
                </div>
              )}

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

              {isAnalyzing && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Our AI is analyzing your photos...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Identifying items • Calculating volume • Estimating price
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
            onBook={() => setStep(5)}
          />
        </div>
      );
    }

    if (quoteMethod === "manual") {
      return (
        <div className="w-full max-w-2xl mx-auto" data-testid="widget-manual-quote">
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(3)}
              className="mb-4"
            >
              ← Back to quote method
            </Button>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Describe What You Need
            </h2>
          </div>

          <ManualQuoteForm
            serviceType={selectedService || ""}
            onComplete={(estimate) => {
              setManualEstimate(estimate);
              setStep(5);
            }}
          />
        </div>
      );
    }
  }

  // Step 5: Auth Gate
  if (step === 5) {
    return (
      <div className="w-full max-w-2xl mx-auto" data-testid="widget-auth-gate">
        <div className="text-center mb-6">
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
                <p className="text-sm text-muted-foreground mb-1">Your Preliminary Estimate</p>
                <p className="text-3xl font-bold text-primary">
                  ${manualEstimate.estimatedPrice}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
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

            <Button
              onClick={goToAuthGate}
              className="w-full"
              size="lg"
              data-testid="button-book-quote"
            >
              Create Account & Book Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account? You'll be able to sign in on the next page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
