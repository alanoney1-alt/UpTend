import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, X, Loader2, Sparkles, DollarSign } from "lucide-react";

interface BundlingSuggestionItem {
  suggestedServiceType: string;
  suggestedItems: string[];
  reason: string;
  estimatedAdditionalCost: number;
  discountPercent: number;
}

interface BundlingSuggestionsProps {
  identifiedItems: string[];
  serviceType: string;
  photoUrls?: string[];
  serviceRequestId?: string;
  customerId?: string;
  onAcceptSuggestion?: (suggestion: BundlingSuggestionItem) => void;
}

const serviceTypeLabels: Record<string, string> = {
  junk_removal: "Junk Removal",
  furniture_moving: "Furniture Moving",
  garage_cleanout: "Garage Cleanout",
  estate_cleanout: "Estate Cleanout",
  truck_unloading: "Truck Unloading",
};

export function BundlingSuggestions({ identifiedItems, serviceType, photoUrls, serviceRequestId, customerId, onAcceptSuggestion }: BundlingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<BundlingSuggestionItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/bundling-suggestions", {
      identifiedItems,
      serviceType,
      photoUrls,
      serviceRequestId,
      customerId,
    }),
    onSuccess: async (response: any) => {
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setHasGenerated(true);
    },
  });

  const visibleSuggestions = suggestions.filter((_, i) => !dismissedIds.has(i));

  if (!hasGenerated && identifiedItems.length > 0) {
    return (
      <Card className="border-orange-500/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-muted-foreground">
                AI can suggest add-on services based on your items
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="button-get-suggestions"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Analyzing...</>
              ) : (
                <><Lightbulb className="h-4 w-4 mr-1" /> Get Suggestions</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleSuggestions.length === 0) return null;

  return (
    <Card className="border-orange-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-orange-400" />
          Smart Add-On Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleSuggestions.map((suggestion, idx) => {
          const originalIdx = suggestions.indexOf(suggestion);
          return (
            <div
              key={originalIdx}
              className="p-3 rounded-md border border-border/50 bg-card/50 space-y-2"
              data-testid={`bundling-suggestion-${originalIdx}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {serviceTypeLabels[suggestion.suggestedServiceType] || suggestion.suggestedServiceType}
                    </Badge>
                    {suggestion.discountPercent > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        {suggestion.discountPercent}% bundle discount
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm mt-1" data-testid={`text-suggestion-reason-${originalIdx}`}>{suggestion.reason}</p>
                  {suggestion.suggestedItems.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Items: {suggestion.suggestedItems.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDismissedIds(prev => new Set(prev).add(originalIdx))}
                  data-testid={`button-dismiss-suggestion-${originalIdx}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">+${suggestion.estimatedAdditionalCost}</span>
                  {suggestion.discountPercent > 0 && (
                    <span className="text-xs text-muted-foreground line-through ml-1">
                      ${Math.round(suggestion.estimatedAdditionalCost / (1 - suggestion.discountPercent / 100))}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => onAcceptSuggestion?.(suggestion)}
                  data-testid={`button-accept-suggestion-${originalIdx}`}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add to Order
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
