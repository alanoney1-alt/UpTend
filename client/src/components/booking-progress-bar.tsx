import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Browse", path: "/services" },
  { label: "Select Service", path: "/services/" },
  { label: "Get Quote", path: "/book" },
  { label: "Book Pro", path: "/booking-success" },
  { label: "Track Job", path: "/jobs" },
] as const;

function getCurrentStep(path: string): number {
  if (path.startsWith("/jobs") || path.startsWith("/track/") || path === "/my-jobs") return 4;
  if (path === "/booking-success") return 3;
  if (path === "/book" || path === "/smart-book") return 2;
  if (path.startsWith("/services/")) return 1;
  if (path === "/services" || path === "/") return 0;
  return -1;
}

const ENGAGED_KEY = "uptend-engaged";
const PROGRESS_KEY = "uptend-max-step";

export function BookingProgressBar() {
  const [location, navigate] = useLocation();
  const [engaged, setEngaged] = useState(() => sessionStorage.getItem(ENGAGED_KEY) === "1");
  const [maxStep, setMaxStep] = useState(() => parseInt(sessionStorage.getItem(PROGRESS_KEY) || "-1"));

  const current = getCurrentStep(location);

  useEffect(() => {
    // Mark engaged when visiting services or book
    if (!engaged && (location.startsWith("/services") || location === "/book" || location === "/smart-book")) {
      sessionStorage.setItem(ENGAGED_KEY, "1");
      setEngaged(true);
    }
    // Track max step
    if (current > maxStep) {
      sessionStorage.setItem(PROGRESS_KEY, String(current));
      setMaxStep(current);
    }
  }, [location, current, engaged, maxStep]);

  if (!engaged || current < 0) return null;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-2 px-4 z-40">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const completed = i < current;
          const active = i === current;
          const clickable = i <= maxStep && i !== current;

          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <button
                disabled={!clickable}
                onClick={() => {
                  if (!clickable) return;
                  if (i === 0) navigate("/services");
                  else if (i === 2) navigate("/book");
                  else if (i === 4) navigate("/my-jobs");
                }}
                className={cn(
                  "flex items-center gap-1 text-xs font-medium whitespace-nowrap transition-colors",
                  active && "text-orange-600 dark:text-orange-400",
                  completed && "text-green-600 dark:text-green-400",
                  !active && !completed && "text-gray-400 dark:text-gray-600",
                  clickable && "hover:text-orange-500 cursor-pointer",
                  !clickable && "cursor-default"
                )}
              >
                {completed ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px] border",
                      active
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-current"
                    )}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2",
                    i < current ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
