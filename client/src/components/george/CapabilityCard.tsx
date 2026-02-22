/**
 * George AI — Capability Showcase Card
 * Displays George's superpowers in a visual grid during intro.
 * Tiles expand to show a brief explanation, then user can "Try it".
 */

import { useState } from "react";
import { Camera, Wrench, CalendarCheck, Shield, ShoppingCart, Video, X, ArrowRight } from "lucide-react";

interface CapabilityCardProps {
  onSelect: (message: string) => void;
}

const CAPABILITIES = [
  {
    icon: Camera,
    label: "Photo Diagnosis",
    desc: "Snap a pic, get instant answers",
    detail: "Take a photo of any home issue — leaky pipe, mystery stain, damaged siding — and George uses AI vision to diagnose the problem, estimate costs, and recommend next steps. Works for all 12 services.",
    message: "I want to send a photo of a problem",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
  },
  {
    icon: Wrench,
    label: "DIY Coaching",
    desc: "60+ guides with video walkthroughs",
    detail: "Describe your problem and George walks you through the fix step-by-step with curated video tutorials. If it's beyond DIY, he'll suggest booking a vetted Pro instead.",
    message: "Walk me through a DIY repair",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
  },
  {
    icon: CalendarCheck,
    label: "Book a Pro",
    desc: "12 services, upfront pricing",
    detail: "Junk removal, pressure washing, handyman, cleaning, landscaping, and more. George gives you upfront pricing — no hidden fees — and books a background-checked Pro right here in the conversation.",
    message: "I need to book a service",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
  },
  {
    icon: Shield,
    label: "Home Health",
    desc: "Track your home's condition score",
    detail: "George monitors your home's maintenance needs — roof age, AC filters, pest control, hurricane prep — and gives you a Home Health Score with seasonal reminders so nothing falls through the cracks.",
    message: "Tell me about the Home Health Score",
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
    borderColor: "border-teal-400/30",
  },
  {
    icon: ShoppingCart,
    label: "Smart Shopping",
    desc: "Products from Amazon, HD, Lowe's",
    detail: "Need a specific part, tool, or product? George finds the best options from Amazon, Home Depot, and Lowe's — with direct links so you can order in seconds.",
    message: "Help me find the right products",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/30",
  },
  {
    icon: Video,
    label: "Video Tutorials",
    desc: "Curated from 30+ trusted channels",
    detail: "George pulls relevant how-to videos from trusted YouTube channels — no searching, no ads to skip through. Just the right video for your specific issue, embedded right in the conversation.",
    message: "Show me a how-to video",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30",
  },
];

export function CapabilityCard({ onSelect }: CapabilityCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="geo-capability-grid">
      {CAPABILITIES.map((cap, i) => {
        const isOpen = expanded === cap.label;
        return (
          <div key={cap.label} className="relative" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
            <button
              onClick={() => setExpanded(isOpen ? null : cap.label)}
              className={`geo-capability-tile w-full ${isOpen ? `ring-1 ${cap.borderColor}` : ""}`}
            >
              <cap.icon className={`w-5 h-5 ${cap.color} flex-shrink-0`} />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-stone-200 leading-tight">{cap.label}</div>
                <div className="text-[11px] text-stone-500 leading-tight">{cap.desc}</div>
              </div>
            </button>

            {/* Flyout explanation */}
            {isOpen && (
              <div className={`mt-1 rounded-lg ${cap.bgColor} border ${cap.borderColor} p-3 animate-in fade-in slide-in-from-top-1 duration-200`}>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="text-xs text-stone-300 leading-relaxed">{cap.detail}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(null); }}
                    className="text-stone-500 hover:text-stone-300 flex-shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => { setExpanded(null); onSelect(cap.message); }}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${cap.color} hover:opacity-80 transition-opacity`}
                >
                  Try it <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
