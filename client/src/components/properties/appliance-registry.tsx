import { useState, useEffect } from "react";
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
import { Zap, Plus, Camera, Upload, Search, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyAppliance } from "@shared/schema";

interface ApplianceRegistryProps {
  propertyId: string;
}

export function ApplianceRegistry({ propertyId }: ApplianceRegistryProps) {
  const [appliances, setAppliances] = useState<PropertyAppliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [manualAddDialogOpen, setManualAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchAppliances();
  }, [propertyId]);

  async function fetchAppliances() {
    try {
      const response = await fetch(`/api/properties/${propertyId}/appliances`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAppliances(data);
      }
    } catch (error) {
      console.error("Failed to fetch appliances:", error);
    } finally {
      setLoading(false);
    }
  }

  function getApplianceIcon(category: string) {
    const icons: Record<string, string> = {
      refrigerator: "❄️",
      dishwasher: "🍽️",
      oven: "🔥",
      microwave: "📟",
      washer: "🧺",
      dryer: "👔",
      hvac: "🌡️",
      water_heater: "💧",
      garbage_disposal: "🗑️",
      range_hood: "💨",
    };
    return icons[category] || "⚡";
  }

  function getWarrantyStatusColor(status?: string) {
    if (!status) return "text-gray-500";
    if (status === "active") return "text-green-600";
    if (status === "expiring_soon") return "text-orange-600";
    if (status === "expired") return "text-red-600";
    return "text-gray-500";
  }

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
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Appliance Registry</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track all appliances, warranties, and maintenance
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Appliance
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Scan Appliance</DialogTitle>
                    <DialogDescription>
                      Take a photo of the model plate or upload existing photos
                    </DialogDescription>
                  </DialogHeader>
                  <ScanApplianceForm
                    propertyId={propertyId}
                    onSuccess={() => {
                      setScanDialogOpen(false);
                      fetchAppliances();
                    }}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={manualAddDialogOpen} onOpenChange={setManualAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manually
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Appliance Manually</DialogTitle>
                    <DialogDescription>
                      Enter appliance details manually
                    </DialogDescription>
                  </DialogHeader>
                  <ManualAddApplianceForm
                    propertyId={propertyId}
                    onSuccess={() => {
                      setManualAddDialogOpen(false);
                      fetchAppliances();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Appliance Grid */}
      {appliances.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Zap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No appliances registered yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your appliance registry by scanning or adding manually
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setScanDialogOpen(true)}>
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Your First Appliance
                </Button>
                <Button variant="outline" onClick={() => setManualAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manually
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appliances.map((appliance) => (
            <Card key={appliance.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{getApplianceIcon(appliance.category)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {appliance.brand} {appliance.model}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {appliance.category?.replace(/_/g, " ")}
                    </p>
                    {appliance.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {appliance.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {appliance.serialNumber && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Serial:</span>{" "}
                      <span className="font-mono">{appliance.serialNumber}</span>
                    </div>
                  )}
                  {appliance.purchaseDate && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Purchased:</span>{" "}
                      {new Date(appliance.purchaseDate).toLocaleDateString()}
                    </div>
                  )}
                  {appliance.installDate && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Installed:</span>{" "}
                      {new Date(appliance.installDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Warranty Status */}
                {appliance.warrantyStatus && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {appliance.warrantyStatus === "active" && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {appliance.warrantyStatus === "expiring_soon" && (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      {appliance.warrantyStatus === "expired" && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium capitalize",
                          getWarrantyStatusColor(appliance.warrantyStatus)
                        )}
                      >
                        {appliance.warrantyStatus?.replace(/_/g, " ")}
                      </span>
                    </div>
                    {appliance.warrantyExpirationDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(appliance.warrantyExpirationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Scan Method Badge */}
                {appliance.scanMethod && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {appliance.scanMethod === "customer_scan" && "Self-Scanned"}
                      {appliance.scanMethod === "pro_scan" && "Pro Scanned"}
                      {appliance.scanMethod === "dwellscan" && "DwellScan"}
                      {appliance.scanMethod === "manual" && "Manual Entry"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScanApplianceForm({
  propertyId,
  onSuccess,
}: {
  propertyId: string;
  onSuccess: () => void;
}) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (photoUrls.length === 0) {
      alert("Please upload at least one photo");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/appliances/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          photoUrls,
          location,
          aiProcessingStatus: "uploaded",
          scanMethod: "customer_scan",
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("Failed to upload scan");
      }
    } catch (error) {
      console.error("Failed to upload scan:", error);
      alert("Failed to upload scan");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Upload Photos</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Take clear photos of the model plate (brand, model, serial number)
        </p>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            // In production, upload to cloud storage and get URLs
            const files = Array.from(e.target.files || []);
            const urls = files.map((f) => URL.createObjectURL(f));
            setPhotoUrls(urls);
          }}
        />
        {photoUrls.length > 0 && (
          <p className="text-sm text-green-600 mt-2">
            {photoUrls.length} photo(s) selected
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          placeholder="e.g., Kitchen, Laundry Room"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How AI Scanning Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ AI extracts brand, model, and serial number</li>
          <li>✓ Auto-lookup warranty information</li>
          <li>✓ Add to your registry automatically</li>
          <li>✓ Results ready in 30-60 seconds</li>
        </ul>
      </div>

      <Button type="submit" disabled={uploading || photoUrls.length === 0} className="w-full">
        {uploading ? "Uploading..." : "Upload & Process"}
      </Button>
    </form>
  );
}

function ManualAddApplianceForm({
  propertyId,
  onSuccess,
}: {
  propertyId: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    category: "",
    brand: "",
    model: "",
    serialNumber: "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.category || !formData.brand) {
      alert("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/appliances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          propertyId,
          ...formData,
          scanMethod: "manual",
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("Failed to add appliance");
      }
    } catch (error) {
      console.error("Failed to add appliance:", error);
      alert("Failed to add appliance");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="refrigerator">Refrigerator</SelectItem>
            <SelectItem value="dishwasher">Dishwasher</SelectItem>
            <SelectItem value="oven">Oven</SelectItem>
            <SelectItem value="microwave">Microwave</SelectItem>
            <SelectItem value="washer">Washer</SelectItem>
            <SelectItem value="dryer">Dryer</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="water_heater">Water Heater</SelectItem>
            <SelectItem value="garbage_disposal">Garbage Disposal</SelectItem>
            <SelectItem value="range_hood">Range Hood</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="brand">Brand *</Label>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="model">Model Number</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="serialNumber">Serial Number</Label>
        <Input
          id="serialNumber"
          value={formData.serialNumber}
          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g., Kitchen, Laundry Room"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Adding..." : "Add Appliance"}
      </Button>
    </form>
  );
}
