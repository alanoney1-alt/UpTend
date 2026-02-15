/**
 * Pro Marketplace Management
 *
 * Allows Pros to:
 * - List recovered items for resale
 * - Track views and interest
 * - Mark items as sold
 * - View marketplace earnings
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, Plus, DollarSign, Eye, Trash2, CheckCircle, Image as ImageIcon } from "lucide-react";
import type { MarketplaceItem } from "@shared/schema";

interface ProMarketplaceStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalEarnings: number;
  items: MarketplaceItem[];
}

export function ProMarketplace({ proId }: { proId: string }) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  // Fetch Pro's marketplace data
  const { data: marketplaceData, isLoading } = useQuery<ProMarketplaceStats>({
    queryKey: [`/api/marketplace/items/pro/${proId}`],
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      price: number;
      category: string;
      condition: string;
      location: string;
      photos: string[];
    }) => apiRequest("POST", "/api/marketplace/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/items/pro/${proId}`] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Listing created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create listing", variant: "destructive" });
    },
  });

  // Mark as sold mutation
  const markAsSoldMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("PATCH", `/api/marketplace/items/${itemId}/sold`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/items/pro/${proId}`] });
      toast({ title: "Success", description: "Item marked as sold" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark item as sold", variant: "destructive" });
    },
  });

  // Delete listing mutation
  const deleteListingMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/marketplace/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/items/pro/${proId}`] });
      toast({ title: "Success", description: "Listing deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete listing", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = marketplaceData || {
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalEarnings: 0,
    items: [],
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.activeListings}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.soldListings}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${stats.totalEarnings.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Listings</h2>
          <p className="text-sm text-muted-foreground">
            Sell recovered items to generate extra income
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Listing
        </Button>
      </div>

      {/* Listings Grid */}
      {stats.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start listing recovered items from your jobs to earn extra income
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {item.photos && item.photos.length > 0 ? (
                <div className="aspect-video bg-muted relative">
                  <img
                    src={item.photos[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.status === "sold" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="default" className="text-lg">SOLD</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                  </div>
                  <Badge variant={item.status === "available" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary">${item.price}</div>
                    {item.category && (
                      <div className="text-xs text-muted-foreground capitalize">{item.category}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{item.views || 0}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  {item.status === "available" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => markAsSoldMutation.mutate(item.id)}
                        disabled={markAsSoldMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Sold
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this listing?")) {
                            deleteListingMutation.mutate(item.id);
                          }
                        }}
                        disabled={deleteListingMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {item.status === "sold" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => deleteListingMutation.mutate(item.id)}
                      disabled={deleteListingMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Listing Dialog */}
      <CreateListingDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(data) => createListingMutation.mutate(data)}
        isSubmitting={createListingMutation.isPending}
      />
    </div>
  );
}

function CreateListingDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    location: string;
    photos: string[];
  }) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "furniture",
    condition: "good",
    location: "Orlando, FL",
    photos: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Marketplace Listing</DialogTitle>
          <DialogDescription>
            List a recovered item for resale. Include clear photos and honest descriptions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Vintage Leather Couch - Great Condition"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the item's condition, dimensions, and any notable features..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger id="condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - Like New</SelectItem>
                  <SelectItem value="good">Good - Minor Wear</SelectItem>
                  <SelectItem value="fair">Fair - Some Damage</SelectItem>
                  <SelectItem value="poor">Poor - Needs Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State"
              />
            </div>
          </div>

          <div>
            <Label>Photos</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag photos here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                For now, add photo URLs after creating the listing
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
