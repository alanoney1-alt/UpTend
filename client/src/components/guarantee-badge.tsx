import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";

interface GuaranteeBadgeProps {
  compact?: boolean;
  className?: string;
}

export function GuaranteeBadge({ compact = false, className = "" }: GuaranteeBadgeProps) {
  if (compact) {
    return (
      <Link href="/service-guarantee">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer ${className}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>$500 Satisfaction Guarantee</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/service-guarantee">
      <div className={`flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl hover:shadow-md transition-all cursor-pointer ${className}`}>
        <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h4 className="font-semibold text-emerald-800 text-sm">$500 Satisfaction Guarantee</h4>
          <p className="text-emerald-600 text-xs mt-0.5">
            Not happy with the service? We'll make it right or refund up to $500. No questions asked.
          </p>
        </div>
      </div>
    </Link>
  );
}
