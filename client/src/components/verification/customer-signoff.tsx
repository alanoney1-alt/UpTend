import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Star, Clock, Camera, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CustomerSignoffProps {
  jobId: string;
  serviceType: string;
  finalAmount: number;
  beforePhotos?: string[];
  afterPhotos?: string[];
  completedAt?: string;
  onSignoffComplete?: () => void;
}

export function CustomerSignoff({
  jobId,
  serviceType,
  finalAmount,
  beforePhotos = [],
  afterPhotos = [],
  completedAt,
  onSignoffComplete,
}: CustomerSignoffProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const handleSignoff = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/service-requests/${jobId}/customer-signoff`, {
        rating: rating > 0 ? rating : undefined,
        feedback: feedback.trim() || undefined,
      });

      setIsComplete(true);
      toast({
        title: "Job Confirmed Complete!",
        description: "Thank you for confirming. Your receipt will be emailed shortly.",
      });
      onSignoffComplete?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to confirm job completion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
            Job Complete!
          </h3>
          <p className="text-sm text-green-600 dark:text-green-500">
            Thank you for confirming. Your digital receipt and ESG impact certificate are on the way.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const serviceLabels: Record<string, string> = {
    junk_removal: "Junk Removal",
    furniture_moving: "Furniture Moving",
    garage_cleanout: "Garage Cleanout",
    estate_cleanout: "Estate Cleanout",
    truck_unloading: "Truck Unloading",
    home_cleaning: "Home Cleaning",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    light_demolition: "Light Demolition",
    home_consultation: "Home Health Audit",
    moving_labor: "Moving Labor",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Confirm Job Complete
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your Pro has marked this job as complete. Please review and confirm.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Summary */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Service</span>
            <Badge variant="secondary">{serviceLabels[serviceType] || serviceType}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Final Amount
            </span>
            <span className="text-lg font-bold">{formatCurrency(finalAmount)}</span>
          </div>
          {completedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Completed
              </span>
              <span className="text-sm">{new Date(completedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Before/After Photos */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-1">
              <Camera className="w-4 h-4" /> Before & After Photos
            </p>
            <div className="grid grid-cols-2 gap-4">
              {beforePhotos.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Before</p>
                  <div className="grid grid-cols-2 gap-1">
                    {beforePhotos.slice(0, 4).map((url, i) => (
                      <img
                        key={`before-${i}`}
                        src={url}
                        alt={`Before ${i + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
              {afterPhotos.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">After</p>
                  <div className="grid grid-cols-2 gap-1">
                    {afterPhotos.slice(0, 4).map((url, i) => (
                      <img
                        key={`after-${i}`}
                        src={url}
                        alt={`After ${i + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Star Rating */}
        <div className="space-y-2">
          <p className="text-sm font-medium">How was your experience? (optional)</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Optional Feedback */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Any feedback? (optional)</p>
          <Textarea
            placeholder="Tell us about your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleSignoff}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Confirming..." : " Confirm Job Complete"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          If you don't confirm within 24 hours, the job will be automatically confirmed.
        </p>
      </CardContent>
    </Card>
  );
}
