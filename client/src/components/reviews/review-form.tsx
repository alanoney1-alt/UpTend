import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Send, CheckCircle2 } from "lucide-react";

const QUICK_TAGS = [
  "On time",
  "Professional",
  "Great communication",
  "Clean work",
  "Above and beyond",
];

interface ReviewFormProps {
  serviceRequestId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ serviceRequestId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Check if already reviewed
  const { data: existingReview, isLoading } = useQuery({
    queryKey: ["/api/service-requests", serviceRequestId, "review"],
    queryFn: async () => {
      const res = await fetch(`/api/service-requests/${serviceRequestId}/review`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch review");
      return res.json();
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/service-requests/${serviceRequestId}/review`, {
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests", serviceRequestId, "review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-jobs"] });
      onSuccess?.();
    },
    onError: (err: Error) => { console.error(err); },
  });

  if (isLoading) return null;

  if (existingReview) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Review submitted</span>
            <div className="flex ml-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= existingReview.rating ? "fill-[#F47C20] text-[#F47C20]" : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>
          {existingReview.comment && (
            <p className="text-sm text-green-600 mt-1">"{existingReview.comment}"</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <Card className="border-[#F47C20]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-[#F47C20]" />
          How was your experience?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-0.5 transition-transform hover:scale-110"
              data-testid={`star-${s}`}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  s <= (hoveredStar || rating)
                    ? "fill-[#F47C20] text-[#F47C20]"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground self-center">
              {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </span>
          )}
        </div>

        {/* Quick Tags */}
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-[#F47C20] hover:bg-[#E06A10]"
                  : "hover:border-[#F47C20] hover:text-[#F47C20]"
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Comment */}
        <Textarea
          placeholder="Tell us about your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="resize-none"
        />

        {/* Submit */}
        <Button
          onClick={() => submitReview.mutate()}
          disabled={rating === 0 || submitReview.isPending}
          className="w-full bg-[#F47C20] hover:bg-[#E06A10]"
          data-testid="submit-review"
        >
          {submitReview.isPending ? (
            "Submitting..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Review
            </>
          )}
        </Button>

        {submitReview.isError && (
          <p className="text-sm text-red-500">Failed to submit review. Please try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
