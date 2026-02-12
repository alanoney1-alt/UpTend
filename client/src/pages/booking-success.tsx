import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Home, CalendarPlus, MapPin, TrendingUp, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { PolishUpCrossSell } from "@/components/cross-sell/polishup-prompt";
import { GuaranteeBadge } from "@/components/guarantee-badge";

export default function BookingSuccess() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<"check" | "house">("check");
  const [fillPercent, setFillPercent] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [showCrossSell, setShowCrossSell] = useState(true);

  // Get service type from session storage (set during booking)
  const bookedService = sessionStorage.getItem("lastBookedService") as
    | "junk_removal"
    | "garage_cleanout"
    | "moving_labor"
    | null;

  const shouldShowCrossSell =
    showCrossSell &&
    bookedService &&
    ["junk_removal", "garage_cleanout", "moving_labor"].includes(bookedService);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("house"), 1200);
    const t2 = setTimeout(() => setFillPercent(75), 1800);
    const t3 = setTimeout(() => setShowContent(true), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleAddToCalendar = () => {
    const title = encodeURIComponent("UpTend Maintenance");
    const details = encodeURIComponent("UpTend Home Health OS - Maintenance Scheduled");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="page-booking-success">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-6">
          <div className="relative inline-flex items-center justify-center w-36 h-36 mx-auto" data-testid="animation-check-to-house">
            {phase === "check" ? (
              <CheckCircle
                className="w-24 h-24 text-emerald-500 animate-[scale-in_0.6s_ease-out]"
                data-testid="icon-check-circle"
              />
            ) : (
              <div className="relative w-full h-full" data-testid="icon-house-fill">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <defs>
                    <clipPath id="houseSuccessClip">
                      <path d="M60 10 L110 50 L110 110 L10 110 L10 50 Z" />
                    </clipPath>
                    <linearGradient id="successGreenGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M60 10 L110 50 L110 110 L10 110 L10 50 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground/30"
                  />
                  <rect
                    x="10"
                    y={110 - fillPercent}
                    width="100"
                    height={fillPercent}
                    clipPath="url(#houseSuccessClip)"
                    className="transition-all duration-1000 ease-out"
                    fill="url(#successGreenGrad)"
                  />
                  <path
                    d="M60 10 L110 50 L110 110 L10 110 L10 50 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-emerald-500"
                  />
                </svg>
                <Home className="absolute inset-0 m-auto w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
          </div>

          <div className={`space-y-3 transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}>
            <h1 className="text-2xl font-bold" data-testid="text-success-title">
              Maintenance Scheduled!
            </h1>

            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <p className="text-muted-foreground" data-testid="text-score-impact">
                Projected Home Score Impact:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+15 Points</span>
              </p>
            </div>
          </div>
        </div>

        <Card className={`transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`} data-testid="card-digital-twin">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-md bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm" data-testid="text-digital-twin-title">Digital Inventory Update</p>
                <p className="text-sm text-muted-foreground" data-testid="text-digital-twin-desc">
                  Your Digital Inventory will be updated automatically during this service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={`transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}>
          <GuaranteeBadge />
        </div>

        {/* PolishUp Cross-Sell Prompt */}
        {shouldShowCrossSell && (
          <div className={`transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}>
            <PolishUpCrossSell
              serviceJustBooked={bookedService!}
              onDismiss={() => setShowCrossSell(false)}
              onBook={() => {
                sessionStorage.setItem("returningCustomerDiscount", "0.10");
                setLocation("/book?service=home_cleaning");
              }}
            />
          </div>
        )}

        <div className={`flex flex-col gap-3 transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}>
          <Button
            className="w-full gap-2"
            onClick={handleAddToCalendar}
            data-testid="button-add-to-calendar"
          >
            <CalendarPlus className="w-4 h-4" />
            Add to Calendar
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full gap-2" data-testid="button-track-pro">
              <MapPin className="w-4 h-4" />
              Track My Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
