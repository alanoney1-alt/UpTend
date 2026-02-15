import { safeFetchJson } from "@/lib/queryClient";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Recycle, Heart, ShoppingBag, Trash2, Zap, AlertTriangle, Cpu, Plus, X, Leaf } from "lucide-react";

interface DisposalRecommendation {
  id: string;
  serviceRequestId: string;
  itemName: string;
  category: string;
  estimatedWeightLbs: number;
  destinationName: string;
  destinationAddress: string;
  estimatedValue: number;
  co2AvoidedLbs: number;
  status: string;
}

interface ClassificationResult {
  recommendations: DisposalRecommendation[];
  summary: {
    totalItems: number;
    totalDivertedLbs: number;
    totalCo2AvoidedLbs: number;
    totalEstimatedValue: number;
    byCategory: Record<string, number>;
  };
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  donate: { icon: <Heart className="h-4 w-4" />, color: "text-pink-400", label: "Donate" },
  recycle: { icon: <Recycle className="h-4 w-4" />, color: "text-green-400", label: "Recycle" },
  resell: { icon: <ShoppingBag className="h-4 w-4" />, color: "text-blue-400", label: "Resell" },
  e_waste: { icon: <Cpu className="h-4 w-4" />, color: "text-yellow-400", label: "E-Waste" },
  hazardous: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-400", label: "Hazardous" },
  landfill: { icon: <Trash2 className="h-4 w-4" />, color: "text-muted-foreground", label: "Landfill" },
};

interface CircularEconomyAgentProps {
  serviceRequestId: string;
  photoUrls?: string[];
  existingItems?: string[];
}

export function CircularEconomyAgent({ serviceRequestId, photoUrls = [], existingItems = [] }: CircularEconomyAgentProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<string[]>(existingItems.length > 0 ? existingItems : []);
  const [newItem, setNewItem] = useState("");

  const { data: existingRecs = [], isLoading } = useQuery<DisposalRecommendation[]>({
    queryKey: ["/api/circular-economy/recommendations", serviceRequestId],
    queryFn: () => safeFetchJson(`/api/circular-economy/recommendations/${serviceRequestId}`),
  });

  const classifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/circular-economy/classify", {
        serviceRequestId,
        photoUrls,
        itemDescriptions: items,
      });
      return res.json() as Promise<ClassificationResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circular-economy/recommendations", serviceRequestId] });
    },
    onError: (err: Error) => { console.error(err); },
  });

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const displayRecs = classifyMutation.data?.recommendations || existingRecs;
  const summary = classifyMutation.data?.summary;

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Recycle className="h-5 w-5 text-green-400" />
        <h3 className="text-lg font-semibold">Circular Economy Agent</h3>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Add items to classify for optimal disposal</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Old sofa, broken TV, cardboard boxes..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              data-testid="input-disposal-item"
            />
            <Button size="sm" onClick={addItem} data-testid="button-add-disposal-item">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {items.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {item}
                  <button onClick={() => removeItem(idx)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Button
            onClick={() => classifyMutation.mutate()}
            disabled={classifyMutation.isPending || items.length === 0}
            className="w-full"
            data-testid="button-classify-items"
          >
            <Leaf className="w-4 h-4 mr-2" />
            {classifyMutation.isPending ? "AI Classifying..." : "Classify Items for Best Disposal"}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Disposal Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400" data-testid="text-diverted-lbs">{summary.totalDivertedLbs.toFixed(0)} lbs</p>
                <p className="text-xs text-muted-foreground">Diverted from Landfill</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400" data-testid="text-co2-avoided">{summary.totalCo2AvoidedLbs.toFixed(1)} lbs</p>
                <p className="text-xs text-muted-foreground">CO2 Avoided</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400" data-testid="text-resale-value">${summary.totalEstimatedValue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Resale Value</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" data-testid="text-total-items">{summary.totalItems}</p>
                <p className="text-xs text-muted-foreground">Items Classified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {displayRecs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Disposal Recommendations</p>
          {displayRecs.map((rec) => {
            const config = categoryConfig[rec.category] || categoryConfig.landfill;
            return (
              <Card key={rec.id} className="p-3" data-testid={`card-disposal-${rec.id}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-muted rounded-lg ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{rec.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {rec.destinationName} {rec.estimatedWeightLbs > 0 && `/ ~${rec.estimatedWeightLbs} lbs`}
                      </p>
                      {rec.estimatedValue > 0 && (
                        <p className="text-xs text-blue-400">Est. value: ${rec.estimatedValue}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.co2AvoidedLbs > 0 && (
                      <Badge variant="outline" className="text-green-400 border-green-500/30">
                        -{rec.co2AvoidedLbs.toFixed(1)} lbs CO2
                      </Badge>
                    )}
                    <Badge variant={rec.category === "landfill" ? "destructive" : "default"}>
                      {config.label}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
