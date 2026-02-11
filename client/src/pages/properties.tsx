import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Plus, TrendingUp, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Property } from "@shared/schema";

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const response = await fetch("/api/properties", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  }

  function getHealthScoreColor(score?: number) {
    if (!score) return "text-gray-500";
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  }

  function getHealthScoreLabel(score?: number) {
    if (!score) return "Not Calculated";
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 40) return "Needs Attention";
    return "Critical";
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Properties</h1>
          <p className="text-lg text-muted-foreground">
            Manage your properties and track their health
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Add a property to start tracking appliances, warranties, and maintenance
              </DialogDescription>
            </DialogHeader>
            <AddPropertyForm
              onSuccess={() => {
                setAddDialogOpen(false);
                fetchProperties();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Stats */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{properties.length}</p>
                <p className="text-sm text-muted-foreground">Total Properties</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {properties.reduce((sum, p) => sum + (p.totalAppliancesRegistered || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Appliances</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {properties.reduce((sum, p) => sum + (p.totalWarrantiesActive || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Active Warranties</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {properties.reduce((sum, p) => sum + (p.totalMaintenanceOverdue || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Maintenance Due</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <Home className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-3">Welcome to Property Intelligence</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start building your home's command center. Track appliances, warranties, maintenance,
                and more - all in one place.
              </p>
              <Button size="lg" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Property
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {properties.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{property.address}</h3>
                      <p className="text-muted-foreground">
                        {property.city}, {property.state} {property.zipCode}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="capitalize">
                          {property.propertyType?.replace(/_/g, " ")}
                        </Badge>
                        {property.yearBuilt && (
                          <Badge variant="outline">Built {property.yearBuilt}</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Property Health Score */}
                  {property.propertyHealthScore !== null && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Property Health Score</p>
                          <p className={cn("text-3xl font-bold", getHealthScoreColor(property.propertyHealthScore))}>
                            {property.propertyHealthScore}
                            <span className="text-lg text-muted-foreground">/100</span>
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-sm",
                            property.propertyHealthScore >= 90 && "bg-green-100 text-green-800",
                            property.propertyHealthScore >= 75 &&
                              property.propertyHealthScore < 90 &&
                              "bg-blue-100 text-blue-800",
                            property.propertyHealthScore >= 60 &&
                              property.propertyHealthScore < 75 &&
                              "bg-yellow-100 text-yellow-800",
                            property.propertyHealthScore < 60 && "bg-red-100 text-red-800"
                          )}
                        >
                          {getHealthScoreLabel(property.propertyHealthScore)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-2xl font-bold text-blue-600">
                        {property.totalAppliancesRegistered || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Appliances</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-2xl font-bold text-green-600">
                        {property.totalWarrantiesActive || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Warranties</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <p className="text-2xl font-bold text-purple-600">
                        {property.totalDocuments || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Documents</p>
                    </div>
                  </div>

                  {/* Alerts */}
                  {(property.totalWarrantiesExpiring || 0) > 0 && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <p className="text-sm text-orange-800 font-medium">
                          {property.totalWarrantiesExpiring} warranty expiring soon
                        </p>
                      </div>
                    </div>
                  )}

                  {(property.totalMaintenanceOverdue || 0) > 0 && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-800 font-medium">
                          {property.totalMaintenanceOverdue} maintenance task(s) overdue
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPropertyForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "",
    yearBuilt: "",
    squareFootage: "",
    bedrooms: "",
    bathrooms: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
      alert("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          ...formData,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
          squareFootage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("Failed to add property");
      }
    } catch (error) {
      console.error("Failed to add property:", error);
      alert("Failed to add property");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="address">Street Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Main St"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div>
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

      <div>
        <Label htmlFor="zipCode">ZIP Code *</Label>
        <Input
          id="zipCode"
          value={formData.zipCode}
          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          placeholder="32801"
          required
        />
      </div>

      <div>
        <Label htmlFor="propertyType">Property Type *</Label>
        <Select
          value={formData.propertyType}
          onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single_family">Single Family Home</SelectItem>
            <SelectItem value="condo">Condo</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
            <SelectItem value="multi_family">Multi-Family</SelectItem>
            <SelectItem value="mobile_home">Mobile Home</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearBuilt">Year Built</Label>
          <Input
            id="yearBuilt"
            type="number"
            value={formData.yearBuilt}
            onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
            placeholder="2020"
          />
        </div>
        <div>
          <Label htmlFor="squareFootage">Square Footage</Label>
          <Input
            id="squareFootage"
            type="number"
            value={formData.squareFootage}
            onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
            placeholder="2000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            placeholder="3"
          />
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            step="0.5"
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            placeholder="2"
          />
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Adding..." : "Add Property"}
      </Button>
    </form>
  );
}
