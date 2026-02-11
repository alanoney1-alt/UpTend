import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Shield,
  Zap,
  ChevronRight,
  Sparkles,
  Truck
} from "lucide-react";

interface Pro {
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

// Legacy type alias for backward compatibility
type Pycker = Pro;

interface QuickMatchProps {
  recommendedPros: Pro[];
  onSelectPro: (pro: Pro) => void;
  onBrowseAll: () => void;
  onBack: () => void;
}

export function QuickMatch({ recommendedPros, onSelectPro, onBrowseAll, onBack }: QuickMatchProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Quick Match</h2>
        <p className="text-muted-foreground">
          Our AI found the top 3 Pros for your job based on ratings, availability, and proximity.
        </p>
      </div>

      <div className="space-y-3">
        {recommendedPros.map((pro, index) => (
          <Card
            key={pro.id}
            className="overflow-hidden cursor-pointer transition-all border-muted-foreground/20"
            onClick={() => onSelectPro(pro)}
            data-testid={`card-quickmatch-pycker-${pro.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage src={pro.photo} alt={pro.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {pro.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{pro.name}</h3>
                    {pro.verified && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <Shield className="w-3 h-3 mr-0.5" />
                        Pro
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-0.5" />
                      {pro.rating.toFixed(1)}
                    </div>
                    <span>{pro.completedJobs} jobs</span>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-0.5" />
                      {pro.distance} mi
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {pro.available && (
                      <Badge className="bg-primary text-xs">
                        <Zap className="w-3 h-3 mr-0.5" />
                        Available Now
                      </Badge>
                    )}
                    {pro.vehicleType && (
                      <Badge variant="outline" className="text-xs">
                        <Truck className="w-3 h-3 mr-0.5" />
                        {pro.vehicleType}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {pro.hourlyRate && (
                    <span className="text-lg font-bold text-primary">
                      ${pro.hourlyRate}/hr
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={onBrowseAll}
          data-testid="button-browse-all-pyckers"
        >
          Browse All Pros
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={onBack}
          data-testid="button-back-from-quickmatch"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
