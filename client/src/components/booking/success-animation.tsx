import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, CalendarPlus, LayoutDashboard, TrendingUp, Leaf, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface SuccessAnimationProps {
  scoreIncrease?: number;
  serviceName?: string;
  bookingId?: string;
  onAddToCalendar?: () => void;
}

export function SuccessAnimation({
  scoreIncrease = 15,
  serviceName = "Maintenance",
  bookingId,
  onAddToCalendar,
}: SuccessAnimationProps) {
  const [fillPercent, setFillPercent] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFillPercent(75), 200);
    const timer2 = setTimeout(() => setShowDetails(true), 1200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleAddToCalendar = () => {
    if (onAddToCalendar) {
      onAddToCalendar();
      return;
    }
    const title = encodeURIComponent(`UpTend ${serviceName}`);
    const details = encodeURIComponent(`Booking #${bookingId || "pending"} - UpTend Home Health OS`);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(url, "_blank");
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-success-animation">
      <CardContent className="pt-8 pb-8 space-y-6 text-center">
        <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto" data-testid="animation-house-health">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
              <clipPath id="houseClip">
                <path d="M60 10 L110 50 L110 110 L10 110 L10 50 Z" />
              </clipPath>
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
              clipPath="url(#houseClip)"
              className="transition-all duration-1000 ease-out"
              fill="url(#greenGrad)"
            />
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#16a34a" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              d="M60 10 L110 50 L110 110 L10 110 L10 50 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-emerald-500"
            />
          </svg>
          <Home className="absolute w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className={`space-y-2 transition-opacity duration-500 ${showDetails ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold" data-testid="text-success-title">
              {serviceName} Scheduled!
            </h2>
          </div>

          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <p className="text-sm text-muted-foreground" data-testid="text-score-projection">
              Your Home Score is projected to increase by{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+{scoreIncrease} points</span>
            </p>
          </div>

          <Badge variant="secondary" className="gap-1" data-testid="badge-eco-impact">
            <Leaf className="w-3 h-3 text-emerald-500" />
            Carbon offset included
          </Badge>
        </div>

        <div className={`flex flex-col gap-3 pt-2 transition-opacity duration-500 ${showDetails ? "opacity-100" : "opacity-0"}`}>
          <Button
            className="w-full gap-2"
            onClick={handleAddToCalendar}
            data-testid="button-add-to-calendar"
          >
            <CalendarPlus className="w-4 h-4" />
            Add to Calendar
          </Button>
          <Link href="/my-home">
            <Button variant="outline" className="w-full gap-2" data-testid="button-view-digital-twin">
              <LayoutDashboard className="w-4 h-4" />
              View My Digital Twin
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
