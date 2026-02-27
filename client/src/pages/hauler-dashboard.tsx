import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useGeoLocation } from "@/hooks/use-geolocation";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProVehicle } from "@shared/schema";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Truck, LayoutDashboard, ClipboardList, Calendar, DollarSign,
  User, Settings, Bell, MapPin, Clock, Package, CheckCircle,
  X, Star, Phone, MessageCircle, Navigation, Timer, CreditCard,
  ExternalLink, Loader2, AlertCircle, Shield, UserCheck, CircleDollarSign,
  ClipboardCheck, Plus, Minus, Camera, AlertTriangle, Upload, Image, Flag,
  Eye, EyeOff, Flame, Lock, Leaf, KeyRound, Zap, TrendingUp, ChevronRight,
  Award, Target, Droplets, Hammer, Users, Gift, Building2
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldAuditForm } from "@/components/field-audit-form";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ServiceRequestWithDetails, ProWithProfile } from "@shared/schema";

import pro1 from "@assets/stock_images/professional_male_wo_ae620e83.jpg";
import { Logo } from "@/components/ui/logo";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { VerificationWorkflow } from "@/components/verification/verification-workflow";
import { NdaAgreementModal } from "@/components/nda-agreement-modal";
import { ICABanner, ICAAgreement, type ICAAcceptanceData } from "@/components/auth/ica-agreement";
import { ProRouteOptimizer } from "@/components/pycker-route-optimizer";
import { ProPriceVerification } from "@/components/pycker-price-verification";
import { SafetyCopilot } from "@/components/safety-copilot";
import { CarbonDispatcher } from "@/components/carbon-dispatcher";
import { ComplianceVault } from "@/components/compliance-vault";
import { VerificationGatesDisplay } from "@/components/verification-gates";
import { EsgImpactDashboard } from "@/components/esg-impact-dashboard";
import { CertificationDashboardSection } from "@/components/pro/certification-dashboard-section";
import { FeeProgressWidget } from "@/components/pro/fee-progress";
import { EarningsDashboard } from "@/components/pro/earnings-dashboard";
import { ImpactWidget } from "@/components/dashboard/impact-widget";
import { FileText, Route, Store } from "lucide-react";
import { ProMarketplace } from "@/components/marketplace/pro-marketplace";
import { ServicesSelector } from "@/components/services-selector";
import { ProAiDashboard } from "@/components/ai/pro-ai-dashboard";
import { ServiceEsgBadge } from "@/components/esg/service-esg-badge";
import { ProInsuranceSection } from "@/components/pro/insurance-section";
import { SERVICE_PRICE_RANGES } from "@/constants/service-price-ranges";

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "***-****";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 3)}) ***-${cleaned.slice(-4)}`;
  }
  return `***-${phone.slice(-4)}`;
}

const navItems: Array<{ id: string; label: string; icon: typeof LayoutDashboard; badge?: string | number }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "requests", label: "Job Requests", icon: ClipboardList },
  { id: "route", label: "Route Optimizer", icon: Route },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "earnings", label: "Earnings", icon: DollarSign },
  { id: "marketplace", label: "Marketplace", icon: Store },
  { id: "ai-insights", label: "AI Insights", icon: Zap },
  { id: "rebates", label: "Green Guarantee", icon: Flag },
  { id: "compliance", label: "Tax & Compliance", icon: FileText },
  { id: "insurance", label: "Insurance & Claims", icon: Shield },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

function formatScheduledDate(val: string) {
  if (!val || val === "asap") return "ASAP";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function JobRequestCard({ request, onAccept, onDecline, canAcceptJobs = false, isAccepting = false }: {
  request: ServiceRequestWithDetails;
  onAccept: () => void;
  onDecline: () => void;
  canAcceptJobs?: boolean;
  isAccepting?: boolean;
}) {
  interface CrewStatusResponse {
    isFull: boolean;
    acceptedCount: number;
    crewSize: number;
    remainingSlots: number;
    crewMembers: Array<{
      proId: string;
      name: string;
      status: string;
    }>;
  }

  // Fetch crew status for multi-Pro jobs
  const { data: crewStatus } = useQuery<CrewStatusResponse>({
    queryKey: [`/api/jobs/${request.id}/crew-status`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/jobs/${request.id}/crew-status`);
      return response.json();
    },
    enabled: !!(request.laborCrewSize && request.laborCrewSize > 1),
  });

  const serviceLabels: Record<string, string> = {
    junk_removal: "Junk Removal",
    furniture_moving: "Furniture Moving",
    garage_cleanout: "Garage Cleanout",
    estate_cleanout: "Estate Cleanout",
    truck_unloading: "U-Haul/Truck Unloading",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    moving_labor: "Moving Labor",
    light_demolition: "Light Demolition",
    home_consultation: "Home Consultation",
    home_cleaning: "Home Cleaning",
    pool_cleaning: "Pool Cleaning",
    carpet_cleaning: "Carpet Cleaning",
    landscaping: "Landscaping",
    handyman: "Handyman Services",
    demolition: "Light Demolition",
  };

  const loadLabels: Record<string, string> = {
    small: "Small Load",
    medium: "Medium Load",
    large: "Large Load",
    extra_large: "Extra Large",
    minimum_load: "Minimum Load",
    half_truck: "Half Truck",
    full_truck: "Full Truck",
    quarter_truck: "Quarter Truck",
    three_quarter_truck: "3/4 Truck",
  };

  // Volume-based truck tier labels for junk removal
  const volumeTierLabels: Record<string, { label: string; volume: string; price: string }> = {
    small: { label: "Minimum/1/8 Truck", volume: "0-27 cu ft", price: "$99-$149" },
    medium: { label: "1/4 Truck", volume: "28-54 cu ft", price: "$199" },
    large: { label: "1/2 Truck", volume: "55-108 cu ft", price: "$299" },
    extra_large: { label: "3/4 Truck", volume: "109-162 cu ft", price: "$399" },
    full: { label: "Full Truck", volume: "163+ cu ft", price: "$549+" },
  };

  const isJunkRemoval = request.serviceType === 'junk_removal' || request.serviceType === 'garage_cleanout' || request.serviceType === 'estate_cleanout';
  const isContactMasked = !request.acceptedAt;
  const customerName = request.customer ? `${request.customer.firstName || ''} ${request.customer.lastName || ''}`.trim() : 'Customer';
  const maskedName = (request.customer?.firstName || 'Customer').split(" ")[0] + " ***";

  return (
    <Card className="p-5 hover-elevate" data-testid={`card-job-${request.id}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{request.customer?.firstName?.charAt(0) || "C"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{isContactMasked ? maskedName : customerName}</h3>
            <p className="text-sm text-muted-foreground">
              {serviceLabels[request.serviceType] || request.serviceType}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          <Clock className="w-3 h-3 mr-1" />
          {formatScheduledDate(request.scheduledFor)}
        </Badge>
      </div>

      {/* Multi-Pro Indicator */}
      {request.laborCrewSize && request.laborCrewSize > 1 && (
        <div className="mb-3 p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Multi-Pro Job: {request.laborCrewSize} Pros needed
              </span>
            </div>
            {crewStatus && (
              <Badge variant={crewStatus.isFull ? "default" : "secondary"} className="text-xs">
                {crewStatus.acceptedCount} of {crewStatus.crewSize} confirmed
              </Badge>
            )}
          </div>
          <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1 ml-6">
            {crewStatus && crewStatus.acceptedCount > 0 ? (
              <>
                {crewStatus.acceptedCount} Pro{crewStatus.acceptedCount > 1 ? 's' : ''} confirmed
                {crewStatus.remainingSlots > 0 && ` • ${crewStatus.remainingSlots} slot${crewStatus.remainingSlots > 1 ? 's' : ''} remaining`}
              </>
            ) : (
              <>Team job - you'll work with {request.laborCrewSize - 1} other Pro{request.laborCrewSize > 2 ? 's' : ''}</>
            )}
          </p>
          {crewStatus && crewStatus.crewMembers && crewStatus.crewMembers.length > 0 && (
            <div className="mt-2 ml-6 space-y-1">
              {crewStatus.crewMembers.map((member: any) => (
                <div key={member.proId} className="flex items-center gap-2 text-xs text-purple-600/70 dark:text-purple-400/70">
                  <CheckCircle className="w-3 h-3" />
                  <span>{member.name}</span>
                  {member.isVerifiedPro && <Badge variant="outline" className="text-[10px] px-1 py-0">Verified</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <span>{request.pickupAddress}, {request.pickupCity} {request.pickupZip}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <Truck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">
              {isJunkRemoval && volumeTierLabels[request.loadEstimate]
                ? volumeTierLabels[request.loadEstimate].label
                : loadLabels[request.loadEstimate] || request.loadEstimate}
            </div>
            {isJunkRemoval && volumeTierLabels[request.loadEstimate] && (
              <div className="text-xs text-muted-foreground">
                {volumeTierLabels[request.loadEstimate].volume} • Base {volumeTierLabels[request.loadEstimate].price}
              </div>
            )}
          </div>
        </div>
        {request.laborHours && request.laborHours > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{request.laborHours} hour{request.laborHours !== 1 ? 's' : ''} estimated</span>
          </div>
        )}
        {request.description && (
          <p className="text-sm text-muted-foreground pl-6 line-clamp-2">
            {request.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4 text-sm">
          {request.distance != null && (
            <div className="flex items-center gap-1">
              <Navigation className="w-4 h-4 text-muted-foreground" />
              <span>{request.distance.toFixed(1)} mi</span>
            </div>
          )}
          {request.estimatedMinutes != null && (
            <div className="flex items-center gap-1 text-status-online">
              <Timer className="w-4 h-4" />
              <span>{request.estimatedMinutes} min</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(request.bountyAmount || 0) > 0 && (
            <Badge variant="destructive" className="shrink-0" data-testid={`badge-bounty-${request.id}`}>
              <Flame className="w-3 h-3 mr-1" />
              +${((request.bountyAmount || 0) / 100).toFixed(0)}
            </Badge>
          )}
          <div className="font-bold text-lg">${request.priceEstimate || "-"}</div>
        </div>
      </div>

      {isContactMasked && (
        <p className="text-xs text-muted-foreground bg-muted p-2 rounded mt-4">
          <Shield className="w-3 h-3 inline mr-1" />
          Full contact info released after accepting job
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onDecline}
          data-testid={`button-decline-${request.id}`}
        >
          <X className="w-4 h-4 mr-2" />
          Decline
        </Button>
        <Button 
          className="flex-1"
          onClick={onAccept}
          disabled={!canAcceptJobs || isAccepting}
          data-testid={`button-accept-${request.id}`}
        >
          {isAccepting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          {!canAcceptJobs ? "Complete Compliance" : "Accept"}
        </Button>
      </div>
      {!canAcceptJobs && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Complete your background check and insurance verification to accept jobs.
        </p>
      )}
    </Card>
  );
}

function ItemVerificationCard({ 
  originalItems, 
  onVerified 
}: { 
  originalItems: { id: string; label: string; quantity: number; price: number }[];
  onVerified: (verified: boolean, adjustments: { added: typeof originalItems; removed: string[]; totalAdjustment: number }) => void;
}) {
  const [verifiedItems, setVerifiedItems] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    originalItems.forEach(item => {
      initial[item.id] = item.quantity;
    });
    return initial;
  });
  const [additionalItems, setAdditionalItems] = useState<{ id: string; label: string; quantity: number; price: number }[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);

  const originalTotal = originalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const verifiedTotal = originalItems.reduce((sum, item) => {
    const qty = verifiedItems[item.id] || 0;
    return sum + (item.price * qty);
  }, 0) + additionalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const adjustment = verifiedTotal - originalTotal;
  const hasDiscrepancy = adjustment !== 0;

  const updateQuantity = (itemId: string, delta: number) => {
    setVerifiedItems(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  return (
    <Card className="p-5" data-testid="card-item-verification">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Verify Items On-Site</h3>
          <p className="text-sm text-muted-foreground">Confirm items match customer's list</p>
        </div>
      </div>

      <div className="p-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-medium">Important:</span> Adjust quantities below to match what's actually on-site. 
            Customer will be notified of any price changes before you start.
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {originalItems.map((item) => {
          const currentQty = verifiedItems[item.id] || 0;
          const originalQty = item.quantity;
          const isDifferent = currentQty !== originalQty;
          
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isDifferent ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">(${item.price} ea)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDifferent && (
                  <Badge variant="outline" className="text-amber-600 border-amber-500 text-xs">
                    was {originalQty}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, -1)}
                    data-testid={`button-verify-minus-${item.id}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{currentQty}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, 1)}
                    data-testid={`button-verify-plus-${item.id}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        {additionalItems.map((item, idx) => (
          <div
            key={`added-${idx}`}
            className="flex items-center justify-between p-3 rounded-lg border border-green-500 bg-green-50 dark:bg-green-900/20"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-4 h-4 text-green-600" />
              <div>
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground ml-2">(${item.price} ea)</span>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-500">
              +{item.quantity} added
            </Badge>
          </div>
        ))}
      </div>

      <div className={`p-4 rounded-lg ${hasDiscrepancy ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted"}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Original Quote:</span>
          <span className="font-medium">${originalTotal}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Verified Total:</span>
          <span className="font-bold text-lg">${verifiedTotal}</span>
        </div>
        {hasDiscrepancy && (
          <div className={`flex justify-between items-center pt-2 border-t ${adjustment > 0 ? "text-amber-600" : "text-green-600"}`}>
            <span className="text-sm font-medium">Adjustment:</span>
            <span className="font-bold">{adjustment > 0 ? "+" : ""}{adjustment}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => setShowAddItem(true)}
          data-testid="button-add-unlisted-item"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Unlisted Item
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            const removed = originalItems
              .filter(item => (verifiedItems[item.id] || 0) < item.quantity)
              .map(item => item.id);
            onVerified(!hasDiscrepancy || adjustment > 0, {
              added: additionalItems,
              removed,
              totalAdjustment: adjustment
            });
          }}
          data-testid="button-confirm-verification"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {hasDiscrepancy ? "Send Adjustment to Customer" : "Items Match - Start Job"}
        </Button>
      </div>
      
      {hasDiscrepancy && adjustment > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-3">
          Customer must approve the ${adjustment} upcharge before you can start the job.
        </p>
      )}
    </Card>
  );
}

