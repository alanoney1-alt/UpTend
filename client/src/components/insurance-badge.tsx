import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InsuranceBadgeProps {
  serviceType: string;
  className?: string;
}

export function InsuranceBadge({ serviceType, className = "" }: InsuranceBadgeProps) {
  const { data } = useQuery({
    queryKey: ["/api/insurance/check-coverage", serviceType],
    queryFn: async () => {
      const res = await fetch(`/api/insurance/check-coverage?serviceType=${serviceType}`, {
        credentials: "include",
      });
      if (!res.ok) return { covered: false };
      return res.json();
    },
    staleTime: 60000,
  });

  if (!data?.covered) return null;

  return (
    <Badge className={`bg-green-600/20 text-green-400 border-green-600/30 gap-1 ${className}`}>
      <ShieldCheck className="w-3.5 h-3.5" />
      Covered{data.bestDiscount > 0 ? ` • ${data.bestDiscount}% off` : " ✓"}
    </Badge>
  );
}
