import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  MapPin, 
  Shield, 
  Zap,
  Heart,
  ChevronLeft,
  CheckCircle,
  Truck
} from "lucide-react";

interface Pycker {
  id: string;
  name: string;
  photo?: string;
  rating: number;
  completedJobs: number;
  specialty?: string;
  distance: number;
  hourlyRate?: number;
  available: boolean;
  verified: boolean;
  badges?: string[];
  bio?: string;
  vehicleType?: string;
}

interface ShortlistReviewProps {
  shortlist: Pycker[];
  onSelectPycker: (pycker: Pycker) => void;
  onBack: () => void;
}

export function ShortlistReview({ shortlist, onSelectPycker, onBack }: ShortlistReviewProps) {
  if (shortlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Pros Selected</h3>
        <p className="text-muted-foreground mb-6">
          Go back and swipe right on Pros you'd like to work with.
        </p>
        <Button variant="outline" onClick={onBack} data-testid="button-back-to-swiping">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Browsing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
          <Heart className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your Shortlist</h2>
        <p className="text-muted-foreground">
          You've liked {shortlist.length} Pro{shortlist.length > 1 ? "s" : ""}. 
          Select one to continue with your booking.
        </p>
      </div>

      <div className="space-y-3">
        {shortlist.map((pycker) => (
          <Card 
            key={pycker.id}
            className="overflow-hidden cursor-pointer transition-all border-primary/30"
            onClick={() => onSelectPycker(pycker)}
            data-testid={`card-shortlist-pycker-${pycker.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage src={pycker.photo} alt={pycker.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {pycker.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Heart className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{pycker.name}</h3>
                    {pycker.verified && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <Shield className="w-3 h-3 mr-0.5" />
                        Pro
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-0.5" />
                      {pycker.rating.toFixed(1)}
                    </div>
                    <span>{pycker.completedJobs} jobs</span>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-0.5" />
                      {pycker.distance} mi
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {pycker.available && (
                      <Badge className="bg-primary text-xs">
                        <Zap className="w-3 h-3 mr-0.5" />
                        Available Now
                      </Badge>
                    )}
                    {pycker.vehicleType && (
                      <Badge variant="outline" className="text-xs">
                        <Truck className="w-3 h-3 mr-0.5" />
                        {pycker.vehicleType}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {pycker.hourlyRate && (
                    <span className="text-lg font-bold text-primary">
                      ${pycker.hourlyRate}/hr
                    </span>
                  )}
                  <Button size="sm" className="bg-primary" data-testid={`button-select-${pycker.id}`}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Select
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        variant="ghost" 
        className="w-full"
        onClick={onBack}
        data-testid="button-back-from-shortlist"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Continue Browsing
      </Button>
    </div>
  );
}
