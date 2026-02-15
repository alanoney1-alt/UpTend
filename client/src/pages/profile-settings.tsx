import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Bell,
  Truck,
  Wallet,
  Radius,
  Camera,
  Loader2,
  ExternalLink,
  Mail,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Star,
  Home,
  Building,
} from "lucide-react";

interface CustomerAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export default function ProfileSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isPro = user?.role === "hauler" || user?.role === "pro" || user?.role === "worker";

  const [notifSms, setNotifSms] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [serviceRadius, setServiceRadius] = useState([20]);

  const addressesQuery = useQuery<CustomerAddress[]>({
    queryKey: ["/api/customers/addresses"],
    enabled: !!user && !isPro,
  });

  const paymentMethodsQuery = useQuery<PaymentMethod[]>({
    queryKey: ["/api/customers/payment-methods"],
    enabled: !!user && !isPro,
  });

  const proProfileQuery = useQuery<any>({
    queryKey: ["/api/pro/profile"],
    enabled: !!user && isPro,
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/customers/addresses/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Address removed" });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/customers/addresses/${id}/set-default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Default address updated" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to manage your settings.</p>
          <Link href="/login">
            <Button className="w-full" data-testid="button-go-to-login">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-profile-settings">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon" data-testid="button-back-profile">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isPro ? <ProSettings profile={proProfileQuery.data} /> : (
          <HomeownerSettings
            addresses={addressesQuery.data || []}
            addressesLoading={addressesQuery.isLoading}
            paymentMethods={paymentMethodsQuery.data || []}
            paymentsLoading={paymentMethodsQuery.isLoading}
            onDeleteAddress={(id) => deleteAddressMutation.mutate(id)}
            onSetDefaultAddress={(id) => setDefaultAddressMutation.mutate(id)}
            notifSms={notifSms}
            notifEmail={notifEmail}
            onNotifSmsChange={setNotifSms}
            onNotifEmailChange={setNotifEmail}
          />
        )}
      </main>
    </div>
  );
}

