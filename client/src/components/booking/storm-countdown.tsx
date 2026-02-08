import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";

function getHurricaneSeasonEnd(): Date {
  const now = new Date();
  const year = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, 10, 30, 23, 59, 59);
}

function getHurricaneSeasonStart(): Date {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear();
  return new Date(year, 5, 1, 0, 0, 0);
}

function getDaysUntil(target: Date): number {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isHurricaneSeason(): boolean {
  const now = new Date();
  const month = now.getMonth();
  return month >= 5 && month <= 10;
}

export function StormCountdown() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const inSeason = isHurricaneSeason();
  const seasonEnd = getHurricaneSeasonEnd();
  const seasonStart = getHurricaneSeasonStart();

  const daysLeft = inSeason
    ? getDaysUntil(seasonEnd)
    : getDaysUntil(seasonStart);

  const urgencyLevel = inSeason
    ? daysLeft <= 30 ? "critical" : daysLeft <= 90 ? "warning" : "active"
    : "offseason";

  const bgClasses: Record<string, string> = {
    critical: "bg-red-600/90 dark:bg-red-700/90",
    warning: "bg-amber-500/90 dark:bg-amber-600/90",
    active: "bg-primary/90 dark:bg-primary/90",
    offseason: "bg-slate-700/90 dark:bg-slate-800/90",
  };

  const messages: Record<string, string> = {
    critical: `${daysLeft} days left in Hurricane Season. Protect your home now.`,
    warning: `${daysLeft} days remaining in Hurricane Season. Book storm-prep services.`,
    active: `Hurricane Season is active. ${daysLeft} days to prepare your property.`,
    offseason: `Hurricane Season starts in ${daysLeft} days. Get ahead of the rush.`,
  };

  return (
    <div
      className={`${bgClasses[urgencyLevel]} text-white py-2.5 px-4 text-center relative z-40`}
      data-testid="banner-storm-countdown"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3">
        {urgencyLevel === "critical" ? (
          <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
        ) : (
          <Clock className="w-4 h-4 shrink-0" />
        )}
        <span className="text-sm font-bold" data-testid="text-storm-message">
          {messages[urgencyLevel]}
        </span>
        <Badge
          variant="outline"
          className="border-white/30 text-white text-[10px] font-bold"
          data-testid="badge-storm-status"
        >
          {inSeason ? "ACTIVE" : "PRE-SEASON"}
        </Badge>
      </div>
    </div>
  );
}
