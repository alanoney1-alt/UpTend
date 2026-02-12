import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";

interface ProReviewsDisplayProps {
  proId: string;
  compact?: boolean;
}

export function ProReviewsDisplay({ proId, compact = false }: ProReviewsDisplayProps) {
  const { data } = useQuery({
    queryKey: ["/api/pros", proId, "reviews"],
    queryFn: () => fetch(`/api/pros/${proId}/reviews`).then((r) => r.json()),
    enabled: !!proId,
  });

  if (!data || data.totalReviews === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <Star className="w-4 h-4 fill-[#F47C20] text-[#F47C20]" />
        <span className="font-semibold">{data.averageRating}</span>
        <span className="text-muted-foreground">({data.totalReviews})</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-5 h-5 ${s <= Math.round(data.averageRating) ? "fill-[#F47C20] text-[#F47C20]" : "text-gray-300"}`}
            />
          ))}
        </div>
        <span className="font-semibold">{data.averageRating}</span>
        <span className="text-muted-foreground text-sm">({data.totalReviews} reviews)</span>
      </div>
      {data.reviews.slice(0, 3).map((r: any) => (
        <div key={r.id} className="border-l-2 border-[#F47C20]/30 pl-3 py-1">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-[#F47C20] text-[#F47C20]" : "text-gray-300"}`} />
            ))}
            {r.customerName && <span className="text-xs text-muted-foreground ml-2">{r.customerName}</span>}
          </div>
          {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
