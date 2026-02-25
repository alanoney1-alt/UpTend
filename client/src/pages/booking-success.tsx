import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle, Home, CalendarPlus, MapPin, TrendingUp, Sparkles,
  Star, Clock, Navigation, Download, ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { PolishUpCrossSell } from "@/components/cross-sell/polishup-prompt";
import { GuaranteeBadge } from "@/components/guarantee-badge";

// Simple confetti CSS animation — floating circles that fade out
function ConfettiCelebration() {
  const colors = ["#ea580c", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${8 + Math.random() * 84}%`,
    delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
    duration: `${1.5 + Math.random() * 1.5}s`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-[confetti-fall_var(--dur)_ease-out_var(--delay)_forwards]"
          style={{
            backgroundColor: p.color,
            left: p.left,
            top: "-20px",
            width: p.size,
            height: p.size,
            opacity: 0,
            "--delay": p.delay,
            "--dur": p.duration,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          70% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(60vh) rotate(720deg) scale(0.3); }
        }
      `}</style>
    </div>
  );
}

export default function BookingSuccess() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<"check" | "house">("check");
  const [fillPercent, setFillPercent] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [showCrossSell, setShowCrossSell] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  const bookedService = sessionStorage.getItem("lastBookedService") as
    | "junk_removal"
    | "garage_cleanout"
    | "moving_labor"
    | null;

  // Mock data — in production, pull from booking context/API
  const bookingId = sessionStorage.getItem("lastBookingId") || "demo-123";
  const proData = {
    firstName: "Marcus",
    avatarUrl: "",
    rating: 4.9,
    reviewCount: 127,
    verified: true,
    completedJobs: 342,
    tenureMonths: 36,
  };
  const estimatedArrival = "45 min";

  const shouldShowCrossSell =
    showCrossSell &&
    bookedService &&
    ["junk_removal", "garage_cleanout", "moving_labor"].includes(bookedService);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("house"), 1200);
    const t2 = setTimeout(() => setFillPercent(75), 1800);
    const t3 = setTimeout(() => setShowContent(true), 2600);
    const t4 = setTimeout(() => setShowConfetti(false), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const handleAddToCalendar = useCallback(() => {
    // Generate .ics file download
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000); // 1h from now placeholder
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UpTend//Booking//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      "SUMMARY:UpTend Service Appointment",
      `DESCRIPTION:Your pro ${proData.firstName} is scheduled. Booking ID: ${bookingId}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uptend-booking-${bookingId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bookingId, proData.firstName]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="page-booking-success">
      {showConfetti && <ConfettiCelebration />}

      <div className="w-full max-w-3xl space-y-6">
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
                  <path d="M60 10 L110 50 L110 110 L10 110 L10 50 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" />
                  <rect x="10" y={110 - fillPercent} width="100" height={fillPercent} clipPath="url(#houseSuccessClip)" className="transition-all duration-1000 ease-out" fill="url(#successGreenGrad)" />
                  <path d="M60 10 L110 50 L110 110 L10 110 L10 50 Z" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500" />
                </svg>
                <Home className="absolute inset-0 m-auto w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
          </div>

          <div className={`space-y-3 transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}>
            <h1 className="text-2xl font-bold" data-testid="text-success-title">
              {t("booking_success.title")}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <p className="text-muted-foreground" data-testid="text-score-impact">
                {t("booking_success.score_impact")}{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{t("booking_success.points")}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Split layout: booking details left, pro card right */}
        <div className={`transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}>
          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* LEFT: Booking Confirmation Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Booking Confirmed</h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Booking ID: <span className="font-mono font-semibold">{bookingId}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Estimated arrival: <span className="font-bold text-slate-900 dark:text-white">{estimatedArrival}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-[#ea580c] shrink-0" />
                      <span>Price Protection active</span>
                    </div>
                  </div>

                  <Card className="border border-slate-100 dark:border-slate-700" data-testid="card-digital-twin">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm">{t("booking_success.inventory_title")}</p>
                          <p className="text-xs text-muted-foreground">{t("booking_success.inventory_desc")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <GuaranteeBadge />
                </div>

                {/* Divider — mobile only */}
                <div className="block md:hidden border-t border-slate-200 dark:border-slate-700" />

                {/* RIGHT: Pro Card */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Your pro is on the way</h3>

                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-emerald-200 dark:border-emerald-700">
                      {proData.avatarUrl && <AvatarImage src={proData.avatarUrl} alt={proData.firstName} />}
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                        {proData.firstName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{proData.firstName}</h4>
                        {proData.verified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0">
                            <CheckCircle className="w-3 h-3 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{proData.rating}</span>
                        <span className="text-xs text-slate-400">({proData.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{Math.floor(proData.tenureMonths / 12)}+ yr</p>
                      <p className="text-[11px] text-slate-500">Experience</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{proData.completedJobs}</p>
                      <p className="text-[11px] text-slate-500">Jobs Done</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Navigation className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">ETA: {estimatedArrival}</span>
                    </div>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">Estimated arrival time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cross-sell */}
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

        {/* Action buttons */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}>
          <Link href={`/jobs/${bookingId}/track`}>
            <Button className="w-full gap-2 bg-[#ea580c] hover:bg-[#dc4c08] text-white" data-testid="button-track-live">
              <MapPin className="w-4 h-4" />
              Track Live
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleAddToCalendar}
            data-testid="button-add-to-calendar"
          >
            <Download className="w-4 h-4" />
            Add to Calendar
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full gap-2" data-testid="button-go-dashboard">
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
