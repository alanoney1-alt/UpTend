import { cn } from "@/lib/utils";

export function Logo({ className = "w-8 h-8", textClassName = "text-2xl", variant = "light" }: { className?: string, textClassName?: string, variant?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className={cn("relative shrink-0 overflow-hidden", className)}>
        <img src="/logo-icon.png" alt="UpTend" className="w-full h-full object-contain rounded-lg brightness-125 contrast-110" style={{ filter: "brightness(1.3) contrast(1.1) saturate(1.2)" }} />
      </div>
      <div className={cn("font-bold tracking-tight", textClassName)}>
        <span className="text-[#F47C20]" style={{ textShadow: variant === "light" ? "0 0 12px rgba(244,124,32,0.4)" : "none" }}>Up</span>
        <span className={variant === "light" ? "text-white font-extrabold" : "text-white font-extrabold"}>Tend</span>
      </div>
    </div>
  );
}
