import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Navigation, Camera, Shield, CheckCircle, Clock, Loader2,
  ArrowLeft, ChevronRight, Timer, Leaf, Upload, AlertTriangle,
  Phone, Truck, Play, Pause, Square, X
} from "lucide-react";

export interface WizardJob {
  id: string;
  serviceType: string;
  customerName: string;
  address: string;
  city?: string;
  zip?: string;
  priceEstimate?: number;
  status: string;
  safetyCode?: string;
  accessType?: string;
}

interface Props {
  job: WizardJob;
  onUpdateStatus: (status: string, data?: Record<string, unknown>) => void;
  isUpdating?: boolean;
}

type Phase = "en_route" | "on_site" | "working" | "completion";

function getPhaseFromStatus(status: string): Phase {
  switch (status) {
    case "accepted":
    case "assigned":
    case "en_route":
      return "en_route";
    case "arrived":
      return "on_site";
    case "working":
    case "in_progress":
      return "working";
    case "completed":
      return "completion";
    default:
      return "en_route";
  }
}

const SERVICE_LABELS: Record<string, string> = {
  junk_removal: "Junk Removal",
  furniture_moving: "Furniture Moving",
  garage_cleanout: "Garage Cleanout",
  estate_cleanout: "Estate Cleanout",
  truck_unloading: "Truck Unloading",
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  moving_labor: "Moving Labor",
  light_demolition: "Light Demolition",
  home_consultation: "Home Consultation",
};

const PHASE_LABELS: Record<Phase, string> = {
  en_route: "En Route",
  on_site: "On Site",
  working: "Working",
  completion: "Complete Job",
};

const PHASE_ORDER: Phase[] = ["en_route", "on_site", "working", "completion"];

function isTimerService(serviceType: string) {
  return ["moving_labor"].includes(serviceType);
}

function isPhotoService(serviceType: string) {
  return ["junk_removal", "furniture_moving", "garage_cleanout", "estate_cleanout",
    "truck_unloading", "pressure_washing", "gutter_cleaning", "light_demolition"].includes(serviceType);
}

