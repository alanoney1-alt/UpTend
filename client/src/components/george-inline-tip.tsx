import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeorgeInlineTipProps {
  message: string;
  cta?: { text: string; action: () => void };
  pageKey: string;
}

export function GeorgeInlineTip({ message, cta, pageKey }: GeorgeInlineTipProps) {
  const storageKey = `george-tip-dismissed-${pageKey}`;
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(storageKey) === "1";
  });

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, [dismissed]);

  if (dismissed) return null;

  function dismiss() {
    setVisible(false);
    localStorage.setItem(storageKey, "1");
    setTimeout(() => setDismissed(true), 300);
  }

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out overflow-hidden",
        visible
          ? "opacity-100 translate-y-0 max-h-24"
          : "opacity-0 translate-y-4 max-h-0"
      )}
    >
      <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 px-4 py-3 my-4">
        {/* George icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
          G
        </div>
        <p className="text-sm text-orange-900 dark:text-orange-100 flex-1">
          {message}
        </p>
        {cta && (
          <button
            onClick={cta.action}
            className="flex-shrink-0 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 underline underline-offset-2"
          >
            {cta.text}
          </button>
        )}
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-orange-400 hover:text-orange-600 dark:hover:text-orange-200"
          aria-label="Dismiss tip"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** Helper to open George chat */
export function openGeorge() {
  window.dispatchEvent(new CustomEvent("george:open"));
}
