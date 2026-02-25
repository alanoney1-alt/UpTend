import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RoomScanner } from "@/components/tools/room-scanner";
import { ResaleGenerator } from "@/components/tools/resale-generator";
import {
  ArrowLeft, DollarSign, ShieldCheck, Tag, Package, Loader2,
  Home, Scan, Trash2, ArrowRight, Video, Grid3X3,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface InventoryItem {
  id: string;
  itemName: string;
  category: string | null;
  estimatedValue: number | null;
  confidenceScore: number | null;
  brandDetected: string | null;
  condition: string | null;
  conditionNotes: string | null;
  photoUrl: string | null;
  verificationPhotoUrl: string | null;
  resaleStatus: string | null;
  generatedAt: string;
}

interface InventoryData {
  items: InventoryItem[];
  totalValue: number;
  itemCount: number;
}

export default function MyHomeInventory() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [resaleItemId, setResaleItemId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<InventoryData>({
    queryKey: ["/api/inventory"],
    enabled: isAuthenticated,
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest("PATCH", `/api/inventory/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Item Updated" });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const items = data?.items || [];
  const totalValue = data?.totalValue || 0;

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case "electronics": return <Tag className="w-4 h-4 text-primary" />;
      case "furniture": return <Home className="w-4 h-4 text-amber-500" />;
      case "appliance": return <Package className="w-4 h-4 text-green-500" />;
      default: return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getConditionColor = (condition: string | null) => {
    switch (condition) {
      case "new":
      case "like_new": return "text-green-600 dark:text-green-400";
      case "good": return "text-blue-600 dark:text-blue-400";
      case "fair": return "text-yellow-600 dark:text-yellow-400";
      case "poor": return "text-red-600 dark:text-red-400";
      default: return "text-muted-foreground";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to view your home inventory.</p>
          <Link href="/login">
            <Button data-testid="button-go-to-login">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-my-home-inventory">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-2 flex-wrap">
          <Link href="/profile" className="flex items-center gap-2">
            <Logo className="w-10 h-10" textClassName="text-xl" />
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="sm" data-testid="button-back-profile">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-primary/10 p-6 rounded-md border border-primary/20">
          <h1 className="text-2xl font-bold mb-2" data-testid="text-page-title">My Digital Home</h1>
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Assets</p>
              <p className="text-2xl font-bold" data-testid="text-total-items">{items.length} Items</p>
            </div>
            <div className="h-10 w-px bg-primary/20" />
            <div>
              <p className="text-xs text-muted-foreground uppercase">Insurable Value</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-total-value">
                ${(totalValue / 100).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="inventory" data-testid="tabs-home-inventory">
          <TabsList className="w-full">
            <TabsTrigger value="inventory" className="flex-1" data-testid="tab-inventory">
              <Grid3X3 className="w-4 h-4 mr-1" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="video-scan" className="flex-1" data-testid="tab-video-scan">
              <Video className="w-4 h-4 mr-1" />
              Video Scan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-4">
            {items.length === 0 ? (
              <Card className="p-8 text-center">
                <Scan className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Use the Video Scan tab to record a room, or book a free Home DNA Scan.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/book?service=home_consultation">
                    <Button variant="outline" data-testid="button-book-assessment">
                      Book Assessment
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden" data-testid={`card-inventory-item-${item.id}`}>
                    <div className="flex">
                      <div className="w-24 h-24 bg-muted shrink-0 flex items-center justify-center">
                        {item.verificationPhotoUrl || item.photoUrl ? (
                          <img
                            src={item.verificationPhotoUrl || item.photoUrl || ""}
                            className="w-full h-full object-cover"
                            alt={item.itemName}
                          />
                        ) : (
                          getCategoryIcon(item.category)
                        )}
                      </div>

                      <CardContent className="p-3 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-sm truncate">{item.itemName}</h3>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            ${(item.estimatedValue || 0) / 100}
                          </Badge>
                        </div>

                        {item.conditionNotes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.conditionNotes}
                          </p>
                        )}

                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {item.confidenceScore ? `${item.confidenceScore}% Verified` : "Verified"}
                          </Badge>
                          {item.condition && (
                            <span className={`text-[10px] font-bold capitalize ${getConditionColor(item.condition)}`}>
                              {item.condition.replace("_", " ")}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (item.photoUrl) {
                                setResaleItemId(resaleItemId === item.id ? null : item.id);
                              } else {
                                updateItemMutation.mutate({
                                  id: item.id,
                                  updates: { resaleStatus: "claimed_for_resale" },
                                });
                              }
                            }}
                            data-testid={`button-sell-${item.id}`}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Sell
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateItemMutation.mutate({
                              id: item.id,
                              updates: { resaleStatus: "disposed" },
                            })}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </div>

                    {resaleItemId === item.id && item.photoUrl && (
                      <div className="p-3 border-t">
                        <ResaleGenerator
                          photoUrl={item.photoUrl}
                          onComplete={() => {
                            updateItemMutation.mutate({
                              id: item.id,
                              updates: { resaleStatus: "claimed_for_resale" },
                            });
                            setResaleItemId(null);
                          }}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="video-scan" className="mt-4 space-y-4">
            <Card className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" data-testid="text-video-scan-title">Video Inventory Scanner</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Point your camera and slowly pan around the room. Our AI identifies every item,
                    estimates cubic volume for truck sizing, and calculates resale value. all in seconds.
                  </p>
                </div>
              </div>
            </Card>

            <RoomScanner
              onSave={(analysis) => {
                toast({
                  title: "Inventory Saved",
                  description: `${analysis.inventory.length} items added to your Digital Home.`,
                });
                queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
