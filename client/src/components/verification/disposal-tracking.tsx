import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, Loader2, X, Plus, Upload, Recycle, Heart, ShoppingBag, Trash2, Zap } from "lucide-react";

interface DisposalTrackingProps {
  jobId: string;
  serviceType: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface DisposalRecord {
  id: string;
  itemDescription: string;
  estimatedWeightLbs: number;
  category: string;
  destinationName: string;
  receiptPhotoUrl?: string;
}

export function DisposalTracking({ jobId, onComplete, onCancel }: DisposalTrackingProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [itemDescription, setItemDescription] = useState("");
  const [estimatedWeightLbs, setEstimatedWeightLbs] = useState("");
  const [category, setCategory] = useState<string>("");
  const [destinationName, setDestinationName] = useState("");
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Category-specific fields
  const [donationOrganization, setDonationOrganization] = useState("");
  const [resalePlatform, setResalePlatform] = useState("");
  const [landfillReason, setLandfillReason] = useState("");
  const [specialtyDisposalType, setSpecialtyDisposalType] = useState("");

  // Fetch existing records
  const { data: disposalStatus, isLoading } = useQuery({
    queryKey: [`/api/jobs/${jobId}/verification/disposal-status`],
  });

  const records: DisposalRecord[] = disposalStatus?.disposalRecords || [];

  const addRecordMutation = useMutation({
    mutationFn: async () => {
      if (!itemDescription || !estimatedWeightLbs || !category || !destinationName) {
        throw new Error("All fields are required");
      }

      const data: any = {
        itemDescription,
        estimatedWeightLbs: parseFloat(estimatedWeightLbs),
        category,
        destinationName,
        receiptPhotoUrl: receiptPhotoUrl || undefined,
      };

      // Add category-specific fields
      if (category === "donate" && donationOrganization) {
        data.donationOrganization = donationOrganization;
      }
      if (category === "resale" && resalePlatform) {
        data.resalePlatform = resalePlatform;
      }
      if (category === "landfill" && landfillReason) {
        data.landfillReason = landfillReason;
      }
      if (category === "specialty" && specialtyDisposalType) {
        data.specialtyDisposalType = specialtyDisposalType;
      }

      return apiRequest("POST", `/api/jobs/${jobId}/verification/disposal-record`, data);
    },
    onSuccess: () => {
      toast({
        title: "Item logged",
        description: "Disposal record added successfully",
      });
      // Reset form
      setItemDescription("");
      setEstimatedWeightLbs("");
      setCategory("");
      setDestinationName("");
      setReceiptPhotoUrl("");
      setDonationOrganization("");
      setResalePlatform("");
      setLandfillReason("");
      setSpecialtyDisposalType("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/verification/disposal-status`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add item",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiRequest("POST", "/api/object-storage/upload", formData);
      setReceiptPhotoUrl(result.url);
      toast({
        title: "Receipt uploaded",
        description: "Proof of disposal added",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const categories = [
    { value: "recycle", label: "Recycle", icon: Recycle, color: "text-green-600" },
    { value: "donate", label: "Donate", icon: Heart, color: "text-pink-600" },
    { value: "resale", label: "Resale", icon: ShoppingBag, color: "text-blue-600" },
    { value: "landfill", label: "Landfill", icon: Trash2, color: "text-gray-600" },
    { value: "specialty", label: "Specialty (E-waste/Hazmat)", icon: Zap, color: "text-yellow-600" },
  ];

  const getCategoryIcon = (cat: string) => {
    const category = categories.find(c => c.value === cat);
    return category ? <category.icon className={`w-4 h-4 ${category.color}`} /> : null;
  };

  const totalWeight = records.reduce((sum, r) => sum + r.estimatedWeightLbs, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Item Disposal Tracking</CardTitle>
              <p className="text-sm text-muted-foreground">
                Log every item and its disposal method
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
            📦 Item Tracking Guidelines:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
            <li>Log EVERY item removed from the site</li>
            <li>Estimate weight as accurately as possible</li>
            <li>Upload receipts from recycling centers, donation centers, landfills, etc.</li>
            <li>Your sustainability report is generated from this data</li>
          </ul>
        </div>

        {/* Summary Stats */}
        {records.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{records.length}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Weight</p>
              <p className="text-2xl font-bold">{totalWeight.toFixed(0)} lbs</p>
            </div>
          </div>
        )}

        {/* Existing Records */}
        {records.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Logged Items ({records.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(record.category)}
                    <div>
                      <p className="font-medium text-sm">{record.itemDescription}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.estimatedWeightLbs} lbs • {record.destinationName}
                      </p>
                    </div>
                  </div>
                  {record.receiptPhotoUrl && (
                    <Badge variant="outline" className="text-xs">
                      Receipt ✓
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Item Form */}
        {showForm ? (
          <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
            <h3 className="font-semibold">Add Item</h3>

            <div className="space-y-2">
              <Label>Item Description</Label>
              <Input
                placeholder="e.g., Leather sofa, Wooden desk"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Weight (lbs)</Label>
              <Input
                type="number"
                placeholder="e.g., 150"
                value={estimatedWeightLbs}
                onChange={(e) => setEstimatedWeightLbs(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Disposal Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className={`w-4 h-4 ${cat.color}`} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category-specific fields */}
            {category === "donate" && (
              <div className="space-y-2">
                <Label>Donation Organization</Label>
                <Input
                  placeholder="e.g., Goodwill, Salvation Army"
                  value={donationOrganization}
                  onChange={(e) => setDonationOrganization(e.target.value)}
                />
              </div>
            )}

            {category === "resale" && (
              <div className="space-y-2">
                <Label>Resale Platform</Label>
                <Input
                  placeholder="e.g., Facebook Marketplace, OfferUp"
                  value={resalePlatform}
                  onChange={(e) => setResalePlatform(e.target.value)}
                />
              </div>
            )}

            {category === "landfill" && (
              <div className="space-y-2">
                <Label>Reason for Landfill</Label>
                <Textarea
                  placeholder="Explain why this item couldn't be recycled, donated, or resold"
                  value={landfillReason}
                  onChange={(e) => setLandfillReason(e.target.value)}
                />
              </div>
            )}

            {category === "specialty" && (
              <div className="space-y-2">
                <Label>Specialty Type</Label>
                <Select value={specialtyDisposalType} onValueChange={setSpecialtyDisposalType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="e-waste">E-waste</SelectItem>
                    <SelectItem value="hazmat">Hazardous Materials</SelectItem>
                    <SelectItem value="battery">Batteries</SelectItem>
                    <SelectItem value="paint">Paint</SelectItem>
                    <SelectItem value="chemicals">Chemicals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Destination/Facility Name</Label>
              <Input
                placeholder="e.g., Orange County Recycling Center"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Receipt/Proof (Optional)</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {receiptPhotoUrl && (
                <p className="text-xs text-green-600">✓ Receipt uploaded</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => addRecordMutation.mutate()}
                disabled={addRecordMutation.isPending}
                className="flex-1"
              >
                {addRecordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Item"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}

        {/* Done Button */}
        {records.length > 0 && !showForm && (
          <Button onClick={onComplete} className="w-full" variant="default">
            Continue to After Photos →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