function HomeownerSettings({
  addresses,
  addressesLoading,
  paymentMethods,
  paymentsLoading,
  onDeleteAddress,
  onSetDefaultAddress,
  notifSms,
  notifEmail,
  onNotifSmsChange,
  onNotifEmailChange,
}: {
  addresses: CustomerAddress[];
  addressesLoading: boolean;
  paymentMethods: PaymentMethod[];
  paymentsLoading: boolean;
  onDeleteAddress: (id: string) => void;
  onSetDefaultAddress: (id: string) => void;
  notifSms: boolean;
  notifEmail: boolean;
  onNotifSmsChange: (v: boolean) => void;
  onNotifEmailChange: (v: boolean) => void;
}) {
  return (
    <Tabs defaultValue="addresses" data-testid="tabs-homeowner-settings">
      <TabsList className="w-full">
        <TabsTrigger value="addresses" className="flex-1" data-testid="tab-addresses">
          <MapPin className="w-4 h-4 mr-1" />
          Addresses
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex-1" data-testid="tab-payments">
          <CreditCard className="w-4 h-4 mr-1" />
          Payments
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex-1" data-testid="tab-notifications">
          <Bell className="w-4 h-4 mr-1" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="addresses" className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">My Saved Addresses</h3>
          <Link href="/profile">
            <Button variant="outline" size="sm" data-testid="button-add-address">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </Link>
        </div>
        {addressesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : addresses.length > 0 ? (
          addresses.map((addr) => (
            <Card key={addr.id} className="p-4" data-testid={`address-card-${addr.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {addr.label.toLowerCase().includes("home") ? (
                      <Home className="w-5 h-5 text-primary" />
                    ) : addr.label.toLowerCase().includes("work") ? (
                      <Building className="w-5 h-5 text-primary" />
                    ) : (
                      <MapPin className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{addr.label}</h4>
                      {addr.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{addr.street}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zipCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!addr.isDefault && (
                    <Button variant="ghost" size="icon" onClick={() => onSetDefaultAddress(addr.id)} data-testid={`button-default-addr-${addr.id}`}>
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onDeleteAddress(addr.id)} data-testid={`button-delete-addr-${addr.id}`}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>No saved addresses yet.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="payments" className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Payment Methods</h3>
          <Link href="/payment-setup">
            <Button variant="outline" size="sm" data-testid="button-add-payment-method">
              <Plus className="w-4 h-4 mr-1" />
              Add Card
            </Button>
          </Link>
        </div>

        <Card className="p-4 hover-elevate" data-testid="card-stripe-portal">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Stripe Customer Portal</p>
                <p className="text-xs text-muted-foreground">Manage cards, invoices, and billing</p>
              </div>
            </div>
            <Button variant="outline" size="sm" data-testid="button-open-stripe-portal">
              <ExternalLink className="w-4 h-4 mr-1" />
              Open
            </Button>
          </div>
        </Card>

        {paymentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : paymentMethods.length > 0 ? (
          paymentMethods.map((pm) => (
            <Card key={pm.id} className="p-4" data-testid={`payment-card-${pm.id}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">{pm.brand} •••• {pm.last4}</p>
                    <p className="text-sm text-muted-foreground">Exp {pm.expMonth}/{pm.expYear}</p>
                  </div>
                  {pm.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>No cards on file. Add one for faster booking.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="notifications" className="mt-4 space-y-4">
        <h3 className="font-semibold">Notification Preferences</h3>
        <Card className="divide-y" data-testid="card-notification-prefs">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">SMS Notifications</p>
                <p className="text-xs text-muted-foreground">Receive job updates and alerts via text</p>
              </div>
            </div>
            <Switch checked={notifSms} onCheckedChange={onNotifSmsChange} data-testid="switch-sms" />
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receipts, weekly summaries, and promotions</p>
              </div>
            </div>
            <Switch checked={notifEmail} onCheckedChange={onNotifEmailChange} data-testid="switch-email" />
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">George</p>
                <p className="text-xs text-muted-foreground">AI assistant sidebar that helps you navigate and book</p>
              </div>
            </div>
            <Switch
              checked={localStorage.getItem("uptend-guide-disabled") !== "true"}
              onCheckedChange={(checked) => {
                if (checked) {
                  localStorage.removeItem("uptend-guide-disabled");
                } else {
                  localStorage.setItem("uptend-guide-disabled", "true");
                }
                window.location.reload();
              }}
              data-testid="switch-guide"
            />
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function ProSettings({ profile }: { profile: any }) {
  const { toast } = useToast();
  const [serviceRadius, setServiceRadius] = useState([profile?.serviceRadius || 20]);

  const updateRadiusMutation = useMutation({
    mutationFn: async (radius: number) => {
      return apiRequest("PATCH", "/api/pro/profile", { serviceRadius: radius });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pro/profile"] });
      toast({ title: "Service radius updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update radius.", variant: "destructive" });
    },
  });

  return (
    <Tabs defaultValue="deposit" data-testid="tabs-pro-settings">
      <TabsList className="w-full">
        <TabsTrigger value="deposit" className="flex-1" data-testid="tab-deposit">
          <Wallet className="w-4 h-4 mr-1" />
          Payouts
        </TabsTrigger>
        <TabsTrigger value="vehicle" className="flex-1" data-testid="tab-vehicle">
          <Truck className="w-4 h-4 mr-1" />
          Vehicle
        </TabsTrigger>
        <TabsTrigger value="radius" className="flex-1" data-testid="tab-radius">
          <Radius className="w-4 h-4 mr-1" />
          Radius
        </TabsTrigger>
      </TabsList>

      <TabsContent value="deposit" className="mt-4 space-y-4">
        <h3 className="font-semibold">Direct Deposit Info</h3>
        <Card data-testid="card-stripe-connect">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-md bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-sm">Stripe Connect</p>
                <p className="text-sm text-muted-foreground">
                  Earnings are deposited directly to your bank account via Stripe. Manage your payout schedule, tax info, and bank details through the Stripe portal.
                </p>
              </div>
            </div>
            <Button className="w-full gap-2" data-testid="button-stripe-connect">
              <ExternalLink className="w-4 h-4" />
              Open Stripe Dashboard
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Payout Rate</p>
                <p className="text-2xl font-bold" data-testid="text-payout-rate">
                  {profile?.payoutRate ? `${profile.payoutRate}%` : "80%"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tier</p>
                <p className="text-2xl font-bold capitalize" data-testid="text-tier">
                  {profile?.level || "Rookie"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Section */}
        <h3 className="font-semibold mt-6">Liability Insurance</h3>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-md bg-green-500/10">
                <svg className="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-semibold text-sm">Have your own liability insurance?</p>
                  <p className="text-sm text-muted-foreground">
                    Pros with their own insurance waive the $10/job surcharge
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="has-insurance" className="text-sm font-medium">
                    I have my own liability insurance
                  </Label>
                  <Switch
                    id="has-insurance"
                    checked={profile?.hasOwnLiabilityInsurance || false}
                    onCheckedChange={async (checked) => {
                      try {
                        await apiRequest("PATCH", "/api/pro/profile", {
                          hasOwnLiabilityInsurance: checked,
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/pro/profile"] });
                        toast({
                          title: checked ? "Insurance enabled" : "Insurance disabled",
                          description: checked
                            ? "Upload your certificate to waive the $10/job surcharge"
                            : "You'll be charged $10/job for UpTend's liability coverage",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to update insurance status",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                </div>
                {profile?.hasOwnLiabilityInsurance && (
                  <div className="pt-2 border-t space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Upload your Certificate of Insurance (COI) to waive the surcharge
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append("file", file);
                          try {
                            const uploadRes = await fetch("/api/upload", {
                              method: "POST",
                              body: formData,
                              credentials: "include",
                            });
                            if (!uploadRes.ok) throw new Error("Upload failed");
                            const result = await uploadRes.json();
                            await apiRequest("PATCH", "/api/pro/profile", {
                              liabilityInsuranceCertificateUrl: result.url,
                              liabilityInsuranceVerifiedAt: new Date().toISOString(),
                            });
                            queryClient.invalidateQueries({ queryKey: ["/api/pro/profile"] });
                            toast({
                              title: "Certificate uploaded",
                              description: "$10/job surcharge waived!",
                            });
                          } catch (error) {
                            toast({
                              title: "Upload failed",
                              description: "Please try again",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    />
                    {profile?.liabilityInsuranceCertificateUrl && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 font-medium">✓ Certificate on file</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(profile.liabilityInsuranceCertificateUrl, "_blank")}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {!profile?.hasOwnLiabilityInsurance && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> $10 will be deducted from your payout per job to cover UpTend's $1M liability insurance
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="vehicle" className="mt-4 space-y-4">
        <h3 className="font-semibold">Vehicle Information</h3>
        <Card data-testid="card-vehicle-info">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">Current Vehicle</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {profile?.vehicleType?.replace(/_/g, " ") || "Not set"}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {profile?.vehicleType || "Unknown"}
              </Badge>
            </div>

            <div className="border rounded-md p-4 flex flex-col items-center gap-3 bg-muted/30" data-testid="upload-truck-photo">
              <Camera className="w-10 h-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center">Upload or update your truck photo</p>
              <Button variant="outline" size="sm" data-testid="button-upload-truck-photo">
                <Camera className="w-4 h-4 mr-1" />
                Upload Photo
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Make</Label>
                  <p className="font-medium text-sm" data-testid="text-vehicle-make">
                    {profile?.registrationData?.vehicleMake || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Model</Label>
                  <p className="font-medium text-sm" data-testid="text-vehicle-model">
                    {profile?.registrationData?.vehicleModel || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <p className="font-medium text-sm" data-testid="text-vehicle-year">
                    {profile?.registrationData?.vehicleYear || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Plate</Label>
                  <p className="font-medium text-sm" data-testid="text-vehicle-plate">
                    {profile?.registrationData?.licensePlate || "—"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="radius" className="mt-4 space-y-4">
        <h3 className="font-semibold">Service Radius</h3>
        <Card data-testid="card-service-radius">
          <CardContent className="p-5 space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold" data-testid="text-radius-value">
                {serviceRadius[0]} mi
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                I travel up to {serviceRadius[0]} miles for jobs
              </p>
            </div>

            <Slider
              value={serviceRadius}
              onValueChange={setServiceRadius}
              min={5}
              max={50}
              step={1}
              data-testid="slider-radius"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>5 mi</span>
              <span>25 mi</span>
              <span>50 mi</span>
            </div>

            <Button
              className="w-full"
              onClick={() => updateRadiusMutation.mutate(serviceRadius[0])}
              disabled={updateRadiusMutation.isPending}
              data-testid="button-save-radius"
            >
              {updateRadiusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Save Radius
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
