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
import { Shield, Plus, FileText, DollarSign, Calendar, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyInsurance } from "@db/schema";

interface InsuranceHubProps {
  propertyId: string;
}

export function InsuranceHub({ propertyId }: InsuranceHubProps) {
  const [insurancePolicies, setInsurancePolicies] = useState<PropertyInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchInsurance();
  }, [propertyId]);

  async function fetchInsurance() {
    try {
      const response = await fetch(`/api/properties/${propertyId}/insurance`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setInsurancePolicies(data);
      }
    } catch (error) {
      console.error("Failed to fetch insurance:", error);
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Insurance Hub</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track insurance policies and claim history
              </p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Insurance Policy</DialogTitle>
                  <DialogDescription>
                    Add an insurance policy to track coverage and claims
                  </DialogDescription>
                </DialogHeader>
                <AddInsuranceForm
                  propertyId={propertyId}
                  onSuccess={() => {
                    setAddDialogOpen(false);
                    fetchInsurance();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Policies List */}
      {insurancePolicies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No insurance policies on file</h3>
              <p className="text-muted-foreground mb-6">
                Add your insurance policies to track coverage and claims
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insurancePolicies.map((policy) => (
            <Card key={policy.id} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Shield className="h-8 w-8 text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{policy.provider}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {policy.policyType?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {policy.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <FileText className="h-3 w-3" />
                          Policy Number
                        </div>
                        <p className="font-medium font-mono text-sm">{policy.policyNumber}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <DollarSign className="h-3 w-3" />
                          Premium
                        </div>
                        <p className="font-medium">
                          ${policy.annualPremium?.toLocaleString()}/year
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          Renewal Date
                        </div>
                        <p className="font-medium">
                          {policy.renewalDate
                            ? new Date(policy.renewalDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {policy.coverageAmount && (
                      <div className="p-3 bg-blue-50 rounded-lg mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Coverage Amount</p>
                        <p className="text-lg font-bold text-blue-900">
                          ${policy.coverageAmount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {policy.deductible && (
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Deductible:</span>{" "}
                          <span className="font-medium">${policy.deductible.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {policy.agentName && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Agent</p>
                            <p className="font-medium">{policy.agentName}</p>
                          </div>
                          {policy.agentPhone && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`tel:${policy.agentPhone}`}>
                                <Phone className="h-3 w-3 mr-2" />
                                Call Agent
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {policy.documentUrl && (
                      <div className="mt-3">
                        <a
                          href={policy.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Policy Document →
                        </a>
                      </div>
                    )}

                    {/* Claims History */}
                    {policy.totalClaimsFiled && policy.totalClaimsFiled > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Claims Filed</p>
                            <p className="font-bold">{policy.totalClaimsFiled}</p>
                          </div>
                          {policy.totalClaimsApproved !== undefined && (
                            <div>
                              <p className="text-xs text-muted-foreground">Approved</p>
                              <p className="font-bold text-green-600">{policy.totalClaimsApproved}</p>
                            </div>
                          )}
                          {policy.totalClaimsDenied !== undefined && (
                            <div>
                              <p className="text-xs text-muted-foreground">Denied</p>
                              <p className="font-bold text-red-600">{policy.totalClaimsDenied}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insurance Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Insurance Tips</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Review your coverage annually to ensure adequate protection</li>
            <li>• Document your property with photos and videos for claims</li>
            <li>• Maintain records of all improvements and upgrades</li>
            <li>• Consider flood insurance even if not in a high-risk area</li>
            <li>• Bundle policies with the same provider for discounts</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function AddInsuranceForm({
  propertyId,
  onSuccess,
}: {
  propertyId: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    policyType: "",
    provider: "",
    policyNumber: "",
    coverageAmount: "",
    annualPremium: "",
    deductible: "",
    renewalDate: "",
    agentName: "",
    agentPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.provider || !formData.policyNumber) {
      alert("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/insurance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          propertyId,
          ...formData,
          coverageAmount: formData.coverageAmount ? parseFloat(formData.coverageAmount) : null,
          annualPremium: formData.annualPremium ? parseFloat(formData.annualPremium) : null,
          deductible: formData.deductible ? parseFloat(formData.deductible) : null,
          status: "active",
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("Failed to add insurance policy");
      }
    } catch (error) {
      console.error("Failed to add insurance:", error);
      alert("Failed to add insurance policy");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="policyType">Policy Type *</Label>
        <Select
          value={formData.policyType}
          onValueChange={(value) => setFormData({ ...formData, policyType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="homeowners">Homeowners Insurance</SelectItem>
            <SelectItem value="renters">Renters Insurance</SelectItem>
            <SelectItem value="condo">Condo Insurance</SelectItem>
            <SelectItem value="flood">Flood Insurance</SelectItem>
            <SelectItem value="earthquake">Earthquake Insurance</SelectItem>
            <SelectItem value="umbrella">Umbrella Policy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="provider">Insurance Provider *</Label>
        <Input
          id="provider"
          placeholder="e.g., State Farm"
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="policyNumber">Policy Number *</Label>
        <Input
          id="policyNumber"
          placeholder="e.g., HO-123456789"
          value={formData.policyNumber}
          onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="coverageAmount">Coverage Amount</Label>
          <Input
            id="coverageAmount"
            type="number"
            placeholder="e.g., 500000"
            value={formData.coverageAmount}
            onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="deductible">Deductible</Label>
          <Input
            id="deductible"
            type="number"
            placeholder="e.g., 2500"
            value={formData.deductible}
            onChange={(e) => setFormData({ ...formData, deductible: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="annualPremium">Annual Premium</Label>
          <Input
            id="annualPremium"
            type="number"
            placeholder="e.g., 1200"
            value={formData.annualPremium}
            onChange={(e) => setFormData({ ...formData, annualPremium: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="renewalDate">Renewal Date</Label>
          <Input
            id="renewalDate"
            type="date"
            value={formData.renewalDate}
            onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="agentName">Agent Name</Label>
        <Input
          id="agentName"
          placeholder="e.g., John Smith"
          value={formData.agentName}
          onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="agentPhone">Agent Phone</Label>
        <Input
          id="agentPhone"
          type="tel"
          placeholder="e.g., (555) 123-4567"
          value={formData.agentPhone}
          onChange={(e) => setFormData({ ...formData, agentPhone: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Adding..." : "Add Insurance Policy"}
      </Button>
    </form>
  );
}
