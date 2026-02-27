import { cn } from "@/lib/utils";

export function Logo({ className = "w-8 h-8", textClassName = "text-2xl", variant = "dark" }: { className?: string, textClassName?: string, variant?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className={cn("relative shrink-0 overflow-hidden", className)}>
        <div className="absolute inset-0 bg-primary rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
        <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md relative">
          <rect width="512" height="512" rx="64" fill="#0f172a" />
          <g transform="translate(256,256)" fill="none" stroke="#F47C20" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
            {/* House outline */}
            <path d="M0-155 L155,30 L155,175 L-155,175 L-155,30 Z" />
            {/* Circuit traces */}
            <line x1="-80" y1="175" x2="-80" y2="60" />
            <circle cx="-80" cy="50" r="8" fill="#F47C20" />
            <line x1="-40" y1="175" x2="-40" y2="20" />
            <circle cx="-40" cy="10" r="8" fill="#F47C20" />
            <line x1="0" y1="175" x2="0" y2="-20" />
            <circle cx="0" cy="-30" r="8" fill="#F47C20" />
            <line x1="40" y1="175" x2="40" y2="30" />
            <circle cx="40" cy="20" r="8" fill="#F47C20" />
            <line x1="80" y1="175" x2="80" y2="70" />
            <circle cx="80" cy="60" r="8" fill="#F47C20" />
            {/* Branch connections */}
            <line x1="-80" y1="90" x2="-40" y2="60" />
            <line x1="-40" y1="50" x2="0" y2="20" />
            <line x1="0" y1="10" x2="40" y2="60" />
            <line x1="40" y1="70" x2="80" y2="100" />
          </g>
        </svg>
      </div>
      <div className={cn("font-bold tracking-tight", textClassName)}>
        <span className={variant === "light" ? "text-white" : "text-[#F47C20]"}>Up</span>
        <span className={variant === "light" ? "text-white" : "text-slate-900"}>Tend</span>
      </div>
    </div>
  );
}
