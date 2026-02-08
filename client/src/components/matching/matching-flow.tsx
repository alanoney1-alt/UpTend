import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PyckerSwiper } from "./pycker-swiper";
import { QuickMatch } from "./quick-match";
import { ShortlistReview } from "./shortlist-review";
import { PyckerMap } from "@/components/pycker-map";
import { 
  Zap, 
  Search,
  X,
  MapPin,
  Calendar,
  DollarSign,
  Map
} from "lucide-react";

interface Pycker {
  id: string;
  profileId?: string;
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
  languages?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  eta?: number;
}

interface JobDetails {
  serviceType?: string;
  address?: string;
  scheduledDate?: string;
  estimatedPrice?: number;
}

interface MatchingFlowProps {
  availablePyckers: Pycker[];
  jobDetails: JobDetails;
  onPyckerSelected: (pycker: Pycker) => void;
  onCancel?: () => void;
  customerLocation?: { lat: number; lng: number } | null;
}

type MatchingStep = "choice" | "quickmatch" | "browse" | "shortlist" | "mapview";

export function MatchingFlow({ 
  availablePyckers, 
  jobDetails, 
  onPyckerSelected, 
  onCancel,
  customerLocation
}: MatchingFlowProps) {
  const [currentStep, setCurrentStep] = useState<MatchingStep>("choice");
  const [shortlist, setShortlist] = useState<Pycker[]>([]);

  const mapPyckers = useMemo(() => {
    return availablePyckers
      .filter(p => p.location)
      .map(p => ({
        id: p.profileId || p.id,
        firstName: p.name.split(" ")[0],
        lastName: p.name.split(" ")[1] || "",
        vehicleType: p.vehicleType || "pickup_truck",
        rating: p.rating,
        jobsCompleted: p.completedJobs,
        distance: p.distance,
        eta: p.eta || Math.round(p.distance * 2),
        location: p.location!,
        profilePhotoUrl: p.photo,
        isVerifiedPro: p.verified,
        userId: p.id,
      }));
  }, [availablePyckers]);

  const handleMapPyckerSelect = (mapPycker: any) => {
    const pycker = availablePyckers.find(p => (p.profileId || p.id) === mapPycker.id || p.id === mapPycker.userId);
    if (pycker) {
      onPyckerSelected(pycker);
    }
  };

  const getRecommendedPyckers = useMemo(() => {
    return [...availablePyckers]
      .sort((a, b) => {
        // Prioritize available pyckers
        if (a.available !== b.available) return a.available ? -1 : 1;
        // Then verified
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        // Then by rating
        if (b.rating !== a.rating) return b.rating - a.rating;
        // Then by distance
        return a.distance - b.distance;
      })
      .slice(0, 3);
  }, [availablePyckers]);

  const handleSwipeComplete = (swiped: Pycker[]) => {
    setShortlist(swiped);
    setCurrentStep("shortlist");
  };

  const handleSelectPycker = (pycker: Pycker) => {
    onPyckerSelected(pycker);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Find Your Pro</CardTitle>
            {onCancel && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onCancel}
                data-testid="button-cancel-matching"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          {jobDetails && (
            <div className="flex flex-wrap gap-2 mt-2">
              {jobDetails.serviceType && (
                <Badge variant="secondary" className="text-xs">
                  {jobDetails.serviceType}
                </Badge>
              )}
              {jobDetails.address && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {jobDetails.address.split(",")[0]}
                </Badge>
              )}
              {jobDetails.scheduledDate && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {jobDetails.scheduledDate}
                </Badge>
              )}
              {jobDetails.estimatedPrice && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="w-3 h-3 mr-0" />
                  {jobDetails.estimatedPrice}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-4">
          {availablePyckers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Pros Available</h3>
              <p className="text-muted-foreground text-sm mb-6">
                We couldn't find any available Pros in your area right now. Please try again later.
              </p>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} data-testid="button-go-back-no-pyckers">
                  Go Back
                </Button>
              )}
            </div>
          ) : currentStep === "choice" && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <h2 className="text-xl font-semibold mb-2">How would you like to find a Pro?</h2>
                <p className="text-muted-foreground text-sm">
                  {availablePyckers.length} Pro{availablePyckers.length !== 1 ? "s" : ""} available for your job
                </p>
              </div>

              <div className="grid gap-4">
                <Card 
                  className="cursor-pointer transition-all border-2 border-primary/50 bg-primary/5"
                  onClick={() => setCurrentStep("quickmatch")}
                  data-testid="card-choose-quickmatch"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Quick Match</h3>
                        <p className="text-sm text-muted-foreground">
                          AI picks top 3 Pros for you
                        </p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer transition-all border-2 border-secondary/30"
                  onClick={() => setCurrentStep("browse")}
                  data-testid="card-choose-browse"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Search className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Browse All</h3>
                        <p className="text-sm text-muted-foreground">
                          Swipe through all available Pros
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {customerLocation && mapPyckers.length > 0 && (
                  <Card 
                    className="cursor-pointer transition-all border-2 border-green-500/30"
                    onClick={() => setCurrentStep("mapview")}
                    data-testid="card-choose-mapview"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Map className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Map View</h3>
                          <p className="text-sm text-muted-foreground">
                            See Pros on a live map
                          </p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-500">
                          Live GPS
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {currentStep === "quickmatch" && (
            <QuickMatch
              recommendedPyckers={getRecommendedPyckers}
              onSelectPycker={handleSelectPycker}
              onBrowseAll={() => setCurrentStep("browse")}
              onBack={() => setCurrentStep("choice")}
            />
          )}

          {currentStep === "browse" && (
            <PyckerSwiper
              availablePyckers={availablePyckers}
              onComplete={handleSwipeComplete}
              onSkip={() => setCurrentStep("quickmatch")}
            />
          )}

          {currentStep === "shortlist" && (
            <ShortlistReview
              shortlist={shortlist}
              onSelectPycker={handleSelectPycker}
              onBack={() => setCurrentStep("browse")}
            />
          )}

          {currentStep === "mapview" && customerLocation && (
            <div className="space-y-4" data-testid="matching-mapview">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentStep("choice")}
                  data-testid="button-back-from-map"
                >
                  Back to options
                </Button>
                <Badge variant="secondary">
                  {mapPyckers.length} Pro{mapPyckers.length !== 1 ? "s" : ""} visible
                </Badge>
              </div>
              
              <PyckerMap
                customerLocation={customerLocation}
                pyckers={mapPyckers}
                onPyckerSelect={handleMapPyckerSelect}
                height="400px"
                radiusMiles={25}
              />
              
              <p className="text-sm text-muted-foreground text-center">
                Tap a Pro on the map to select them
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { PyckerSwiper, QuickMatch, ShortlistReview };
