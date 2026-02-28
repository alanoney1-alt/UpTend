/**
 * George Intervention — when something breaks or goes off-track,
 * George steps in with personality instead of a cold error message.
 * 
 * Use this anywhere on the site where errors, edge cases, or user
 * confusion might happen. George catches it, makes it human, and
 * redirects them.
 * 
 * Usage:
 *   <GeorgeIntervention
 *     show={hasError}
 *     message="That's a nice soda can, but I'm gonna need a photo of something around your house."
 *     suggestion="Try snapping a picture of the items you need hauled."
 *     onDismiss={() => setHasError(false)}
 *     onTalkToGeorge={() => window.dispatchEvent(new CustomEvent("george:open", { detail: { message: "I need help with my photo quote" } }))}
 *   />
 */

import { useState, useEffect } from "react";
import { X, MessageCircle, Camera, RotateCcw } from "lucide-react";

interface GeorgeInterventionProps {
  show: boolean;
  message: string;
  suggestion?: string;
  onDismiss: () => void;
  onRetry?: () => void;
  onTalkToGeorge?: () => void;
  retryLabel?: string;
}

export function GeorgeIntervention({
  show,
  message,
  suggestion,
  onDismiss,
  onRetry,
  onTalkToGeorge,
  retryLabel = "Try again",
}: GeorgeInterventionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay for mount animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#F47C20]/20 my-4"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 0 30px rgba(244, 124, 32, 0.05)" }} />
      
      <div className="relative p-4">
        {/* Header: George's face + dismiss */}
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-[#F47C20]/30">
              <img src="/george-avatar.png" alt="George" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm leading-relaxed">{message}</p>
            {suggestion && (
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">{suggestion}</p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Action buttons */}
        {(onRetry || onTalkToGeorge) && (
          <div className="flex gap-2 mt-3 ml-[52px]">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  bg-[#F47C20]/10 border-[#F47C20]/30 text-[#F47C20]
                  hover:bg-[#F47C20]/20 hover:border-[#F47C20]/50"
              >
                <RotateCcw className="w-3 h-3" />
                {retryLabel}
              </button>
            )}
            {onTalkToGeorge && (
              <button
                onClick={onTalkToGeorge}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  bg-white/[0.04] border-white/10 text-slate-300
                  hover:bg-white/[0.08] hover:border-white/20 hover:text-white"
              >
                <MessageCircle className="w-3 h-3" />
                Talk to George
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate a George-style intervention message based on error context.
 * Call this when an error happens to get a message with personality.
 */
export function getGeorgeIntervention(context: string, errorType?: string): { message: string; suggestion: string } {
  const interventions: Record<string, { message: string; suggestion: string }[]> = {
    photo_not_home: [
      { message: "That's a great photo, but I don't see anything that needs fixing. I need a shot of the stuff you want hauled, cleaned, or worked on.", suggestion: "Try pointing your camera at the items, the room, or the area that needs attention." },
      { message: "Nice picture, but I can't quote that. Snap a photo of what you actually need done around the house.", suggestion: "The closer and clearer the shot, the better my estimate." },
      { message: "I appreciate the creativity, but I need to see the actual job. Show me what you're working with.", suggestion: "Photos of the items, the mess, the yard -- whatever needs handling." },
    ],
    photo_analysis_failed: [
      { message: "Couldn't quite make that one out. Sometimes lighting or angle throws me off.", suggestion: "Try a clearer shot with good lighting. Straight-on works best." },
      { message: "That photo gave me trouble. Let's try again -- make sure the area is well-lit and the camera is steady.", suggestion: "If photos aren't working, just describe what you need and I'll price it." },
    ],
    upload_failed: [
      { message: "That file didn't come through right. Could be too large or a format I can't read.", suggestion: "Try a JPG or PNG under 10MB. Screenshots work too." },
    ],
    generic_error: [
      { message: "Something went sideways on my end. Not your fault.", suggestion: "Give it another shot, or just tell me what you need and I'll handle it from here." },
      { message: "Hit a bump. Let me try that again.", suggestion: "If this keeps happening, tap 'Talk to George' and I'll walk you through it personally." },
    ],
    booking_error: [
      { message: "Booking hit a snag. Your info is saved -- nothing's lost.", suggestion: "Try again in a sec. If it keeps happening, I can book it for you directly." },
    ],
    payment_error: [
      { message: "Payment didn't go through. Double-check the card details and try once more.", suggestion: "If your card is fine, it might be a temporary hold. Give it a minute." },
    ],
    no_pros_available: [
      { message: "No pros available for that time slot right now. Orlando's busy.", suggestion: "Try a different day or time. I can also put you on a waitlist and ping you when someone opens up." },
    ],
  };

  const options = interventions[context] || interventions.generic_error;
  const pick = options[Math.floor(Math.random() * options.length)];
  return pick;
}
