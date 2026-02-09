import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { type CrossSellSuggestion } from "@shared/cross-sell";

interface CrossSellCardProps {
  suggestion: CrossSellSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export function CrossSellCard({ suggestion, onAccept, onDismiss }: CrossSellCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors"
        aria-label="Dismiss suggestion"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="space-y-3">
        {suggestion.badge && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {suggestion.badge}
          </Badge>
        )}

        <div>
          <h3 className="font-semibold text-lg mb-1">
            {suggestion.headline}
          </h3>
          <p className="text-sm text-muted-foreground">
            {suggestion.description}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onAccept}
            className="flex-1"
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Booking
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            className="flex-1"
          >
            No Thanks
          </Button>
        </div>
      </div>
    </Card>
  );
}
