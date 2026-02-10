import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Shield, Plus, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyWarranty } from "@db/schema";

interface WarrantyTrackerProps {
  propertyId: string;
}

export function WarrantyTracker({ propertyId }: WarrantyTrackerProps) {
  const [warranties, setWarranties] = useState<PropertyWarranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  useEffect(() => {
    fetchWarranties();
  }, [propertyId]);

  async function fetchWarranties() {
    try {
      const response = await fetch(`/api/properties/${propertyId}/warranties`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setWarranties(data);
      }
    } catch (error) {
      console.error("Failed to fetch warranties:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    if (status === "active") return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === "expiring_soon") return <Clock className="h-5 w-5 text-orange-600" />;
    if (status === "expired") return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Shield className="h-5 w-5 text-gray-400" />;
  }

  function getStatusColor(status: string) {
    if (status === "active") return "bg-green-100 text-green-800 border-green-300";
    if (status === "expiring_soon") return "bg-orange-100 text-orange-800 border-orange-300";
    if (status === "expired") return "bg-red-100 text-red-800 border-red-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  }

  const filteredWarranties = warranties.filter((w) => {
    if (filter === "all") return true;
    if (filter === "active") return w.status === "active";
    if (filter === "expiring") return w.status === "expiring_soon";
    if (filter === "expired") return w.status === "expired";
    return true;
  });

  const stats = {
    total: warranties.length,
    active: warranties.filter((w) => w.status === "active").length,
    expiring: warranties.filter((w) => w.status === "expiring_soon").length,
    expired: warranties.filter((w) => w.status === "expired").length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Warranty Tracker</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track all warranties and get expiration alerts
              </p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Warranty
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Warranty</DialogTitle>
                  <DialogDescription>
                    Add a warranty to track expiration and coverage
                  </DialogDescription>
                </DialogHeader>
                <AddWarrantyForm
                  propertyId={propertyId}
                  onSuccess={() => {
                    setAddDialogOpen(false);
                    fetchWarranties();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("active")}
        >
          Active ({stats.active})
        </Button>
        <Button
          variant={filter === "expiring" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("expiring")}
        >
          Expiring Soon ({stats.expiring})
        </Button>
        <Button
          variant={filter === "expired" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("expired")}
        >
          Expired ({stats.expired})
        </Button>
      </div>

      {/* Warranties List */}
      {filteredWarranties.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No warranties found</h3>
              <p className="text-muted-foreground mb-6">
                {filter === "all"
                  ? "Start tracking warranties to get expiration alerts"
                  : `No ${filter} warranties`}
              </p>
              {filter === "all" && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Warranty
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWarranties.map((warranty) => (
            <Card key={warranty.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(warranty.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{warranty.itemCovered}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {warranty.warrantyType?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Badge className={cn("text-xs", getStatusColor(warranty.status))}>
                        {warranty.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Provider</p>
                        <p className="font-medium">{warranty.provider || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium">
                          {new Date(warranty.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expiration</p>
                        <p className="font-medium">
                          {new Date(warranty.expirationDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Days Remaining</p>
                        <p
                          className={cn(
                            "font-bold",
                            warranty.daysUntilExpiration! > 90 && "text-green-600",
                            warranty.daysUntilExpiration! <= 90 &&
                              warranty.daysUntilExpiration! > 30 &&
                              "text-orange-600",
                            warranty.daysUntilExpiration! <= 30 && "text-red-600"
                          )}
                        >
                          {warranty.daysUntilExpiration || 0}
                        </p>
                      </div>
                    </div>

                    {warranty.coverageDetails && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-xs text-muted-foreground mb-1">Coverage Details</p>
                        <p className="text-sm">{warranty.coverageDetails}</p>
                      </div>
                    )}

                    {warranty.daysUntilExpiration! <= 90 && warranty.daysUntilExpiration! > 0 && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <p className="text-sm text-orange-800 font-medium">
                            Warranty expiring in {warranty.daysUntilExpiration} days
                          </p>
                        </div>
                        <p className="text-xs text-orange-700 mt-1">
                          Schedule service now to take advantage of coverage
                        </p>
                      </div>
                    )}

                    {warranty.documentUrl && (
                      <div className="mt-4">
                        <a
                          href={warranty.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Warranty Document →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddWarrantyForm({
  propertyId,
  onSuccess,
}: {
  propertyId: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    warrantyType: "",
    itemCovered: "",
    provider: "",
    startDate: "",
    expirationDate: "",
    coverageDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.itemCovered || !formData.startDate || !formData.expirationDate) {
      alert("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/warranties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          propertyId,
          ...formData,
          status: "active",
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("Failed to add warranty");
      }
    } catch (error) {
      console.error("Failed to add warranty:", error);
      alert("Failed to add warranty");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="warrantyType">Warranty Type *</Label>
        <Select
          value={formData.warrantyType}
          onValueChange={(value) => setFormData({ ...formData, warrantyType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manufacturer">Manufacturer Warranty</SelectItem>
            <SelectItem value="extended">Extended Warranty</SelectItem>
            <SelectItem value="home_warranty">Home Warranty</SelectItem>
            <SelectItem value="appliance_protection">Appliance Protection Plan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="itemCovered">Item Covered *</Label>
        <Input
          id="itemCovered"
          placeholder="e.g., HVAC System, Refrigerator"
          value={formData.itemCovered}
          onChange={(e) => setFormData({ ...formData, itemCovered: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="provider">Provider</Label>
        <Input
          id="provider"
          placeholder="e.g., American Home Shield"
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="expirationDate">Expiration Date *</Label>
          <Input
            id="expirationDate"
            type="date"
            value={formData.expirationDate}
            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="coverageDetails">Coverage Details</Label>
        <Textarea
          id="coverageDetails"
          placeholder="What does this warranty cover?"
          value={formData.coverageDetails}
          onChange={(e) => setFormData({ ...formData, coverageDetails: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Adding..." : "Add Warranty"}
      </Button>
    </form>
  );
}