interface ActiveJob {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupZip: string;
  serviceType: string;
  loadEstimate: string;
  priceEstimate: number;
  status: string;
  acceptedAt?: string;
  contactRequiredBy?: string;
  contactConfirmedAt?: string;
  paymentStatus?: string;
  isPriceLocked?: boolean;
  accessType?: string;
  laborCrewSize?: number;
  laborHours?: number;
}

function ActiveJobCard({ 
  job,
  onPhotoUpload,
  onReportIssue,
  onCompleteJob,
  onConfirmCall,
  onLockPrice,
  isUploading = false,
  uploadedPhotos = [],
  isConfirmingCall = false,
}: { 
  job: ActiveJob;
  onPhotoUpload: (files: FileList) => void;
  onReportIssue: (issue: { type: string; description: string }) => void;
  onCompleteJob: () => void;
  onConfirmCall: () => void;
  onLockPrice?: (data: { newPrice: number; lineItems: any[]; reason: string }) => void;
  isUploading?: boolean;
  uploadedPhotos?: string[];
  isConfirmingCall?: boolean;
}) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [issueType, setIssueType] = useState("access");
  const [issueDescription, setIssueDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [callTimeLeft, setCallTimeLeft] = useState<number>(0);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  
  // Calculate call deadline countdown
  useEffect(() => {
    if (!job.acceptedAt || job.contactConfirmedAt) return;
    
    const deadline = job.contactRequiredBy 
      ? new Date(job.contactRequiredBy).getTime()
      : new Date(job.acceptedAt).getTime() + 5 * 60 * 1000;
    
    const updateTimer = () => {
      const remaining = Math.max(0, deadline - Date.now());
      setCallTimeLeft(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [job.acceptedAt, job.contactRequiredBy, job.contactConfirmedAt]);
  
  const callMinutes = Math.floor(callTimeLeft / 60000);
  const callSeconds = Math.floor((callTimeLeft % 60000) / 1000);
  const callDeadlineExpired = callTimeLeft === 0 && job.acceptedAt && !job.contactConfirmedAt;

  const serviceLabels: Record<string, string> = {
    junk_removal: "Junk Removal",
    furniture_moving: "Furniture Moving",
    garage_cleanout: "Garage Cleanout",
    estate_cleanout: "Estate Cleanout",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    moving_labor: "Moving Labor",
    light_demolition: "Light Demolition",
    home_consultation: "Home Consultation",
    home_cleaning: "Home Cleaning",
    pool_cleaning: "Pool Cleaning",
    carpet_cleaning: "Carpet Cleaning",
    landscaping: "Landscaping",
    handyman: "Handyman Services",
    demolition: "Light Demolition",
    truck_unloading: "U-Haul/Truck Unloading",
  };

  const handleCallCustomer = () => {
    fetch("/api/audit/pii-reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fieldType: "phone_call", resourceId: `job_${job.id}` }),
    }).catch(() => {});
    window.location.href = `tel:${job.customerPhone}`;
  };

  const handleTextCustomer = () => {
    fetch("/api/audit/pii-reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fieldType: "phone_text", resourceId: `job_${job.id}` }),
    }).catch(() => {});
    window.location.href = `sms:${job.customerPhone}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onPhotoUpload(e.target.files);
    }
  };

  const handleSubmitIssue = () => {
    onReportIssue({ type: issueType, description: issueDescription });
    setShowReportDialog(false);
    setIssueDescription("");
  };

  return (
    <>
      <Card className="p-5" data-testid="card-active-job">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Active Job</h3>
              <Badge variant="secondary" className="mt-1">
                {serviceLabels[job.serviceType] || job.serviceType}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${job.priceEstimate}</p>
            <p className="text-xs text-muted-foreground">Estimated earnings: ${Math.round(job.priceEstimate * 0.85)}</p>
          </div>
        </div>

        {/* Multi-Pro Team Indicator */}
        {job.laborCrewSize && job.laborCrewSize > 1 && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-700 dark:text-purple-400">
                Team Job: {job.laborCrewSize} Pros total
              </span>
            </div>
            <p className="text-sm text-purple-600/80 dark:text-purple-400/80 mt-1 ml-7">
              You're working with {job.laborCrewSize - 1} other Pro{job.laborCrewSize > 2 ? 's' : ''} on this job
            </p>
            {job.laborHours && (
              <p className="text-xs text-purple-600/60 dark:text-purple-400/60 mt-1 ml-7">
                {job.laborHours} hour{job.laborHours !== 1 ? 's' : ''} estimated • ${Math.round(job.priceEstimate / job.laborCrewSize)} per Pro
              </p>
            )}
          </div>
        )}

        {/* Field Audit Form - shown when worker has arrived but hasn't locked price */}
        {(job.status === "arrived" || job.status === "assigned") && !job.isPriceLocked && onLockPrice && (
          <div className="mb-4">
            <FieldAuditForm
              job={{ id: job.id, priceEstimate: job.priceEstimate, isPriceLocked: job.isPriceLocked || false }}
              onLockPrice={onLockPrice}
            />
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>{job.customerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{job.customerName}</p>
              {job.paymentStatus === "authorized" || job.paymentStatus === "captured" || job.paymentStatus === "completed" ? (
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground" data-testid="text-customer-phone">
                    {phoneRevealed ? job.customerPhone : maskPhone(job.customerPhone)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setPhoneRevealed(!phoneRevealed);
                      if (!phoneRevealed) {
                        fetch("/api/audit/pii-reveal", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ fieldType: "phone_number", resourceId: `job_${job.id}` }),
                        }).catch(() => {});
                      }
                    }}
                    data-testid="button-toggle-phone"
                  >
                    {phoneRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400">Contact info available after payment</p>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>{job.pickupAddress}, {job.pickupCity} {job.pickupZip}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {job.paymentStatus === "authorized" || job.paymentStatus === "captured" || job.paymentStatus === "completed" ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCallCustomer}
                data-testid="button-call-customer"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleTextCustomer}
                data-testid="button-text-customer"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Text
              </Button>
            </>
          ) : (
            <div className="flex-1 p-3 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
              Contact options available after customer payment
            </div>
          )}
        </div>
        
        {/* Call confirmation requirement */}
        {job.acceptedAt && !job.contactConfirmedAt && (
          <div className={`rounded-lg p-3 mb-4 ${callDeadlineExpired ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Phone className={`w-5 h-5 ${callDeadlineExpired ? 'text-red-600' : 'text-amber-600'} ${!callDeadlineExpired && 'animate-pulse'}`} />
                <div>
                  <p className={`text-sm font-medium ${callDeadlineExpired ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {callDeadlineExpired 
                      ? "Call deadline passed! Please call customer immediately"
                      : "Call customer within"}
                  </p>
                  {!callDeadlineExpired && (
                    <span className="text-lg font-bold font-mono text-amber-600" data-testid="text-pro-call-countdown">
                      {callMinutes}:{callSeconds.toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
              <Button 
                size="sm"
                onClick={onConfirmCall}
                disabled={isConfirmingCall}
                data-testid="button-confirm-call"
              >
                {isConfirmingCall ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    I Called
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {job.contactConfirmedAt && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Customer contacted
            </span>
          </div>
        )}

        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Proof of Completion Photos</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Upload before & after photos to document the job
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-photo-upload"
            />
            
            <div className="grid grid-cols-4 gap-2 mb-3">
              {uploadedPhotos.map((photo, idx) => (
                <div 
                  key={idx} 
                  className="aspect-square rounded-lg bg-muted overflow-hidden"
                  data-testid={`uploaded-photo-${idx}`}
                >
                  <img src={photo} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover-elevate transition-colors"
                data-testid="button-add-photo"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => setShowReportDialog(true)}
              data-testid="button-report-issue"
            >
              <Flag className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
            <Button 
              className="flex-1"
              disabled={uploadedPhotos.length === 0}
              onClick={onCompleteJob}
              data-testid="button-complete-job"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Job
            </Button>
          </div>
          
          {uploadedPhotos.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              Upload at least one photo to complete the job
            </p>
          )}
        </div>
      </Card>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Let us know what problem you've encountered with this job.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger data-testid="select-issue-type">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="access">Can't access location</SelectItem>
                  <SelectItem value="safety">Safety concern</SelectItem>
                  <SelectItem value="items_different">Items different than described</SelectItem>
                  <SelectItem value="customer_not_present">Customer not present</SelectItem>
                  <SelectItem value="vehicle_issue">Vehicle/equipment issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-issue-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitIssue}
              disabled={!issueDescription.trim()}
              data-testid="button-submit-issue"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Completed Job Card with Receipt Upload Prompt
function CompletedJobCard({
  job,
  hasExistingClaim,
  onUploadReceipt
}: {
  job: ServiceRequestWithDetails;
  hasExistingClaim: boolean;
  onUploadReceipt: (jobId: string) => void;
}) {
  const earnings = Math.round((job.livePrice || 0) * 0.8);
  const potentialRebate = Math.min((job.livePrice || 0) * 0.10, 25);

  const serviceLabels: Record<string, string> = {
    junk_removal: "Junk Removal",
    furniture_moving: "Furniture Moving",
    garage_cleanout: "Garage Cleanout",
    estate_cleanout: "Estate Cleanout",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    moving_labor: "Moving Labor",
    light_demolition: "Light Demolition",
    home_consultation: "Home Consultation",
    home_cleaning: "Home Cleaning",
    pool_cleaning: "Pool Cleaning",
    carpet_cleaning: "Carpet Cleaning",
    landscaping: "Landscaping",
    handyman: "Handyman Services",
    demolition: "Light Demolition",
    truck_unloading: "U-Haul/Truck Unloading",
  };

  // Calculate time since completion
  const completedAt = job.completedAt ? new Date(job.completedAt) : new Date();
  const hoursSinceCompletion = Math.floor((Date.now() - completedAt.getTime()) / (1000 * 60 * 60));
  const hoursRemaining = Math.max(0, 48 - hoursSinceCompletion);

  // Fetch ESG metrics for this job
  const { data: esgMetrics } = useQuery({
    queryKey: ["service-esg-metrics", job.id],
    queryFn: async () => {
      const response = await fetch(`/api/esg/service-metrics/${job.id}`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result.metrics;
    },
  });

  return (
    <Card className="p-5 border-green-500/30" data-testid={`card-completed-job-${job.id}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Job #{job.id.slice(-4).toUpperCase()}</span>
          <Badge variant="secondary" className="bg-green-500/10 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            COMPLETED
          </Badge>
        </div>
      </div>

      {/* ESG Badge */}
      {esgMetrics && (
        <div className="mb-3">
          <ServiceEsgBadge
            serviceType={job.serviceType || "junk_removal"}
            esgScore={esgMetrics.esgScore || 0}
            co2SavedLbs={esgMetrics.totalCo2SavedLbs}
            waterSavedGallons={esgMetrics.waterSavedGallons}
          />
        </div>
      )}
      
      <div className="border-t border-b py-3 my-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Earnings:</span>
          <span className="text-xl font-bold">${earnings}</span>
        </div>
      </div>

      {!hasExistingClaim ? (
        <div className="bg-green-500/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-700">EARN UP TO ${potentialRebate.toFixed(0)} MORE!</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Upload dump receipt within {hoursRemaining > 0 ? `${hoursRemaining} hrs` : "48 hrs"} to get 10% rebate:
          </p>
          
          <Button 
            className="w-full mb-4"
            onClick={() => onUploadReceipt(job.id)}
            data-testid={`button-upload-receipt-${job.id}`}
          >
            <Camera className="w-4 h-4 mr-2" />
            Upload Receipt Photo
          </Button>
          
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Must show weight
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Must be from approved facility
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Must match job within 20%
            </li>
          </ul>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <Flag className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-700">Receipt Submitted</p>
          <p className="text-xs text-muted-foreground">Pending admin review</p>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground text-center mt-3">
        {serviceLabels[job.serviceType || ""] || job.serviceType} - {job.pickupAddress}
      </p>
    </Card>
  );
}

// Green Guarantee Rebate Section Component
function GreenGuaranteeSection({ proId, rebateBalance }: { proId: string; rebateBalance: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [facilityName, setFacilityName] = useState<string>("");
  const [facilityAddress, setFacilityAddress] = useState<string>("");
  const [facilityType, setFacilityType] = useState<string>("recycling");
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [receiptDate, setReceiptDate] = useState<string>("");
  const [receiptWeight, setReceiptWeight] = useState<string>("");
  const [feeCharged, setFeeCharged] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get approved facilities list
  const { data: approvedFacilities } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
  });

  // Get completed jobs for this Pro
  const { data: completedJobs } = useQuery<ServiceRequestWithDetails[]>({
    queryKey: ["/api/service-requests/pro", proId],
    enabled: !!proId,
  });

  // Get existing rebate claims
  const { data: rebateClaims, isLoading: claimsLoading } = useQuery<any[]>({
    queryKey: ["/api/rebates/pro", proId],
    queryFn: async () => {
      const res = await fetch(`/api/rebates/pro/${proId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!proId,
  });

  // Handle facility selection from approved list
  const handleFacilitySelect = (facilityId: string) => {
    const facility = approvedFacilities?.find(f => f.id === facilityId);
    if (facility) {
      setFacilityName(facility.name);
      setFacilityAddress(`${facility.address}, ${facility.city}, ${facility.state} ${facility.zipCode || ""}`);
      setFacilityType(facility.facilityType);
      setValidationWarnings(prev => prev.filter(w => w !== 'unknown_facility'));
    }
  };

  // Check if entered facility matches an approved one
  const checkFacilityApproval = (name: string) => {
    if (!name || !approvedFacilities) return;
    const match = approvedFacilities.find(f => 
      f.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(f.name.toLowerCase())
    );
    if (!match) {
      if (!validationWarnings.includes('unknown_facility')) {
        setValidationWarnings(prev => [...prev, 'unknown_facility']);
      }
    } else {
      setValidationWarnings(prev => prev.filter(w => w !== 'unknown_facility'));
    }
  };

  // Get estimated weight for selected job
  const getEstimatedWeight = () => {
    const job = completedJobs?.find(j => j.id === selectedJob);
    if (!job) return 500;
    const loadWeights: Record<string, number> = { small: 200, medium: 500, large: 1000, extra_large: 2000 };
    return loadWeights[job.loadEstimate || "medium"] || 500;
  };

  // Check weight variance (20% tolerance)
  const checkWeightVariance = (weight: string) => {
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight)) return;
    const estimated = getEstimatedWeight();
    const variance = Math.abs((numWeight - estimated) / estimated * 100);
    if (variance > 20) {
      if (!validationWarnings.includes('weight_variance')) {
        setValidationWarnings(prev => [...prev, 'weight_variance']);
      }
    } else {
      setValidationWarnings(prev => prev.filter(w => w !== 'weight_variance'));
    }
  };

  const submitClaimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rebates/claim", {
        serviceRequestId: selectedJob,
        proId,
        receiptUrl,
        facilityName,
        facilityAddress: facilityAddress || null,
        facilityType,
        receiptNumber: receiptNumber || null,
        receiptDate,
        receiptWeight: parseFloat(receiptWeight),
        feeCharged: feeCharged ? parseFloat(feeCharged) : null,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rebates/pro", proId] });
      setSelectedJob("");
      setReceiptUrl("");
      setFacilityName("");
      setFacilityAddress("");
      setReceiptNumber("");
      setReceiptDate("");
      setReceiptWeight("");
      setFeeCharged("");
      setValidationWarnings([]);
      
      // Show validation results if there are flags
      if (data.validation?.flags?.length > 0) {
        toast({
          title: "Claim Submitted for Review",
          description: `Your claim has been flagged for manual review: ${data.validation.flags.join(', ')}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Claim Submitted",
          description: "Your rebate claim is pending admin approval.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit claim",
        variant: "destructive",
      });
    },
  });

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("directory", ".private/receipts");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (data.path) {
        setReceiptUrl(data.path);
      }
    } catch (error) {
      console.error("Error uploading receipt:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const eligibleJobs = completedJobs?.filter(job => {
    const hasExistingClaim = rebateClaims?.some(claim => claim.serviceRequestId === job.id);
    return job.status === "completed" && !hasExistingClaim;
  }) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="w-6 h-6 text-green-600" />
            Green Guarantee
          </h1>
          <p className="text-muted-foreground">
            100% Verified Proper Disposal - Earn 10% back (max $25) for recycling receipts
          </p>
        </div>
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Your Rebate Balance</p>
            <p className="text-2xl font-bold text-green-600">${rebateBalance.toFixed(2)}</p>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Submit New Claim */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Submit Disposal Receipt
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label>Select Completed Job</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger data-testid="select-job">
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleJobs.length === 0 ? (
                    <SelectItem value="none" disabled>No eligible jobs</SelectItem>
                  ) : (
                    eligibleJobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.pickupAddress} - ${job.livePrice || 0}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Receipt Requirements Checklist */}
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Receipt Must Show:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li className={facilityName && facilityAddress ? "text-green-600" : ""}>
                  {facilityName && facilityAddress ? "" : ""} Facility name/address
                </li>
                <li className={receiptDate ? "text-green-600" : ""}>
                  {receiptDate ? "" : ""} Date & time (within 24 hours of job)
                </li>
                <li className={receiptWeight ? "text-green-600" : ""}>
                  {receiptWeight ? "" : ""} Weight of load
                </li>
                <li className={feeCharged ? "text-green-600" : ""}>
                  {feeCharged ? "" : ""} Fee charged
                </li>
                <li className={receiptNumber ? "text-green-600" : ""}>
                  {receiptNumber ? "" : ""} Receipt number
                </li>
              </ul>
            </div>

            {/* Validation Warnings */}
            {(validationWarnings.length > 0 || (!receiptNumber && selectedJob) || (!feeCharged && selectedJob) || (!facilityAddress && selectedJob)) && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-sm">
                <p className="font-medium text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Missing Info May Delay Approval
                </p>
                <ul className="mt-1 text-amber-600 space-y-1">
                  {validationWarnings.includes('unknown_facility') && (
                    <li>Facility not in approved list - claim will require manual review</li>
                  )}
                  {validationWarnings.includes('weight_variance') && (
                    <li>Weight differs more than 20% from job estimate - claim may be flagged</li>
                  )}
                  {!receiptNumber && selectedJob && (
                    <li>Receipt number not provided - recommended for faster approval</li>
                  )}
                  {!feeCharged && selectedJob && (
                    <li>Fee charged not provided - recommended for verification</li>
                  )}
                  {!facilityAddress && selectedJob && (
                    <li>Facility address not provided - recommended for verification</li>
                  )}
                </ul>
              </div>
            )}

            {/* Approved Facility Selector */}
            <div>
              <Label>Select Approved Facility (Recommended)</Label>
              <Select onValueChange={handleFacilitySelect}>
                <SelectTrigger data-testid="select-approved-facility">
                  <SelectValue placeholder="Choose from approved facilities..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedFacilities && approvedFacilities.length > 0 ? (
                    approvedFacilities.map(facility => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name} ({facility.facilityType})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No approved facilities loaded</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Or enter facility details manually below</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Facility Name <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="e.g., Orange County Landfill"
                  value={facilityName}
                  onChange={(e) => {
                    setFacilityName(e.target.value);
                    checkFacilityApproval(e.target.value);
                  }}
                  data-testid="input-facility-name"
                />
              </div>
              <div>
                <Label>Facility Type</Label>
                <Select value={facilityType} onValueChange={setFacilityType}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer_station">Transfer Station</SelectItem>
                    <SelectItem value="recycling">Recycling Center</SelectItem>
                    <SelectItem value="landfill">Landfill</SelectItem>
                    <SelectItem value="hazmat">Hazardous Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Facility Address</Label>
              <Input 
                placeholder="e.g., 5901 Young Pine Rd, Orlando, FL 32829"
                value={facilityAddress}
                onChange={(e) => setFacilityAddress(e.target.value)}
                data-testid="input-facility-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Receipt Date & Time <span className="text-red-500">*</span></Label>
                <Input 
                  type="datetime-local"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  data-testid="input-receipt-date"
                />
              </div>
              <div>
                <Label>Receipt Number</Label>
                <Input 
                  placeholder="e.g., RC-12345"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  data-testid="input-receipt-number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Weight from Receipt (lbs) <span className="text-red-500">*</span></Label>
                <Input 
                  type="number"
                  placeholder="e.g., 450"
                  value={receiptWeight}
                  onChange={(e) => {
                    setReceiptWeight(e.target.value);
                    checkWeightVariance(e.target.value);
                  }}
                  data-testid="input-weight"
                />
                {selectedJob && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimated: {getEstimatedWeight()} lbs (±20% accepted)
                  </p>
                )}
              </div>
              <div>
                <Label>Fee Charged ($)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="e.g., 35.00"
                  value={feeCharged}
                  onChange={(e) => setFeeCharged(e.target.value)}
                  data-testid="input-fee"
                />
              </div>
            </div>

            <div>
              <Label>Receipt Photo</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleReceiptUpload}
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                data-testid="button-upload-receipt"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : receiptUrl ? (
                  <><CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Receipt Uploaded</>
                ) : (
                  <><Camera className="w-4 h-4 mr-2" /> Upload Receipt Photo</>
                )}
              </Button>
            </div>

            <Button 
              className="w-full"
              disabled={!selectedJob || !receiptUrl || !facilityName || !receiptDate || !receiptWeight || submitClaimMutation.isPending}
              onClick={() => submitClaimMutation.mutate()}
              data-testid="button-submit-claim"
            >
              {submitClaimMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <>Submit for 10% Rebate</>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Fields marked with <span className="text-red-500">*</span> are required
            </p>
          </div>
        </Card>

        {/* Claim History */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Your Rebate Claims
          </h3>
          
          {claimsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : rebateClaims && rebateClaims.length > 0 ? (
            <div className="space-y-3">
              {rebateClaims.map((claim: any) => (
                <div 
                  key={claim.id} 
                  className="p-3 border rounded-lg flex items-center justify-between"
                  data-testid={`claim-${claim.id}`}
                >
                  <div>
                    <p className="font-medium text-sm">{claim.facilityName || "Disposal Receipt"}</p>
                    <p className="text-xs text-muted-foreground">
                      {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        claim.status === "approved" ? "default" : 
                        claim.status === "denied" ? "destructive" : 
                        "secondary"
                      }
                    >
                      {claim.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {claim.status === "denied" && <X className="w-3 h-3 mr-1" />}
                      {claim.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </Badge>
                    {claim.rebateAmount && (
                      <p className="text-sm font-semibold text-green-600 mt-1">
                        +${claim.rebateAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Flag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No rebate claims yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Submit disposal receipts to earn 10% back!
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5 bg-green-500/5 border-green-500/20">
        <h3 className="font-semibold mb-3 text-green-700 dark:text-green-400">How Green Guarantee Works</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <span className="font-bold text-green-600">1</span>
            </div>
            <div>
              <p className="font-medium">Complete a Job</p>
              <p className="text-muted-foreground">Finish any junk removal or hauling job</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <span className="font-bold text-green-600">2</span>
            </div>
            <div>
              <p className="font-medium">Dispose Properly</p>
              <p className="text-muted-foreground">Take items to recycling or donation centers</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <span className="font-bold text-green-600">3</span>
            </div>
            <div>
              <p className="font-medium">Get 10% Back</p>
              <p className="text-muted-foreground">Upload receipt for instant rebate (max $25)</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Referral Earnings Card Component
function ReferralEarningsCard({ proId }: { proId: string }) {
  const { data: referralData, isLoading } = useQuery<{
    totalEarnings: number;
    pendingCommissions: number;
    paidCommissions: number;
    referrals: Array<{
      id: string;
      category: string;
      status: string;
      referralAmount: number;
      commissionAmount: number;
      completedAt: string;
    }>;
  }>({
    queryKey: ["/api/partner-referrals/pro", proId],
    queryFn: async () => {
      const res = await fetch(`/api/partner-referrals/pro/${proId}`, { credentials: "include" });
      if (!res.ok) return { totalEarnings: 0, pendingCommissions: 0, paidCommissions: 0, referrals: [] };
      return res.json();
    },
    enabled: !!proId,
  });

  if (isLoading) {
    return (
      <Card className="p-5 mt-6" data-testid="card-referral-earnings-loading">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          Referral Commissions
        </h3>
        <p className="text-sm text-muted-foreground">Loading referral earnings...</p>
      </Card>
    );
  }

  const hasEarnings = (referralData?.totalEarnings || 0) > 0;

  return (
    <Card className="p-5 mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20" data-testid="card-referral-earnings">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Referral Commissions
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Earn 10% when customers book partner services you recommend
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Earned</p>
          <p className="text-2xl font-bold text-purple-600" data-testid="text-total-referral-earnings">
            ${referralData?.totalEarnings.toFixed(2) || "0.00"}
          </p>
        </div>
      </div>

      {hasEarnings ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-background/50 backdrop-blur rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-xl font-bold text-yellow-600" data-testid="text-pending-commissions">
                ${referralData?.pendingCommissions.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="p-3 bg-background/50 backdrop-blur rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Paid Out</p>
              <p className="text-xl font-bold text-green-600" data-testid="text-paid-commissions">
                ${referralData?.paidCommissions.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          {referralData?.referrals && referralData.referrals.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Recent Referrals</p>
              <div className="space-y-2">
                {referralData.referrals.slice(0, 3).map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 bg-background/50 backdrop-blur rounded-lg border border-border"
                    data-testid={`referral-row-${referral.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm capitalize">{referral.category}</p>
                      <p className="text-xs text-muted-foreground">
                        Service: ${referral.referralAmount} • {referral.completedAt ? new Date(referral.completedAt).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={referral.status === "completed" ? "default" : "secondary"}
                        className="mb-1"
                      >
                        {referral.status}
                      </Badge>
                      <p className="text-sm font-bold text-purple-600">+${referral.commissionAmount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-3">
            <Gift className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium mb-1">Start Earning Commissions</p>
          <p className="text-xs text-muted-foreground">
            Recommend partner services during jobs and earn 10% commission on completed bookings
          </p>
        </div>
      )}
    </Card>
  );
}

function DashboardContent({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const queryClient = useQueryClient();
  const [showGoOnlineDialog, setShowGoOnlineDialog] = useState(false);
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [showIcaModal, setShowIcaModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [travelRadius, setTravelRadius] = useState<number>(25);
  const [locationConsent, setLocationConsent] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const lastLocationBroadcast = useRef<number>(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isConfirmingCall, setIsConfirmingCall] = useState(false);
  const { toast } = useToast();

  // Fetch Pro data first (needed for other queries)
  const { data: pros } = useQuery<ProWithProfile[]>({
    queryKey: ["/api/pros"],
  });

  const currentPro = pros?.[0];

  // Fetch active jobs for this Pro
  const { data: activeJobs, isLoading: activeJobsLoading, refetch: refetchActiveJobs } = useQuery<ServiceRequestWithDetails[]>({
    queryKey: ["/api/pros", "active-jobs"],
    queryFn: async () => {
      const res = await fetch(`/api/pros/${currentPro?.id}/jobs/active`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentPro?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get the first active job (most Pros work on one job at a time)
  const currentActiveJob = activeJobs?.[0];
  
  // Transform to ActiveJob format for compatibility
  const activeJob: ActiveJob | null = currentActiveJob ? {
    id: currentActiveJob.id,
    customerName: currentActiveJob.customer ? 
      `${currentActiveJob.customer.firstName || ''} ${currentActiveJob.customer.lastName || ''}`.trim() : 
      'Customer',
    customerPhone: currentActiveJob.customerPhone || '(407) 555-0199',
    pickupAddress: currentActiveJob.pickupAddress || '',
    pickupCity: currentActiveJob.pickupCity || '',
    pickupZip: currentActiveJob.pickupZip || '',
    serviceType: currentActiveJob.serviceType || '',
    loadEstimate: currentActiveJob.loadEstimate || 'medium',
    priceEstimate: currentActiveJob.livePrice || currentActiveJob.priceEstimate || 0,
    status: currentActiveJob.status || 'accepted',
    acceptedAt: currentActiveJob.acceptedAt || undefined,
    contactRequiredBy: currentActiveJob.contactRequiredBy || undefined,
    contactConfirmedAt: currentActiveJob.contactConfirmedAt || undefined,
    paymentStatus: currentActiveJob.paymentStatus || undefined,
    isPriceLocked: currentActiveJob.isPriceLocked || false,
    accessType: currentActiveJob.accessType || "person",
  } : null;
  
  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/jobs/${jobId}/start`, {});
    },
    onSuccess: () => {
      refetchActiveJobs();
      toast({ title: "Job Started", description: "You can now begin working on this job" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start job", variant: "destructive" });
    },
  });
  
  // Add adjustment mutation
  const addAdjustmentMutation = useMutation({
    mutationFn: async ({ jobId, adjustment }: { jobId: string; adjustment: { adjustmentType: string; itemName: string; priceChange: number; reason?: string } }) => {
      return apiRequest("POST", `/api/jobs/${jobId}/adjustments`, adjustment);
    },
    onSuccess: () => {
      toast({ title: "Adjustment Added", description: "Waiting for customer approval" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add adjustment", variant: "destructive" });
    },
  });
  
  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/jobs/${jobId}/complete`, {});
    },
    onSuccess: (data) => {
      refetchActiveJobs();
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: "Job Completed!", description: "Payment has been captured successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to complete job", variant: "destructive" });
    },
  });
  
  // Update completion checklist mutation
  const updateCompletionMutation = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: Record<string, any> }) => {
      return apiRequest("PATCH", `/api/jobs/${jobId}/completion`, updates);
    },
    onSuccess: () => {
      refetchActiveJobs();
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const handlePhotoUpload = async (files: FileList) => {
    if (!activeJob) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file, idx) => {
        formData.append(`photo_${idx}`, file);
      });
      formData.append("jobId", activeJob.id);
      formData.append("photoType", "after");

      const response = await fetch("/api/jobs/upload-photos", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedPhotos(prev => [...prev, ...data.urls]);
      } else {
        const urls = Array.from(files).map(file => URL.createObjectURL(file));
        setUploadedPhotos(prev => [...prev, ...urls]);
      }
    } catch {
      const urls = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedPhotos(prev => [...prev, ...urls]);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleReportIssue = async (issue: { type: string; description: string }) => {
    if (!activeJob) return;
    try {
      await apiRequest("POST", `/api/jobs/${activeJob.id}/report-issue`, issue);
      toast({ title: "Issue Reported", description: "Support will contact you shortly" });
    } catch {
      toast({ title: "Issue Reported", description: "Support will contact you shortly" });
    }
  };

  const handleCompleteJob = async () => {
    if (!activeJob) return;
    
    // First update completion checklist to mark work as completed
    await updateCompletionMutation.mutateAsync({
      jobId: activeJob.id,
      updates: { workCompleted: true, photosAfter: uploadedPhotos }
    });
    
    // Then complete the job
    completeJobMutation.mutate(activeJob.id);
    setUploadedPhotos([]);
  };

  const handleConfirmCall = async () => {
    if (!activeJob) return;
    setIsConfirmingCall(true);
    try {
      await apiRequest("POST", `/api/service-requests/${activeJob.id}/confirm-call`, {
        proId: currentPro?.id,
      });
      refetchActiveJobs();
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
    } catch {
      toast({ title: "Call Confirmed", description: "Thank you for contacting the customer" });
    } finally {
      setIsConfirmingCall(false);
    }
  };
  
  const handleStartJob = () => {
    if (!activeJob) return;
    startJobMutation.mutate(activeJob.id);
  };
  
  const handleAddAdjustment = (itemName: string, priceChange: number, reason?: string) => {
    if (!activeJob) return;
    addAdjustmentMutation.mutate({
      jobId: activeJob.id,
      adjustment: {
        adjustmentType: priceChange >= 0 ? 'add_item' : 'remove_item',
        itemName,
        priceChange,
        reason,
      }
    });
  };

  const { data: pendingRequests, isLoading: requestsLoading } = useQuery<ServiceRequestWithDetails[]>({
    queryKey: ["/api/service-requests/pending"],
  });

  // Get completed jobs for this Pro
  const { data: completedJobs } = useQuery<ServiceRequestWithDetails[]>({
    queryKey: ["/api/service-requests/pro", currentPro?.profile?.id],
    enabled: !!currentPro?.profile?.id,
  });

  // Get existing rebate claims to check which jobs have claims
  const { data: rebateClaims } = useQuery<any[]>({
    queryKey: ["/api/rebates/pro", currentPro?.profile?.id],
    queryFn: async () => {
      const res = await fetch(`/api/rebates/pro/${currentPro?.profile?.id}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentPro?.profile?.id,
  });

  // Get recent completed jobs eligible for receipt upload (within 48 hours)
  const recentCompletedJobs = completedJobs?.filter(job => {
    if (job.status !== "completed") return false;
    const completedAt = job.completedAt ? new Date(job.completedAt) : new Date();
    const hoursSinceCompletion = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCompletion <= 48;
  }) || [];

  // Function to navigate to rebates tab with pre-selected job
  const handleUploadReceipt = (jobId: string) => {
    setActiveTab("rebates");
    // The GreenGuaranteeSection will handle the job selection
  };
  const isAvailable = currentPro?.profile?.isAvailable ?? false;

  const geoLocation = useGeoLocation(isAvailable, {
    enableHighAccuracy: true,
  });

  useEffect(() => {
    if (!isAvailable || !currentPro?.id) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${currentPro.id}&role=pro`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Pro location WebSocket connected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Pro location WebSocket disconnected");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isAvailable, currentPro?.id]);

  useEffect(() => {
    if (!geoLocation.lat || !geoLocation.lng || !isAvailable) return;

    const now = Date.now();
    const hasActiveJob = !!currentActiveJob;
    const updateInterval = hasActiveJob ? 10000 : 30000;
    
    if (now - lastLocationBroadcast.current < updateInterval) return;
    lastLocationBroadcast.current = now;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "location_update",
        data: {
          lat: geoLocation.lat,
          lng: geoLocation.lng,
          accuracy: geoLocation.accuracy,
          heading: geoLocation.heading,
          speed: geoLocation.speed,
        },
      }));
    }

    apiRequest("POST", "/api/pros/update-location", {
      latitude: geoLocation.lat,
      longitude: geoLocation.lng,
      accuracy: geoLocation.accuracy,
    }).catch(err => console.error("Failed to update location:", err));
  }, [geoLocation.lat, geoLocation.lng, geoLocation.timestamp, isAvailable, currentActiveJob]);

  const { data: vehicles } = useQuery<ProVehicle[]>({
    queryKey: [`/api/pros/${currentPro?.profile?.id}/vehicles`],
    enabled: !!currentPro?.profile?.id,
  });

  const goOnlineMutation = useMutation({
    mutationFn: async () => {
      if (!currentPro?.profile?.id) throw new Error("No profile");
      
      // Location consent is required per Florida labor law
      if (!locationConsent) {
        throw new Error("Location consent is required to go online");
      }
      
      // Get current location for GPS tracking
      const position = geoLocation.lat && geoLocation.lng ? 
        { latitude: geoLocation.lat, longitude: geoLocation.lng, accuracy: geoLocation.accuracy } :
        await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }).then(pos => ({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }));
      
      // First call the new GPS tracking endpoint (requires location consent)
      await apiRequest("POST", "/api/pros/go-online", {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        locationConsent: locationConsent, // User explicitly consented via checkbox
      });
      
      // Then call the legacy endpoint to set vehicle and travel radius
      return apiRequest("POST", `/api/pros/${currentPro.profile.id}/go-online`, {
        vehicleId: selectedVehicleId,
        travelRadius,
      });
    },
    onSuccess: () => {
      setShowGoOnlineDialog(false);
      setLocationConsent(false); // Reset for next time
      queryClient.invalidateQueries({ queryKey: ["/api/pros"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pros/available"] });
      toast({
        title: "You're Online",
        description: "You are now visible to customers and can receive job requests.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to go online",
        description: error.message || "Please enable location services and try again.",
        variant: "destructive",
      });
    },
  });

  const goOfflineMutation = useMutation({
    mutationFn: async () => {
      if (!currentPro?.profile?.id) throw new Error("No profile");
      
      // Call the new GPS tracking endpoint to stop location tracking
      await apiRequest("POST", "/api/pros/go-offline", {});
      
      // Then call the legacy endpoint
      return apiRequest("POST", `/api/pros/${currentPro.profile.id}/go-offline`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pros"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pros/available"] });
      toast({
        title: "You're Offline",
        description: "Location tracking has stopped. You will not receive new job requests.",
      });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const handleAvailabilityToggle = (checked: boolean) => {
    if (checked) {
      if (vehicles && vehicles.length > 0) {
        setSelectedVehicleId(vehicles[0].id);
        setTravelRadius(currentPro?.profile?.activeTravelRadius || 25);
        setShowGoOnlineDialog(true);
      } else {
        goOnlineMutation.mutate();
      }
    } else {
      goOfflineMutation.mutate();
    }
  };

  const getVehicleLabel = (vehicle: ProVehicle) => {
    const parts = [];
    if (vehicle.vehicleName) parts.push(vehicle.vehicleName);
    else {
      if (vehicle.make) parts.push(vehicle.make);
      if (vehicle.model) parts.push(vehicle.model);
    }
    if (vehicle.year) parts.push(`(${vehicle.year})`);
    if (vehicle.hasTrailer && vehicle.trailerSize) parts.push(`w/ ${vehicle.trailerSize} trailer`);
    if (vehicle.isEnclosed) parts.push("- Enclosed");
    return parts.join(" ") || vehicle.vehicleType;
  };

  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/service-requests/${requestId}`, {
        status: "assigned",
        assignedHaulerId: currentPro?.profile?.id || currentPro?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/pending"] });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const declineMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/service-requests/${requestId}`, {
        status: "cancelled",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/pending"] });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const { data: stripeStatus } = useQuery<{
    hasAccount: boolean;
    onboardingComplete: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
  }>({
    queryKey: ["/api/pros", currentPro?.profile?.id, "stripe-status"],
    queryFn: async () => {
      if (!currentPro?.profile?.id) return { hasAccount: false, onboardingComplete: false };
      const res = await fetch(`/api/pros/${currentPro.profile.id}/stripe-status`);
      return res.json();
    },
    enabled: !!currentPro?.profile?.id,
  });

  const stripeOnboardMutation = useMutation({
    mutationFn: async () => {
      if (!currentPro?.profile?.id) throw new Error("No profile");
      const res = await apiRequest("POST", `/api/pros/${currentPro.profile.id}/stripe-onboard`, {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const { data: complianceStatus, isLoading: complianceLoading } = useQuery<{
    hasCardOnFile: boolean;
    backgroundCheckStatus: string;
    stripeOnboardingComplete: boolean;
    canAcceptJobs: boolean;
    unpaidPenaltiesCount: number;
    unpaidPenaltiesAmount: number;
    ndaAccepted: boolean;
    ndaAcceptedAt: string | null;
    ndaVersion: string | null;
  }>({
    queryKey: ["/api/pros", currentPro?.profile?.id, "compliance"],
    queryFn: async () => {
      if (!currentPro?.profile?.id) return {
        hasCardOnFile: false,
        backgroundCheckStatus: "pending",
        stripeOnboardingComplete: false,
        canAcceptJobs: false,
        unpaidPenaltiesCount: 0,
        unpaidPenaltiesAmount: 0,
        ndaAccepted: false,
        ndaAcceptedAt: null,
        ndaVersion: null,
      };
      const res = await fetch(`/api/pros/${currentPro.profile.id}/compliance`);
      return res.json();
    },
    enabled: !!currentPro?.profile?.id,
  });

  const setupCardMutation = useMutation({
    mutationFn: async () => {
      if (!currentPro?.profile?.id) throw new Error("No profile");
      const res = await apiRequest("POST", `/api/pros/${currentPro.profile.id}/setup-card`, {});
      return res.json();
    },
  });

  const backgroundCheckMutation = useMutation({
    mutationFn: async () => {
      if (!currentPro?.profile?.id) throw new Error("No profile");
      const res = await apiRequest("POST", `/api/pros/${currentPro.profile.id}/request-background-check`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pros", currentPro?.profile?.id, "compliance"] });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const [, navigateTo] = useLocation();
  
  const acceptJobMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!currentPro?.id) throw new Error("No Pro");
      const res = await apiRequest("POST", `/api/service-requests/${requestId}/accept`, {
        proId: currentPro.id,
      });
      return { res, requestId };
    },
    onSuccess: ({ requestId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pros", "active-jobs"] });
      toast({
        title: "Job accepted",
        description: "Routing you to the job wizard...",
      });
      navigateTo(`/job/${requestId}/work`);
    },
    onError: (error: any) => {
      let title = "Cannot accept job";
      let description = "Failed to accept job. Please try again.";
      
      try {
        const raw = error?.message || "";
        const jsonStart = raw.indexOf("{");
        if (jsonStart >= 0) {
          const parsed = JSON.parse(raw.slice(jsonStart));
          description = parsed.reason || parsed.error || description;
          if (parsed.error?.includes("no longer available") || parsed.reason?.includes("already been accepted") || parsed.reason?.includes("just taken") || parsed.reason?.includes("cancelled")) {
            title = "Job no longer available";
          }
        } else {
          description = raw;
        }
      } catch {
        description = error?.message || description;
      }
      
      toast({ title, description, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/pending"] });
    },
  });

  // Languages for profile
  const languageOptions = [
    { id: "en", label: "English" },
    { id: "es", label: "Spanish" },
    { id: "pt", label: "Portuguese" },
    { id: "fr", label: "French" },
    { id: "ht", label: "Haitian Creole" },
    { id: "vi", label: "Vietnamese" },
    { id: "zh", label: "Chinese" },
  ];
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    currentPro?.profile?.languagesSpoken || ["en"]
  );
  
  const updateLanguagesMutation = useMutation({
    mutationFn: async (languages: string[]) => {
      if (!currentPro?.profile?.id) throw new Error("No profile");
      return apiRequest("PATCH", `/api/pros/${currentPro.profile.id}/profile`, {
        languagesSpoken: languages,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pros"] });
      toast({
        title: "Languages updated",
        description: "Your spoken languages have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update languages. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const toggleLanguage = (langId: string) => {
    const newLanguages = selectedLanguages.includes(langId)
      ? selectedLanguages.filter(l => l !== langId)
      : [...selectedLanguages, langId];
    
    // Must have at least one language
    if (newLanguages.length === 0) {
      toast({
        title: "At least one language required",
        description: "You must speak at least one language.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedLanguages(newLanguages);
    updateLanguagesMutation.mutate(newLanguages);
  };

  // Profile Section
  if (activeTab === "profile") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your Pro profile and preferences</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={pro1} alt={currentPro?.profile?.companyName || 'Pro'} />
                <AvatarFallback className="text-xl">{currentPro?.firstName?.charAt(0) || "P"}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{currentPro?.profile?.companyName || "Your Company"}</h2>
                <Badge variant={currentPro?.profile?.pyckerTier === "verified_pro" ? "default" : "secondary"}>
                  {currentPro?.profile?.pyckerTier === "verified_pro" ? "Verified Pro" : "Independent Pro"}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-medium flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {currentPro?.profile?.rating || 5.0} ({currentPro?.profile?.reviewCount || 0} reviews)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Jobs Completed</span>
                <span className="font-medium">{currentPro?.profile?.jobsCompleted || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payout Rate</span>
                <span className="font-medium">{(currentPro?.profile?.payoutPercentage || 0.85) * 100}%</span>
              </div>
            </div>
          </Card>
          
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Languages I Speak
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select all languages you can communicate with customers in. This helps us match you with customers who prefer your language.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all hover-elevate ${
                    selectedLanguages.includes(lang.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background"
                  }`}
                  onClick={() => toggleLanguage(lang.id)}
                  disabled={updateLanguagesMutation.isPending}
                  data-testid={`toggle-lang-${lang.id}`}
                >
                  {selectedLanguages.includes(lang.id) && (
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                  )}
                  {lang.label}
                </button>
              ))}
            </div>
            
            {updateLanguagesMutation.isPending && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </p>
            )}
          </Card>
          
          {currentPro?.profile?.id && (
            <VerificationGatesDisplay haulerId={currentPro.profile.id} />
          )}
          
          <Card className="p-5 lg:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Service Types
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Jobs you're willing to accept. Contact support to update.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {(currentPro?.profile?.serviceTypes || ["junk_removal", "furniture_moving", "garage_cleanout", "estate_cleanout"]).map((service) => (
                <Badge key={service} variant="secondary" className="text-sm">
                  {{
                    junk_removal: "Junk Removal",
                    furniture_moving: "Furniture Moving",
                    garage_cleanout: "Garage Cleanout",
                    estate_cleanout: "Estate Cleanout",
                    truck_unloading: "U-Haul/Truck Unloading",
                  }[service] || service}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Green Guarantee Rebate Section
  if (activeTab === "rebates") {
    return (
      <GreenGuaranteeSection 
        proId={currentPro?.profile?.id || ""} 
        rebateBalance={currentPro?.profile?.rebateBalance || 0}
      />
    );
  }

  if (activeTab === "compliance") {
    return (
      <div className="p-6 space-y-6" data-testid="compliance-section">
        <ComplianceVault proId={currentPro?.profile?.userId || (currentPro as any)?.userId || ""} />
      </div>
    );
  }

  // Insurance Section
  if (activeTab === "insurance") {
    return (
      <ProInsuranceSection proId={currentPro?.id || ""} />
    );
  }

  if (activeTab === "route") {
    return (
      <div className="p-6 space-y-6" data-testid="route-section">
        <CarbonDispatcher />
        <ProRouteOptimizer proId={currentPro?.profile?.id || ""} />
      </div>
    );
  }

  // Schedule Section
  if (activeTab === "schedule") {
    return (
      <div className="p-6" data-testid="schedule-section">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-schedule-heading">My Schedule</h1>
          <p className="text-muted-foreground">View and manage your upcoming jobs</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5" data-testid="card-upcoming-jobs">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Jobs
              </h3>
              {activeJobs && activeJobs.length > 0 ? (
                <div className="space-y-3" data-testid="list-scheduled-jobs">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg" data-testid={`row-job-${job.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-job-type-${job.id}`}>{job.serviceType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                          <p className="text-sm text-muted-foreground">{job.pickupAddress}, {job.pickupCity}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          {(job.bountyAmount || 0) > 0 && (
                            <Badge variant="destructive" className="shrink-0" data-testid={`badge-bounty-list-${job.id}`}>
                              <Flame className="w-3 h-3 mr-1" />
                              +${((job.bountyAmount || 0) / 100).toFixed(0)}
                            </Badge>
                          )}
                          <p className="font-semibold" data-testid={`text-job-price-${job.id}`}>${job.livePrice || job.priceEstimate}</p>
                        </div>
                        <Badge variant="secondary">{formatScheduledDate(job.scheduledFor)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" data-testid="empty-schedule">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No scheduled jobs</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("requests")} data-testid="button-browse-requests">
                    Browse Job Requests
                  </Button>
                </div>
              )}
            </Card>
          </div>
          
          <Card className="p-5" data-testid="card-quick-stats">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Jobs Today</span>
                <span className="font-semibold">{activeJobs?.length || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">This Week</span>
                <span className="font-semibold">{currentPro?.profile?.jobsCompleted || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-semibold">{(((currentPro?.profile as any)?.completionRate || 1) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Earnings Section  
  if (activeTab === "earnings") {
    const { data: earningsData, isLoading: earningsLoading } = useQuery<{
      total: number;
      weekly: number;
      monthly: number;
      today: number;
      pending: number;
      jobsThisWeek: number;
      history: Array<{ id: string; serviceType: string; address: string; date: string; amount: number; status: string }>;
    }>({
      queryKey: ["/api/pro/earnings"],
    });

    const payoutPctEarnings = currentPro?.profile?.payoutPercentage || 0.85;
    const todayEarnings = earningsData?.today ?? 0;
    const weekEarnings = earningsData?.weekly ?? 0;
    const monthEarnings = earningsData?.monthly ?? 0;
    const pendingEarnings = earningsData?.pending ?? 0;
    const jobsThisWeek = earningsData?.jobsThisWeek ?? 0;
    const recentHistory = earningsData?.history ?? [];

    const serviceLabelsEarnings: Record<string, string> = {
      junk_removal: "Junk Removal",
      furniture_moving: "Furniture Moving",
      garage_cleanout: "Garage Cleanout",
      estate_cleanout: "Estate Cleanout",
      pressure_washing: "Pressure Washing",
      gutter_cleaning: "Gutter Cleaning",
      moving_labor: "Moving Labor",
      light_demolition: "Light Demolition",
      home_consultation: "Home Consultation",
      home_cleaning: "Home Cleaning",
      pool_cleaning: "Pool Cleaning",
      carpet_cleaning: "Carpet Cleaning",
      landscaping: "Landscaping",
      handyman: "Handyman Services",
      demolition: "Light Demolition",
      truck_unloading: "U-Haul/Truck Unloading",
    };

    return (
      <div className="p-6" data-testid="earnings-section">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-earnings-heading">Earnings</h1>
          <p className="text-muted-foreground">Track your income and payouts</p>
        </div>

        {/* Stripe Connect Payouts Dashboard */}
        <div className="mb-8">
          <EarningsDashboard />
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5" data-testid="card-earnings-today">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Today</span>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-earnings-today">
              {earningsLoading ? <Skeleton className="h-8 w-20" /> : `$${(todayEarnings / 100).toFixed(0)}`}
            </p>
          </Card>
          <Card className="p-5" data-testid="card-earnings-week">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Week</span>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-earnings-week">
              {earningsLoading ? <Skeleton className="h-8 w-20" /> : `$${(weekEarnings / 100).toFixed(0)}`}
            </p>
            <p className="text-xs text-muted-foreground">{jobsThisWeek} jobs completed</p>
          </Card>
          <Card className="p-5" data-testid="card-earnings-month">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Month</span>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-earnings-month">
              {earningsLoading ? <Skeleton className="h-8 w-20" /> : `$${(monthEarnings / 100).toFixed(0)}`}
            </p>
          </Card>
          <Card className="p-5" data-testid="card-earnings-pending">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-earnings-pending">
              {earningsLoading ? <Skeleton className="h-8 w-20" /> : `$${(pendingEarnings / 100).toFixed(0)}`}
            </p>
            <p className="text-xs text-muted-foreground">Pending payout</p>
          </Card>
        </div>

        <Card className="p-5" data-testid="card-recent-transactions">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recent Transactions
          </h3>
          <div className="space-y-3" data-testid="list-transactions">
            {earningsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : recentHistory.length > 0 ? (
              recentHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`row-transaction-${tx.id}`}>
                  <div>
                    <p className="font-medium">{serviceLabelsEarnings[tx.serviceType] || tx.serviceType}</p>
                    <p className="text-sm text-muted-foreground">{tx.address ? `${tx.address} · ` : ""}{tx.date ? new Date(tx.date).toLocaleDateString() : "-"}</p>
                  </div>
                  <span className="font-semibold text-status-online">+${(tx.amount / 100).toFixed(0)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No earnings yet</p>
                <p className="text-xs text-muted-foreground mt-1">Complete jobs to start earning!</p>
              </div>
            )}
          </div>
        </Card>

        <ReferralEarningsCard proId={currentPro?.id || ""} />
      </div>
    );
  }

  // Marketplace Section
  if (activeTab === "marketplace") {
    return (
      <div className="p-6" data-testid="marketplace-section">
        <ProMarketplace proId={currentPro?.id || ""} />
      </div>
    );
  }

  // AI Insights Section
  if (activeTab === "ai-insights") {
    return <ProAiDashboard />;
  }

  // Settings Section
  if (activeTab === "settings") {
    return (
      <div className="p-6" data-testid="settings-section">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-settings-heading">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5" data-testid="card-notifications">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Job Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when new jobs are available</p>
                </div>
                <Switch defaultChecked data-testid="switch-job-alerts" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Updates</p>
                  <p className="text-sm text-muted-foreground">Notifications for payouts and tips</p>
                </div>
                <Switch defaultChecked data-testid="switch-payment-updates" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Reminders</p>
                  <p className="text-sm text-muted-foreground">Get text reminders for scheduled jobs</p>
                </div>
                <Switch defaultChecked data-testid="switch-sms-reminders" />
              </div>
            </div>
          </Card>
          
          <Card className="p-5" data-testid="card-payment-settings">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Settings
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Payout Method</Label>
                <p className="font-medium" data-testid="text-payout-method">Stripe Connect</p>
                <Badge variant="secondary" className="mt-1" data-testid="badge-stripe-connected">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Payout Schedule</Label>
                <p className="font-medium" data-testid="text-payout-schedule">Weekly (Fridays)</p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Commission Rate</Label>
                <p className="font-medium" data-testid="text-commission-rate">{(1 - (currentPro?.profile?.payoutPercentage || 0.85)) * 100}% platform fee</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-5" data-testid="card-languages">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Languages Spoken
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">English</p>
                  <p className="text-sm text-muted-foreground">Required for all Pros</p>
                </div>
                <Switch checked disabled data-testid="switch-lang-en" />
              </div>
              <Separator />
              {[
                { code: "es", label: "Spanish / Espa\u00f1ol", bonus: "+5%" },
                { code: "pt", label: "Portuguese / Portugu\u00eas", bonus: "+5%" },
                { code: "fr", label: "French / Fran\u00e7ais", bonus: "+3%" },
                { code: "ht", label: "Haitian Creole / Krey\u00f2l", bonus: "+5%" },
                { code: "vi", label: "Vietnamese / Ti\u1ebfng Vi\u1ec7t", bonus: "+3%" },
                { code: "zh", label: "Chinese / \u4e2d\u6587", bonus: "+3%" },
              ].map((lang) => {
                const langs = currentPro?.profile?.languagesSpoken || ["en"];
                const isActive = langs.includes(lang.code);
                return (
                  <div key={lang.code}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium flex items-center gap-2 flex-wrap">
                          {lang.label}
                          <Badge variant="secondary" className="text-xs">{lang.bonus} earnings</Badge>
                        </p>
                        <p className="text-sm text-muted-foreground">Unlock language-matched jobs</p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={async (checked) => {
                          const newLangs = checked 
                            ? [...langs.filter(l => l !== lang.code), lang.code]
                            : langs.filter(l => l !== lang.code);
                          try {
                            await apiRequest("PATCH", "/api/pro/profile", { languagesSpoken: newLangs });
                            queryClient.invalidateQueries({ queryKey: ["/api/pro/me"] });
                          } catch {}
                        }}
                        data-testid={`switch-lang-${lang.code}`}
                      />
                    </div>
                    <Separator className="mt-4" />
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Speaking a second language unlocks more jobs and earns bonus pay.
              </p>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2" data-testid="card-services">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Services You Provide
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select the services you're equipped to provide. You'll only receive job requests for services you've selected.
            </p>
            <ServicesSelector
              selectedServices={currentPro?.profile?.serviceTypes || []}
              onSelectionChange={(services) => {
                // Update services via API
                apiRequest("PATCH", `/api/pros/${currentPro?.profile?.id}/profile`, {
                  serviceTypes: services,
                  supportedServices: services,
                })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/pros/me"] });
                    toast({
                      title: "Services Updated",
                      description: "Your service offerings have been updated successfully",
                    });
                  })
                  .catch((error) => {
                    toast({
                      title: "Update Failed",
                      description: "Failed to update services. Please try again.",
                      variant: "destructive",
                    });
                  });
              }}
              showEquipmentInfo={true}
            />
          </Card>

          {/* Commercial / B2B Rates - only visible if b2b_licensed */}
          {currentPro?.profile?.b2bLicensed && (
            <Card className="p-5 lg:col-span-2" data-testid="card-b2b-rates">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Commercial / B2B Rates
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                These rates apply to HOA, property management, and commercial jobs
              </p>
              {currentPro?.profile?.licenseNumber && (
                <p className="text-xs text-muted-foreground mb-4">
                  License: {currentPro.profile.licenseNumber}
                </p>
              )}
              <div className="space-y-3">
                {(currentPro?.profile?.serviceTypes || []).map((service: string) => {
                  const range = SERVICE_PRICE_RANGES[service];
                  if (!range || range.floor === 0) return null;
                  const b2b = (currentPro?.profile?.b2bRates as Record<string, { min: number; max: number }> | null)?.[service] || { min: range.floor, max: range.ceiling };
                  return (
                    <div key={service} className="p-3 border rounded-lg bg-card">
                      <p className="font-medium text-sm mb-2">{range.displayName} (Commercial/B2B)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Min ($)</Label>
                          <Input
                            type="number"
                            value={b2b.min}
                            onChange={async (e) => {
                              const newRates = {
                                ...((currentPro?.profile?.b2bRates as Record<string, { min: number; max: number }>) || {}),
                                [service]: { ...b2b, min: Number(e.target.value) },
                              };
                              try {
                                await apiRequest("PATCH", "/api/pro/profile", { b2bRates: newRates });
                                queryClient.invalidateQueries({ queryKey: ["/api/pro/me"] });
                              } catch {}
                            }}
                            data-testid={`input-b2b-min-${service}`}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Max ($)</Label>
                          <Input
                            type="number"
                            value={b2b.max}
                            onChange={async (e) => {
                              const newRates = {
                                ...((currentPro?.profile?.b2bRates as Record<string, { min: number; max: number }>) || {}),
                                [service]: { ...b2b, max: Number(e.target.value) },
                              };
                              try {
                                await apiRequest("PATCH", "/api/pro/profile", { b2bRates: newRates });
                                queryClient.invalidateQueries({ queryKey: ["/api/pro/me"] });
                              } catch {}
                            }}
                            data-testid={`input-b2b-max-${service}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5 lg:col-span-2" data-testid="card-account-security">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{currentPro?.email || "Not set"}</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-change-email">Change</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-change-password">Change</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-enable-2fa">Enable</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTab === "requests") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Job Requests</h1>
            <p className="text-muted-foreground">
              {pendingRequests?.length || 0} available jobs in your area
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {requestsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </Card>
            ))
          ) : pendingRequests && pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <JobRequestCard
                key={request.id}
                request={request}
                onAccept={() => acceptJobMutation.mutate(request.id)}
                onDecline={() => declineMutation.mutate(request.id)}
                canAcceptJobs={complianceStatus?.canAcceptJobs ?? false}
                isAccepting={acceptJobMutation.isPending}
              />
            ))
          ) : (
            <Card className="col-span-full p-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No job requests right now</h3>
              <p className="text-muted-foreground">
                New requests will appear here. Make sure you're set to available!
              </p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const levelLabel = (() => {
    const l = currentPro?.profile?.level || 1;
    if (l >= 3) return "Master Consultant";
    if (l >= 2) return "Verified Pro";
    return "Rookie";
  })();
  const levelColor = (() => {
    const l = currentPro?.profile?.level || 1;
    if (l >= 3) return "text-amber-500";
    if (l >= 2) return "text-primary";
    return "text-muted-foreground";
  })();
  const xp = currentPro?.profile?.xpPoints || 0;
  const nextLevelXp = (() => {
    const l = currentPro?.profile?.level || 1;
    if (l >= 3) return xp;
    if (l >= 2) return 5000;
    return 1000;
  })();
  const xpProgress = Math.min(100, Math.round((xp / Math.max(nextLevelXp, 1)) * 100));
  const payoutPct = (currentPro?.profile?.payoutPercentage || 0.85) * 100;
  const nextPayout = activeJob ? Math.max(50, Math.round(((activeJob as any).livePrice || activeJob.priceEstimate || 0) * (currentPro?.profile?.payoutPercentage || 0.85))) : 0;
  const safetyCode = currentPro?.profile?.safetyCode;

  const proServiceTypes = currentPro?.profile?.serviceTypes || ["junk_removal", "furniture_moving", "garage_cleanout", "estate_cleanout"];
  const hasPressureWasher = currentPro?.profile?.hasPressureWasher ?? false;
  const hasTallLadder = currentPro?.profile?.hasTallLadder ?? false;
  const hasDemoTools = currentPro?.profile?.hasDemoTools ?? false;

  const matchedJobs = (pendingRequests || []).filter((req) => {
    const sType = req.serviceType;
    if (!proServiceTypes.includes(sType)) return false;
    if (sType === "pressure_washing" && !hasPressureWasher) return false;
    if (sType === "gutter_cleaning" && !hasTallLadder) return false;
    if (sType === "light_demolition" && !hasDemoTools) return false;
    return true;
  });

  const allServiceLabels: Record<string, string> = {
    junk_removal: "Junk Removal",
    furniture_moving: "Furniture Moving",
    garage_cleanout: "Garage Cleanout",
    estate_cleanout: "Estate Cleanout",
    truck_unloading: "U-Haul/Truck Unloading",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    moving_labor: "Moving Labor",
    light_demolition: "Light Demolition",
    home_consultation: "Home Consultation",
    home_cleaning: "Home Cleaning",
    pool_cleaning: "Pool Cleaning",
    carpet_cleaning: "Carpet Cleaning",
    landscaping: "Landscaping",
    handyman: "Handyman Services",
    demolition: "Light Demolition",
  };

  return (
    <div className="p-6">
      <OnboardingChecklist
        user={{
          firstName: currentPro?.profile?.companyName?.split(" ")[0] || "Pro",
          profileImageUrl: currentPro?.profile?.profilePhotoUrl || null,
          isVerified: currentPro?.profile?.verified || false,
          certifications: currentPro?.profile?.canAcceptJobs ? ["app_certification"] : [],
          payoutSetup: !!currentPro?.profile?.stripeAccountId,
          profileCompleted: !!(currentPro?.profile?.companyName && currentPro?.profile?.serviceTypes?.length),
        }}
      />

      {/* ICA Banner for existing pros who haven't signed */}
      {currentPro?.profile && !currentPro.profile.icaAcceptedAt && (
        <ICABanner onSign={() => setShowIcaModal(true)} />
      )}

      {/* === FEE PROGRESS === */}
      <FeeProgressWidget />

      {/* === CERTIFICATIONS === */}
      <CertificationDashboardSection />

      {/* === MISSION CONTROL HEADER === */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-2 border-primary/30">
              <AvatarImage src={pro1} alt={currentPro?.profile?.companyName || "Pro"} />
              <AvatarFallback className="text-lg">{currentPro?.firstName?.charAt(0) || "P"}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 flex-wrap" data-testid="text-mission-control-name">
                {currentPro?.profile?.companyName || "Pro"}
                <Badge variant="secondary" className={`${levelColor} text-xs`} data-testid="badge-level">
                  <Award className="w-3 h-3 mr-1" />
                  {levelLabel}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-mission-subtitle">Mission Control</p>
            </div>
          </div>
          <Card className={`p-4 ${isAvailable ? "bg-green-500/10 border-green-500/30" : "bg-muted"}`}>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isAvailable ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
              <div>
                <p className={`font-semibold ${isAvailable ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                  {isAvailable ? "Online" : "Offline"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAvailable ? (
                    <>
                      {vehicles?.find(v => v.id === currentPro?.profile?.activeVehicleId)?.vehicleType || "Available"}
                      {currentPro?.profile?.activeTravelRadius && ` | ${currentPro.profile.activeTravelRadius} mi`}
                      {geoLocation.isTracking && <span className="ml-1 text-green-600 dark:text-green-400">| GPS</span>}
                    </>
                  ) : "Go online to receive jobs"}
                </p>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={handleAvailabilityToggle}
                disabled={goOnlineMutation.isPending || goOfflineMutation.isPending}
                data-testid="switch-availability"
                className="ml-2"
              />
            </div>
          </Card>
        </div>

        {/* Loyalty & Repeat Job Incentives Banner */}
        <Card className="p-5 mb-6 bg-gradient-to-r from-green-500/10 to-primary/10 border-green-500/20">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-lg">You Build It, You Keep It</h3>
                <Badge className="bg-green-600 text-white">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Quality work gets rewarded. Proper disposal gets recognized. Your reputation becomes your income.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Green Guarantee Bonus</p>
                  <p className="text-xl font-bold text-green-600">$20/day</p>
                  <p className="text-xs text-muted-foreground">Upload disposal receipts</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Referral Commissions</p>
                  <p className="text-xl font-bold text-primary">10%</p>
                  <p className="text-xs text-muted-foreground">On partner referrals</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marketplace Sales</p>
                  <p className="text-xl font-bold text-purple-600">100%</p>
                  <p className="text-xs text-muted-foreground">You keep all proceeds</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* XP + Payout Strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">XP Level</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold" data-testid="text-xp-points">{xp.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
            <div className="mt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all"
                  style={{ width: `${xpProgress}%` }}
                  data-testid="bar-xp-progress"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(currentPro?.profile?.level || 1) >= 3 ? "Max level reached" : `${nextLevelXp - xp} XP to next level`}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Estimated Payout</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-next-payout">
              {nextPayout > 0 ? `$${nextPayout}` : "--"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {payoutPct}% of active job ($50 minimum){!activeJob && " (no active job)"}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Rating</span>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold">{currentPro?.profile?.rating || 5.0}</span>
              <span className="text-xs text-muted-foreground">({currentPro?.profile?.reviewCount || 0})</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentPro?.profile?.fiveStarRatingCount || 0} five-star reviews
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Jobs Done</span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <span className="text-2xl font-bold" data-testid="text-jobs-completed">{currentPro?.profile?.jobsCompleted || 0}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {matchedJobs.length} job{matchedJobs.length !== 1 ? "s" : ""} matching your skills
            </p>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <ImpactWidget />
      </div>

      {/* === ACTIVE JOB SECTION with Safety Code === */}
      {(activeJobsLoading || activeJob) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Active Mission
          </h2>
          {activeJobsLoading ? (
            <Card className="p-5"><Skeleton className="h-48 w-full" /></Card>
          ) : activeJob ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Safety Code Banner */}
                {safetyCode && (
                  <Card className="p-4 bg-primary/5 border-primary/20" data-testid="card-safety-code">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Your Safety Code</p>
                          <p className="text-sm text-muted-foreground">Customer must confirm this code</p>
                        </div>
                      </div>
                      <div className="text-3xl font-mono font-bold tracking-wider text-primary" data-testid="text-safety-code">
                        {safetyCode}
                      </div>
                    </div>
                  </Card>
                )}

                {activeJob.status === 'accepted' || activeJob.status === 'assigned' ? (
                  <Card className="p-5" data-testid="card-start-job">
                    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Job Ready</h3>
                          <p className="text-sm text-muted-foreground">{activeJob.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${activeJob.priceEstimate}</p>
                        <p className="text-xs text-muted-foreground">
                          Estimated earnings: ${Math.max(50, Math.round(activeJob.priceEstimate * (currentPro?.profile?.payoutPercentage || 0.85)))}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>{activeJob.pickupAddress}, {activeJob.pickupCity} {activeJob.pickupZip}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>{allServiceLabels[activeJob.serviceType] || activeJob.serviceType}</span>
                      </div>
                      {activeJob.accessType && activeJob.accessType !== "person" && (
                        <AccessCodeReveal jobId={activeJob.id} status={activeJob.status} accessType={activeJob.accessType} />
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigateTo(`/job/${activeJob.id}/work`)}
                        data-testid="button-go-to-wizard"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Open Wizard
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleStartJob}
                        disabled={startJobMutation.isPending}
                        data-testid="button-start-job"
                      >
                        {startJobMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        I've Arrived
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <ActiveJobCard
                    job={activeJob}
                    onPhotoUpload={handlePhotoUpload}
                    onReportIssue={handleReportIssue}
                    onCompleteJob={handleCompleteJob}
                    onConfirmCall={handleConfirmCall}
                    onLockPrice={async (data) => {
                      try {
                        await apiRequest("POST", `/api/service-requests/${activeJob.id}/lock-price`, data);
                        queryClient.invalidateQueries({ queryKey: ["/api/pros", "active-jobs"] });
                        toast({ title: "Price Locked", description: `Job started at $${data.newPrice}` });
                      } catch (error) {
                        toast({ title: "Error", description: "Failed to lock price", variant: "destructive" });
                      }
                    }}
                    isUploading={isUploadingPhoto}
                    uploadedPhotos={uploadedPhotos}
                    isConfirmingCall={isConfirmingCall}
                  />
                )}
              </div>
              <div className="space-y-4">
                <ProPriceVerification
                  jobId={currentActiveJob?.id || ""}
                  aiPriceMin={currentActiveJob?.aiPriceMin ?? undefined}
                  aiPriceMax={currentActiveJob?.aiPriceMax ?? undefined}
                  aiConfidence={currentActiveJob?.aiConfidence ?? undefined}
                  priceEstimate={currentActiveJob?.livePrice || currentActiveJob?.priceEstimate || 0}
                  photoUrls={currentActiveJob?.photoUrls || []}
                  identifiedItems={[]}
                  customerItems={(() => {
                    try {
                      return currentActiveJob?.customerItems ? JSON.parse(currentActiveJob.customerItems) : [];
                    } catch { return []; }
                  })()}
                  loadEstimate={currentActiveJob?.loadEstimate}
                  serviceType={currentActiveJob?.serviceType}
                  onVerified={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/pros"] });
                  }}
                />
                <SafetyCopilot
                  serviceRequestId={currentActiveJob?.id || ""}
                  haulerId={currentPro?.profile?.id || ""}
                  photoUrls={currentActiveJob?.photoUrls || []}
                  serviceType={currentActiveJob?.serviceType || "junk_removal"}
                />

                {/* Job Verification Workflow for applicable service types */}
                {currentActiveJob && ["junk_removal", "garage_cleanout", "light_demolition"].includes(currentActiveJob.serviceType || "") && (
                  <VerificationWorkflow
                    jobId={currentActiveJob.id}
                    serviceType={currentActiveJob.serviceType || "junk_removal"}
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* === No active job prompt === */}
      {!activeJobsLoading && !activeJob && (
        <Card className="p-6 mb-8 border-dashed text-center" data-testid="card-no-active-job">
          <Truck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No Active Mission</h3>
          <p className="text-sm text-muted-foreground mb-4">Accept a job below to start earning</p>
          {safetyCode && (
            <p className="text-sm text-muted-foreground">
              Your Safety Code: <span className="font-mono font-bold text-primary" data-testid="text-safety-code-idle">{safetyCode}</span>
            </p>
          )}
        </Card>
      )}

      {/* === SKILL-MATCHED JOB FEED === */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Jobs For You
              {matchedJobs.length > 0 && (
                <Badge variant="secondary" data-testid="badge-matched-count">{matchedJobs.length}</Badge>
              )}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("requests")} data-testid="button-view-all-requests">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {requestsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-5"><Skeleton className="h-32 w-full" /></Card>
              ))}
            </div>
          ) : matchedJobs.length > 0 ? (
            <div className="space-y-4">
              {matchedJobs.slice(0, 4).map((request) => (
                <JobRequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => acceptJobMutation.mutate(request.id)}
                  onDecline={() => declineMutation.mutate(request.id)}
                  canAcceptJobs={complianceStatus?.canAcceptJobs ?? false}
                  isAccepting={acceptJobMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No matching jobs right now</h3>
              <p className="text-sm text-muted-foreground">
                {(pendingRequests?.length || 0) > 0
                  ? `${pendingRequests?.length} jobs available but don't match your skills/equipment`
                  : "New requests will appear here when available"}
              </p>
              {!isAvailable && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Go online to start receiving jobs</p>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Actions
            </h3>
            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("schedule")} data-testid="button-view-schedule">
              <Calendar className="w-4 h-4 mr-2" /> Schedule
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("earnings")} data-testid="button-earnings">
              <DollarSign className="w-4 h-4 mr-2" /> Earnings
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("rebates")} data-testid="button-green-guarantee">
              <Flag className="w-4 h-4 mr-2" /> Green Guarantee
            </Button>
            <Separator />
            <Button variant="outline" className="w-full justify-start" data-testid="button-support">
              <Phone className="w-4 h-4 mr-2" /> Support
            </Button>
          </Card>

          {/* Skills & Equipment */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Your Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {proServiceTypes.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs" data-testid={`badge-skill-${s}`}>
                  {allServiceLabels[s] || s}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hasPressureWasher && <Badge variant="outline" className="text-xs"><Droplets className="w-3 h-3 mr-1" />Pressure Washer</Badge>}
              {hasTallLadder && <Badge variant="outline" className="text-xs"><TrendingUp className="w-3 h-3 mr-1" />Tall Ladder</Badge>}
              {hasDemoTools && <Badge variant="outline" className="text-xs"><Hammer className="w-3 h-3 mr-1" />Demo Tools</Badge>}
            </div>
          </Card>

          {/* Compliance */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Compliance
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Stripe</span>
                {stripeStatus?.onboardingComplete
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <Button size="sm" variant="outline" onClick={() => stripeOnboardMutation.mutate()} disabled={stripeOnboardMutation.isPending} data-testid="button-stripe-onboard">{stripeOnboardMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Setup"}</Button>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Card on File</span>
                {complianceStatus?.hasCardOnFile
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <Button size="sm" variant="outline" onClick={() => setupCardMutation.mutate()} disabled={setupCardMutation.isPending} data-testid="button-add-card">{setupCardMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}</Button>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Background</span>
                {complianceStatus?.backgroundCheckStatus === "clear"
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <Button size="sm" variant="outline" onClick={() => backgroundCheckMutation.mutate()} disabled={backgroundCheckMutation.isPending} data-testid="button-background-check">{backgroundCheckMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Start"}</Button>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">NDA</span>
                {complianceStatus?.ndaAccepted
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <Button size="sm" variant="outline" onClick={() => setShowNdaModal(true)} data-testid="button-sign-nda">Sign</Button>}
              </div>
            </div>
            <div className={`mt-3 p-2 rounded-md text-xs font-medium text-center ${complianceStatus?.canAcceptJobs ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
              {complianceStatus?.canAcceptJobs ? "Ready to Accept Jobs" : "Complete requirements above"}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Completed Jobs - Receipt Upload */}
      {recentCompletedJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-green-600" />
            Recent Completed Jobs
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCompletedJobs.slice(0, 3).map((job) => {
              const hasExistingClaim = rebateClaims?.some(claim => claim.serviceRequestId === job.id);
              return (
                <CompletedJobCard
                  key={job.id}
                  job={job}
                  hasExistingClaim={hasExistingClaim || false}
                  onUploadReceipt={handleUploadReceipt}
                />
              );
            })}
          </div>
          {recentCompletedJobs.length > 3 && (
            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => setActiveTab("rebates")} data-testid="button-view-all-completed">
                View All {recentCompletedJobs.length} Completed Jobs
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={showGoOnlineDialog} onOpenChange={setShowGoOnlineDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Go Online</DialogTitle>
            <DialogDescription>
              Select the vehicle you're using today and how far you're willing to travel for jobs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Select Vehicle</Label>
              {vehicles && vehicles.length > 0 ? (
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger data-testid="select-active-vehicle">
                    <SelectValue placeholder="Choose a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        <div className="flex flex-col">
                          <span>{getVehicleLabel(vehicle)}</span>
                          <span className="text-xs text-muted-foreground">
                            {vehicle.isEnclosed ? "Enclosed" : "Open"} 
                            {vehicle.hasTrailer && ` + ${vehicle.trailerSize || "Trailer"}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">No vehicles registered. You can still go online.</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Travel Radius</Label>
                <span className="text-lg font-bold">{travelRadius} miles</span>
              </div>
              <Slider
                value={[travelRadius]}
                onValueChange={([val]) => setTravelRadius(val)}
                min={5}
                max={100}
                step={5}
                className="w-full"
                data-testid="slider-travel-radius"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 mi</span>
                <span>50 mi</span>
                <span>100 mi</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="location-consent"
                  checked={locationConsent}
                  onChange={(e) => setLocationConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-input"
                  data-testid="checkbox-location-consent"
                />
                <div className="space-y-1">
                  <Label htmlFor="location-consent" className="text-sm font-medium cursor-pointer">
                    I consent to GPS location tracking while online
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Per Florida labor law, you may decline location tracking. Your location will only be shared 
                    while you're online and will be automatically deleted after 48 hours. Location data is used 
                    to connect you with nearby customers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGoOnlineDialog(false)} data-testid="button-cancel-go-online">
              Cancel
            </Button>
            <Button 
              onClick={() => goOnlineMutation.mutate()}
              disabled={goOnlineMutation.isPending || (!selectedVehicleId && vehicles && vehicles.length > 0) || !locationConsent}
              data-testid="button-confirm-go-online"
            >
              {goOnlineMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Going online...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Go Online
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NdaAgreementModal
        open={showNdaModal}
        onOpenChange={setShowNdaModal}
        proName={currentPro?.firstName && currentPro?.lastName
          ? `${currentPro.firstName} ${currentPro.lastName}`
          : currentPro?.email || "Pro"}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/pros", currentPro?.profile?.id, "compliance"] });
        }}
      />

      {/* ICA Agreement Modal for existing pros */}
      <Dialog open={showIcaModal} onOpenChange={setShowIcaModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <ICAAgreement
            contractorName={currentPro?.firstName && currentPro?.lastName
              ? `${currentPro.firstName} ${currentPro.lastName}`
              : ""}
            onAccept={async (data: ICAAcceptanceData) => {
              try {
                const res = await fetch("/api/auth/accept-ica", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(data),
                });
                if (!res.ok) throw new Error("Failed to save ICA acceptance");
                setShowIcaModal(false);
                queryClient.invalidateQueries({ queryKey: ["/api/pros"] });
                toast({ title: "Agreement Signed", description: "Thank you for signing the Independent Contractor Agreement." });
              } catch (e: any) {
                toast({ title: "Error", description: e.message || "Failed to save agreement", variant: "destructive" });
              }
            }}
            onBack={() => setShowIcaModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccessCodeReveal({ jobId, status, accessType }: { jobId: string; status: string; accessType: string }) {
  const [revealed, setRevealed] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const canReveal = ["en_route", "in_progress", "assigned"].includes(status);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("GET", `/api/service-requests/${jobId}/access-code`);
      const data = await res.json();
      if (data.code) {
        setCode(data.code);
        setRevealed(true);
      } else if (data.message) {
        toast({ title: "Access Code", description: data.message, variant: "default" });
      } else {
        setError("No code available");
      }
    } catch (e) {
      setError("Failed to load access code");
      toast({ title: "Error", description: "Could not retrieve access code", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-primary/5 border border-primary/20">
      <KeyRound className="w-4 h-4 text-primary shrink-0" />
      <span className="text-muted-foreground">
        {accessType === "smart_lock" ? "Smart Lock" : "Lockbox"}:
      </span>
      {canReveal ? (
        <>
          <span className="font-mono font-medium" data-testid="text-access-code">
            {revealed && code ? code : "****"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReveal}
            disabled={loading}
            data-testid="button-reveal-access-code"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Available when en route</span>
      )}
    </div>
  );
}

export default function ProDashboard() {
  usePageTitle("Pro Dashboard | UpTend");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: pros } = useQuery<ProWithProfile[]>({
    queryKey: ["/api/pros"],
  });

  const currentPro = pros?.[0];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center" data-testid="page-loading">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full" data-testid="page-pro-dashboard">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" textClassName="text-xl" />
            </Link>
            <p className="text-xs text-muted-foreground mt-1">Pro Portal</p>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        data-testid={`nav-${item.id}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge className="ml-auto" variant="secondary">
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 p-3 bg-sidebar-accent rounded-lg">
              <Avatar>
                <AvatarImage src={pro1} alt={currentPro?.firstName || 'Pro'} />
                <AvatarFallback>{currentPro?.firstName?.charAt(0) || "P"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {currentPro?.profile?.companyName || "Pro"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${currentPro?.profile?.isAvailable ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                  {currentPro?.profile?.isAvailable ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-muted/30">
            <DashboardContent activeTab={activeTab} setActiveTab={setActiveTab} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
