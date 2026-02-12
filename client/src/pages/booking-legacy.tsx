import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ProTierBadge } from "@/components/pycker-tier-badge";
import { PricingTransparencyModal } from "@/components/pricing-transparency-modal";
// ImpactMeter removed — "Estimated Protected Value" not useful for customers
import { Header } from "@/components/landing/header";
import {
  ArrowLeft, ArrowRight, Trash2, Sofa, Refrigerator, Home,
  MapPin, Clock, Package, CheckCircle, Star, Truck,
  Phone, MessageCircle, Timer, DollarSign, TrendingUp, Zap, Navigation,
  Camera, X, Upload, Loader2, ImageIcon, Gift, CalendarCheck, Users, Shield, ShieldCheck, CreditCard, LogIn,
  Lock, KeyRound, Leaf, Droplets, Hammer, ClipboardCheck, Minus, Plus, Info, Trophy, Crown, Sparkles, Wrench
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { useAuth } from "@/hooks/use-auth";
import { useGeoLocation } from "@/hooks/use-geolocation";
import type { ProWithProfile, ProWithProfileAndVehicle, PriceQuote } from "@shared/schema";
import { LOYALTY_TIER_CONFIG } from "@shared/schema";
import { PaymentForm } from "@/components/payment-form";
import { trackJobPosted, trackJobBooked, trackPromoApplied } from "@/lib/analytics";
import { getAllItemsFlat, getItemPrice } from "@shared/itemCatalog";
import { MatchingFlow } from "@/components/matching";
import { BundlingSuggestions } from "@/components/bundling-suggestions";
import { VideoUpload } from "@/components/video-upload";
import { Video } from "lucide-react";
import {
  GARAGE_CLEANOUT_PACKAGES,
  loadSizePackages,
  TRUCK_UNLOADING_SIZES,
  HOURLY_RATE_PER_PRO,
  SERVICE_STARTING_PRICES
} from "@/lib/bundle-pricing";
import { PolishUpBooking, type PolishUpBookingDetails } from "@/components/booking/polishup-booking";

import pro1 from "@assets/stock_images/professional_male_wo_ae620e83.jpg";

const serviceTypes = [
  { id: "home_consultation", label: "AI Home Scan", icon: ClipboardCheck, description: "Starting at $99 - Full home walkthrough with optional drone aerial scan", startingPrice: SERVICE_STARTING_PRICES.home_consultation, featured: true },
  { id: "junk_removal", label: "Junk Removal", icon: Trash2, description: "Clear unwanted items and debris", startingPrice: SERVICE_STARTING_PRICES.junk_removal },
  { id: "garage_cleanout", label: "Garage Cleanout", icon: Home, description: "Complete garage cleanout service", startingPrice: SERVICE_STARTING_PRICES.garage_cleanout },
  { id: "pressure_washing", label: "Pressure Washing", icon: Droplets, description: "Driveways, patios, walkways, and siding", startingPrice: SERVICE_STARTING_PRICES.pressure_washing },
  { id: "gutter_cleaning", label: "Gutter Cleaning", icon: Home, description: "Clean and flush gutters and downspouts", startingPrice: SERVICE_STARTING_PRICES.gutter_cleaning },
  { id: "handyman", label: "Handyman Services", icon: Wrench, description: "Assembly, mounting, repairs, and installations", startingPrice: SERVICE_STARTING_PRICES.handyman },
  { id: "moving_labor", label: "Moving Labor", icon: Users, description: "Hourly help for loading, unloading, and rearranging", startingPrice: SERVICE_STARTING_PRICES.moving_labor },
  { id: "light_demolition", label: "Light Demolition", icon: Hammer, description: "Tear out cabinets, sheds, fencing, decks", startingPrice: SERVICE_STARTING_PRICES.light_demolition },
  { id: "home_cleaning", label: "Home Cleaning", icon: Sparkles, description: "Professional home cleaning with room-by-room checklists", startingPrice: SERVICE_STARTING_PRICES.home_cleaning },
  { id: "pool_cleaning", label: "Pool Cleaning", icon: Droplets, description: "Weekly pool maintenance and chemical balancing", startingPrice: SERVICE_STARTING_PRICES.pool_cleaning },
  { id: "landscaping", label: "Landscaping", icon: Leaf, description: "Professional lawn care and landscaping", startingPrice: SERVICE_STARTING_PRICES.landscaping },
  { id: "carpet_cleaning", label: "Carpet Cleaning", icon: Sparkles, description: "Deep carpet and upholstery cleaning", startingPrice: SERVICE_STARTING_PRICES.carpet_cleaning },
];

// Map shared garage packages to booking page format
const garageCleanoutPackages = GARAGE_CLEANOUT_PACKAGES.map(pkg => ({
  id: pkg.id,
  label: pkg.name,
  price: pkg.price,
  description: pkg.description,
  items: pkg.itemsEstimate,
  time: pkg.duration,
  featured: false,
}));

// Map shared load size packages to junk removal format
const junkRemovalLoadTiers = loadSizePackages.map(pkg => ({
  id: pkg.id,
  label: pkg.name,
  price: pkg.price,
  cubicYards: `~${Math.round(pkg.cubicFeet / 27)} cu yd`,
  description: pkg.description,
  examples: pkg.example,
}));

// Truck unloading hourly rates ($160/hr for 2 Pros, 1hr minimum)
const truckUnloadingRates = [
  { id: "1hour", label: "1 Hour", price: 160, description: "Minimum booking (small loads)" },
  { id: "2hours", label: "2 Hours", price: 320, description: "Standard U-Haul" },
  { id: "3hours", label: "3 Hours", price: 480, description: "Typical 15-20ft truck" },
  { id: "4hours", label: "4 Hours", price: 640, description: "Full 26ft truck" },
  { id: "5hours", label: "5+ Hours", price: 800, description: "Large moves with heavy items" },
];

// Map shared truck sizes
const truckSizes = TRUCK_UNLOADING_SIZES.map(size => ({
  id: size.id,
  label: size.truckSize,
  description: size.description,
}));

const bedroomOptions = [
  { id: 1, label: "1 Bedroom" },
  { id: 2, label: "2 Bedrooms" },
  { id: 3, label: "3 Bedrooms" },
  { id: 4, label: "4 Bedrooms" },
  { id: 5, label: "5+ Bedrooms" },
];

const applianceOptions = [
  { id: "refrigerator", label: "Refrigerator" },
  { id: "washer", label: "Washer" },
  { id: "dryer", label: "Dryer" },
  { id: "dishwasher", label: "Dishwasher" },
  { id: "stove", label: "Stove/Range" },
  { id: "freezer", label: "Freezer" },
];

const heavyItemOptions = [
  { id: "piano", label: "Piano" },
  { id: "safe", label: "Safe/Gun Safe" },
  { id: "pool_table", label: "Pool Table" },
  { id: "hot_tub", label: "Hot Tub" },
  { id: "gym_equipment", label: "Heavy Gym Equipment" },
];

// À la carte item pricing
const itemPricing = [
  // Furniture
  { id: "couch", label: "Couch/Sofa", price: 75, icon: Sofa, category: "furniture" },
  { id: "loveseat", label: "Loveseat", price: 55, icon: Sofa, category: "furniture" },
  { id: "recliner", label: "Recliner", price: 45, icon: Sofa, category: "furniture" },
  { id: "sectional", label: "Sectional Sofa", price: 125, icon: Sofa, category: "furniture" },
  { id: "dining_table", label: "Dining Table", price: 50, icon: Home, category: "furniture" },
  { id: "dining_chairs", label: "Dining Chairs (set of 4)", price: 40, icon: Home, category: "furniture" },
  { id: "dresser", label: "Dresser", price: 60, icon: Package, category: "furniture" },
  { id: "nightstand", label: "Nightstand", price: 25, icon: Package, category: "furniture" },
  { id: "king_bed", label: "King Size Bed (frame + mattress)", price: 95, icon: Home, category: "furniture" },
  { id: "queen_bed", label: "Queen Size Bed (frame + mattress)", price: 85, icon: Home, category: "furniture" },
  { id: "twin_bed", label: "Twin Bed (frame + mattress)", price: 55, icon: Home, category: "furniture" },
  { id: "mattress_only", label: "Mattress Only", price: 40, icon: Package, category: "furniture" },
  { id: "box_spring", label: "Box Spring", price: 30, icon: Package, category: "furniture" },
  { id: "desk", label: "Desk", price: 45, icon: Package, category: "furniture" },
  { id: "office_chair", label: "Office Chair", price: 25, icon: Package, category: "furniture" },
  { id: "bookshelf", label: "Bookshelf", price: 40, icon: Package, category: "furniture" },
  { id: "tv_stand", label: "TV Stand/Entertainment Center", price: 50, icon: Package, category: "furniture" },
  { id: "piano", label: "Piano/Upright Piano", price: 150, icon: Package, category: "furniture" },
  // Appliances (now part of furniture category)
  { id: "refrigerator", label: "Refrigerator", price: 85, icon: Refrigerator, category: "furniture" },
  { id: "freezer", label: "Freezer (standalone)", price: 75, icon: Refrigerator, category: "furniture" },
  { id: "washer", label: "Washer", price: 65, icon: Refrigerator, category: "furniture" },
  { id: "dryer", label: "Dryer", price: 65, icon: Refrigerator, category: "furniture" },
  { id: "stove", label: "Stove/Oven/Range", price: 70, icon: Refrigerator, category: "furniture" },
  { id: "dishwasher", label: "Dishwasher", price: 55, icon: Refrigerator, category: "furniture" },
  { id: "microwave", label: "Microwave", price: 20, icon: Refrigerator, category: "furniture" },
  { id: "water_heater", label: "Water Heater", price: 85, icon: Refrigerator, category: "furniture" },
  { id: "ac_unit", label: "AC Unit/Window Unit", price: 40, icon: Refrigerator, category: "furniture" },
  { id: "tv_small", label: "TV (under 40\")", price: 35, icon: Package, category: "furniture" },
  { id: "tv_large", label: "TV (40\" and larger)", price: 50, icon: Package, category: "furniture" },
  // Exercise & Outdoor
  { id: "treadmill", label: "Treadmill", price: 75, icon: Package, category: "exercise" },
  { id: "elliptical", label: "Elliptical/Exercise Bike", price: 65, icon: Package, category: "exercise" },
  { id: "weight_bench", label: "Weight Bench/Home Gym", price: 85, icon: Package, category: "exercise" },
  { id: "patio_set", label: "Patio Furniture Set", price: 80, icon: Home, category: "outdoor" },
  { id: "grill", label: "BBQ Grill", price: 45, icon: Trash2, category: "outdoor" },
  { id: "hot_tub", label: "Hot Tub/Spa", price: 200, icon: Home, category: "outdoor" },
  { id: "shed", label: "Shed Cleanout (contents)", price: 150, icon: Home, category: "outdoor" },
  // General Junk
  { id: "misc_bags", label: "Bags of Junk (each)", price: 15, icon: Trash2, category: "junk" },
  { id: "misc_boxes", label: "Boxes (each)", price: 10, icon: Package, category: "junk" },
  { id: "carpet", label: "Carpet/Flooring (per room)", price: 75, icon: Trash2, category: "junk" },
  { id: "construction", label: "Construction Debris (per cubic yard)", price: 85, icon: Trash2, category: "junk" },
  { id: "yard_waste", label: "Yard Waste (per cubic yard)", price: 60, icon: Trash2, category: "junk" },
];

// Load-based pricing tiers (bulk pickup)
const loadPricing = [
  { id: "minimum", label: "Minimum", description: "Up to 1 item", price: 79, cubicYards: "~1 cu yd", examples: "Single mattress, TV, small appliance" },
  { id: "quarter", label: "Quarter Load", description: "1-2 large items or 5-6 bags", price: 99, cubicYards: "~4 cu yd", examples: "Couch + chair, small bedroom cleanout" },
  { id: "half", label: "Half Load", description: "Bedroom cleanout, small office", price: 179, cubicYards: "~8 cu yd", examples: "Bedroom set, 2-3 appliances, small garage corner" },
  { id: "three_quarter", label: "3/4 Load", description: "Garage cleanout, estate items", price: 299, cubicYards: "~12 cu yd", examples: "Full garage, 2-3 rooms of furniture" },
  { id: "full", label: "Full Load", description: "Whole home, large estate", price: 549, cubicYards: "~16 cu yd", examples: "Whole apartment, large estate cleanout" },
];

const timeSlots = [
  { id: "30min", label: "Within 30 Min", sublabel: "Urgent pickup" },
  { id: "2hours", label: "Within 2 Hours", sublabel: "Flexible timing" },
  { id: "morning", label: "Morning", sublabel: "8 AM - 12 PM" },
  { id: "afternoon", label: "Afternoon", sublabel: "12 PM - 5 PM" },
  { id: "evening", label: "Evening", sublabel: "5 PM - 8 PM" },
  { id: "next_day", label: "Tomorrow", sublabel: "Next available" },
  { id: "next_week", label: "Next Week", sublabel: "Flexible scheduling" },
];

interface NearbyPro {
  id: number;
  firstName: string;
  lastName: string;
  vehicleType: string;
  rating: number | null;
  jobsCompleted: number;
  distance: number;
  eta: number;
  location: {
    latitude: number;
    longitude: number;
  };
  profilePhotoUrl?: string;
  isVerifiedPro?: boolean;
}

export default function Booking() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const geoLocation = useGeoLocation(true, { enableHighAccuracy: true });
  const customerLocation = (geoLocation.lat !== null && geoLocation.lat !== undefined &&
                            geoLocation.lng !== null && geoLocation.lng !== undefined)
    ? { lat: geoLocation.lat, lng: geoLocation.lng }
    : null;

  const { data: nearbyProsData } = useQuery<{ pros: NearbyPro[] }>({
    queryKey: ["/api/pros/nearby", customerLocation?.lat, customerLocation?.lng],
    queryFn: async () => {
      if (!customerLocation) return { pros: [] };
      const response = await fetch(
        `/api/pros/nearby?lat=${customerLocation.lat}&lng=${customerLocation.lng}&radius=25`,
        { credentials: "include" }
      );
      if (!response.ok) return { pros: [] };
      return response.json();
    },
    enabled: !!customerLocation,
    refetchInterval: 30000,
  });

  const nearbyPros = nearbyProsData?.pros || [];
  
  const paymentStatusQuery = useQuery({
    queryKey: ["/api/customers/payment-status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customers/payment-status");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Loyalty account query
  const loyaltyQuery = useQuery({
    queryKey: ["/api/loyalty", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/loyalty/${user.id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: isAuthenticated && !!user?.id,
  });
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: "",
    loadEstimate: "medium",
    pickupAddress: "",
    pickupCity: "",
    pickupZip: "",
    destinationAddress: "",
    destinationCity: "",
    destinationZip: "",
    pickupStairs: 0,
    destinationStairs: 0,
    moveServiceMode: "truck_and_mover" as "truck_and_mover" | "labor_only",
    description: "",
    accessNotes: "",
    gateCode: "",
    scheduledFor: "asap",
    promoCode: "",
    truckSize: "",
    bedroomCount: 0,
    hasAppliances: false,
    appliancesList: [] as string[],
    hasHeavyItems: false,
    heavyItemsList: [] as string[],
    preferredLanguage: "en",
    accessType: "person" as "person" | "smart_lock" | "lockbox",
    smartLockCode: "",
    carbonOffsetOptIn: false,
    squareFootage: 500,
    storyCount: 1,
    laborHours: 2,
    laborCrewSize: 2,
    dwellscanTier: "standard" as "standard" | "aerial",
  });
  const [moveQuote, setMoveQuote] = useState<{
    distanceMiles: number;
    mileageCharge: number;
    stairsCharge: number;
    serviceModeDiscount: number;
    totalPrice: number;
    breakdown: { label: string; amount: number }[];
  } | null>(null);
  const [moveQuoteError, setMoveQuoteError] = useState<string | null>(null);
  const [selectedPro, setSelectedPro] = useState<ProWithProfileAndVehicle | null>(null);
  const [promoValidation, setPromoValidation] = useState<{ valid: boolean; discount: number; error?: string } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [showProSwiper, setShowProSwiper] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ path: string; previewUrl: string }>>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAuthorized, setPaymentAuthorized] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{
    recommendedLoadSize: string;
    recommendedTruckSize: string;
    suggestedPrice: number;
    identifiedItems: string[];
    confidence: number;
    reasoning: string;
    priceBreakdown: { label: string; amount: number }[];
    estimatedVolumeCubicFt?: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<"photo" | "video">("photo");
  
  // À la carte items state
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  
  // Service-specific pricing selections
  const [selectedGaragePackage, setSelectedGaragePackage] = useState<string | null>(null);
  const [selectedJunkLoadTier, setSelectedJunkLoadTier] = useState<string | null>(null);
  const [selectedUnloadingHours, setSelectedUnloadingHours] = useState<string | null>(null);
  
  // Pricing mode for furniture moving: 'items' for à la carte (items only)
  const [pricingMode, setPricingMode] = useState<'items' | 'load'>('items');
  const [selectedLoadTier, setSelectedLoadTier] = useState<string | null>(null);
  
  // All Pros are verified and insured by default
  const preferVerifiedPro = true; // Always true - all pros are verified

  // PolishUp (home cleaning) booking details
  const [freshSpaceDetails, setPolishUpDetails] = useState<PolishUpBookingDetails | null>(null);

  // Initial quote data from quote page
  const [initialQuote, setInitialQuote] = useState<{
    price: number;
    items: string[];
    notes: string;
    method: string;
    truckSize?: string;
  } | null>(null);
  
    
  // Calculate à la carte total - use initial quote price if available
  const calculatedItemsTotal = Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
    // First try the local itemPricing, then fall back to shared catalog
    const localItem = itemPricing.find(i => i.id === itemId);
    if (localItem) {
      return sum + (localItem.price * qty);
    }
    // Check shared catalog for items from quote page
    const sharedPrice = getItemPrice(itemId);
    return sum + (sharedPrice * qty);
  }, 0);
  
  // Use quote price if coming from quote page and no new items selected in booking
  const itemsTotal = initialQuote && initialQuote.price > 0 && calculatedItemsTotal === 0 
    ? initialQuote.price 
    : calculatedItemsTotal;
  
  const totalItemCount = initialQuote && initialQuote.items.length > 0 && Object.keys(selectedItems).length === 0
    ? initialQuote.items.length
    : Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
  
  // Compute service-specific price based on selections
  const getServicePrice = (): number => {
    switch (formData.serviceType) {
      case "junk_removal":
        return junkRemovalLoadTiers.find(t => t.id === selectedJunkLoadTier)?.price || 0;
      case "garage_cleanout":
        return garageCleanoutPackages.find(p => p.id === selectedGaragePackage)?.price || 0;
      case "pressure_washing": {
        const raw = Math.round(formData.squareFootage * 0.25);
        return Math.max(raw, 150);
      }
      case "gutter_cleaning":
        return formData.storyCount === 2 ? 199 : 120;
      case "moving_labor": {
        const hrs = Math.max(formData.laborHours, 1);
        return hrs * formData.laborCrewSize * 80;
      }
      case "handyman": {
        const hrs = Math.max(formData.laborHours, 1);
        return hrs * 49;
      }
      case "light_demolition": {
        const hrs = Math.max(formData.laborHours || 2, 2);
        return hrs * (formData.laborCrewSize || 2) * 80;
      }
      case "home_consultation":
        return formData.dwellscanTier === "aerial" ? 199 : 99;
      case "pool_cleaning":
        return 89; // Starting price for pool cleaning
      case "landscaping":
        return 59; // Starting price for lawn care
      case "carpet_cleaning":
        return 99; // Starting price per room
      case "home_cleaning":
        return freshSpaceDetails?.estimatedPrice || 149; // Default if no details yet
      default:
        return 0;
    }
  };

  // Validate step 1 is complete based on service type
  const isStep1Complete = (): boolean => {
    if (!formData.serviceType) return false;
    
    // Count only fully uploaded photos (with persisted paths starting with "/")
    const uploadedPhotoCount = uploadedPhotos.filter(p => p.path.startsWith("/")).length;
    // Check if any uploads are still in progress (temp IDs)
    const hasUploadsInProgress = uploadedPhotos.some(p => p.path.startsWith("temp-"));
    
    // Block progression while uploads are in progress
    if (hasUploadsInProgress) return false;
    
    const hasVideoFrames = videoFrames.length > 0;

    switch (formData.serviceType) {
      case "junk_removal":
        return !!selectedJunkLoadTier; // Photos encouraged but not required
      case "garage_cleanout":
        return !!selectedGaragePackage;
      case "pressure_washing":
        return formData.squareFootage >= 100;
      case "gutter_cleaning":
        return formData.storyCount === 1 || formData.storyCount === 2;
      case "moving_labor":
        return formData.laborHours >= 2 && formData.laborCrewSize >= 1;
      case "handyman":
        return formData.laborHours >= 1;
      case "light_demolition":
        return formData.laborHours >= 2 && formData.laborCrewSize >= 1;
      case "home_consultation":
        return true;
      case "pool_cleaning":
        // Basic pool cleaning - requires service confirmation
        return true;
      case "landscaping":
        // Lawn care - redirects to dedicated booking page
        return false; // Never reached as we redirect
      case "carpet_cleaning":
        // Carpet cleaning - redirects to dedicated booking page
        return false; // Never reached as we redirect
      case "home_cleaning":
        // Home cleaning routes to PolishUpBooking component
        return !!freshSpaceDetails;
      default:
        return false;
    }
  };

  const addItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };
  
  const removeItem = (itemId: string) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  // Sync service-specific selections to formData.loadEstimate for pricing API
  useEffect(() => {
    let loadEstimate = "";
    switch (formData.serviceType) {
      case "junk_removal":
        loadEstimate = selectedJunkLoadTier || "";
        break;
      case "garage_cleanout":
        loadEstimate = selectedGaragePackage || "";
        break;
    }
    if (loadEstimate && loadEstimate !== formData.loadEstimate) {
      setFormData(prev => ({ ...prev, loadEstimate }));
    }
  }, [formData.serviceType, formData.truckSize, selectedJunkLoadTier, selectedGaragePackage, selectedUnloadingHours, totalItemCount]);

  const { uploadFile, isUploading, error: uploadError } = useUpload({});

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        const tempId = `temp-${Date.now()}`;
        setUploadedPhotos(prev => [...prev, { path: tempId, previewUrl }]);
        
        const response = await uploadFile(file);
        if (response) {
          setUploadedPhotos(prev => 
            prev.map(p => p.path === tempId 
              ? { path: response.objectPath, previewUrl } 
              : p
            )
          );
        } else {
          setUploadedPhotos(prev => prev.filter(p => p.path !== tempId));
        }
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    setAiSuggestion(null);
  };

  const analyzePhotos = async () => {
    const validPhotos = uploadedPhotos.filter(p => p.path.startsWith("/")).map(p => p.path);
    if (validPhotos.length === 0 || !formData.serviceType) return;
    
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/analyze-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls: validPhotos,
          serviceType: formData.serviceType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestion({
          recommendedLoadSize: data.recommendedLoadSize,
          recommendedTruckSize: data.recommendedTruckSize || "cargo_van",
          suggestedPrice: data.suggestedPrice,
          identifiedItems: data.identifiedItems || [],
          confidence: data.confidence || 0,
          reasoning: data.reasoning || "",
          priceBreakdown: data.priceBreakdown || [],
          estimatedVolumeCubicFt: data.estimatedVolumeCubicFt || 0,
        });

        // Auto-select junk removal tier based on AI recommendation
        if (formData.serviceType === "junk_removal" && data.recommendedLoadSize) {
          setSelectedJunkLoadTier(data.recommendedLoadSize);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAiError(errorData.error || "Failed to analyze photos. Please try again.");
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
      setAiError("Failed to connect to AI service. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeVideo = async () => {
    if (videoFrames.length === 0 || !formData.serviceType) return;
    
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames: videoFrames,
          serviceType: formData.serviceType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestion({
          recommendedLoadSize: data.recommendedLoadSize,
          recommendedTruckSize: data.recommendedTruckSize || "cargo_van",
          suggestedPrice: data.suggestedPrice,
          identifiedItems: data.identifiedItems || [],
          confidence: data.confidence || 0,
          reasoning: data.reasoning || "",
          priceBreakdown: data.priceBreakdown || [],
          estimatedVolumeCubicFt: data.estimatedVolumeCubicFt || 0,
        });

        // Auto-select junk removal tier based on AI recommendation
        if (formData.serviceType === "junk_removal" && data.recommendedLoadSize) {
          setSelectedJunkLoadTier(data.recommendedLoadSize);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAiError(errorData.error || "Failed to analyze video. Please try again.");
      }
    } catch (error) {
      console.error("AI video analysis failed:", error);
      setAiError("Failed to connect to AI service. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setFormData(prev => ({ ...prev, loadEstimate: aiSuggestion.recommendedLoadSize }));
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(searchString);

    // Check for AI quote from Florida Estimator flow
    const quoteIdParam = params.get("quoteId");
    const photosParam = params.get("photos");
    const serviceParam = params.get("service");
    const addressParam = params.get("address");
    const manualEstimateParam = params.get("manualEstimate");
    const schedulingDataParam = params.get("schedulingData");

    if (quoteIdParam) {
      // Fetch AI estimate from frictionless quote flow
      fetch(`/api/ai-estimates/quote/${quoteIdParam}`, { credentials: "include" })
        .then(res => res.json())
        .then(estimate => {
          setAiSuggestion({
            recommendedLoadSize: estimate.recommendedLoadSize,
            recommendedTruckSize: estimate.recommendedTruckSize || "cargo_van",
            suggestedPrice: estimate.suggestedPrice,
            identifiedItems: estimate.identifiedItems,
            confidence: estimate.confidence,
            reasoning: estimate.reasoning,
            priceBreakdown: estimate.priceBreakdown || [],
          });

          // Process scheduling data if present
          let schedulingUpdate = {};
          if (schedulingDataParam) {
            try {
              const schedulingData = JSON.parse(decodeURIComponent(schedulingDataParam));
              if (schedulingData.type === "asap") {
                schedulingUpdate = { scheduledFor: "asap" };
              } else if (schedulingData.type === "scheduled") {
                schedulingUpdate = {
                  scheduledFor: schedulingData.timeSlot || "morning",
                };
              } else if (schedulingData.type === "recurring") {
                schedulingUpdate = {
                  scheduledFor: schedulingData.timeSlot || "morning",
                };
              }
            } catch (e) {
              console.error("Failed to parse scheduling data:", e);
            }
          }

          setFormData(prev => ({
            ...prev,
            serviceType: serviceParam || estimate.serviceType || "",
            pickupAddress: addressParam || "",
            loadEstimate: estimate.recommendedLoadSize,
            ...schedulingUpdate,
          }));

          setInitialQuote({
            price: estimate.suggestedPrice,
            items: estimate.identifiedItems,
            notes: estimate.reasoning,
            method: "ai",
            truckSize: estimate.recommendedTruckSize,
          });
        })
        .catch(err => {
          console.error("Failed to fetch AI estimate:", err);
        });

      // Parse photos if present
      if (photosParam) {
        try {
          const photos = JSON.parse(decodeURIComponent(photosParam));
          setUploadedPhotos(photos.map((path: string) => ({ path, previewUrl: path })));
        } catch (e) {
          console.error("Failed to parse photos param:", e);
        }
      }

      // Skip rest of URL param parsing
      return;
    }

    // Check for manual estimate from Florida Estimator flow
    if (manualEstimateParam) {
      try {
        const manualEstimate = JSON.parse(decodeURIComponent(manualEstimateParam));

        // Process scheduling data if present
        let schedulingUpdate = {};
        if (schedulingDataParam) {
          try {
            const schedulingData = JSON.parse(decodeURIComponent(schedulingDataParam));
            if (schedulingData.type === "asap") {
              schedulingUpdate = { scheduledFor: "asap" };
            } else if (schedulingData.type === "scheduled") {
              schedulingUpdate = {
                scheduledFor: schedulingData.timeSlot || "morning",
              };
            } else if (schedulingData.type === "recurring") {
              schedulingUpdate = {
                scheduledFor: schedulingData.timeSlot || "morning",
              };
            }
          } catch (e) {
            console.error("Failed to parse scheduling data:", e);
          }
        }

        setFormData(prev => ({
          ...prev,
          serviceType: serviceParam || manualEstimate.serviceType || "",
          pickupAddress: addressParam || "",
          ...schedulingUpdate,
        }));

        setInitialQuote({
          price: manualEstimate.estimatedPrice,
          items: [],
          notes: `Manual estimate: ${JSON.stringify(manualEstimate.userInputs)}`,
          method: "manual",
          truckSize: "cargo_van",
        });
      } catch (e) {
        console.error("Failed to parse manual estimate param:", e);
      }

      // Skip rest of URL param parsing
      return;
    }

    // Check for new quoteData format (JSON payload from quote page)
    const quoteDataParam = params.get("quoteData");
    if (quoteDataParam) {
      try {
        const quoteData = JSON.parse(quoteDataParam);
        
        // Set form data from quote
        setFormData(prev => ({
          ...prev,
          serviceType: quoteData.service || "",
          pickupZip: quoteData.zip || "",
          description: quoteData.notes || "",
          truckSize: quoteData.truckSize || "",
        }));
        
        // Parse items from quote and set them in selectedItems
        if (quoteData.items && typeof quoteData.items === "string") {
          const itemsList = quoteData.items.split(",").filter((item: string) => item.trim());
          const itemsMap: Record<string, number> = {};
          itemsList.forEach((itemId: string) => {
            const trimmedId = itemId.trim();
            if (trimmedId) {
              // Count occurrences for quantity
              itemsMap[trimmedId] = (itemsMap[trimmedId] || 0) + 1;
            }
          });
          setSelectedItems(itemsMap);
        }
        
        // Store initial quote for display
        setInitialQuote({
          price: quoteData.price || 0,
          items: quoteData.items ? quoteData.items.split(",").filter((i: string) => i.trim()) : [],
          notes: quoteData.notes || "",
          method: quoteData.method || "items",
          truckSize: quoteData.truckSize || "",
        });
        
      } catch (e) {
        console.error("Failed to parse quote data:", e);
      }
    } else {
      // Fallback to legacy URL params
      const service = params.get("service");
      const zip = params.get("zip");
      const address = params.get("address");
      const bundle = params.get("bundle");
      const packageTier = params.get("package");
      const packagePrice = params.get("price");

      if (service) setFormData(prev => ({ ...prev, serviceType: service }));
      if (zip) setFormData(prev => ({ ...prev, pickupZip: zip }));
      if (address) setFormData(prev => ({ ...prev, pickupAddress: address }));
      if (bundle) setFormData(prev => ({ ...prev, serviceType: bundle }));
      
      // Handle garage cleanout package selection
      if (service === "garage_cleanout" && packageTier && packagePrice) {
        const packageNames: Record<string, string> = {
          small: "Small Garage Cleanout (Single-car, lightly filled)",
          medium: "Medium Garage Cleanout (Typical single-car)",
          large: "Large Garage Cleanout (Full single-car or half two-car)",
          xl: "XL Garage Cleanout (Full two-car)",
        };
        setFormData(prev => ({
          ...prev,
          serviceType: "garage_cleanout",
          description: packageNames[packageTier] || `Garage Cleanout - ${packageTier.toUpperCase()}`,
        }));
        setInitialQuote({
          price: parseInt(packagePrice) || 0,
          items: [],
          notes: packageNames[packageTier] || "",
          method: "package",
          truckSize: "",
        });
      }
    }
  }, [searchString]);

  useEffect(() => {
    if (formData.serviceType === "furniture_moving" && 
        formData.pickupZip.length === 5 && 
        formData.destinationZip.length === 5) {
      // Furniture moving uses items-only pricing (no bulk load)
      const basePrice = itemsTotal > 0 ? itemsTotal : 99;
      
      apiRequest("POST", "/api/pricing/move-quote", {
          pickupZip: formData.pickupZip,
          destinationZip: formData.destinationZip,
          pickupStairs: formData.pickupStairs,
          destinationStairs: formData.destinationStairs,
          moveServiceMode: formData.moveServiceMode,
          basePrice,
        })
        .then((res) => res.json())
        .then((data) => {
          setMoveQuote(data);
          setMoveQuoteError(null);
        })
        .catch((err) => {
          setMoveQuote(null);
          if (err.message?.includes("service area")) {
            setMoveQuoteError("One or both zip codes are outside our Orlando service area");
          } else {
            setMoveQuoteError("Could not calculate distance");
          }
        });
    } else {
      setMoveQuote(null);
      setMoveQuoteError(null);
    }
  }, [formData.serviceType, formData.pickupZip, formData.destinationZip, formData.pickupStairs, formData.destinationStairs, formData.moveServiceMode, itemsTotal]);

  
  // Extended price quote type with promotions
  type PriceQuoteWithPromotions = PriceQuote & {
    firstJobDiscount?: number;
    hasPriorityAccess?: boolean;
    promoDiscount?: number;
    promoCodeApplied?: string;
  };

  const { data: priceQuote, isLoading: isPriceLoading, refetch: refetchQuote } = useQuery<PriceQuoteWithPromotions>({
    queryKey: ["/api/pricing/quote", formData.serviceType, formData.loadEstimate, promoValidation?.valid ? formData.promoCode : ""],
    queryFn: async () => {
      if (!formData.serviceType || !formData.loadEstimate) return null;
      const res = await fetch("/api/pricing/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: formData.serviceType,
          loadSize: formData.loadEstimate,
          userId: user?.id || "guest",
          bookingSource: "app",
          promoCode: promoValidation?.valid ? formData.promoCode : undefined,
        }),
      });
      const data = await res.json();
      if (data.error || !data.totalPrice) return null;
      return data;
    },
    enabled: !!formData.serviceType && !!formData.loadEstimate,
  });

  // Check if selected date is same-day or weekend for priority messaging
  const isPrioritySlot = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // ASAP and quick bookings are always same-day, hence priority
    if (formData.scheduledFor === "asap") return true;
    if (formData.scheduledFor === "30min") return true;
    if (formData.scheduledFor === "2hours") return true;
    
    // Morning, afternoon, evening are all same-day slots (priority)
    if (["morning", "afternoon", "evening"].includes(formData.scheduledFor)) {
      return true; // Same-day booking = priority
    }
    
    // If it's a weekend day, weekend slots are priority
    return isWeekend;
  };

  const { data: availablePros } = useQuery<ProWithProfileAndVehicle[]>({
    queryKey: ["/api/pros/available/with-vehicles", preferVerifiedPro],
    queryFn: async () => {
      const url = `/api/pros/available/with-vehicles?preferVerifiedPro=${preferVerifiedPro}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch pros");
      return response.json();
    },
    enabled: step === 3,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const photoUrls = uploadedPhotos
        .filter(p => p.path.startsWith("/"))
        .map(p => p.path);
      
      // Build item list string for description
      let itemListStr = "";
      if (totalItemCount > 0) {
        const itemDetails = Object.entries(selectedItems)
          .filter(([_, qty]) => qty > 0)
          .map(([itemId, qty]) => {
            const item = itemPricing.find(i => i.id === itemId);
            return item ? `${qty}x ${item.label} ($${item.price * qty})` : null;
          })
          .filter(Boolean)
          .join(", ");
        itemListStr = `\n\n[À LA CARTE ITEMS: ${itemDetails} | Total: $${itemsTotal}]`;
      }
      
      const requestBody: Record<string, unknown> = {
        customerId: user?.id || "guest",
        serviceType: data.serviceType,
        status: "matching",
        pickupAddress: data.pickupAddress,
        pickupCity: data.pickupCity,
        pickupZip: data.pickupZip,
        loadEstimate: data.loadEstimate,
        description: (data.description || "") + itemListStr || null,
        accessNotes: data.gateCode 
          ? `Gate Code: ${data.gateCode}${data.accessNotes ? ` | ${data.accessNotes}` : ""}`
          : (data.accessNotes || null),
        scheduledFor: data.scheduledFor,
        createdAt: new Date().toISOString(),
        itemsTotal: itemsTotal > 0 ? itemsTotal : null,
        preferVerifiedPro: preferVerifiedPro,
      };

      if (totalItemCount > 0) {
        const structuredItems = Object.entries(selectedItems)
          .filter(([_, qty]) => qty > 0)
          .map(([itemId, qty]) => {
            const item = itemPricing.find(i => i.id === itemId);
            return item ? { id: itemId, label: item.label, quantity: qty, price: item.price } : null;
          })
          .filter(Boolean);
        if (structuredItems.length > 0) {
          requestBody.customerItems = JSON.stringify(structuredItems);
        }
      }
      
      if (data.destinationAddress) {
        requestBody.destinationAddress = data.destinationAddress;
      }
      if (data.destinationCity) {
        requestBody.destinationCity = data.destinationCity;
      }
      if (data.destinationZip) {
        requestBody.destinationZip = data.destinationZip;
      }
      if (data.serviceType === "furniture_moving") {
        requestBody.pickupStairs = data.pickupStairs;
        requestBody.destinationStairs = data.destinationStairs;
        requestBody.moveServiceMode = data.moveServiceMode;
        if (moveQuote) {
          requestBody.distanceMiles = moveQuote.distanceMiles;
          requestBody.livePrice = moveQuote.totalPrice;
        }
      }
      if (photoUrls.length > 0) {
        requestBody.photoUrls = photoUrls;
      }

      if (videoUrl) {
        requestBody.videoUrl = videoUrl;
      }
      
      // Add truck unloading specific fields
      if (data.serviceType === "truck_unloading") {
        requestBody.truckSize = data.truckSize;
        requestBody.bedroomCount = data.bedroomCount;
        requestBody.hasAppliances = data.appliancesList.length > 0;
        requestBody.appliancesList = data.appliancesList.length > 0 ? data.appliancesList : null;
        requestBody.hasHeavyItems = data.heavyItemsList.length > 0;
        requestBody.heavyItemsList = data.heavyItemsList.length > 0 ? data.heavyItemsList : null;
        // Use the combined truckSize_hours loadEstimate from the sync effect
        // This preserves the hourly rate selection for pricing consistency
      }
      
      // Add PolishUp (home_cleaning) specific fields
      if (data.serviceType === "home_cleaning" && freshSpaceDetails) {
        requestBody.freshSpaceDetails = JSON.stringify({
          bedrooms: freshSpaceDetails.bedrooms,
          bathrooms: freshSpaceDetails.bathrooms,
          cleanType: freshSpaceDetails.cleanType,
          addOns: freshSpaceDetails.addOns,
          bookingType: freshSpaceDetails.bookingType,
          recurringFrequency: freshSpaceDetails.recurringFrequency,
          preferredDay: freshSpaceDetails.preferredDay,
          preferredTimeWindow: freshSpaceDetails.preferredTimeWindow,
          specialInstructions: freshSpaceDetails.specialInstructions,
          bringsSupplies: freshSpaceDetails.bringsSupplies,
        });
        requestBody.livePrice = freshSpaceDetails.estimatedPrice;
      }

      // Add customer's preferred language for matching
      if (data.preferredLanguage) {
        requestBody.preferredLanguage = data.preferredLanguage;
      }

      if (data.accessType !== "person" && data.smartLockCode) {
        requestBody.accessType = data.accessType;
        requestBody.encryptedAccessCode = data.smartLockCode;
      }

      if (data.carbonOffsetOptIn) {
        requestBody.carbonOffsetOptIn = true;
        requestBody.carbonOffsetFee = 1499;
      }
      
      const response = await apiRequest("POST", "/api/service-requests", requestBody);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedRequestId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });

      // Store service type for cross-sell prompts
      sessionStorage.setItem("lastBookedService", formData.serviceType);

      trackJobPosted(user?.id || "guest", {
        serviceType: formData.serviceType,
        loadEstimate: formData.loadEstimate,
        scheduledFor: formData.scheduledFor,
        promoCode: formData.promoCode || undefined,
      });

      setTimeout(() => {
        if (availablePros && availablePros.length > 0) {
          setSelectedPro(availablePros[0]);
          trackJobBooked(user?.id || "guest", {
            serviceRequestId: data.id,
            proId: availablePros[0].id,
            promoCode: formData.promoCode || undefined,
          });
        }
        setMatchingComplete(true);
      }, 3000);
    },
  });

  useEffect(() => {
    if (step === 3 && !matchingComplete && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, matchingComplete, countdown]);

  const handleNext = () => {
    if (step === 3) {
      // Only create the booking at the final step — prompt login if needed
      if (!isAuthenticated) {
        const returnUrl = `/book?service=${formData.serviceType}`;
        navigate(`/customer-login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }
      createRequestMutation.mutate(formData);
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const progress = (step / 4) * 100;

  // REMOVED: Auth gate now happens at payment step (step 3) instead of entry
  // This allows users to see quotes and configure their service before authenticating

  // Dev mode payment bypass state
  const [devPaymentBypass, setDevPaymentBypass] = useState(false);
  const isDevMode = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // Show payment setup prompt if authenticated but no payment method
  if (!authLoading && isAuthenticated && paymentStatusQuery.isSuccess && !paymentStatusQuery.data?.hasPaymentMethod && !devPaymentBypass) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-booking-payment">
        <Header />
        <main className="pt-24 pb-12">
          <div className="max-w-md mx-auto px-4 md:px-6">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Add Payment Method</h1>
              <p className="text-muted-foreground mb-6">
                To book a Pro, please add a payment method. You won't be charged until you confirm a booking.
              </p>
              
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Your card is securely stored with Stripe</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">You'll see your exact price before any charge</span>
                </div>
              </div>
              
              <Link href="/payment-setup">
                <Button className="w-full" data-testid="button-add-payment">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </Link>
              
              {isDevMode && (
                <Button 
                  variant="outline" 
                  className="w-full mt-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={() => setDevPaymentBypass(true)}
                  data-testid="button-dev-skip-payment"
                >
                  ⚡ Dev Mode: Skip Payment
                </Button>
              )}
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Route to PolishUp booking flow if home_cleaning is selected
  if (formData.serviceType === "home_cleaning" && !freshSpaceDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PolishUpBooking
          onComplete={(details) => {
            setPolishUpDetails(details);
            // Set formData with PolishUp details for service request creation
            setFormData(prev => ({
              ...prev,
              description: `Home Cleaning ${details.cleanType} - ${details.bedrooms} bed / ${details.bathrooms} bath${details.addOns.length > 0 ? ` with add-ons: ${details.addOns.join(", ")}` : ""}${details.specialInstructions ? ` - ${details.specialInstructions}` : ""}`,
            }));
            setStep(2); // Move to address/scheduling step
          }}
          onBack={() => {
            setFormData(prev => ({ ...prev, serviceType: "" }));
            setPolishUpDetails(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-booking">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">Book a Pro</h1>
              <Badge variant="secondary">Step {step} of 4</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Quote Summary Banner - shown when coming from quote page */}
          {initialQuote && initialQuote.price > 0 && (
            <Card className="p-4 mb-6 bg-primary/5 border-primary/20" data-testid="quote-summary">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Your Quote</p>
                    <p className="text-sm text-muted-foreground">
                      {initialQuote.items.length} item{initialQuote.items.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary" data-testid="text-price-range">
                    ${Math.round(initialQuote.price * 0.85)} - ${Math.round(initialQuote.price * 1.15)}
                  </p>
                  <p className="text-xs text-muted-foreground">AI estimate - your Pro confirms final price on arrival</p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {step === 1 && (
                <Card className="p-6 md:p-8" data-testid="step-1-service">
                  {/* Loyalty Status Card */}
                  {loyaltyQuery.data?.account && (
                    <Card className="p-5 mb-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          {loyaltyQuery.data.account.currentTier === "platinum" && <Crown className="w-8 h-8 text-purple-500" />}
                          {loyaltyQuery.data.account.currentTier === "gold" && <Trophy className="w-8 h-8 text-yellow-500" />}
                          {loyaltyQuery.data.account.currentTier === "silver" && <Trophy className="w-8 h-8 text-slate-400" />}
                          {loyaltyQuery.data.account.currentTier === "bronze" && <Star className="w-8 h-8 text-amber-600" />}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize font-bold">
                                {loyaltyQuery.data.account.currentTier} Member
                              </Badge>
                              {LOYALTY_TIER_CONFIG[loyaltyQuery.data.account.currentTier as keyof typeof LOYALTY_TIER_CONFIG]?.discountPercent > 0 && (
                                <Badge className="bg-green-600 text-white">
                                  {LOYALTY_TIER_CONFIG[loyaltyQuery.data.account.currentTier as keyof typeof LOYALTY_TIER_CONFIG].discountPercent}% Off
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {loyaltyQuery.data.account.currentPoints?.toLocaleString() || 0} points • Every job builds your rewards—and supports Pros you can trust
                            </p>
                          </div>
                        </div>
                        <Link href="/loyalty">
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Gift className="w-4 h-4" />
                            View Rewards
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )}

                  <h2 className="text-xl font-semibold mb-2">Select Service Type</h2>
                  <p className="text-muted-foreground mb-6">What do you need help with today?</p>

                  <RadioGroup
                    value={formData.serviceType}
                    onValueChange={(val) => {
                      // Redirect to dedicated booking pages for certain services
                      if (val === "carpet_cleaning") {
                        navigate("/services/carpet-cleaning");
                        return;
                      }
                      if (val === "landscaping") {
                        navigate("/services/landscaping");
                        return;
                      }

                      setFormData(prev => ({
                        ...prev,
                        serviceType: val,
                        loadEstimate: "",
                        squareFootage: 500,
                        storyCount: 1,
                        laborHours: 2,
                        laborCrewSize: 2,
                      }));
                      setSelectedJunkLoadTier(null);
                      setSelectedGaragePackage(null);
                      setSelectedUnloadingHours(null);
                      setSelectedItems({});
                      setUploadedPhotos([]);
                      setVideoFrames([]);
                      setVideoUrl(null);
                      setMediaMode("photo");
                      setAiSuggestion(null);
                    }}
                    className="space-y-6"
                  >
                    {/* Featured: DwellScan */}
                    {serviceTypes.filter(s => s.featured).map((service) => (
                      <label
                        key={service.id}
                        className={`flex items-center gap-4 p-5 rounded-lg border-2 cursor-pointer transition-all hover-elevate bg-gradient-to-br from-primary/10 to-primary/5 ${
                          formData.serviceType === service.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-primary/50"
                        }`}
                        data-testid={`radio-service-${service.id}`}
                      >
                        <RadioGroupItem value={service.id} className="shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-1 mt-2 flex-wrap">
                            <service.icon className="w-5 h-5 text-primary" />
                            <span className="font-semibold">{service.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                          <p className="text-xs text-primary font-medium mt-1">From ${service.startingPrice}</p>
                        </div>
                      </label>
                    ))}

                    {/* Separator */}
                    <div className="flex items-center gap-3 py-2">
                      <div className="h-px bg-border flex-1"></div>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">All Services</span>
                      <div className="h-px bg-border flex-1"></div>
                    </div>

                    {/* All Other Services */}
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {serviceTypes.filter(s => !s.featured).map((service) => (
                        <label
                          key={service.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all hover-elevate ${
                            formData.serviceType === service.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          data-testid={`radio-service-${service.id}`}
                        >
                          <RadioGroupItem value={service.id} className="shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <service.icon className="w-5 h-5 text-primary" />
                              <span className="font-medium">{service.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                            <p className="text-xs text-primary font-medium mt-1">From ${service.startingPrice}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>

                  {formData.serviceType === "truck_unloading" && (
                    <div className="mt-8 p-5 bg-primary/5 rounded-lg border border-primary/20">
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-primary" />
                        Truck Details
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <Label className="mb-2 block">What size truck?</Label>
                          <RadioGroup 
                            value={formData.truckSize} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, truckSize: val }))}
                            className="grid sm:grid-cols-2 gap-3"
                          >
                            {truckSizes.map((size) => (
                              <label
                                key={size.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover-elevate ${
                                  formData.truckSize === size.id
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-background"
                                }`}
                                data-testid={`radio-truck-${size.id}`}
                              >
                                <RadioGroupItem value={size.id} />
                                <div>
                                  <span className="font-medium">{size.label}</span>
                                  <p className="text-xs text-muted-foreground">{size.description}</p>
                                </div>
                              </label>
                            ))}
                          </RadioGroup>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">How many bedrooms worth of furniture?</Label>
                          <RadioGroup 
                            value={String(formData.bedroomCount)} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, bedroomCount: parseInt(val) }))}
                            className="flex flex-wrap gap-2"
                          >
                            {bedroomOptions.map((opt) => (
                              <label
                                key={opt.id}
                                className={`px-4 py-2 rounded-lg border cursor-pointer transition-all hover-elevate ${
                                  formData.bedroomCount === opt.id
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-background"
                                }`}
                                data-testid={`radio-bedroom-${opt.id}`}
                              >
                                <RadioGroupItem value={String(opt.id)} className="sr-only" />
                                <span className="font-medium">{opt.label}</span>
                              </label>
                            ))}
                          </RadioGroup>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Any appliances to unload?</Label>
                          <div className="flex flex-wrap gap-2">
                            {applianceOptions.map((app) => (
                              <button
                                key={app.id}
                                type="button"
                                className={`px-3 py-1.5 rounded-lg border text-sm transition-all hover-elevate ${
                                  formData.appliancesList.includes(app.id)
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background"
                                }`}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    hasAppliances: !prev.appliancesList.includes(app.id) || prev.appliancesList.length > 1,
                                    appliancesList: prev.appliancesList.includes(app.id)
                                      ? prev.appliancesList.filter(a => a !== app.id)
                                      : [...prev.appliancesList, app.id]
                                  }));
                                }}
                                data-testid={`toggle-appliance-${app.id}`}
                              >
                                {app.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Any heavy/specialty items?</Label>
                          <div className="flex flex-wrap gap-2">
                            {heavyItemOptions.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className={`px-3 py-1.5 rounded-lg border text-sm transition-all hover-elevate ${
                                  formData.heavyItemsList.includes(item.id)
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background"
                                }`}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    hasHeavyItems: !prev.heavyItemsList.includes(item.id) || prev.heavyItemsList.length > 1,
                                    heavyItemsList: prev.heavyItemsList.includes(item.id)
                                      ? prev.heavyItemsList.filter(i => i !== item.id)
                                      : [...prev.heavyItemsList, item.id]
                                  }));
                                }}
                                data-testid={`toggle-heavy-${item.id}`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <Label className="mb-3 block">Crew Size</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { size: 1, label: "1 Pro", desc: "Small loads" },
                              { size: 2, label: "2 Pros", desc: "Standard" },
                              { size: 3, label: "3 Pros", desc: "Large trucks" },
                            ].map((crew) => (
                              <div
                                key={crew.size}
                                className={`p-4 rounded-lg border cursor-pointer transition-all hover-elevate text-center ${
                                  (formData.laborCrewSize || 2) === crew.size
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, laborCrewSize: crew.size }))}
                                data-testid={`truck-crew-size-${crew.size}`}
                              >
                                <Users className={`w-6 h-6 mx-auto mb-1 ${(formData.laborCrewSize || 2) === crew.size ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="font-medium text-sm">{crew.label}</div>
                                <p className="text-xs text-muted-foreground">{crew.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="flex justify-between items-end mb-3 gap-4 flex-wrap">
                            <Label>Hours Needed</Label>
                            <span className="text-lg font-bold text-primary" data-testid="text-truck-hours">{formData.laborHours || 1} hr{(formData.laborHours || 1) !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => setFormData(prev => ({ ...prev, laborHours: Math.max(1, (prev.laborHours || 1) - 1) }))}
                              disabled={(formData.laborHours || 1) <= 1}
                              data-testid="button-truck-hours-minus"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Slider
                              value={[formData.laborHours || 1]}
                              onValueChange={(val) => setFormData(prev => ({ ...prev, laborHours: val[0] }))}
                              min={1}
                              max={8}
                              step={1}
                              className="flex-1"
                              data-testid="slider-truck-hours"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => setFormData(prev => ({ ...prev, laborHours: Math.min(8, (prev.laborHours || 1) + 1) }))}
                              disabled={(formData.laborHours || 1) >= 8}
                              data-testid="button-truck-hours-plus"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>1 hr (min)</span>
                            <span>8 hrs</span>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex justify-between items-center gap-4 flex-wrap">
                            <span className="font-medium">Your Quote:</span>
                            <span className="text-xl font-bold text-primary" data-testid="text-truck-price">${getServicePrice()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formData.laborCrewSize || 2} Pro{(formData.laborCrewSize || 2) > 1 ? "s" : ""} &times; {formData.laborHours || 1} hrs &times; $80/hr = ${getServicePrice()}
                          </p>
                        </div>

                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            <strong>Note:</strong> If your job goes over the selected hours, your Pro will add the extra time at the end and you'll be charged the difference automatically.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* JUNK REMOVAL - Load tiers with required photo upload */}
                  {formData.serviceType === "junk_removal" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <Trash2 className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Estimate Your Load Size</h3>
                      </div>
                      
                      <div className="p-4 mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Camera className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-700 dark:text-amber-400">Photo or Video Required for Accurate Quote</p>
                            <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                              Upload photos or record a video walkthrough of your junk for AI-powered load estimation. Videos provide the most accurate estimates.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Truck Volume Visualizer */}
                      {(selectedJunkLoadTier || aiSuggestion) && (
                        <div className="mb-6 p-5 bg-gradient-to-br from-primary/5 to-green-500/5 border border-primary/20 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm">Estimated Truck Load</h4>
                            {aiSuggestion && (
                              <Badge variant="secondary" className="text-xs">
                                {Math.round((aiSuggestion.confidence || 0) * 100)}% AI Confidence
                              </Badge>
                            )}
                          </div>

                          {/* Truck Visual */}
                          <div className="relative w-full h-24 bg-muted rounded-lg overflow-hidden border-2 border-border mb-3">
                            {/* Truck bed outline */}
                            <div className="absolute inset-0 flex items-end">
                              <div
                                className="h-full bg-gradient-to-t from-primary/80 to-primary/40 transition-all duration-500 ease-out relative"
                                style={{
                                  width: selectedJunkLoadTier === 'minimum' ? '12%' :
                                         selectedJunkLoadTier === 'eighth' ? '20%' :
                                         selectedJunkLoadTier === 'quarter' ? '35%' :
                                         selectedJunkLoadTier === 'half' ? '55%' :
                                         selectedJunkLoadTier === 'three_quarter' ? '75%' :
                                         selectedJunkLoadTier === 'full' ? '100%' : '0%'
                                }}
                              >
                                {/* Fill level indicator */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
                              </div>
                            </div>

                            {/* Volume markers */}
                            <div className="absolute inset-0 flex items-end justify-between px-2 pb-1 pointer-events-none">
                              <span className="text-[10px] text-muted-foreground/60">Empty</span>
                              <span className="text-[10px] text-muted-foreground/60">1/4</span>
                              <span className="text-[10px] text-muted-foreground/60">1/2</span>
                              <span className="text-[10px] text-muted-foreground/60">3/4</span>
                              <span className="text-[10px] text-muted-foreground/60">Full</span>
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-sm font-medium">
                              {selectedJunkLoadTier === 'minimum' ? 'Minimum Load (under 1/8 truck)' :
                               selectedJunkLoadTier === 'eighth' ? '1/8 Truck Load' :
                               selectedJunkLoadTier === 'quarter' ? '1/4 Truck Load' :
                               selectedJunkLoadTier === 'half' ? '1/2 Truck Load' :
                               selectedJunkLoadTier === 'three_quarter' ? '3/4 Truck Load' :
                               selectedJunkLoadTier === 'full' ? 'Full Truck Load' : 'Select load size below'}
                            </p>
                            {aiSuggestion?.estimatedVolumeCubicFt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ~{Math.round(aiSuggestion.estimatedVolumeCubicFt)} cubic feet estimated
                              </p>
                            )}
                          </div>

                          {aiSuggestion && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground">
                                <strong>AI Analysis:</strong> {aiSuggestion.reasoning || 'Based on items identified in your photos.'}
                              </p>
                              {aiSuggestion.identifiedItems && aiSuggestion.identifiedItems.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <strong>Items found:</strong> {aiSuggestion.identifiedItems.slice(0, 5).join(', ')}
                                  {aiSuggestion.identifiedItems.length > 5 && ` +${aiSuggestion.identifiedItems.length - 5} more`}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground mb-4">
                        Select or adjust your truck load tier below:
                      </p>

                      <div className="space-y-3">
                        {junkRemovalLoadTiers.map((tier) => (
                          <div
                            key={tier.id}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover-elevate ${
                              selectedJunkLoadTier === tier.id 
                                ? "border-primary bg-primary/5" 
                                : "border-border"
                            }`}
                            onClick={() => setSelectedJunkLoadTier(tier.id)}
                            data-testid={`junk-tier-${tier.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                selectedJunkLoadTier === tier.id 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              }`}>
                                <Truck className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium">{tier.label}</div>
                                <div className="text-sm text-muted-foreground">{tier.description}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{tier.cubicYards}</div>
                                <div className="text-xs text-primary/80 mt-1 italic">e.g. {tier.examples}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">${tier.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {selectedJunkLoadTier && (
                        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Your Quote:</span>
                            <span className="text-xl font-bold text-primary" data-testid="text-price-range">
                              ${Math.round((junkRemovalLoadTiers.find(t => t.id === selectedJunkLoadTier)?.price || 0) * 0.85)} - ${Math.round((junkRemovalLoadTiers.find(t => t.id === selectedJunkLoadTier)?.price || 0) * 1.15)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            AI estimate - your Pro confirms final price on arrival
                          </p>
                          <div className="mt-3 pt-3 border-t border-primary/20">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              Pro will verify load size on arrival. If load exceeds tier, next tier price applies.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FURNITURE MOVING - Items only (no bulk load) */}
                  {formData.serviceType === "furniture_moving" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sofa className="w-5 h-5 text-primary" />
                          <h3 className="font-medium">Select Items to Move</h3>
                        </div>
                        {totalItemCount > 0 && (
                          <Badge variant="secondary" className="text-sm">
                            {totalItemCount} item{totalItemCount !== 1 ? "s" : ""} - ${itemsTotal}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        Select the furniture items you need moved for accurate pricing.
                      </p>
                      
                      <div className="grid gap-2 max-h-80 overflow-y-auto pr-2">
                        {itemPricing.filter(item => item.category === "furniture").map((item) => {
                          const qty = selectedItems[item.id] || 0;
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                qty > 0 ? "border-primary bg-primary/5" : "border-border"
                              }`}
                              data-testid={`item-${item.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">${item.price}</span>
                                <div className="flex items-center gap-1">
                                  {qty > 0 && (
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7"
                                      onClick={() => removeItem(item.id)}
                                      data-testid={`button-remove-${item.id}`}
                                    >
                                      <span className="text-lg leading-none">−</span>
                                    </Button>
                                  )}
                                  {qty > 0 && (
                                    <span className="w-6 text-center text-sm font-medium">{qty}</span>
                                  )}
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant={qty > 0 ? "default" : "outline"}
                                    className="h-7 w-7"
                                    onClick={() => addItem(item.id)}
                                    data-testid={`button-add-${item.id}`}
                                  >
                                    <span className="text-lg leading-none">+</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {totalItemCount > 0 && (
                        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Items Total:</span>
                            <span className="text-xl font-bold text-primary">${itemsTotal}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Base price for {totalItemCount} item{totalItemCount !== 1 ? "s" : ""}. Mileage calculated in next step.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* GARAGE CLEANOUT - Package pricing */}
                  {formData.serviceType === "garage_cleanout" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <Home className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Choose Your Package</h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        Fixed-price packages for hassle-free garage cleanouts. No hidden fees.
                      </p>
                      
                      <div className="space-y-3">
                        {garageCleanoutPackages.map((pkg) => (
                          <div
                            key={pkg.id}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover-elevate ${
                              selectedGaragePackage === pkg.id 
                                ? "border-primary bg-primary/5" 
                                : "border-border"
                            } ${pkg.featured ? "ring-2 ring-primary/30" : ""}`}
                            onClick={() => setSelectedGaragePackage(pkg.id)}
                            data-testid={`garage-pkg-${pkg.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                selectedGaragePackage === pkg.id 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              }`}>
                                <Home className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{pkg.label}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">{pkg.description}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{pkg.items} | {pkg.time}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">${pkg.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {selectedGaragePackage && (
                        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Package Price:</span>
                            <span className="text-xl font-bold text-primary">
                              ${garageCleanoutPackages.find(p => p.id === selectedGaragePackage)?.price || 0}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            All-inclusive: labor, hauling, and disposal included.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PRESSURE WASHING - Square footage slider */}
                  {formData.serviceType === "pressure_washing" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <Droplets className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Area to Clean</h3>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Estimate the total square footage. We price at $0.25/sq ft with a $120 minimum.
                      </p>

                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-3 gap-4 flex-wrap">
                            <Label>Square Footage</Label>
                            <span className="text-2xl font-bold text-primary" data-testid="text-sqft-value">
                              {formData.squareFootage.toLocaleString()} sq ft
                            </span>
                          </div>
                          <Slider
                            value={[formData.squareFootage]}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, squareFootage: val[0] }))}
                            min={100}
                            max={5000}
                            step={50}
                            data-testid="slider-sqft"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>100 sq ft</span>
                            <span>5,000 sq ft</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Small Patio", sqft: 200 },
                            { label: "Driveway", sqft: 800 },
                            { label: "Full House", sqft: 2500 },
                          ].map((preset) => (
                            <Button
                              key={preset.label}
                              type="button"
                              variant={formData.squareFootage === preset.sqft ? "default" : "outline"}
                              onClick={() => setFormData(prev => ({ ...prev, squareFootage: preset.sqft }))}
                              data-testid={`button-preset-${preset.sqft}`}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex justify-between items-center gap-4 flex-wrap">
                          <span className="font-medium">Your Quote:</span>
                          <span className="text-xl font-bold text-primary" data-testid="text-pw-price">
                            ${getServicePrice()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.squareFootage.toLocaleString()} sq ft &times; $0.25 = ${Math.round(formData.squareFootage * 0.25)}
                          {Math.round(formData.squareFootage * 0.25) < 150 ? " (minimum $150 applies)" : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* GUTTER CLEANING - Story toggle */}
                  {formData.serviceType === "gutter_cleaning" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <Home className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Home Details</h3>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Flat-rate pricing based on your home&rsquo;s height.
                      </p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { stories: 1, price: 149, label: "1-Story Home", desc: "Single level, standard roof" },
                          { stories: 2, price: 249, label: "2-Story Home", desc: "Two levels, requires tall ladder" },
                        ].map((opt) => (
                          <div
                            key={opt.stories}
                            className={`p-5 rounded-lg border cursor-pointer transition-all hover-elevate text-center ${
                              formData.storyCount === opt.stories
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, storyCount: opt.stories }))}
                            data-testid={`gutter-story-${opt.stories}`}
                          >
                            <Home className={`w-8 h-8 mx-auto mb-2 ${formData.storyCount === opt.stories ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="font-medium">{opt.label}</div>
                            <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
                            <div className="text-2xl font-bold text-primary mt-3" data-testid={`text-gutter-price-${opt.stories}`}>${opt.price}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Includes full gutter cleanout, downspout flush, and debris removal.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* HANDYMAN - Hours counter */}
                  {formData.serviceType === "handyman" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <Wrench className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Handyman Service Details</h3>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Professional handyman services for repairs, assembly, mounting, and more. From $49/hr, 1-hour minimum. Billed by the minute after first hour.
                      </p>

                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-3 gap-4 flex-wrap">
                            <Label>Hours Needed</Label>
                            <span className="text-lg font-bold text-primary" data-testid="text-handyman-hours">{formData.laborHours} hr{formData.laborHours !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => setFormData(prev => ({ ...prev, laborHours: Math.max(1, prev.laborHours - 1) }))}
                              disabled={formData.laborHours <= 1}
                              data-testid="button-handyman-hours-minus"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Slider
                              value={[formData.laborHours]}
                              onValueChange={(val) => setFormData(prev => ({ ...prev, laborHours: val[0] }))}
                              min={1}
                              max={8}
                              step={0.5}
                              className="flex-1"
                              data-testid="slider-handyman-hours"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => setFormData(prev => ({ ...prev, laborHours: Math.min(8, prev.laborHours + 0.5) }))}
                              disabled={formData.laborHours >= 8}
                              data-testid="button-handyman-hours-plus"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Estimate hours needed. Final time billed by the minute after first hour.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">
                          Common Tasks:
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                          • Furniture assembly (1-2 hrs) • TV mounting (1 hr) • Picture hanging (0.5-1 hr) • Minor drywall repair (1-2 hrs) • Door adjustments (1 hr) • Light fixture installation (1-2 hrs)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* MOVING LABOR - Hours counter + crew size */}
                  {formData.serviceType === "moving_labor" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Labor Details</h3>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Hourly labor for loading, unloading, or rearranging. $80/hr per Pro, 2-hour minimum.
                      </p>

                      <div className="space-y-6">
                        <div>
                          <Label className="mb-3 block">Crew Size</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { size: 1, label: "1 Worker", desc: "Light jobs" },
                              { size: 2, label: "2 Workers", desc: "Standard" },
                              { size: 3, label: "3 Workers", desc: "Heavy loads" },
                            ].map((crew) => (
                              <div
                                key={crew.size}
                                className={`p-4 rounded-lg border cursor-pointer transition-all hover-elevate text-center ${
                                  formData.laborCrewSize === crew.size
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, laborCrewSize: crew.size }))}
                                data-testid={`crew-size-${crew.size}`}
                              >
                                <Users className={`w-6 h-6 mx-auto mb-1 ${formData.laborCrewSize === crew.size ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="font-medium text-sm">{crew.label}</div>
                                <p className="text-xs text-muted-foreground">{crew.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-end mb-3 gap-4 flex-wrap">
                            <Label>Hours Needed</Label>
                            <span className="text-lg font-bold text-primary" data-testid="text-labor-hours">{formData.laborHours} hr{formData.laborHours !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => setFormData(prev => ({ ...prev, laborHours: Math.max(2, prev.laborHours - 1) }))}
                              disabled={formData.laborHours <= 2}
                              data-testid="button-hours-minus"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Slider
                              value={[formData.laborHours]}
                              onValueChange={(val) => setFormData(prev => ({ ...prev, laborHours: val[0] }))}
                              min={2}
                              max={12}
                              step={1}
                              className="flex-1"
                              data-testid="slider-hours"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => setFormData(prev => ({ ...prev, laborHours: Math.min(12, prev.laborHours + 1) }))}
                              disabled={formData.laborHours >= 12}
                              data-testid="button-hours-plus"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>2 hrs (min)</span>
                            <span>12 hrs</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex justify-between items-center gap-4 flex-wrap">
                          <span className="font-medium">Your Quote:</span>
                          <span className="text-xl font-bold text-primary" data-testid="text-labor-price">${getServicePrice()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.laborCrewSize} Pro{formData.laborCrewSize > 1 ? "s" : ""} &times; {formData.laborHours} hrs &times; $80/hr = ${getServicePrice()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* LIGHT DEMOLITION - Hourly with crew size */}
                  {formData.serviceType === "light_demolition" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <Hammer className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">Light Demolition</h3>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Hourly demolition labor including cleanup and hauling. $80/hr per Pro, 2-hour minimum.
                      </p>

                      <div className="space-y-6">
                        <div>
                          <Label className="mb-3 block">Crew Size</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { size: 1, label: "1 Pro", desc: "Small projects" },
                              { size: 2, label: "2 Pros", desc: "Standard" },
                              { size: 3, label: "3 Pros", desc: "Large jobs" },
                            ].map((crew) => (
                              <div
                                key={crew.size}
                                className={`p-4 rounded-lg border cursor-pointer transition-all hover-elevate text-center ${
                                  (formData.laborCrewSize || 2) === crew.size
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, laborCrewSize: crew.size }))}
                                data-testid={`demo-crew-size-${crew.size}`}
                              >
                                <Users className={`w-6 h-6 mx-auto mb-1 ${(formData.laborCrewSize || 2) === crew.size ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="font-medium text-sm">{crew.label}</div>
                                <p className="text-xs text-muted-foreground">{crew.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-end mb-3 gap-4 flex-wrap">
                            <Label>Hours Needed</Label>
                            <span className="text-lg font-bold text-primary" data-testid="text-demo-hours">{formData.laborHours || 2} hr{(formData.laborHours || 2) !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => setFormData(prev => ({ ...prev, laborHours: Math.max(2, (prev.laborHours || 2) - 1) }))}
                              disabled={(formData.laborHours || 2) <= 2}
                              data-testid="button-demo-hours-minus"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Slider
                              value={[formData.laborHours || 2]}
                              onValueChange={(val) => setFormData(prev => ({ ...prev, laborHours: val[0] }))}
                              min={2}
                              max={12}
                              step={1}
                              className="flex-1"
                              data-testid="slider-demo-hours"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => setFormData(prev => ({ ...prev, laborHours: Math.min(12, (prev.laborHours || 2) + 1) }))}
                              disabled={(formData.laborHours || 2) >= 12}
                              data-testid="button-demo-hours-plus"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>2 hrs (min)</span>
                            <span>12 hrs</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex justify-between items-center gap-4 flex-wrap">
                          <span className="font-medium">Your Quote:</span>
                          <span className="text-xl font-bold text-primary" data-testid="text-demo-price">${getServicePrice()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.laborCrewSize || 2} Pro{(formData.laborCrewSize || 2) > 1 ? "s" : ""} &times; {formData.laborHours || 2} hrs &times; $80/hr = ${getServicePrice()}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">What&rsquo;s included:</p>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Cabinet tear-out and removal</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Deck and fencing demolition</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Shed and small structure removal</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Debris hauling included</li>
                        </ul>
                      </div>

                      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Pro will assess the full scope on arrival. Price may adjust for larger or complex jobs.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DWELLSCAN - Two-tier pricing */}
                  {formData.serviceType === "home_consultation" && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                        <h3 className="font-medium">AI Home Scan - Select Your Tier</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {/* Standard Tier */}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, dwellscanTier: "standard" })}
                          className={`p-6 rounded-lg border-2 text-left transition-all ${
                            (formData.dwellscanTier || "standard") === "standard"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">AI Home Scan Standard</h4>
                              <p className="text-3xl font-bold text-primary mt-1">$99</p>
                            </div>
                            {(formData.dwellscanTier || "standard") === "standard" && (
                              <CheckCircle className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Full interior and exterior walkthrough with personalized maintenance report.
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> Room-by-room interior photos</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> Exterior ground-level assessment</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> Major systems check</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> Personalized maintenance report</li>
                          </ul>
                        </button>

                        {/* Aerial Tier */}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, dwellscanTier: "aerial" })}
                          className={`p-6 rounded-lg border-2 text-left transition-all relative ${
                            formData.dwellscanTier === "aerial"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Badge className="absolute top-3 right-3 bg-orange-500 text-white">Best Value</Badge>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">AI Home Scan Aerial</h4>
                              <p className="text-3xl font-bold text-primary mt-1">$199</p>
                            </div>
                            {formData.dwellscanTier === "aerial" && (
                              <CheckCircle className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Everything in Standard plus drone-powered roof and gutter scan.
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> <strong>Everything in Standard</strong></li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> FAA Part 107 drone pilot</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> Aerial roof condition scan</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> Gutter blockage assessment</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> GPS-tagged aerial photos</li>
                          </ul>
                          <p className="text-xs text-blue-600 mt-2 font-medium">
                            ⚡ Comparable drone inspections: $290-$350
                          </p>
                        </button>
                      </div>

                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Gift className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">$49 credit toward first booked service</p>
                            <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                              Get $49 off your first service booked from the Home Scan report recommendations. It's risk-free.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </Card>
              )}

              {step === 2 && (
                <Card className="p-6 md:p-8" data-testid="step-2-details">
                  <h2 className="text-xl font-semibold mb-2">Job Details</h2>
                  <p className="text-muted-foreground mb-6">Tell us where and when you need the service.</p>

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="address">Pickup Address</Label>
                        <div className="relative mt-2">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="address"
                            placeholder="123 Main Street" 
                            className="pl-10"
                            value={formData.pickupAddress}
                            onChange={(e) => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                            data-testid="input-address"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city"
                          placeholder="Orlando" 
                          className="mt-2"
                          value={formData.pickupCity}
                          onChange={(e) => setFormData(prev => ({ ...prev, pickupCity: e.target.value }))}
                          data-testid="input-city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input 
                          id="zip"
                          placeholder="32801" 
                          className="mt-2"
                          value={formData.pickupZip}
                          onChange={(e) => setFormData(prev => ({ ...prev, pickupZip: e.target.value }))}
                          data-testid="input-zip"
                        />
                      </div>
                    </div>


                    {formData.serviceType === "furniture_moving" && (
                      <div className="space-y-6 pt-4 border-t">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Navigation className="w-5 h-5 text-primary" />
                            <span className="font-medium">Move Details</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            For moves, we need both pickup and destination to calculate your total cost including mileage.
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <Label htmlFor="dest-address">Destination Address</Label>
                            <div className="relative mt-2">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input 
                                id="dest-address"
                                placeholder="456 Oak Avenue" 
                                className="pl-10"
                                value={formData.destinationAddress}
                                onChange={(e) => setFormData(prev => ({ ...prev, destinationAddress: e.target.value }))}
                                data-testid="input-dest-address"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="dest-city">Destination City</Label>
                            <Input 
                              id="dest-city"
                              placeholder="Orlando" 
                              className="mt-2"
                              value={formData.destinationCity}
                              onChange={(e) => setFormData(prev => ({ ...prev, destinationCity: e.target.value }))}
                              data-testid="input-dest-city"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dest-zip">Destination ZIP Code</Label>
                            <Input 
                              id="dest-zip"
                              placeholder="32801" 
                              className="mt-2"
                              maxLength={5}
                              value={formData.destinationZip}
                              onChange={(e) => setFormData(prev => ({ ...prev, destinationZip: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
                              data-testid="input-dest-zip"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pickup-stairs">Flights of Stairs at Pickup</Label>
                            <div className="flex items-center gap-3 mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setFormData(prev => ({ ...prev, pickupStairs: Math.max(0, prev.pickupStairs - 1) }))}
                                disabled={formData.pickupStairs === 0}
                                data-testid="button-pickup-stairs-minus"
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-medium" data-testid="text-pickup-stairs">{formData.pickupStairs}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setFormData(prev => ({ ...prev, pickupStairs: prev.pickupStairs + 1 }))}
                                data-testid="button-pickup-stairs-plus"
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="dest-stairs">Flights of Stairs at Destination</Label>
                            <div className="flex items-center gap-3 mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setFormData(prev => ({ ...prev, destinationStairs: Math.max(0, prev.destinationStairs - 1) }))}
                                disabled={formData.destinationStairs === 0}
                                data-testid="button-dest-stairs-minus"
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-medium" data-testid="text-dest-stairs">{formData.destinationStairs}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setFormData(prev => ({ ...prev, destinationStairs: prev.destinationStairs + 1 }))}
                                data-testid="button-dest-stairs-plus"
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label>Service Type</Label>
                          <p className="text-sm text-muted-foreground mb-3">Do you need a truck, or just help with loading/unloading?</p>
                          <RadioGroup 
                            value={formData.moveServiceMode} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, moveServiceMode: val as "truck_and_mover" | "labor_only" }))}
                            className="grid sm:grid-cols-2 gap-4"
                          >
                            <label
                              className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all hover-elevate ${
                                formData.moveServiceMode === "truck_and_mover"
                                  ? "border-primary bg-primary/5"
                                  : "border-border"
                              }`}
                              data-testid="radio-service-truck"
                            >
                              <RadioGroupItem value="truck_and_mover" className="mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Truck className="w-5 h-5 text-primary" />
                                  <span className="font-medium">Truck + Mover</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Full service with truck and professional movers</p>
                              </div>
                            </label>
                            <label
                              className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all hover-elevate ${
                                formData.moveServiceMode === "labor_only"
                                  ? "border-primary bg-primary/5"
                                  : "border-border"
                              }`}
                              data-testid="radio-service-labor"
                            >
                              <RadioGroupItem value="labor_only" className="mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Users className="w-5 h-5 text-primary" />
                                  <span className="font-medium">Labor Only</span>
                                  <Badge variant="secondary" className="text-xs">40% Off</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">Loading/unloading help - you provide the truck</p>
                              </div>
                            </label>
                          </RadioGroup>
                        </div>

                        {moveQuote && (
                          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <Navigation className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-700 dark:text-green-400">
                                Distance: {moveQuote.distanceMiles} miles
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              {(moveQuote.breakdown ?? []).map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span className={item.amount < 0 ? "text-green-600" : "text-muted-foreground"}>{item.label}</span>
                                  <span className={item.amount < 0 ? "text-green-600" : ""}>
                                    {item.amount < 0 ? "-" : ""}${Math.abs(item.amount).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between pt-2 border-t mt-2 font-semibold">
                                <span>Estimated Total</span>
                                <span className="text-primary" data-testid="text-price-range">${Math.round(moveQuote.totalPrice * 0.85)} - ${Math.round(moveQuote.totalPrice * 1.15)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                AI estimate - your Pro confirms final price on arrival
                              </p>
                            </div>
                          </div>
                        )}

                        {moveQuoteError && (
                          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{moveQuoteError}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <Label>When do you need service?</Label>
                      
                      {/* Primary: Find Pros Now */}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, scheduledFor: "asap" }))}
                        className={`w-full mt-3 p-4 rounded-lg border-2 text-left transition-all hover-elevate ${
                          formData.scheduledFor === "asap"
                            ? "border-primary bg-primary/10"
                            : "border-primary/50 bg-primary/5"
                        }`}
                        data-testid="button-time-asap"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                              <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-lg">Find Pros Now</div>
                              <div className="text-sm text-muted-foreground">Get matched within minutes</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                              </span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {availablePros?.length || 0} Pros live
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">Ready to help now</div>
                          </div>
                        </div>
                      </button>

                      {/* Secondary: Schedule Ahead */}
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Or schedule ahead:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, scheduledFor: slot.id }))}
                              className={`p-3 rounded-lg border text-center transition-all hover-elevate ${
                                formData.scheduledFor === slot.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border"
                              }`}
                              data-testid={`button-time-${slot.id}`}
                            >
                              <div className="font-medium text-sm">{slot.label}</div>
                              <div className="text-xs text-muted-foreground">{slot.sublabel}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">What needs to be hauled?</Label>
                      <Textarea 
                        id="description"
                        placeholder="Describe the items that need to be removed or moved..."
                        className="mt-2"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        data-testid="textarea-description"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gateCode">Gate Code (if applicable)</Label>
                        <Input 
                          id="gateCode"
                          placeholder="e.g. #1234 or *5678"
                          className="mt-2"
                          value={formData.gateCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, gateCode: e.target.value }))}
                          data-testid="input-gate-code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Special Access Instructions</Label>
                        <Input 
                          id="notes"
                          placeholder="Parking info, locked doors, etc."
                          className="mt-2"
                          value={formData.accessNotes}
                          onChange={(e) => setFormData(prev => ({ ...prev, accessNotes: e.target.value }))}
                          data-testid="input-access-notes"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
                      <div className="flex items-center gap-2 mb-3">
                        <Lock className="w-5 h-5 text-primary" />
                        <Label className="font-medium">Property Access</Label>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        How will your Pro access the property?
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { id: "person" as const, label: "I'll be there", icon: Users },
                          { id: "smart_lock" as const, label: "Smart Lock Code", icon: KeyRound },
                          { id: "lockbox" as const, label: "Lockbox Code", icon: Lock },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all hover-elevate ${
                              formData.accessType === opt.id
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border bg-background"
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, accessType: opt.id }))}
                            data-testid={`button-access-${opt.id}`}
                          >
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {formData.accessType !== "person" && (
                        <div className="mt-3">
                          <Label htmlFor="smartLockCode">
                            {formData.accessType === "smart_lock" ? "Smart Lock Code" : "Lockbox Combination"}
                          </Label>
                          <Input
                            id="smartLockCode"
                            placeholder={formData.accessType === "smart_lock" ? "e.g. 4-digit PIN" : "e.g. 1234"}
                            className="mt-2"
                            type="password"
                            value={formData.smartLockCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, smartLockCode: e.target.value }))}
                            data-testid="input-smart-lock-code"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Your code is encrypted and only revealed to your assigned Pro when they're en route.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-6 rounded-md" data-testid="section-carbon-neutral">
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500 p-2 rounded-lg">
                            <Leaf className="text-white w-5 h-5" />
                          </div>
                          <div>
                            <Label className="font-bold text-base">Carbon Neutral Guarantee</Label>
                            <p className="text-[10px] text-green-700 dark:text-green-400 font-bold uppercase tracking-widest">Powered by UpTend Sustain</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">$14.99</Badge>
                          <Switch
                            checked={formData.carbonOffsetOptIn}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, carbonOffsetOptIn: checked }))}
                            data-testid="switch-carbon-offset"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Make your entire residence 100% Carbon Neutral for 30 days. We purchase and retire verified local Florida carbon credits based on the materials recovered from your service.
                      </p>
                      {formData.carbonOffsetOptIn && (
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-md border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                            <Info className="w-3 h-3 flex-shrink-0" />
                            <span>Verified by UpTend ESG Ledger. Certificate added to your Home Playbook for insurance and resale value.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-primary" />
                        <Label className="font-medium">Preferred Language</Label>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        We'll try to match you with a Pro who speaks your preferred language.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "en", label: "English" },
                          { id: "es", label: "Spanish" },
                          { id: "pt", label: "Portuguese" },
                          { id: "fr", label: "French" },
                          { id: "ht", label: "Haitian Creole" },
                          { id: "vi", label: "Vietnamese" },
                          { id: "zh", label: "Chinese" },
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            className={`px-3 py-1.5 rounded-lg border text-sm transition-all hover-elevate ${
                              formData.preferredLanguage === lang.id
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border bg-background"
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, preferredLanguage: lang.id }))}
                            data-testid={`button-lang-${lang.id}`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Label className="flex items-center gap-2 mb-1">
                        <Camera className="w-4 h-4" />
                        Photos or Video {totalItemCount === 0 && <span className="text-red-500">*</span>}
                        {totalItemCount > 0 && <Badge variant="outline" className="text-xs ml-1">Highly Recommended</Badge>}
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        {totalItemCount > 0 
                          ? "Add photos or a video walkthrough for a more accurate AI price estimate"
                          : "Upload photos or record a video walkthrough for the most accurate AI price estimate"
                        }
                      </p>
                      
                      <div className="flex gap-1 mb-4">
                        <Button
                          type="button"
                          variant={mediaMode === "photo" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMediaMode("photo")}
                          className="gap-1.5"
                          data-testid="button-mode-photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Photos
                        </Button>
                        <Button
                          type="button"
                          variant={mediaMode === "video" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMediaMode("video")}
                          className="gap-1.5"
                          data-testid="button-mode-video"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Video Walkthrough
                        </Button>
                      </div>

                      {mediaMode === "photo" ? (
                        <>
                          <div className="flex flex-wrap gap-3">
                            {uploadedPhotos.map((photo, index) => (
                              <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted">
                                <img 
                                  src={photo.previewUrl} 
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                                  data-testid={`button-remove-photo-${index}`}
                                  title="Remove photo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                {photo.path.startsWith("temp-") && (
                                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {uploadedPhotos.length < 5 && (
                              <label 
                                className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover-elevate transition-colors"
                                data-testid="button-add-photo"
                              >
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={handlePhotoUpload}
                                  disabled={isUploading}
                                />
                                {isUploading ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Add Photo</span>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                          
                          {uploadedPhotos.length >= 2 ? (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                              {uploadedPhotos.length}/5 photos added - great for accurate pricing!
                            </p>
                          ) : uploadedPhotos.length === 1 ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                              1/5 photos added - add 1-2 more angles for better accuracy
                            </p>
                          ) : totalItemCount > 0 ? (
                            <p className="text-xs text-muted-foreground mt-2">
                              Photos are optional when using a la carte, but help verify pricing
                            </p>
                          ) : (
                            <p className="text-xs text-red-500 mt-2">
                              Add 2-3 photos from different angles for accurate AI pricing
                            </p>
                          )}
                          
                          {uploadError && (
                            <p className="text-xs text-red-500 mt-2">
                              Failed to upload photo. Please try again.
                            </p>
                          )}
                        </>
                      ) : (
                        <VideoUpload
                          onFramesExtracted={(frames) => {
                            setVideoFrames(frames);
                            setAiSuggestion(null);
                          }}
                          onVideoUploaded={(url) => setVideoUrl(url)}
                          maxDurationSeconds={60}
                        />
                      )}
                      
                      {mediaMode === "photo" && uploadedPhotos.filter(p => p.path.startsWith("/")).length > 0 && formData.serviceType && !aiSuggestion && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={analyzePhotos}
                            disabled={isAnalyzing}
                            data-testid="button-analyze-photos"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing photos...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                Get AI Price Estimate
                              </>
                            )}
                          </Button>
                          {aiError && (
                            <p className="text-xs text-red-500 mt-2">{aiError}</p>
                          )}
                        </div>
                      )}

                      {mediaMode === "video" && videoFrames.length > 0 && formData.serviceType && !aiSuggestion && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={analyzeVideo}
                            disabled={isAnalyzing}
                            data-testid="button-analyze-video"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing video ({videoFrames.length} frames)...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                Get AI Price Estimate from Video
                              </>
                            )}
                          </Button>
                          {aiError && (
                            <p className="text-xs text-red-500 mt-2">{aiError}</p>
                          )}
                        </div>
                      )}
                      
                      {aiSuggestion && (
                        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-5 h-5 text-primary" />
                            <span className="font-medium text-primary">AI Analysis</span>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(aiSuggestion.confidence * 100)}% confident
                            </Badge>
                          </div>
                          
                          {aiSuggestion.identifiedItems.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm text-muted-foreground mb-1">Items detected:</p>
                              <div className="flex flex-wrap gap-1">
                                {(aiSuggestion.identifiedItems ?? []).slice(0, 6).map((item, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                                {(aiSuggestion.identifiedItems?.length ?? 0) > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(aiSuggestion.identifiedItems?.length ?? 0) - 6} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Load size:</p>
                              <p className="font-semibold capitalize">{aiSuggestion.recommendedLoadSize.replace("_", " ")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Truck needed:</p>
                              <p className="font-semibold capitalize">{aiSuggestion.recommendedTruckSize.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                          
                          {aiSuggestion.priceBreakdown && aiSuggestion.priceBreakdown.length > 0 && (
                            <div className="mb-3 p-3 bg-background/50 rounded-md">
                              <p className="text-sm font-medium mb-2">Price breakdown:</p>
                              {(aiSuggestion.priceBreakdown ?? []).map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{item.label}</span>
                                  <span>${item.amount}</span>
                                </div>
                              ))}
                              <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t">
                                <span>Total</span>
                                <span className="text-primary">${aiSuggestion.suggestedPrice}</span>
                              </div>
                            </div>
                          )}
                          
                          {aiSuggestion.reasoning && (
                            <p className="text-xs text-muted-foreground mb-3">{aiSuggestion.reasoning}</p>
                          )}
                          
                          <Button
                            type="button"
                            size="sm"
                            onClick={applyAiSuggestion}
                            data-testid="button-apply-ai-suggestion"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Apply Suggestion
                          </Button>
                        </div>
                      )}
                    </div>

                    {aiSuggestion && aiSuggestion.identifiedItems?.length > 0 && (
                      <div className="pt-4">
                        <BundlingSuggestions
                          identifiedItems={aiSuggestion.identifiedItems}
                          serviceType={formData.serviceType}
                          photoUrls={uploadedPhotos.filter(p => p.path.startsWith("/")).map(p => p.path).slice(0, 4)}
                        />
                      </div>
                    )}

                    {/* All Pros are Verified & Insured */}
                    <div className="pt-6 border-t">
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                            All UpTend Pros are Verified & Fully Insured
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            Every Pro carries $1M liability insurance, passes background checks, and is academy-trained. Your property is protected on every job.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {step === 3 && (
                <Card className="p-6 md:p-8" data-testid="step-3-matching">
                  {showProSwiper ? (
                    <MatchingFlow
                      customerLocation={customerLocation}
                      availablePros={(availablePros || []).map(h => {
                        const profileId = h.profile?.id;
                        const nearbyInfo = nearbyPros.find((np: any) => String(np.proId) === String(profileId));
                        return {
                          id: String(h.id),
                          profileId: String(profileId),
                          name: h.profile.companyName || `${h.firstName || ''} ${h.lastName || ''}`.trim() || 'Pro',
                          photo: pro1,
                          rating: h.profile.rating || 4.5,
                          completedJobs: h.profile.reviewCount || 0,
                          specialty: h.profile.bio?.slice(0, 50) || 'Professional services',
                          distance: nearbyInfo?.distance || 2.5,
                          eta: nearbyInfo?.eta,
                          hourlyRate: 75,
                          available: h.profile.isAvailable || false,
                          verified: h.profile.pyckerTier === 'verified_pro',
                          badges: h.profile.pyckerTier === 'verified_pro' ? ['Verified Pro', 'Insured'] : [],
                          bio: h.profile.bio || 'Ready to help with your service needs!',
                          vehicleType: h.activeVehicle?.vehicleType?.replace(/_/g, ' ') || h.profile.vehicleType?.replace(/_/g, ' ') || 'Truck',
                          languages: ['English'],
                          location: nearbyInfo?.location,
                        };
                      })}
                      jobDetails={{
                        serviceType: (() => {
                          const label = serviceTypes.find(s => s.id === formData.serviceType)?.label;
                          return typeof label === 'string' ? label : formData.serviceType;
                        })(),
                        address: formData.pickupAddress,
                        scheduledDate: formData.scheduledFor || 'ASAP',
                        estimatedPrice: priceQuote?.totalPrice || itemsTotal || 149
                      }}
                      onProSelected={(pro) => {
                        const foundPro = availablePros?.find(h => String(h.id) === pro.id);
                        if (foundPro) {
                          setSelectedPro(foundPro);
                          setShowProSwiper(false);
                        }
                      }}
                      onCancel={() => setShowProSwiper(false)}
                    />
                  ) : !matchingComplete ? (
                    <div className="text-center py-12">
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-muted" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <Truck className="absolute inset-0 m-auto w-10 h-10 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">Finding Available Pros...</h2>
                      <p className="text-muted-foreground mb-6">
                        We're matching you with verified professionals in your area.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
                        <Timer className="w-4 h-4" />
                        <span>Estimated wait: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                      </div>
                      {availablePros && availablePros.length >= 1 && (
                        <Button
                          variant="outline"
                          onClick={() => setShowProSwiper(true)}
                          data-testid="button-browse-pros-during-matching"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Browse {availablePros.length} Available Pro{availablePros.length > 1 ? 's' : ''}
                        </Button>
                      )}
                    </div>
                  ) : selectedPro ? (
                    <div>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-6">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Match Found!</span>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl mb-6">
                        <Avatar className="w-16 h-16 border-2 border-background">
                          <AvatarImage src={pro1} alt={selectedPro.profile.companyName} />
                          <AvatarFallback>{selectedPro.firstName?.charAt(0) || selectedPro.profile.companyName?.charAt(0) || 'P'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold">{selectedPro.profile.companyName}</h3>
                            <ProTierBadge tier={selectedPro.profile.pyckerTier || 'independent'} size="sm" />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium text-foreground">{selectedPro.profile.rating}</span>
                              <span>({selectedPro.profile.reviewCount} reviews)</span>
                            </div>
                          </div>
                          {(selectedPro.activeVehicle || selectedPro.profile.vehicleType) && (
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="gap-1">
                                <Truck className="w-3 h-3" />
                                {selectedPro.activeVehicle 
                                  ? `${selectedPro.activeVehicle.year || ""} ${selectedPro.activeVehicle.make || ""} ${selectedPro.activeVehicle.model || ""}`.trim() || selectedPro.activeVehicle.vehicleType.replace(/_/g, " ")
                                  : selectedPro.profile.vehicleType.replace(/_/g, " ")}
                              </Badge>
                              {selectedPro.activeVehicle?.capacity && (
                                <Badge variant="outline" className="text-xs">
                                  {selectedPro.activeVehicle.capacity}
                                </Badge>
                              )}
                              {selectedPro.activeVehicle?.isEnclosed && (
                                <Badge variant="outline" className="text-xs">
                                  Enclosed
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">{selectedPro.profile.bio}</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Estimated Arrival</div>
                          <div className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            25-35 minutes
                          </div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Quote</div>
                          <div className="text-lg font-semibold flex items-center gap-2" data-testid="text-price-range">
                            <DollarSign className="w-5 h-5 text-primary" />
                            ${priceQuote?.priceMin?.toFixed(0) || Math.round((priceQuote?.totalPrice || 149) * 0.85)} - ${priceQuote?.priceMax?.toFixed(0) || Math.round((priceQuote?.totalPrice || 149) * 1.15)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">AI estimate - your Pro confirms final price on arrival</p>
                        </div>
                      </div>

                      {!showPayment ? (
                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1" onClick={() => setShowProSwiper(true)} data-testid="button-browse-pros">
                            Browse Pros
                          </Button>
                          <Button className="flex-1" onClick={() => setShowPayment(true)} data-testid="button-accept-match">
                            Accept Match
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-6">
                          {paymentError && (
                            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                              {paymentError}
                            </div>
                          )}
                          {paymentAuthorized ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                <p className="font-medium text-green-700 dark:text-green-300">Payment Authorized</p>
                                <p className="text-sm text-muted-foreground">Your payment is <strong>held</strong> and will only be charged upon job completion.</p>
                              </div>
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-xs text-red-700 dark:text-red-400 text-center">
                                  <strong>IMPORTANT:</strong> Pros are NEVER authorized to accept cash payments. Tips are the only exception. ALL transactions are processed securely through the UpTend app. Paying a Pro directly violates our terms.
                                </p>
                              </div>
                              <Button className="w-full" onClick={handleNext} data-testid="button-confirm-booking">
                                Confirm Booking
                              </Button>
                            </div>
                          ) : createdRequestId ? (
                            <>
                              {/* Price Breakdown with Protection Fee */}
                              <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Service</span>
                                    <span>${(priceQuote?.totalPrice || 149).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm items-center">
                                    <div className="flex items-center gap-1">
                                      <span>UpTend Protection Fee (7%)</span>
                                      <div className="group relative">
                                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                          Covers your $1M liability insurance, verified Pro guarantee, background checks, sustainability tracking, and 24/7 support.
                                        </div>
                                      </div>
                                    </div>
                                    <span>${(((priceQuote?.totalPrice || 149) * 0.07)).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Total</span>
                                    <span>${(((priceQuote?.totalPrice || 149) * 1.07)).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                              {isDevMode ? (
                                <Button 
                                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                                  variant="outline"
                                  onClick={() => {
                                    setPaymentAuthorized(true);
                                    setPaymentError(null);
                                  }}
                                  data-testid="button-dev-authorize-payment"
                                >
                                  ⚡ Dev Mode: Authorize Payment
                                </Button>
                              ) : (
                                <PaymentForm
                                  amount={((priceQuote?.totalPrice || 149) * 1.07)}
                                  jobId={createdRequestId}
                                  customerId={user?.id || "guest"}
                                  assignedHaulerId={selectedPro?.id}
                                  onSuccess={() => {
                                    setPaymentAuthorized(true);
                                    setPaymentError(null);
                                  }}
                                  onError={(error) => setPaymentError(error)}
                                />
                              )}
                            </>
                          ) : (
                            <div className="text-center text-muted-foreground">
                              Loading payment...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No Pros available right now. Please try again later.</p>
                    </div>
                  )}
                </Card>
              )}

              {step === 4 && (
                <Card className="p-6 md:p-8" data-testid="step-4-confirmation">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                    <p className="text-muted-foreground">
                      Your Pro is on the way. Track their location in real-time.
                    </p>
                  </div>

                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
                    <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                      <strong>Payment Held:</strong> Your payment is securely held and will only be charged once the job is marked complete.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                    <p className="text-xs text-red-700 dark:text-red-400 text-center">
                      <strong>NO CASH POLICY:</strong> Pros are NEVER authorized to accept cash payments (tips are okay). ALL transactions are processed through UpTend. Report any cash requests immediately.
                    </p>
                  </div>

                  {selectedPro && (
                    <div className="bg-muted/50 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={pro1} alt={selectedPro.profile.companyName} />
                          <AvatarFallback>{selectedPro.firstName?.charAt(0) || selectedPro.profile.companyName?.charAt(0) || 'P'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{selectedPro.profile.companyName}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>{selectedPro.profile.rating}</span>
                          </div>
                        </div>
                        <div className="ml-auto flex gap-2">
                          <Button size="icon" variant="outline" data-testid="button-call">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" data-testid="button-message">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">ETA</span>
                          <p className="font-medium">25-35 min</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vehicle</span>
                          <p className="font-medium">
                            {selectedPro.activeVehicle 
                              ? `${selectedPro.activeVehicle.year || ""} ${selectedPro.activeVehicle.make || ""} ${selectedPro.activeVehicle.model || ""}`.trim() || selectedPro.activeVehicle.vehicleType.replace(/_/g, " ")
                              : selectedPro.profile.vehicleType.replace(/_/g, " ")}
                          </p>
                          {selectedPro.activeVehicle?.capacity && (
                            <p className="text-xs text-muted-foreground">{selectedPro.activeVehicle.capacity}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {createdRequestId && (
                    <Button 
                      variant="outline" 
                      className="w-full mb-4 flex items-center gap-2"
                      onClick={() => navigate(`/track/${createdRequestId}`)}
                      data-testid="button-track"
                    >
                      <Navigation className="w-4 h-4" />
                      Track Your Pro Live
                    </Button>
                  )}

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium">
                        {serviceTypes.find(s => s.id === formData.serviceType)?.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Pickup</span>
                      <span className="font-medium text-right">
                        {formData.pickupAddress}, {formData.pickupCity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Estimated Total</span>
                      <span className="font-bold text-lg" data-testid="text-price-range">${priceQuote?.priceMin?.toFixed(0) || Math.round((priceQuote?.totalPrice || 149) * 0.85)} - ${priceQuote?.priceMax?.toFixed(0) || Math.round((priceQuote?.totalPrice || 149) * 1.15)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">AI estimate - your Pro confirms final price on arrival</p>
                  </div>

                  <Button className="w-full" onClick={() => navigate("/")} data-testid="button-done">
                    Done
                  </Button>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="p-4 sticky top-24" data-testid="price-summary">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Live Price Quote
                </h3>

                {!formData.serviceType || !formData.loadEstimate ? (
                  <p className="text-sm text-muted-foreground">
                    Select a service and load size to see your price estimate.
                  </p>
                ) : isPriceLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : priceQuote && priceQuote.totalPrice !== undefined ? (
                  <div>
                    <div className="text-3xl font-bold text-primary mb-1" data-testid="text-price-range">
                      ${(priceQuote.priceMin ? priceQuote.priceMin + itemsTotal : (priceQuote.totalPrice + itemsTotal) * 0.85).toFixed(0)} - ${(priceQuote.priceMax ? priceQuote.priceMax + itemsTotal : (priceQuote.totalPrice + itemsTotal) * 1.15).toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Visual Quote - locked for the items in your photos</p>
                    <PricingTransparencyModal />
                    <div className="mb-4" />

                    {isPrioritySlot() && (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm border border-blue-200 dark:border-blue-800" data-testid="priority-slot">
                        <CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <span className="font-medium text-blue-700 dark:text-blue-300">Priority Booking</span>
                          <p className="text-xs text-blue-600 dark:text-blue-400">Same-day & weekend slots reserved for app users first</p>
                        </div>
                      </div>
                    )}

                    {priceQuote.surgeMultiplier > 1 && (
                      <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                        <TrendingUp className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-700 dark:text-yellow-400">
                          {priceQuote.surgeMultiplier}x surge pricing active
                        </span>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {(priceQuote.breakdown ?? []).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">${item.amount.toFixed(0)}</span>
                        </div>
                      ))}
                      {totalItemCount > 0 && (
                        <div className="flex justify-between pt-2 border-t mt-2">
                          <span className="text-muted-foreground">À La Carte Items ({totalItemCount})</span>
                          <span className="font-medium">${itemsTotal}</span>
                        </div>
                      )}
                      {priceQuote.promoDiscount && priceQuote.promoDiscount > 0 && (
                        <div className="flex justify-between text-purple-600 dark:text-purple-400">
                          <span>Promo Code ({priceQuote.promoCodeApplied?.toUpperCase()})</span>
                          <span className="font-medium">-${priceQuote.promoDiscount.toFixed(0)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm font-medium mb-2 block">Promo Code</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. ORLANDO25"
                          value={formData.promoCode}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }));
                            setPromoValidation(null);
                          }}
                          className="flex-1"
                          data-testid="input-promo-code"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!formData.promoCode || isValidatingPromo}
                          onClick={async () => {
                            if (!formData.promoCode) return;
                            setIsValidatingPromo(true);
                            try {
                              const res = await apiRequest("POST", "/api/promo-codes/validate", {
                                code: formData.promoCode,
                                userId: user?.id || "guest",
                                orderAmount: priceQuote.totalPrice,
                                isApp: true,
                              });
                              const result = await res.json();
                              setPromoValidation(result);
                              if (result.valid) {
                                trackPromoApplied(user?.id || "guest", formData.promoCode, result.discount);
                              }
                            } catch {
                              setPromoValidation({ valid: false, discount: 0, error: "Failed to validate" });
                            } finally {
                              setIsValidatingPromo(false);
                            }
                          }}
                          data-testid="button-apply-promo"
                        >
                          {isValidatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                      {promoValidation && !promoValidation.valid && (
                        <p className="text-xs text-red-500 mt-1" data-testid="promo-error">{promoValidation.error}</p>
                      )}
                      {promoValidation?.valid && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1" data-testid="promo-success">
                          Promo code applied! Saving ${promoValidation.discount.toFixed(0)}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Zap className="w-4 h-4" />
                        <span>{aiSuggestion ? "AI-verified pricing" : "Transparent pricing"} - fair and final</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {aiSuggestion 
                          ? "Price is set by our AI based on your photos. No haggling, no surprises."
                          : "Price based on your selected items. Moving includes $1/mile. No hidden fees."
                        }
                      </p>
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>
          </div>

          {step < 3 && (
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button 
                className="ml-auto" 
                onClick={handleNext}
                disabled={
                  (step === 1 && !isStep1Complete()) ||
                  (step === 2 && (!formData.pickupAddress || !formData.pickupCity || !formData.pickupZip)) ||
                  (step === 2 && formData.serviceType === "furniture_moving" && !formData.destinationAddress)
                }
                data-testid="button-next"
              >
                {step === 2 ? "Find Pro" : "Continue"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
