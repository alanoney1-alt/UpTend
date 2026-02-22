/**
 * George AI — Capability Showcase Card
 * Displays George's superpowers in a visual grid during intro.
 */

import { Camera, Wrench, CalendarCheck, Shield, ShoppingCart, Video } from "lucide-react";

interface CapabilityCardProps {
  onSelect: (message: string) => void;
}

const CAPABILITIES = [
  {
    icon: Camera,
    label: "Photo Diagnosis",
    desc: "Snap a pic, get instant answers",
    message: "I want to send a photo of a problem",
    color: "text-orange-400",
  },
  {
    icon: Wrench,
    label: "DIY Coaching",
    desc: "60+ guides with video walkthroughs",
    message: "Walk me through a DIY repair",
    color: "text-yellow-400",
  },
  {
    icon: CalendarCheck,
    label: "Book a Pro",
    desc: "12 services, upfront pricing",
    message: "I need to book a service",
    color: "text-blue-400",
  },
  {
    icon: Shield,
    label: "Home Health",
    desc: "Track your home's condition score",
    message: "Tell me about the Home Health Score",
    color: "text-teal-400",
  },
  {
    icon: ShoppingCart,
    label: "Smart Shopping",
    desc: "Products from Amazon, HD, Lowe's",
    message: "Help me find the right products",
    color: "text-purple-400",
  },
  {
    icon: Video,
    label: "Video Tutorials",
    desc: "Curated from 30+ trusted channels",
    message: "Show me a how-to video",
    color: "text-red-400",
  },
];

export function CapabilityCard({ onSelect }: CapabilityCardProps) {
  return (
    <div className="geo-capability-grid">
      {CAPABILITIES.map((cap, i) => (
        <button
          key={cap.label}
          onClick={() => onSelect(cap.message)}
          className="geo-capability-tile"
          style={{ animationDelay: `${0.05 + i * 0.06}s` }}
        >
          <cap.icon className={`w-5 h-5 ${cap.color} flex-shrink-0`} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-stone-200 leading-tight">{cap.label}</div>
            <div className="text-[11px] text-stone-500 leading-tight">{cap.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
