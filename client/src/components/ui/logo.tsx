import { cn } from "@/lib/utils";

export function Logo({ className = "w-8 h-8", textClassName = "text-2xl" }: { className?: string, textClassName?: string }) {
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className={cn("relative shrink-0", className)}>
        <div className="absolute inset-0 bg-primary rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md relative">
          <rect width="100" height="100" rx="20" fill="#3B1D5A" />
          <path
            d="M30 65 V40 A20 20 0 0 1 70 40 V65"
            stroke="url(#uptend_arrow_u)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M50 25 L65 40 M50 25 L35 40"
            stroke="#F47C20"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="uptend_arrow_u" x1="30" y1="65" x2="70" y2="35" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F47C20" />
              <stop offset="1" stopColor="#F47C20" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className={cn("font-bold tracking-tight", textClassName)}>
        <span className="text-[#3B1D5A]">Up</span>
        <span className="text-primary">Tend</span>
      </div>
    </div>
  );
}
