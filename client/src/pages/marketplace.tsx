/**
 * Customer Marketplace Browse Page
 *
 * Customers can browse and search for secondhand items recovered by Pros
 * All proceeds go directly to the Pro who recovered the item
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store, Search, Eye, MapPin, DollarSign, Package, Image as ImageIcon, Phone, MessageCircle } from "lucide-react";
import type { MarketplaceItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  // Fetch marketplace items
  const { data: items, isLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ["/api/marketplace/items", { category: categoryFilter, condition: conditionFilter, maxPrice }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
      if (conditionFilter && conditionFilter !== "all") params.set("condition", conditionFilter);
      if (maxPrice) params.set("maxPrice", maxPrice);

      const res = await fetch(`/api/marketplace/items?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch marketplace items");
      return res.json();
    },
  });

  // Track view when item is opened
  const trackView = async (itemId: string) => {
    try {
      await apiRequest("POST", `/api/marketplace/items/${itemId}/view`, {});
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  };

  const handleItemClick = (item: MarketplaceItem) => {
    setSelectedItem(item);
    trackView(item.id);
  };

  const filteredItems = items?.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-10 w-64 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Store className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">UpTend Marketplace</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-6">
            Quality secondhand items recovered from local jobs. All proceeds go directly to UpTend Pros.
          </p>

          {/* Search & Filters */}
          <Card className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="appliances">Appliances</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="outdoor">Outdoor/Garden</SelectItem>
                    <SelectItem value="building_materials">Building Materials</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={conditionFilter} onValueChange={setConditionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Condition</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-orange-400" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || (categoryFilter && categoryFilter !== "all") || (conditionFilter && conditionFilter !== "all")
                  ? "No items match your filters"
                  : "Marketplace Coming Soon"}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {searchQuery || (categoryFilter && categoryFilter !== "all") || (conditionFilter && conditionFilter !== "all")
                  ? "Try adjusting your filters"
                  : "Our Pros recover quality furniture, appliances, and household items during junk removal jobs."}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {!(searchQuery || (categoryFilter && categoryFilter !== "all") || (conditionFilter && conditionFilter !== "all"))
                  && "Browse rescued items at great prices. and keep them out of the landfill. Listings go live when Pros start posting recovered items."}
              </p>
              {(searchQuery || (categoryFilter && categoryFilter !== "all") || (conditionFilter && conditionFilter !== "all")) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setConditionFilter("all");
                    setMaxPrice("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleItemClick(item)}
              >
                {item.photos && item.photos.length > 0 ? (
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={item.photos[0]}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                    {item.condition && (
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {item.condition}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold text-primary">${item.price}</div>
                        {item.category && (
                          <div className="text-xs text-muted-foreground capitalize mt-1">
                            {item.category.replace(/_/g, " ")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>{item.views || 0}</span>
                      </div>
                    </div>

                    {item.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{item.location}</span>
                      </div>
                    )}

                    <Button className="w-full" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Item Details Dialog */}
        {selectedItem && (
          <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  Listed by UpTend Pro • All proceeds go directly to the seller
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Photos */}
                {selectedItem.photos && selectedItem.photos.length > 0 ? (
                  <div className="grid gap-2">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={selectedItem.photos[0]}
                        alt={selectedItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedItem.photos.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedItem.photos.slice(1, 5).map((photo, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={photo}
                              alt={`${selectedItem.title} - ${index + 2}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}

                <Separator />

                {/* Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedItem.description || "No description provided"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedItem.category && (
                        <Badge variant="outline" className="capitalize">
                          {selectedItem.category.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {selectedItem.condition && (
                        <Badge variant="secondary" className="capitalize">
                          {selectedItem.condition} condition
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-4xl font-bold text-primary mb-2">
                        ${selectedItem.price}
                      </div>
                      {selectedItem.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedItem.location}</span>
                        </div>
                      )}
                    </Card>

                    <div className="space-y-2">
                      <Button className="w-full" size="lg">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Seller
                      </Button>
                      <Button className="w-full" size="lg" variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        100% of proceeds go to the UpTend Pro who recovered this item
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
