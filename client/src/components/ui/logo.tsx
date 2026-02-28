import { cn } from "@/lib/utils";

export function Logo({ className = "w-8 h-8", textClassName = "text-2xl", variant = "dark" }: { className?: string, textClassName?: string, variant?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className={cn("relative shrink-0 overflow-hidden", className)}>
        <img src="/logo-icon.png" alt="UpTend" className="w-full h-full object-contain rounded-lg" />
      </div>
      <div className={cn("font-bold tracking-tight", textClassName)}>
        <span className={variant === "light" ? "text-white" : "text-[#F47C20]"}>Up</span>
        <span className={variant === "light" ? "text-white" : "text-slate-900"}>Tend</span>
      </div>
    </div>
  );
}
