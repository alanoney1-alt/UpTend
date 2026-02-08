import { useState, useRef, useMemo } from "react";
import TinderCard from "react-tinder-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  MapPin, 
  Truck, 
  Shield, 
  X, 
  Heart, 
  RotateCcw,
  ChevronLeft,
  Zap
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
  languages?: string[];
}

interface PyckerSwiperProps {
  availablePyckers: Pycker[];
  onComplete: (shortlist: Pycker[]) => void;
  onSkip: () => void;
}

type Direction = "left" | "right" | "up" | "down";

export function PyckerSwiper({ availablePyckers, onComplete, onSkip }: PyckerSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(availablePyckers.length - 1);
  const [shortlist, setShortlist] = useState<Pycker[]>([]);
  const [lastDirection, setLastDirection] = useState<Direction | null>(null);
  const currentIndexRef = useRef(currentIndex);

  const childRefs = useMemo(
    () =>
      Array(availablePyckers.length)
        .fill(0)
        .map(() => useRef<any>(null)),
    [availablePyckers.length]
  );

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const canSwipe = currentIndex >= 0;
  const canGoBack = currentIndex < availablePyckers.length - 1;

  const swiped = (direction: Direction, pycker: Pycker, index: number) => {
    setLastDirection(direction);
    updateCurrentIndex(index - 1);
    
    if (direction === "right") {
      setShortlist((prev) => [...prev, pycker]);
    }
  };

  const outOfFrame = (name: string, idx: number) => {
    if (currentIndexRef.current >= idx && childRefs[idx].current) {
      childRefs[idx].current.restoreCard();
    }
  };

  const swipe = async (dir: Direction) => {
    if (canSwipe && childRefs[currentIndex]?.current) {
      await childRefs[currentIndex].current.swipe(dir);
    }
  };

  const goBack = async () => {
    if (!canGoBack) return;
    const newIndex = currentIndex + 1;
    updateCurrentIndex(newIndex);
    
    // Remove from shortlist if it was there
    const pyckerToRemove = availablePyckers[newIndex];
    setShortlist((prev) => prev.filter((p) => p.id !== pyckerToRemove.id));
    
    if (childRefs[newIndex]?.current) {
      await childRefs[newIndex].current.restoreCard();
    }
  };

  const handleComplete = () => {
    onComplete(shortlist);
  };

  if (currentIndex < 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">You've seen all Pros!</h3>
        <p className="text-muted-foreground mb-6">
          {shortlist.length > 0
            ? `You've liked ${shortlist.length} Pro${shortlist.length > 1 ? "s" : ""}. Review your shortlist to pick one.`
            : "You didn't select any Pros. Try Quick Match for AI recommendations."}
        </p>
        <div className="flex gap-3">
          {shortlist.length > 0 ? (
            <Button onClick={handleComplete} data-testid="button-review-shortlist">
              Review Shortlist ({shortlist.length})
            </Button>
          ) : (
            <Button onClick={onSkip} data-testid="button-try-quickmatch">
              <Zap className="w-4 h-4 mr-2" />
              Try Quick Match
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-4 px-2">
        <Button variant="ghost" size="sm" onClick={onSkip} data-testid="button-skip-to-quickmatch">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Quick Match
        </Button>
        <Badge variant="secondary">
          {currentIndex + 1} of {availablePyckers.length}
        </Badge>
        {shortlist.length > 0 && (
          <Badge variant="default" className="bg-primary">
            <Heart className="w-3 h-3 mr-1" />
            {shortlist.length} liked
          </Badge>
        )}
      </div>

      <div className="relative w-full max-w-sm h-[450px] mb-6">
        {availablePyckers.map((pycker, index) => (
          <TinderCard
            ref={childRefs[index]}
            key={pycker.id}
            onSwipe={(dir) => swiped(dir as Direction, pycker, index)}
            onCardLeftScreen={() => outOfFrame(pycker.name, index)}
            preventSwipe={["up", "down"]}
            className="absolute w-full"
          >
            <Card 
              className="w-full h-[450px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
              data-testid={`card-pycker-${pycker.id}`}
            >
              <div className="relative h-48 bg-gradient-to-b from-secondary/30 to-background">
                <Avatar className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-24 h-24 border-4 border-background">
                  <AvatarImage src={pycker.photo} alt={pycker.name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {pycker.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                {pycker.verified && (
                  <Badge className="absolute top-3 right-3 bg-secondary">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Pro
                  </Badge>
                )}
                {pycker.available && (
                  <Badge className="absolute top-3 left-3 bg-primary">
                    <Zap className="w-3 h-3 mr-1" />
                    Available Now
                  </Badge>
                )}
              </div>

              <div className="pt-14 px-4 pb-4 text-center">
                <h3 className="text-xl font-bold mb-1">{pycker.name}</h3>
                
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {pycker.rating.toFixed(1)}
                  </div>
                  <span className="text-muted-foreground/50">|</span>
                  <span>{pycker.completedJobs} jobs</span>
                  <span className="text-muted-foreground/50">|</span>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {pycker.distance} mi
                  </div>
                </div>

                {pycker.vehicleType && (
                  <div className="flex items-center justify-center gap-1 text-sm mb-3">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>{pycker.vehicleType}</span>
                  </div>
                )}

                {pycker.badges && pycker.badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    {pycker.badges.slice(0, 3).map((badge, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}

                {pycker.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {pycker.bio}
                  </p>
                )}

                {pycker.hourlyRate && (
                  <div className="mt-3 text-lg font-semibold text-primary">
                    ${pycker.hourlyRate}/hr
                  </div>
                )}
              </div>
            </Card>
          </TinderCard>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="default"
          onClick={() => goBack()}
          disabled={!canGoBack}
          data-testid="button-undo-swipe"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Undo
        </Button>
        
        <Button
          variant="outline"
          size="default"
          className="border-destructive text-destructive"
          onClick={() => swipe("left")}
          disabled={!canSwipe}
          data-testid="button-swipe-left"
        >
          <X className="w-4 h-4 mr-1" />
          Pass
        </Button>
        
        <Button
          size="default"
          className="bg-primary text-primary-foreground"
          onClick={() => swipe("right")}
          disabled={!canSwipe}
          data-testid="button-swipe-right"
        >
          <Heart className="w-4 h-4 mr-1" />
          Like
        </Button>

        {shortlist.length > 0 && (
          <Button
            size="default"
            className="bg-primary"
            onClick={handleComplete}
            data-testid="button-view-shortlist"
          >
            Review ({shortlist.length})
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Swipe right to like, left to pass
      </p>
    </div>
  );
}