export function UniversalJobWizard({ job, onUpdateStatus, isUpdating }: Props) {
  const [, navigate] = useLocation();
  const [currentPhase, setCurrentPhase] = useState<Phase>(() => getPhaseFromStatus(job.status));
  const [manualPhaseOverride, setManualPhaseOverride] = useState<Phase | null>(null);

  useEffect(() => {
    if (!manualPhaseOverride) {
      setCurrentPhase(getPhaseFromStatus(job.status));
    }
  }, [job.status, manualPhaseOverride]);

  const activePhase = manualPhaseOverride || currentPhase;
  const phaseIndex = PHASE_ORDER.indexOf(activePhase);
  const progress = ((phaseIndex + 1) / PHASE_ORDER.length) * 100;

  const advanceToCompletion = () => {
    setManualPhaseOverride("completion");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="wizard-container">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/pro/dashboard")}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold" data-testid="text-phase-label">{PHASE_LABELS[activePhase]}</p>
            <p className="text-xs text-muted-foreground">{SERVICE_LABELS[job.serviceType] || job.serviceType}</p>
          </div>
          <Badge variant="secondary" className="text-xs" data-testid="badge-job-id">
            #{job.id.slice(0, 6)}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5 rounded-none" data-testid="bar-wizard-progress" />
      </div>

      {/* Phase Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activePhase === "en_route" && (
          <PhaseEnRoute job={job} onArrive={() => onUpdateStatus("arrived")} isUpdating={isUpdating} />
        )}
        {activePhase === "on_site" && (
          <PhaseOnSite
            job={job}
            onStartWork={() => onUpdateStatus("working")}
            isUpdating={isUpdating}
          />
        )}
        {activePhase === "working" && (
          <PhaseWorking job={job} onMarkComplete={advanceToCompletion} />
        )}
        {activePhase === "completion" && (
          <PhaseCompletion
            job={job}
            onComplete={(data) => onUpdateStatus("completed", data)}
            isUpdating={isUpdating}
          />
        )}
      </div>

      {/* Phase Navigation */}
      <div className="sticky bottom-0 z-50 border-t bg-background p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {PHASE_ORDER.map((p, i) => (
              <div
                key={p}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i <= phaseIndex ? "bg-primary" : "bg-muted"
                }`}
                data-testid={`dot-phase-${p}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {phaseIndex + 1} of {PHASE_ORDER.length}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================
   PHASE 1: EN ROUTE
   ============================ */
function PhaseEnRoute({ job, onArrive, isUpdating }: { job: WizardJob; onArrive: () => void; isUpdating?: boolean }) {
  const [sliderValue, setSliderValue] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);

  const handleSlideComplete = useCallback(() => {
    if (sliderValue > 85) {
      setArrived(true);
      onArrive();
    } else {
      setSliderValue(0);
    }
  }, [sliderValue, onArrive]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsSliding(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSliding || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderValue(pct);
  };

  const handlePointerUp = () => {
    setIsSliding(false);
    handleSlideComplete();
  };

  const fullAddress = [job.address, job.city, job.zip].filter(Boolean).join(", ");

  return (
    <div className="space-y-6 max-w-lg mx-auto" data-testid="phase-en-route">
      {/* Map placeholder */}
      <Card className="overflow-hidden">
        <div
          className="h-56 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center relative"
          data-testid="map-container"
        >
          <div className="text-center space-y-2">
            <Navigation className="w-12 h-12 text-primary mx-auto" />
            <p className="text-sm font-medium">Navigate to Customer</p>
            <p className="text-xs text-muted-foreground">GPS Navigation Active</p>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <Button
              variant="outline"
              className="w-full bg-background/90 backdrop-blur-sm"
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`, "_blank")}
              data-testid="button-open-maps"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Open in Maps
            </Button>
          </div>
        </div>
      </Card>

      {/* Customer & Address */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold" data-testid="text-customer-name">{job.customerName}</p>
              <p className="text-sm text-muted-foreground" data-testid="text-customer-address">{fullAddress}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="text-sm font-medium">{SERVICE_LABELS[job.serviceType] || job.serviceType}</p>
            </div>
            {job.priceEstimate != null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Estimate</p>
                <p className="text-lg font-bold">${(job.priceEstimate / 100).toFixed(0)}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Swipe to Arrive */}
      <div className="space-y-2">
        <p className="text-center text-sm font-medium text-muted-foreground">
          {arrived ? "Arrival confirmed!" : "Slide to confirm arrival"}
        </p>
        <div
          ref={sliderRef}
          className={`relative h-16 rounded-lg overflow-hidden select-none ${
            arrived
              ? "bg-green-500/20 border border-green-500/30"
              : "bg-primary/10 border border-primary/20"
          }`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          data-testid="slider-arrive"
        >
          {!arrived && (
            <>
              <div
                className="absolute inset-y-0 left-0 bg-primary/20 transition-none"
                style={{ width: `${sliderValue}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-14 h-14 rounded-lg bg-primary text-primary-foreground flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-none z-10"
                style={{ left: `calc(${sliderValue}% - ${sliderValue > 50 ? 28 : 0}px)` }}
                onPointerDown={handlePointerDown}
                data-testid="slider-thumb"
              >
                <ChevronRight className="w-6 h-6" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-sm font-medium text-muted-foreground">
                  {sliderValue > 50 ? "Almost there..." : "Swipe to Arrive"}
                </span>
              </div>
            </>
          )}
          {arrived && (
            <div className="absolute inset-0 flex items-center justify-center">
              {isUpdating ? (
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              ) : (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Arrived!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <Button variant="outline" className="w-full" data-testid="button-call-customer">
        <Phone className="w-4 h-4 mr-2" />
        Call Customer
      </Button>
    </div>
  );
}

/* ============================
   PHASE 2: ON SITE
   ============================ */
function PhaseOnSite({ job, onStartWork, isUpdating }: { job: WizardJob; onStartWork: () => void; isUpdating?: boolean }) {
  const [beforePhotoTaken, setBeforePhotoTaken] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const useTimer = isTimerService(job.serviceType);
  const usePhoto = isPhotoService(job.serviceType);

  const canProceed = useTimer ? timerStarted : usePhoto ? beforePhotoTaken : true;

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBeforePhotoTaken(true);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto" data-testid="phase-on-site">
      <Card className="p-5">
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">You've Arrived</h2>
          <p className="text-sm text-muted-foreground">
            {useTimer
              ? "Start the timer before beginning work"
              : usePhoto
              ? "Take a 'Before' photo to document the job site"
              : "Confirm you're ready to begin the consultation"}
          </p>
        </div>

        {/* Job Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Customer</span>
            <span className="text-sm font-medium" data-testid="text-onsite-customer">{job.customerName}</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Service</span>
            <Badge variant="secondary">{SERVICE_LABELS[job.serviceType] || job.serviceType}</Badge>
          </div>
          {job.priceEstimate != null && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Quote</span>
              <span className="text-sm font-bold">${(job.priceEstimate / 100).toFixed(0)}</span>
            </div>
          )}
        </div>

        {/* Action Area */}
        {useTimer && (
          <div className="space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setTimerStarted(true)}
              disabled={timerStarted}
              data-testid="button-start-timer"
            >
              {timerStarted ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Timer Ready
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Timer
                </>
              )}
            </Button>
            {timerStarted && (
              <p className="text-center text-sm text-green-600 dark:text-green-400">
                Timer will begin when you proceed to working phase
              </p>
            )}
          </div>
        )}

        {usePhoto && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
              data-testid="input-before-photo"
            />
            <Button
              className="w-full"
              size="lg"
              variant={beforePhotoTaken ? "outline" : "default"}
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-take-before-photo"
            >
              {beforePhotoTaken ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Before Photo Captured
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Take Before Photo
                </>
              )}
            </Button>
            {!beforePhotoTaken && (
              <p className="text-center text-xs text-muted-foreground">
                A before photo is required before you can start working
              </p>
            )}
          </div>
        )}

        {!useTimer && !usePhoto && (
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Ready to begin the home consultation checklist
            </p>
          </div>
        )}
      </Card>

      {/* Proceed Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={onStartWork}
        disabled={!canProceed || isUpdating}
        data-testid="button-begin-work"
      >
        {isUpdating ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <ChevronRight className="w-5 h-5 mr-2" />
        )}
        Begin Work
      </Button>
    </div>
  );
}

/* ============================
   PHASE 3: WORKING
   ============================ */
function PhaseWorking({ job, onMarkComplete }: { job: WizardJob; onMarkComplete: () => void }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const useTimer = isTimerService(job.serviceType);

  useEffect(() => {
    if (useTimer && isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [useTimer, isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto" data-testid="phase-working">
      {/* Safety Code Display */}
      {job.safetyCode && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="text-center space-y-3">
            <Shield className="w-10 h-10 text-primary mx-auto" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Share with Customer</p>
              <p className="text-4xl font-mono font-bold tracking-widest text-primary mt-2" data-testid="text-working-safety-code">
                {job.safetyCode}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Ask the customer to confirm this code to verify your identity
            </p>
          </div>
        </Card>
      )}

      {!job.safetyCode && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="text-center space-y-3">
            <Shield className="w-10 h-10 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              No safety code assigned. Introduce yourself to the customer verbally.
            </p>
          </div>
        </Card>
      )}

      {/* Timer (for moving_labor) */}
      {useTimer && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <Timer className="w-8 h-8 text-primary mx-auto" />
            <p className="text-5xl font-mono font-bold tabular-nums" data-testid="text-timer">
              {formatTime(elapsedSeconds)}
            </p>
            <p className="text-sm text-muted-foreground">
              ${((elapsedSeconds / 3600) * 45).toFixed(2)} estimated cost
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant={isRunning ? "outline" : "default"}
                size="icon"
                onClick={() => setIsRunning(!isRunning)}
                data-testid="button-timer-toggle"
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Work Status */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="font-semibold">Job In Progress</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{SERVICE_LABELS[job.serviceType] || job.serviceType}</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium">{job.customerName}</span>
          </div>
          {job.priceEstimate != null && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-muted-foreground">Quote</span>
              <span className="font-bold">${(job.priceEstimate / 100).toFixed(0)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Mark Work Complete */}
      <Button
        className="w-full"
        size="lg"
        onClick={onMarkComplete}
        data-testid="button-mark-work-complete"
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        Mark Work Complete
      </Button>
    </div>
  );
}

/* ============================
   PHASE 4: COMPLETION
   ============================ */
function PhaseCompletion({ job, onComplete, isUpdating }: { job: WizardJob; onComplete: (data: Record<string, unknown>) => void; isUpdating?: boolean }) {
  const [afterPhotoTaken, setAfterPhotoTaken] = useState(false);
  const [carbonOffset, setCarbonOffset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAfterPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAfterPhotoTaken(true);
    }
  };

  const handleComplete = () => {
    onComplete({ carbonOffsetSold: carbonOffset });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto" data-testid="phase-completion">
      <Card className="p-5">
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold">Almost Done!</h2>
          <p className="text-sm text-muted-foreground">
            Take an after photo and confirm the job is complete
          </p>
        </div>

        {/* After Photo */}
        <div className="space-y-4 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleAfterPhoto}
            data-testid="input-after-photo"
          />
          <Button
            className="w-full"
            size="lg"
            variant={afterPhotoTaken ? "outline" : "default"}
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-take-after-photo"
          >
            {afterPhotoTaken ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                After Photo Captured
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Take After Photo (Required)
              </>
            )}
          </Button>
          {!afterPhotoTaken && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                An after photo is required to complete the job and receive payment
              </p>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Carbon Offset Upsell */}
        <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/15 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Carbon Offset Add-On</p>
              <p className="text-xs text-muted-foreground">
                Did the customer opt-in to the $4.99 carbon offset?
              </p>
            </div>
          </div>
          <label
            className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover-elevate"
            data-testid="label-carbon-offset"
          >
            <input
              type="checkbox"
              checked={carbonOffset}
              onChange={(e) => setCarbonOffset(e.target.checked)}
              className="w-5 h-5 rounded border-input accent-green-600"
              data-testid="checkbox-carbon-offset"
            />
            <span className="text-sm font-medium">
              Yes, customer purchased a carbon offset (+$4.99)
            </span>
          </label>
        </div>
      </Card>

      {/* Job Summary */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Job Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{SERVICE_LABELS[job.serviceType] || job.serviceType}</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium">{job.customerName}</span>
          </div>
          {job.priceEstimate != null && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-muted-foreground">Quote</span>
              <span className="font-bold">${(job.priceEstimate / 100).toFixed(0)}</span>
            </div>
          )}
          {carbonOffset && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-muted-foreground">Carbon Offset</span>
              <span className="font-medium text-green-600">+$4.99</span>
            </div>
          )}
        </div>
      </Card>

      {/* Complete Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleComplete}
        disabled={!afterPhotoTaken || isUpdating}
        data-testid="button-complete-job"
      >
        {isUpdating ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="w-5 h-5 mr-2" />
        )}
        Complete Job
      </Button>
    </div>
  );
}
