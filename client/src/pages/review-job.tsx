import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QUICK_TAGS = [
  "On time",
  "Professional", 
  "Great communication",
  "Clean work",
  "Above and beyond",
  "Thorough",
  "Respectful",
  "Efficient"
];

export default function ReviewJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Get job details for context
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch/track/${jobId}`);
      if (!res.ok) throw new Error("Job not found");
      return res.json();
    },
    enabled: !!jobId
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async (reviewData: {
      jobId: string;
      rating: number;
      reviewText?: string;
      customerName?: string;
    }) => {
      return apiRequest("POST", "/api/dispatch/reviews", reviewData);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Success",
        description: "Thank you for your review!",
      });
    },
    onError: (error) => {
      console.error("Review submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    const fullReviewText = [
      reviewText.trim(),
      selectedTags.length > 0 ? `Tags: ${selectedTags.join(", ")}` : ""
    ].filter(Boolean).join(" | ");

    submitReview.mutate({
      jobId: jobId!,
      rating,
      reviewText: fullReviewText || undefined,
      customerName: customerName.trim() || undefined
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1 justify-center mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="transition-colors duration-200"
          >
            <Star
              size={40}
              className={`${
                star <= (hoveredStar || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">Job not found</p>
            <Button variant="outline" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">Your review has been submitted successfully.</p>
            <Button onClick={() => setLocation("/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Rate Your Service</CardTitle>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Service:</p>
              <p className="font-semibold">{job.job.service_type}</p>
              
              {job.job.pro_first_name && (
                <>
                  <p className="text-sm text-gray-600 mt-2">Technician:</p>
                  <p className="font-semibold">
                    {job.job.pro_first_name} {job.job.pro_last_name}
                  </p>
                </>
              )}
              
              <p className="text-sm text-gray-600 mt-2">Address:</p>
              <p className="font-semibold">{job.job.customer_address}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">How was your experience?</h3>
              {renderStars()}
              {rating > 0 && (
                <p className="text-sm text-gray-600">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"} 
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            {/* Quick Tags */}
            {rating > 0 && (
              <div>
                <h4 className="font-semibold mb-3">What stood out? (optional)</h4>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-orange-100"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (optional)
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Written Review */}
            <div>
              <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (optional)
              </label>
              <Textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us more about your experience..."
                rows={4}
                className="w-full"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitReview.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600"
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

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
              Your review helps other customers and supports our technicians
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}