/**
 * HOA Violation Submission Interface
 *
 * Allows HOA/Property Managers to submit violations with:
 * - Property selection from roster
 * - Violation type and description
 * - Photo evidence upload
 * - Deadline for resolution
 * - Automatic homeowner notification
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertTriangle, Calendar as CalendarIcon, Upload, X, Image as ImageIcon, MapPin, Home } from "lucide-react";
import { format } from "date-fns";
import type { HoaProperty, HoaViolation } from "@shared/schema";

interface ViolationSubmissionProps {
  businessAccountId: string;
  onSuccess?: () => void;
}

const VIOLATION_TYPES = [
  { value: "lawn_maintenance", label: "Lawn/Landscaping Maintenance", description: "Overgrown grass, weeds, dead plants" },
  { value: "exterior_paint", label: "Exterior Paint/Siding", description: "Faded, peeling, or damaged exterior" },
  { value: "roof_damage", label: "Roof Damage/Debris", description: "Missing shingles, visible damage" },
  { value: "vehicle_parking", label: "Vehicle Parking", description: "Unauthorized parking, commercial vehicles" },
  { value: "trash_debris", label: "Trash/Debris", description: "Visible trash, junk, or debris" },
  { value: "fence_damage", label: "Fence/Gate Damage", description: "Broken or damaged fencing" },
  { value: "unauthorized_structure", label: "Unauthorized Structure", description: "Shed, addition, or modification without approval" },
  { value: "pool_maintenance", label: "Pool Maintenance", description: "Green water, debris, safety issues" },
  { value: "noise_disturbance", label: "Noise Disturbance", description: "Excessive noise complaints" },
  { value: "pet_violation", label: "Pet Violation", description: "Unleashed pets, waste not picked up" },
  { value: "other", label: "Other", description: "Other community guideline violation" },
];

export function ViolationSubmission({ businessAccountId, onSuccess }: ViolationSubmissionProps) {
  const { toast } = useToast();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [violationType, setViolationType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [notifyHomeowner, setNotifyHomeowner] = useState(true);

  // Fetch properties for this business account
  const { data: properties, isLoading: propertiesLoading } = useQuery<HoaProperty[]>({
    queryKey: [`/api/business/${businessAccountId}/properties`],
  });

  // Create violation mutation
  const createViolationMutation = useMutation({
    mutationFn: (data: {
      propertyId: string;
      violationType: string;
      description: string;
      severity: string;
      photos: string[];
      deadline?: string;
      notifyHomeowner: boolean;
    }) => apiRequest("POST", "/api/hoa/violations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessAccountId}/violations`] });
      toast({ title: "Success", description: "Violation submitted successfully" });

      // Reset form
      setSelectedPropertyId("");
      setViolationType("");
      setDescription("");
      setDeadline(undefined);
      setPhotos([]);
      setSeverity("medium");
      setNotifyHomeowner(true);

      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit violation",
        variant: "destructive"
      });
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setPhotos([...photos, data.url]);
      toast({ title: "Success", description: "Photo uploaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPropertyId) {
      toast({ title: "Error", description: "Please select a property", variant: "destructive" });
      return;
    }

    if (!violationType) {
      toast({ title: "Error", description: "Please select a violation type", variant: "destructive" });
      return;
    }

    if (!description.trim()) {
      toast({ title: "Error", description: "Please provide a description", variant: "destructive" });
      return;
    }

    createViolationMutation.mutate({
      propertyId: selectedPropertyId,
      violationType,
      description: description.trim(),
      severity,
      photos,
      deadline: deadline ? deadline.toISOString() : undefined,
      notifyHomeowner,
    });
  };

  const selectedProperty = properties?.find(p => p.id === selectedPropertyId);
  const selectedViolationType = VIOLATION_TYPES.find(v => v.value === violationType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Submit Violation</CardTitle>
              <CardDescription>
                Document property violations and notify homeowners
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              {propertiesLoading ? (
                <div className="h-10 bg-muted rounded animate-pulse" />
              ) : (
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select property..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          <span>{property.address}</span>
                          {property.ownerName && (
                            <span className="text-muted-foreground">({property.ownerName})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedProperty && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedProperty.address}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Violation Type */}
            <div className="space-y-2">
              <Label htmlFor="violation-type">Violation Type *</Label>
              <Select value={violationType} onValueChange={setViolationType}>
                <SelectTrigger id="violation-type">
                  <SelectValue placeholder="Select violation type..." />
                </SelectTrigger>
                <SelectContent>
                  {VIOLATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedViolationType && (
                <p className="text-xs text-muted-foreground">{selectedViolationType.description}</p>
              )}
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label>Severity</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={severity === "low" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeverity("low")}
                  className={severity === "low" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                >
                  Low
                </Button>
                <Button
                  type="button"
                  variant={severity === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeverity("medium")}
                  className={severity === "medium" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  Medium
                </Button>
                <Button
                  type="button"
                  variant={severity === "high" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeverity("high")}
                  className={severity === "high" ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  High
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the violation in detail. Include specific observations and relevant guidelines violated."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Be specific and objective. Include dates, measurements, or other relevant details.
              </p>
            </div>

            {/* Resolution Deadline */}
            <div className="space-y-2">
              <Label>Resolution Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Select deadline..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Optional: Set a date by which the violation must be resolved
              </p>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo Evidence</Label>
              <div className="space-y-3">
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-dashed rounded-lg p-6">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <Upload className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium mb-1">Click to upload photo</p>
                        <p className="text-xs text-muted-foreground">
                          Take photos from multiple angles showing the violation clearly
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notification Option */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <p className="font-medium text-sm">Notify Homeowner</p>
                <p className="text-xs text-muted-foreground">
                  Send automatic email and SMS notification to property owner
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyHomeowner}
                onChange={(e) => setNotifyHomeowner(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={createViolationMutation.isPending}
              >
                {createViolationMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Submit Violation
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedPropertyId("");
                  setViolationType("");
                  setDescription("");
                  setDeadline(undefined);
                  setPhotos([]);
                  setSeverity("medium");
                }}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
