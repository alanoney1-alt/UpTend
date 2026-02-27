import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/landing/header";
import { ServiceTimeline } from "@/components/home/service-timeline";
import { WarrantyTracker } from "@/components/home/warranty-tracker";
import { useToast } from "@/hooks/use-toast";
import {
  Home, Plus, Loader2, ArrowLeft, Building, Calendar, Wrench,
  Refrigerator, Shield, BarChart3,
} from "lucide-react";

function apiGet(url: string) {
  return fetch(url, { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });
}
function apiPost(url: string, body: any) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) }).then((r) => {
    if (!r.ok) throw new Error("Failed");
    return r.json();
  });
}

export default function HomeProfilePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showAddHome, setShowAddHome] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddAppliance, setShowAddAppliance] = useState(false);

  // Dashboard query
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["home-dashboard"],
    queryFn: () => apiGet("/api/home/dashboard"),
  });

  // Service history for selected profile
  const { data: historyData } = useQuery({
    queryKey: ["home-service-history", selectedProfile],
    queryFn: () => apiGet(`/api/home/service-history/${selectedProfile}`),
    enabled: !!selectedProfile,
  });

  // Appliances for selected profile
  const { data: appliancesData } = useQuery({
    queryKey: ["home-appliances", selectedProfile],
    queryFn: () => apiGet(`/api/home/appliances/${selectedProfile}`),
    enabled: !!selectedProfile,
  });

  // Add home mutation
  const [homeForm, setHomeForm] = useState({ address: "", city: "", state: "", zip: "", homeType: "single_family", squareFootage: "", yearBuilt: "", bedrooms: "", bathrooms: "" });
  const addHomeMutation = useMutation({
    mutationFn: () => apiPost("/api/home/profiles", {
      ...homeForm,
      squareFootage: homeForm.squareFootage ? Number(homeForm.squareFootage) : undefined,
      yearBuilt: homeForm.yearBuilt ? Number(homeForm.yearBuilt) : undefined,
      bedrooms: homeForm.bedrooms ? Number(homeForm.bedrooms) : undefined,
      bathrooms: homeForm.bathrooms ? Number(homeForm.bathrooms) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-dashboard"] });
      setShowAddHome(false);
      setHomeForm({ address: "", city: "", state: "", zip: "", homeType: "single_family", squareFootage: "", yearBuilt: "", bedrooms: "", bathrooms: "" });
      toast({ title: "Home added!" });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  // Add service history
  const [serviceForm, setServiceForm] = useState({ serviceType: "", provider: "", date: "", cost: "", notes: "" });
  const addServiceMutation = useMutation({
    mutationFn: () => apiPost("/api/home/service-history", {
      homeProfileId: selectedProfile,
      ...serviceForm,
      cost: serviceForm.cost ? Number(serviceForm.cost) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-service-history", selectedProfile] });
      qc.invalidateQueries({ queryKey: ["home-dashboard"] });
      setShowAddService(false);
      setServiceForm({ serviceType: "", provider: "", date: "", cost: "", notes: "" });
      toast({ title: "Service record added!" });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  // Add appliance
  const [applianceForm, setApplianceForm] = useState({ name: "", brand: "", model: "", warrantyExpiry: "" });
  const addApplianceMutation = useMutation({
    mutationFn: () => apiPost("/api/home/appliances", { homeProfileId: selectedProfile, ...applianceForm }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-appliances", selectedProfile] });
      qc.invalidateQueries({ queryKey: ["home-dashboard"] });
      setShowAddAppliance(false);
      setApplianceForm({ name: "", brand: "", model: "", warrantyExpiry: "" });
      toast({ title: "Appliance added!" });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const profiles = dashboard?.profiles || [];
  const activeProfile = profiles.find((p: any) => p.id === selectedProfile);

  // Auto-select first profile
  if (profiles.length > 0 && !selectedProfile) {
    setSelectedProfile(profiles[0].id);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Dashboard</Button>
            </Link>
            <h1 className="text-3xl font-bold mt-2 flex items-center gap-2"><Home className="w-8 h-8" /> My Home</h1>
          </div>
          <Dialog open={showAddHome} onOpenChange={setShowAddHome}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Home</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add a Home</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Address</Label><Input value={homeForm.address} onChange={(e) => setHomeForm({ ...homeForm, address: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>City</Label><Input value={homeForm.city} onChange={(e) => setHomeForm({ ...homeForm, city: e.target.value })} /></div>
                  <div><Label>State</Label><Input value={homeForm.state} onChange={(e) => setHomeForm({ ...homeForm, state: e.target.value })} /></div>
                  <div><Label>ZIP</Label><Input value={homeForm.zip} onChange={(e) => setHomeForm({ ...homeForm, zip: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Sq. Ft.</Label><Input type="number" value={homeForm.squareFootage} onChange={(e) => setHomeForm({ ...homeForm, squareFootage: e.target.value })} /></div>
                  <div><Label>Year Built</Label><Input type="number" value={homeForm.yearBuilt} onChange={(e) => setHomeForm({ ...homeForm, yearBuilt: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Bedrooms</Label><Input type="number" value={homeForm.bedrooms} onChange={(e) => setHomeForm({ ...homeForm, bedrooms: e.target.value })} /></div>
                  <div><Label>Bathrooms</Label><Input type="number" value={homeForm.bathrooms} onChange={(e) => setHomeForm({ ...homeForm, bathrooms: e.target.value })} /></div>
                </div>
                <Button className="w-full" onClick={() => addHomeMutation.mutate()} disabled={addHomeMutation.isPending || !homeForm.address || !homeForm.city}>
                  {addHomeMutation.isPending ? "Adding..." : "Add Home"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>}

        {!isLoading && profiles.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Add Your First Home</h2>
              <p className="text-muted-foreground mb-6">Track service history, appliances, warranties, and more.</p>
              <Button onClick={() => setShowAddHome(true)}><Plus className="w-4 h-4 mr-2" /> Add Home</Button>
            </CardContent>
          </Card>
        )}

        {profiles.length > 0 && (
          <>
            {/* Stats overview */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card><CardContent className="pt-6 flex items-center gap-3">
                <Building className="w-8 h-8 text-primary" />
                <div><p className="text-2xl font-bold">{dashboard?.stats.totalHomes}</p><p className="text-sm text-muted-foreground">Homes</p></div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 flex items-center gap-3">
                <Wrench className="w-8 h-8 text-blue-500" />
                <div><p className="text-2xl font-bold">{dashboard?.stats.totalServices}</p><p className="text-sm text-muted-foreground">Service Records</p></div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 flex items-center gap-3">
                <Refrigerator className="w-8 h-8 text-green-500" />
                <div><p className="text-2xl font-bold">{dashboard?.stats.totalAppliances}</p><p className="text-sm text-muted-foreground">Appliances</p></div>
              </CardContent></Card>
            </div>

            {/* Home selector */}
            {profiles.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {profiles.map((p: any) => (
                  <Button key={p.id} variant={selectedProfile === p.id ? "default" : "outline"} size="sm" onClick={() => setSelectedProfile(p.id)}>
                    <Home className="w-4 h-4 mr-1" /> {p.address.split(",")[0]}
                  </Button>
                ))}
              </div>
            )}

            {/* Warranty tracker (from dashboard data) */}
            <div className="mb-6">
              <WarrantyTracker warranties={dashboard?.expiringWarranties || []} />
            </div>

            {/* Tabs for selected home */}
            {activeProfile && (
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details"><Building className="w-4 h-4 mr-1" /> Details</TabsTrigger>
                  <TabsTrigger value="history"><Calendar className="w-4 h-4 mr-1" /> Service History</TabsTrigger>
                  <TabsTrigger value="appliances"><Refrigerator className="w-4 h-4 mr-1" /> Appliances</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><p className="text-sm text-muted-foreground">Address</p><p className="font-medium">{activeProfile.address}</p></div>
                        <div><p className="text-sm text-muted-foreground">City / State / ZIP</p><p className="font-medium">{activeProfile.city}, {activeProfile.state} {activeProfile.zip}</p></div>
                        <div><p className="text-sm text-muted-foreground">Type</p><p className="font-medium capitalize">{activeProfile.homeType?.replace("_", " ")}</p></div>
                        <div><p className="text-sm text-muted-foreground">Year Built</p><p className="font-medium">{activeProfile.yearBuilt || "-"}</p></div>
                        <div><p className="text-sm text-muted-foreground">Square Footage</p><p className="font-medium">{activeProfile.squareFootage ? `${activeProfile.squareFootage} sq ft` : "-"}</p></div>
                        <div><p className="text-sm text-muted-foreground">Bed / Bath</p><p className="font-medium">{activeProfile.bedrooms || "-"} bed / {activeProfile.bathrooms || "-"} bath</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <div className="flex justify-end mb-4">
                    <Dialog open={showAddService} onOpenChange={setShowAddService}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Record</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Service Record</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Service Type</Label><Input value={serviceForm.serviceType} onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })} placeholder="e.g., HVAC Tune-up" /></div>
                          <div><Label>Provider</Label><Input value={serviceForm.provider} onChange={(e) => setServiceForm({ ...serviceForm, provider: e.target.value })} /></div>
                          <div><Label>Date</Label><Input type="date" value={serviceForm.date} onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })} /></div>
                          <div><Label>Cost ($)</Label><Input type="number" value={serviceForm.cost} onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })} /></div>
                          <div><Label>Notes</Label><Textarea value={serviceForm.notes} onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })} /></div>
                          <Button className="w-full" onClick={() => addServiceMutation.mutate()} disabled={addServiceMutation.isPending || !serviceForm.serviceType || !serviceForm.date}>
                            {addServiceMutation.isPending ? "Adding..." : "Add Record"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <ServiceTimeline history={historyData?.history || []} />
                </TabsContent>

                <TabsContent value="appliances">
                  <div className="flex justify-end mb-4">
                    <Dialog open={showAddAppliance} onOpenChange={setShowAddAppliance}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Appliance</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Appliance</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Name</Label><Input value={applianceForm.name} onChange={(e) => setApplianceForm({ ...applianceForm, name: e.target.value })} placeholder="e.g., Water Heater" /></div>
                          <div><Label>Brand</Label><Input value={applianceForm.brand} onChange={(e) => setApplianceForm({ ...applianceForm, brand: e.target.value })} /></div>
                          <div><Label>Model</Label><Input value={applianceForm.model} onChange={(e) => setApplianceForm({ ...applianceForm, model: e.target.value })} /></div>
                          <div><Label>Warranty Expiry</Label><Input type="date" value={applianceForm.warrantyExpiry} onChange={(e) => setApplianceForm({ ...applianceForm, warrantyExpiry: e.target.value })} /></div>
                          <Button className="w-full" onClick={() => addApplianceMutation.mutate()} disabled={addApplianceMutation.isPending || !applianceForm.name}>
                            {addApplianceMutation.isPending ? "Adding..." : "Add Appliance"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(appliancesData?.appliances || []).map((a: any) => (
                      <Card key={a.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{a.name}</h4>
                              <p className="text-sm text-muted-foreground">{[a.brand, a.model].filter(Boolean).join(" · ") || "No details"}</p>
                            </div>
                            {a.warrantyExpiry && (
                              <Badge variant={new Date(a.warrantyExpiry) < new Date() ? "destructive" : "outline"} className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                {new Date(a.warrantyExpiry) < new Date() ? "Expired" : `Until ${new Date(a.warrantyExpiry).toLocaleDateString()}`}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(appliancesData?.appliances || []).length === 0 && (
                      <Card className="col-span-2"><CardContent className="py-8 text-center text-muted-foreground">No appliances tracked yet.</CardContent></Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </main>
    </div>
  );
}
