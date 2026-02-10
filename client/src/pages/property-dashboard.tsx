import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PropertyHealthScore } from "@/components/properties/property-health-score";
import { ApplianceRegistry } from "@/components/properties/appliance-registry";
import { WarrantyTracker } from "@/components/properties/warranty-tracker";
import { InsuranceHub } from "@/components/properties/insurance-hub";
import { DocumentVault } from "@/components/properties/document-vault";
import { PropertyTimeline } from "@/components/properties/property-timeline";
import { MaintenanceCalendar } from "@/components/properties/maintenance-calendar";
import { Home, AlertCircle, TrendingUp, Calendar, FileText, Shield } from "lucide-react";
import type { Property } from "@db/schema";

export default function PropertyDashboard() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  async function fetchProperty() {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setProperty(data);
      }
    } catch (error) {
      console.error("Failed to fetch property:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Property not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Property Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">{property.address}</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              {property.city}, {property.state} {property.zipCode}
            </p>
            <div className="flex gap-3 mt-3">
              <Badge variant="secondary">
                {property.propertyType?.replace(/_/g, " ")}
              </Badge>
              {property.yearBuilt && (
                <Badge variant="outline">Built {property.yearBuilt}</Badge>
              )}
              {property.squareFootage && (
                <Badge variant="outline">{property.squareFootage.toLocaleString()} sq ft</Badge>
              )}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/properties">
              <span>← Back to Properties</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Property Health Score - Featured */}
      <div className="mb-8">
        <PropertyHealthScore propertyId={propertyId!} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appliances</p>
                <p className="text-2xl font-bold">{property.totalAppliancesRegistered || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Warranties</p>
                <p className="text-2xl font-bold">{property.totalWarrantiesActive || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{property.totalDocuments || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Due</p>
                <p className="text-2xl font-bold">{property.totalMaintenanceOverdue || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appliances">Appliances</TabsTrigger>
          <TabsTrigger value="warranties">Warranties</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Property Type</p>
                  <p className="font-medium">{property.propertyType?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year Built</p>
                  <p className="font-medium">{property.yearBuilt || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Square Footage</p>
                  <p className="font-medium">{property.squareFootage?.toLocaleString() || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms / Bathrooms</p>
                  <p className="font-medium">
                    {property.bedrooms || "?"} bed / {property.bathrooms || "?"} bath
                  </p>
                </div>
                {property.lotSizeAcres && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lot Size</p>
                    <p className="font-medium">{property.lotSizeAcres} acres</p>
                  </div>
                )}
                {property.roofAgeYears !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Roof Age</p>
                    <p className="font-medium">{property.roofAgeYears} years</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("timeline")}>
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PropertyTimeline propertyId={propertyId!} limit={5} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appliances" className="mt-6">
          <ApplianceRegistry propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="warranties" className="mt-6">
          <WarrantyTracker propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="insurance" className="mt-6">
          <InsuranceHub propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentVault propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <PropertyTimeline propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <MaintenanceCalendar propertyId={propertyId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
