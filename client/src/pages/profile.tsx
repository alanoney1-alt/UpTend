import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HomeDnaScoreWidget } from "@/components/home-dna-score-widget";
import { MaintenancePlan } from "@/components/maintenance-plan";
import { ImpactDashboard } from "@/components/impact-dashboard";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Home,
  Building,
  Star,
  Check,
  X,
  Send,
  FileText,
  ArrowRightLeft,
  Shield,
  Clock,
  Package,
  TrendingUp,
  Truck,
  DollarSign,
  Award,
  Settings,
  Wallet,
  Radius,
  BadgeCheck,
  ShieldCheck,
  ChevronDown,
  CalendarPlus,
  MessageCircle
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CustomerAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  yearBuilt?: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

function AddressCard({ 
  address, 
  onEdit, 
  onDelete, 
  onSetDefault 
}: { 
  address: CustomerAddress; 
  onEdit: () => void; 
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <Card className="p-4" data-testid={`address-card-${address.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {address.label.toLowerCase().includes('home') ? (
              <Home className="w-5 h-5 text-primary" />
            ) : address.label.toLowerCase().includes('work') ? (
              <Building className="w-5 h-5 text-primary" />
            ) : (
              <MapPin className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{address.label}</h4>
              {address.isDefault && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{address.street}</p>
            <p className="text-sm text-muted-foreground">{address.city}, {address.state} {address.zipCode}</p>
            {(address.bedrooms || address.bathrooms || address.sqft) && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {[
                  address.bedrooms && `${address.bedrooms} bd`,
                  address.bathrooms && `${address.bathrooms} ba`,
                  address.sqft && `${address.sqft} sqft`,
                  address.yearBuilt && `Built ${address.yearBuilt}`,
                ].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!address.isDefault && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onSetDefault}
              data-testid={`button-set-default-${address.id}`}
            >
              <Star className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEdit}
            data-testid={`button-edit-address-${address.id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            data-testid={`button-delete-address-${address.id}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PaymentMethodCard({ 
  method, 
  onDelete,
  onSetDefault
}: { 
  method: PaymentMethod; 
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const brandColors: Record<string, string> = {
    visa: "text-blue-600",
    mastercard: "text-orange-500",
    amex: "text-blue-400",
    discover: "text-orange-600",
  };

  return (
    <Card className="p-4" data-testid={`payment-card-${method.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <CreditCard className={`w-5 h-5 ${brandColors[method.brand.toLowerCase()] || 'text-muted-foreground'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium capitalize">{method.brand} •••• {method.last4}</p>
              {method.isDefault && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Expires {method.expMonth}/{method.expYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!method.isDefault && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onSetDefault}
              data-testid={`button-set-default-payment-${method.id}`}
            >
              <Star className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            data-testid={`button-delete-payment-${method.id}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AddAddressDialog({ 
  open, 
  onOpenChange, 
  editAddress,
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  editAddress?: CustomerAddress | null;
  onSave: (data: Partial<CustomerAddress>) => void;
}) {
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");

  // Sync form fields when editAddress changes (fixes edit not pre-filling)
  useEffect(() => {
    if (editAddress) {
      setLabel(editAddress.label || "");
      setStreet(editAddress.street || "");
      setCity(editAddress.city || "");
      setState(editAddress.state || "");
      setZipCode(editAddress.zipCode || "");
      setBedrooms((editAddress as any).bedrooms || "");
      setBathrooms((editAddress as any).bathrooms || "");
      setSqft((editAddress as any).sqft || "");
      setYearBuilt((editAddress as any).yearBuilt || "");
    } else {
      setLabel("");
      setStreet("");
      setCity("");
      setState("");
      setZipCode("");
      setBedrooms("");
      setBathrooms("");
      setSqft("");
      setYearBuilt("");
    }
  }, [editAddress, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ label, street, city, state, zipCode, ...(bedrooms && { bedrooms }), ...(bathrooms && { bathrooms }), ...(sqft && { sqft }), ...(yearBuilt && { yearBuilt }) } as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogDescription>
            Save an address for faster booking.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input 
              id="label" 
              placeholder="Home, Work, etc." 
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              data-testid="input-address-label"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input 
              id="street" 
              placeholder="123 Main St" 
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
              data-testid="input-address-street"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                placeholder="Orlando" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                data-testid="input-address-city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input 
                id="state" 
                placeholder="FL" 
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                data-testid="input-address-state"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input 
              id="zipCode" 
              placeholder="32801" 
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              required
              data-testid="input-address-zip"
            />
          </div>

          <Separator className="my-2" />
          <p className="text-sm font-medium text-muted-foreground">Home Specs (optional)</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input 
                id="bedrooms" 
                placeholder="3" 
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                data-testid="input-address-bedrooms"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input 
                id="bathrooms" 
                placeholder="2" 
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                data-testid="input-address-bathrooms"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sqft">Sq Ft</Label>
              <Input 
                id="sqft" 
                placeholder="1,800" 
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                data-testid="input-address-sqft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input 
                id="yearBuilt" 
                placeholder="2005" 
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                data-testid="input-address-yearbuilt"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-address">
              {editAddress ? "Save Changes" : "Add Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProProfileSection() {
  const { user } = useAuth();

  const proProfileQuery = useQuery<any>({
    queryKey: ["/api/pro/profile"],
    enabled: !!user,
  });

  const proData = proProfileQuery.data;

  return (
    <>
      {/* Quick Stats */}
      <Card className="p-6 mb-6" data-testid="card-pro-stats">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Quick Stats</h3>
        </div>
        {proProfileQuery.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-primary">{proData?.payoutRate ? `$${proData.payoutRate}` : '—'}</p>
              <p className="text-xs text-muted-foreground">Payout Rate</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-primary">{proData?.tier || proData?.level || '—'}</p>
              <p className="text-xs text-muted-foreground">Tier / Level</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-primary">{proData?.serviceRadius ? `${proData.serviceRadius} mi` : '—'}</p>
              <p className="text-xs text-muted-foreground">Service Radius</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-primary">{proData?.jobsCompleted ?? proData?.completedJobs ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Jobs Completed</p>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/career">
          <Card className="p-4 hover-elevate cursor-pointer" data-testid="link-career-dashboard">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">Career Dashboard</p>
                <p className="text-xs text-muted-foreground">Track your progression</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/earnings">
          <Card className="p-4 hover-elevate cursor-pointer" data-testid="link-earnings">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-sm">Earnings</p>
                <p className="text-xs text-muted-foreground">View your payouts</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Vehicle Info */}
      <Card className="p-6 mb-6" data-testid="card-vehicle-info">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Vehicle</h3>
        </div>
        {proData && (proData.vehicleMake || proData.vehicleModel) ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Make / Model</span>
              <span className="font-medium">{proData.vehicleMake} {proData.vehicleModel}</span>
            </div>
            {proData.vehicleYear && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium">{proData.vehicleYear}</span>
              </div>
            )}
            {proData.licensePlate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plate</span>
                <span className="font-medium">{proData.licensePlate}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No vehicle info added. Update in Settings.</p>
        )}
      </Card>

      {/* Certifications & Insurance */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/certifications">
          <Card className="p-4 hover-elevate cursor-pointer" data-testid="link-certifications">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-sm">Certifications</p>
                <p className="text-xs text-muted-foreground">View & manage</p>
              </div>
            </div>
          </Card>
        </Link>
        <Card className="p-4" data-testid="card-insurance-status">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${proData?.hasOwnInsurance ? 'bg-green-500/10' : 'bg-muted'}`}>
              <ShieldCheck className={`w-5 h-5 ${proData?.hasOwnInsurance ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-bold text-sm">Insurance</p>
              <p className="text-xs text-muted-foreground">
                {proData?.hasOwnInsurance ? 'Own coverage' : 'UpTend covered'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Link */}
      <Link href="/profile/settings">
        <Card className="p-4 hover-elevate cursor-pointer" data-testid="link-pro-settings">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">Settings</p>
              <p className="text-xs text-muted-foreground">Vehicle, radius, notifications & more</p>
            </div>
          </div>
        </Card>
      </Link>
    </>
  );
}

export default function Profile() {
  usePageTitle("My Profile | UpTend");
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferPropertyHash, setTransferPropertyHash] = useState("");
  const [transferPropertyAddress, setTransferPropertyAddress] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ profile: true });
  const toggleSection = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const isPro = user?.role === "hauler" || user?.role === "pro" || user?.role === "worker";

  const userInitials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : '';

  const addressesQuery = useQuery<CustomerAddress[]>({
    queryKey: ["/api/customers/addresses"],
    enabled: !!user && !isPro,
  });

  const paymentMethodsQuery = useQuery<PaymentMethod[]>({
    queryKey: ["/api/customers/payment-methods"],
    enabled: !!user && !isPro,
  });

  interface PropertyWithTransfers {
    id: string;
    addressHash: string | null;
    fullAddress: string | null;
    ownerId: string | null;
    maintenanceScore: number | null;
    lastAssessmentDate: string | null;
    estimatedValueIncrease: number | null;
    transfers: Array<{
      id: string;
      toEmail: string;
      status: string | null;
      createdAt: string | null;
    }>;
  }

  const propertiesQuery = useQuery<PropertyWithTransfers[]>({
    queryKey: ["/api/properties/my-properties"],
    enabled: !!user && !isPro,
  });

  const transferMutation = useMutation({
    mutationFn: async ({ addressHash, buyerEmail }: { addressHash: string; buyerEmail: string }) => {
      const res = await apiRequest("POST", `/api/properties/${addressHash}/transfer`, { buyerEmail });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer Sent",
        description: data.message || "The buyer will receive an email to claim the property history.",
      });
      setTransferDialogOpen(false);
      setBuyerEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/properties/my-properties"] });
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Could not send the transfer invitation.",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string }) => {
      const response = await apiRequest("PATCH", "/api/customers/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated", description: "Your profile has been saved." });
      setEditingProfile(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (data: Partial<CustomerAddress>) => {
      const response = await apiRequest("POST", "/api/customers/addresses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Address added", description: "Your address has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add address.", variant: "destructive" });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerAddress> }) => {
      const response = await apiRequest("PATCH", `/api/customers/addresses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Address updated", description: "Your address has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update address.", variant: "destructive" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/addresses/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Address deleted", description: "Your address has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete address.", variant: "destructive" });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/payment-methods/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/payment-methods"] });
      toast({ title: "Payment method removed", description: "Your card has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove payment method.", variant: "destructive" });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/customers/addresses/${id}/set-default`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Default address updated" });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const setDefaultPaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/customers/payment-methods/${id}/set-default`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/payment-methods"] });
      toast({ title: "Default payment method updated" });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const handleSaveAddress = (data: Partial<CustomerAddress>) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data });
    } else {
      addAddressMutation.mutate(data);
    }
    setEditingAddress(null);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditingAddress(address);
    setAddressDialogOpen(true);
  };

  const handleStartEditProfile = () => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    });
    setEditingProfile(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#3B1D5A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#3B1D5A] flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
          <Link href="/login">
            <Button className="w-full" data-testid="button-go-to-login">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3B1D5A]" data-testid="page-profile">
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        <div className="flex justify-center mb-6">
          <Logo className="w-10 h-10" textClassName="text-xl" variant="light" />
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-8">My Profile</h1>

        <Card className="p-4 mb-4" data-testid="card-profile-info">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-xl">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                {editingProfile ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(p => ({ ...p, firstName: e.target.value }))}
                        placeholder="First Name"
                        className="w-32"
                        data-testid="input-first-name"
                      />
                      <Input 
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(p => ({ ...p, lastName: e.target.value }))}
                        placeholder="Last Name"
                        className="w-32"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
                    <p className="text-muted-foreground">{isPro ? 'Pro' : 'Customer'} since {new Date(user.createdAt || Date.now()).getFullYear()}</p>
                  </>
                )}
              </div>
            </div>
            {editingProfile ? (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setEditingProfile(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => updateProfileMutation.mutate(profileData)}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleStartEditProfile}
                data-testid="button-edit-profile"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Separator className="mb-4" />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Phone</p>
                {editingProfile ? (
                  <Input 
                    value={profileData.phone}
                    onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(407) 555-0199"
                    className="mt-1"
                    data-testid="input-phone"
                  />
                ) : (
                  <p className="font-medium">{user.phone || "Not provided"}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {isPro ? (
          <ProProfileSection />
        ) : (
          <>
            {/* Quick Actions */}
            <div className="flex gap-3 mb-4">
              <Link href="/book" className="flex-1">
                <Button className="w-full" size="sm" data-testid="button-book-service">
                  <CalendarPlus className="w-4 h-4 mr-1" />
                  Book a Service
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.dispatchEvent(new CustomEvent("george:open"))}
                data-testid="button-talk-to-george"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Talk to George
              </Button>
            </div>

            {/* My Digital Home. inline */}
            <Link href="/my-home">
              <Card className="p-3 mb-4 hover-elevate cursor-pointer" data-testid="link-my-home-inventory">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm">My Digital Home</span>
                  <span className="text-xs text-muted-foreground">, AI-cataloged inventory</span>
                </div>
              </Card>
            </Link>

            {/* Addresses */}
            <Card className="p-4 mb-4" data-testid="card-addresses">
              <button
                type="button"
                className="flex items-center justify-between w-full"
                onClick={() => toggleSection("addresses")}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold">Saved Addresses</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAddress(null);
                      setAddressDialogOpen(true);
                    }}
                    className="inline-flex items-center text-sm text-primary hover:underline"
                    data-testid="button-add-address"
                  >
                    <Plus className="w-4 h-4 mr-0.5" />
                    Add
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded.addresses ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expanded.addresses && (
                <div className="mt-3 overflow-hidden">
                  {addressesQuery.isLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : addressesQuery.data && addressesQuery.data.length > 0 ? (
                    <div className="space-y-2">
                      {addressesQuery.data.map((address) => (
                        <AddressCard 
                          key={address.id} 
                          address={address}
                          onEdit={() => handleEditAddress(address)}
                          onDelete={() => deleteAddressMutation.mutate(address.id)}
                          onSetDefault={() => setDefaultAddressMutation.mutate(address.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No saved addresses</p>
                      <p className="text-sm">Add an address for faster booking</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Home Intelligence group */}
            <Card className="p-4 mb-4" data-testid="card-home-intelligence">
              <button
                type="button"
                className="flex items-center justify-between w-full"
                onClick={() => toggleSection("intelligence")}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold">Home Intelligence</h3>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded.intelligence ? "rotate-180" : ""}`} />
              </button>
              {expanded.intelligence && (
                <div className="mt-3 space-y-4 overflow-hidden">
                  <HomeDnaScoreWidget />
                  <MaintenancePlan />
                  <ImpactDashboard />
                </div>
              )}
            </Card>

            {/* Home History */}
            <Card className="p-4 mb-4" data-testid="card-home-history">
              <button
                type="button"
                className="flex items-center justify-between w-full"
                onClick={() => toggleSection("history")}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold">Home History</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded.history ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expanded.history && (
                <div className="mt-3 overflow-hidden">
                  {propertiesQuery.isLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : propertiesQuery.data && propertiesQuery.data.length > 0 ? (
                    <div className="space-y-3">
                      {propertiesQuery.data.map((property) => (
                        <Card key={property.id} className="p-3" data-testid={`card-property-${property.id}`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Home className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="font-medium truncate">{property.fullAddress || "Unknown Address"}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                                <span>Score: <strong className="text-foreground">{property.maintenanceScore || 0}</strong>/100</span>
                                <span>Value Add: <strong className="text-foreground">+${property.estimatedValueIncrease || 0}</strong></span>
                              </div>
                              {property.transfers.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {property.transfers.map((t) => (
                                    <div key={t.id} className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <span>
                                        Transfer to {t.toEmail.replace(/(.{3}).*@/, "$1***@")} - 
                                        <Badge variant={t.status === "claimed" ? "default" : "secondary"} className="ml-1 text-xs">
                                          {t.status === "claimed" ? "Claimed" : "Pending"}
                                        </Badge>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTransferPropertyHash(property.addressHash || "");
                                setTransferPropertyAddress(property.fullAddress || "");
                                setTransferDialogOpen(true);
                              }}
                              data-testid={`button-transfer-${property.id}`}
                            >
                              <ArrowRightLeft className="w-4 h-4 mr-1" />
                              Transfer
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Home className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No property history yet</p>
                      <p className="text-sm">Complete a service to start building your home's maintenance record</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Payment Methods */}
            <Card className="p-4" data-testid="card-payment-methods">
              <button
                type="button"
                className="flex items-center justify-between w-full"
                onClick={() => toggleSection("payments")}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold">Payment Methods</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/payment-setup" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <span className="inline-flex items-center text-sm text-primary hover:underline" data-testid="button-add-payment">
                      <Plus className="w-4 h-4 mr-0.5" />
                      Add
                    </span>
                  </Link>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded.payments ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expanded.payments && (
                <div className="mt-3 overflow-hidden">
                  {paymentMethodsQuery.isLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : paymentMethodsQuery.data && paymentMethodsQuery.data.length > 0 ? (
                    <div className="space-y-2">
                      {paymentMethodsQuery.data.map((method) => (
                        <PaymentMethodCard 
                          key={method.id} 
                          method={method}
                          onDelete={() => deletePaymentMutation.mutate(method.id)}
                          onSetDefault={() => setDefaultPaymentMutation.mutate(method.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No payment methods</p>
                      <p className="text-sm">Add a card for instant booking</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </>
        )}
      </main>

      <AddAddressDialog 
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        editAddress={editingAddress}
        onSave={handleSaveAddress}
      />

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Home History</DialogTitle>
            <DialogDescription>
              Enter the buyer's email address. They'll receive an invitation to claim 
              the verified maintenance history for {transferPropertyAddress}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (transferPropertyHash && buyerEmail) {
              transferMutation.mutate({ addressHash: transferPropertyHash, buyerEmail });
            }
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Buyer's Email</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  placeholder="buyer@email.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                  data-testid="input-buyer-email"
                />
              </div>
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What gets transferred:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Verified maintenance history with before/after photos</li>
                  <li>Property maintenance score</li>
                  <li>Service certificates from UpTend-verified pros</li>
                  <li>Documented value added from professional services</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)} data-testid="button-cancel-transfer">
                Cancel
              </Button>
              <Button type="submit" disabled={transferMutation.isPending || !buyerEmail} data-testid="button-send-transfer">
                {transferMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Send Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
