/**
 * HOA Property Roster Management
 *
 * Allows HOA/Property Managers to:
 * - View all properties in their portfolio
 * - Add new properties
 * - Edit property details
 * - View violation count per property
 * - Search and filter properties
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Home, Plus, Search, MapPin, AlertTriangle, Edit, Mail, Phone, User } from "lucide-react";
import type { HoaProperty } from "@shared/schema";

interface PropertyRosterProps {
  businessAccountId: string;
}

export function PropertyRoster({ businessAccountId }: PropertyRosterProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<HoaProperty | null>(null);

  // Fetch properties
  const { data: properties, isLoading } = useQuery<HoaProperty[]>({
    queryKey: [`/api/business/${businessAccountId}/properties`],
  });

  // Filter properties by search
  const filteredProperties = properties?.filter(property => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      property.address.toLowerCase().includes(query) ||
      property.ownerName?.toLowerCase().includes(query) ||
      property.ownerEmail?.toLowerCase().includes(query)
    );
  }) || [];

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    toast({ title: "Success", description: "Property added to roster" });
  };

  const handleEditSuccess = () => {
    setEditingProperty(null);
    toast({ title: "Success", description: "Property updated" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-5">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Property Roster</CardTitle>
                <CardDescription>
                  {properties?.length || 0} propert{properties?.length === 1 ? "y" : "ies"} in your portfolio
                </CardDescription>
              </div>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
              </DialogTrigger>
              <PropertyForm
                businessAccountId={businessAccountId}
                onSuccess={handleAddSuccess}
              />
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, owner name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No properties found" : "No properties yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Add properties to start managing violations and communications"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Property
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={() => setEditingProperty(property)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingProperty && (
        <Dialog open={!!editingProperty} onOpenChange={() => setEditingProperty(null)}>
          <PropertyForm
            businessAccountId={businessAccountId}
            property={editingProperty}
            onSuccess={handleEditSuccess}
          />
        </Dialog>
      )}
    </div>
  );
}

function PropertyCard({ property, onEdit }: { property: HoaProperty; onEdit: () => void }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">{property.address}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {property.city}, {property.state} {property.zipCode}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>

            {property.ownerName && (
              <div className="grid sm:grid-cols-3 gap-3 pl-13">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{property.ownerName}</span>
                </div>
                {property.ownerEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{property.ownerEmail}</span>
                  </div>
                )}
                {property.ownerPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{property.ownerPhone}</span>
                  </div>
                )}
              </div>
            )}

            {property.notes && (
              <div className="pl-13">
                <p className="text-sm text-muted-foreground">{property.notes}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PropertyForm({
  businessAccountId,
  property,
  onSuccess,
}: {
  businessAccountId: string;
  property?: HoaProperty;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    address: property?.address || "",
    city: property?.city || "",
    state: property?.state || "FL",
    zipCode: property?.zipCode || "",
    ownerName: property?.ownerName || "",
    ownerEmail: property?.ownerEmail || "",
    ownerPhone: property?.ownerPhone || "",
    notes: property?.notes || "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (property) {
        // Update existing property
        return apiRequest("PATCH", `/api/hoa/properties/${property.id}`, data);
      } else {
        // Create new property
        return apiRequest("POST", "/api/hoa/properties", {
          ...data,
          businessAccountId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessAccountId}/properties`] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save property",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address.trim()) {
      toast({ title: "Error", description: "Address is required", variant: "destructive" });
      return;
    }

    if (!formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
      toast({ title: "Error", description: "City, state, and ZIP code are required", variant: "destructive" });
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{property ? "Edit Property" : "Add Property"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Property Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main Street"
            required
          />
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Orlando"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="FL"
              maxLength={2}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="32803"
            maxLength={10}
            required
          />
        </div>

        <Separator />

        {/* Owner Information */}
        <div className="space-y-4">
          <h3 className="font-semibold">Owner Information</h3>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerEmail">Owner Email</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              placeholder="owner@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Email notifications for violations will be sent here
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerPhone">Owner Phone</Label>
            <Input
              id="ownerPhone"
              type="tel"
              value={formData.ownerPhone}
              onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
              placeholder="(407) 555-0123"
            />
            <p className="text-xs text-muted-foreground">
              SMS notifications will be sent here
            </p>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any special notes about this property..."
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : property ? "Update Property" : "Add Property"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
