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
import { DwellScanWidget } from "@/components/dwellscan-widget";
import { MaintenancePlan } from "@/components/maintenance-plan";
import { ImpactDashboard } from "@/components/impact-dashboard";
import { Footer } from "@/components/landing/footer";
import {
  ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Plus, Pencil, Trash2, Loader2,
  Home, Building, Star, Check, X, Send, FileText, ArrowRightLeft, Shield, Clock,
  Package, TrendingUp, Truck, DollarSign, Award, Settings, Wallet, Radius,
  BadgeCheck, ShieldCheck, MessageCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

/* ─── Design Tokens ─── */
const T = {
  bg: "#FFFBF5",
  primary: "#F59E0B",
  primaryDark: "#D97706",
  text: "#1E293B",
  textMuted: "#64748B",
  card: "#FFFFFF",
};

function openGeorge(message?: string) {
  window.dispatchEvent(new CustomEvent("george:open", { detail: message ? { message } : undefined }));
}

/* ─── George Avatar ─── */
function GeorgeAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-10 h-10 text-lg" : size === "lg" ? "w-20 h-20 text-3xl" : "w-14 h-14 text-2xl";
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
      style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
    >
      G
    </div>
  );
}

/* ─── George Speech Bubble ─── */
function GeorgeSays({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 text-base leading-relaxed shadow-sm ${className}`}
      style={{ background: T.card, color: T.text }}
    >
      {children}
    </div>
  );
}

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

/* ─── George's Home Knowledge Card ─── */
function GeorgeHomeCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: CustomerAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const specs = [
    address.bedrooms && `${address.bedrooms}-bed`,
    address.bathrooms && `${address.bathrooms}-bath`,
    address.sqft && `${Number(address.sqft).toLocaleString()} sqft`,
  ].filter(Boolean);

  return (
    <div
      className="rounded-2xl p-5 border border-amber-100 shadow-sm"
      style={{ background: "linear-gradient(135deg, #FFFDF7, #FFF8E7)" }}
      data-testid={`address-card-${address.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4" style={{ color: T.primary }} />
            <span className="font-bold" style={{ color: T.text }}>{address.label}</span>
            {address.isDefault && (
              <Badge className="text-xs bg-amber-100 text-amber-700 border-0">Primary</Badge>
            )}
          </div>
          <p className="text-sm mt-2" style={{ color: T.text }}>
            Your home at <strong>{address.street}</strong> in {address.city}, {address.state} {address.zipCode}
            {specs.length > 0 && <> is a <strong>{specs.join(", ")}</strong></>}
            {address.yearBuilt && <> built in <strong>{address.yearBuilt}</strong></>}.
          </p>
          {specs.length === 0 && !address.yearBuilt && (
            <p className="text-sm mt-1 italic" style={{ color: T.textMuted }}>
              Tell me more about this home so I can take better care of it!
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!address.isDefault && (
            <Button variant="ghost" size="icon" onClick={onSetDefault} data-testid={`button-set-default-${address.id}`}>
              <Star className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onEdit} data-testid={`button-edit-address-${address.id}`}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} data-testid={`button-delete-address-${address.id}`}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodCard({
  method,
  onDelete,
  onSetDefault,
}: {
  method: PaymentMethod;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center justify-between"
      style={{ background: T.card }}
      data-testid={`payment-card-${method.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <CreditCard className="w-5 h-5" style={{ color: T.primary }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium capitalize" style={{ color: T.text }}>{method.brand} •••• {method.last4}</p>
            {method.isDefault && (
              <Badge className="text-xs bg-amber-100 text-amber-700 border-0">Default</Badge>
            )}
          </div>
          <p className="text-sm" style={{ color: T.textMuted }}>Expires {method.expMonth}/{method.expYear}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!method.isDefault && (
          <Button variant="ghost" size="icon" onClick={onSetDefault} data-testid={`button-set-default-payment-${method.id}`}>
            <Star className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onDelete} data-testid={`button-delete-payment-${method.id}`}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function AddAddressDialog({
  open,
  onOpenChange,
  editAddress,
  onSave,
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
      setLabel(""); setStreet(""); setCity(""); setState(""); setZipCode("");
      setBedrooms(""); setBathrooms(""); setSqft(""); setYearBuilt("");
    }
  }, [editAddress, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      label, street, city, state, zipCode,
      ...(bedrooms && { bedrooms }), ...(bathrooms && { bathrooms }),
      ...(sqft && { sqft }), ...(yearBuilt && { yearBuilt }),
    } as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editAddress ? "Update Your Home Details" : "Tell Me About a New Home"}</DialogTitle>
          <DialogDescription>
            {editAddress ? "Let me know what's changed." : "The more I know, the better I can help."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">What do you call this place?</Label>
            <Input id="label" placeholder="Home, Work, Mom's house..." value={label} onChange={(e) => setLabel(e.target.value)} required data-testid="input-address-label" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input id="street" placeholder="123 Main St" value={street} onChange={(e) => setStreet(e.target.value)} required data-testid="input-address-street" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Orlando" value={city} onChange={(e) => setCity(e.target.value)} required data-testid="input-address-city" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="FL" value={state} onChange={(e) => setState(e.target.value)} required data-testid="input-address-state" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input id="zipCode" placeholder="32801" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required data-testid="input-address-zip" />
          </div>
          <Separator className="my-2" />
          <p className="text-sm font-medium" style={{ color: T.textMuted }}>Home details (helps me give better estimates)</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" placeholder="3" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} data-testid="input-address-bedrooms" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" placeholder="2" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} data-testid="input-address-bathrooms" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sqft">Sq Ft</Label>
              <Input id="sqft" placeholder="1,800" value={sqft} onChange={(e) => setSqft(e.target.value)} data-testid="input-address-sqft" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input id="yearBuilt" placeholder="2005" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} data-testid="input-address-yearbuilt" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" style={{ background: T.primary }} data-testid="button-save-address">
              {editAddress ? "Save Changes" : "Add Home"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Pro Profile Section (George-wrapped) ─── */
function ProProfileSection() {
  const { user } = useAuth();

  const proProfileQuery = useQuery<any>({
    queryKey: ["/api/pro/profile"],
    enabled: !!user,
  });

  const proData = proProfileQuery.data;

  return (
    <>
      {/* George's Briefing */}
      <div className="flex items-start gap-3 mb-6">
        <GeorgeAvatar size="sm" />
        <GeorgeSays>
          <p className="font-medium mb-1">Here's your pro snapshot:</p>
          {proProfileQuery.isLoading ? (
            <p style={{ color: T.textMuted }}>Let me pull up your stats...</p>
          ) : (
            <p>
              You're at <strong>{proData?.tier || proData?.level || "Rookie"}</strong> level
              with <strong>{proData?.jobsCompleted ?? proData?.completedJobs ?? 0}</strong> jobs completed
              and a <strong>{proData?.serviceRadius || "—"} mile</strong> service radius.
              Your payout rate is <strong>{proData?.payoutRate ? `$${proData.payoutRate}` : "standard"}</strong>.
            </p>
          )}
        </GeorgeSays>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/career">
          <div className="rounded-2xl p-4 border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ background: T.card }} data-testid="link-career-dashboard">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" style={{ color: T.primary }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: T.text }}>Career Dashboard</p>
                <p className="text-xs" style={{ color: T.textMuted }}>Track your progression</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/earnings">
          <div className="rounded-2xl p-4 border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ background: T.card }} data-testid="link-earnings">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: T.text }}>Earnings</p>
                <p className="text-xs" style={{ color: T.textMuted }}>View your payouts</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Vehicle Info */}
      {proData && (proData.vehicleMake || proData.vehicleModel) && (
        <div className="rounded-2xl p-5 border border-amber-100 shadow-sm mb-6" style={{ background: T.card }} data-testid="card-vehicle-info">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5" style={{ color: T.primary }} />
            <h3 className="font-bold" style={{ color: T.text }}>Your Vehicle</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: T.textMuted }}>Make / Model</span>
              <span className="font-medium" style={{ color: T.text }}>{proData.vehicleMake} {proData.vehicleModel}</span>
            </div>
            {proData.vehicleYear && (
              <div className="flex justify-between">
                <span style={{ color: T.textMuted }}>Year</span>
                <span className="font-medium" style={{ color: T.text }}>{proData.vehicleYear}</span>
              </div>
            )}
            {proData.licensePlate && (
              <div className="flex justify-between">
                <span style={{ color: T.textMuted }}>Plate</span>
                <span className="font-medium" style={{ color: T.text }}>{proData.licensePlate}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certs & Insurance */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/certifications">
          <div className="rounded-2xl p-4 border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ background: T.card }} data-testid="link-certifications">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" style={{ color: T.primaryDark }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: T.text }}>Certifications</p>
                <p className="text-xs" style={{ color: T.textMuted }}>View & manage</p>
              </div>
            </div>
          </div>
        </Link>
        <div className="rounded-2xl p-4 border border-amber-100 shadow-sm" style={{ background: T.card }} data-testid="card-insurance-status">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${proData?.hasOwnInsurance ? "bg-green-50" : "bg-gray-50"}`}>
              <ShieldCheck className={`w-5 h-5 ${proData?.hasOwnInsurance ? "text-green-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: T.text }}>Insurance</p>
              <p className="text-xs" style={{ color: T.textMuted }}>
                {proData?.hasOwnInsurance ? "Own coverage" : "UpTend covered"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <Link href="/profile/settings">
        <div className="rounded-2xl p-4 border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ background: T.card }} data-testid="link-pro-settings">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" style={{ color: T.textMuted }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: T.text }}>Settings</p>
              <p className="text-xs" style={{ color: T.textMuted }}>Vehicle, radius, notifications & more</p>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}

/* ─── Main Profile Page ─── */
export default function Profile() {
  usePageTitle("My Profile | UpTend");
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferPropertyHash, setTransferPropertyHash] = useState("");
  const [transferPropertyAddress, setTransferPropertyAddress] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [profileData, setProfileData] = useState({ firstName: "", lastName: "", phone: "" });

  const isPro = user?.role === "hauler" || user?.role === "pro" || user?.role === "worker";
  const firstName = user?.firstName || "friend";
  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "";

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
    transfers: Array<{ id: string; toEmail: string; status: string | null; createdAt: string | null }>;
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
      toast({ title: "Transfer Sent", description: data.message || "The buyer will receive an email to claim the property history." });
      setTransferDialogOpen(false);
      setBuyerEmail("");
      qc.invalidateQueries({ queryKey: ["/api/properties/my-properties"] });
    },
    onError: (error: any) => {
      toast({ title: "Transfer Failed", description: error.message || "Could not send the transfer invitation.", variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string }) => {
      const response = await apiRequest("PATCH", "/api/customers/profile", data);
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Got it!", description: "Your profile has been updated." });
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
      qc.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Home added!", description: "I'll keep track of it for you." });
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
      qc.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Updated!", description: "Home details saved." });
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
      qc.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Removed", description: "Address deleted." });
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
      qc.invalidateQueries({ queryKey: ["/api/customers/payment-methods"] });
      toast({ title: "Card removed" });
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
      qc.invalidateQueries({ queryKey: ["/api/customers/addresses"] });
      toast({ title: "Primary home updated" });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const setDefaultPaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/customers/payment-methods/${id}/set-default`, {});
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/customers/payment-methods"] });
      toast({ title: "Default payment updated" });
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.primary }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: T.bg }}>
        <GeorgeAvatar size="lg" />
        <GeorgeSays className="mt-6 max-w-md text-center">
          <p className="font-medium mb-3">Hey! I'd love to help, but I need to know who you are first.</p>
          <Link href="/login">
            <Button style={{ background: T.primary }} className="text-white font-bold" data-testid="button-go-to-login">
              Sign In
            </Button>
          </Link>
        </GeorgeSays>
      </div>
    );
  }

  const defaultAddress = addressesQuery.data?.find((a) => a.isDefault) || addressesQuery.data?.[0];

  return (
    <div className="min-h-screen" style={{ background: T.bg }} data-testid="page-profile">
      {/* Header */}
      <header className="p-4 max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" style={{ color: T.text }} />
          <span style={{ color: T.text }}>Back</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        {/* George Greeting */}
        <div className="flex flex-col items-center mb-8">
          <GeorgeAvatar size="lg" />
          <h1 className="mt-4 text-2xl font-bold" style={{ color: T.text }}>
            Hey, {firstName}!
          </h1>
          <p style={{ color: T.textMuted }} className="text-sm mt-1">
            Here's everything I know about {isPro ? "your career" : "your home"}
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl p-6 mb-6 border border-amber-100 shadow-sm" style={{ background: T.card }} data-testid="card-profile-info">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-amber-200">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-amber-100 text-amber-700 text-lg font-bold">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                {editingProfile ? (
                  <div className="flex gap-2">
                    <Input value={profileData.firstName} onChange={(e) => setProfileData((p) => ({ ...p, firstName: e.target.value }))} placeholder="First Name" className="w-28" data-testid="input-first-name" />
                    <Input value={profileData.lastName} onChange={(e) => setProfileData((p) => ({ ...p, lastName: e.target.value }))} placeholder="Last Name" className="w-28" data-testid="input-last-name" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold" style={{ color: T.text }}>{user.firstName} {user.lastName}</h2>
                    <p style={{ color: T.textMuted }} className="text-sm">{isPro ? "Pro" : "Member"} since {new Date(user.createdAt || Date.now()).getFullYear()}</p>
                  </>
                )}
              </div>
            </div>
            {editingProfile ? (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingProfile(false)}><X className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => updateProfileMutation.mutate(profileData)} disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                  {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" onClick={handleStartEditProfile} data-testid="button-edit-profile">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" style={{ color: T.textMuted }} />
              <span className="text-sm" style={{ color: T.text }}>{user.email || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4" style={{ color: T.textMuted }} />
              {editingProfile ? (
                <Input value={profileData.phone} onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))} placeholder="(407) 555-0199" className="flex-1" data-testid="input-phone" />
              ) : (
                <span className="text-sm" style={{ color: T.text }}>{user.phone || "Not provided"}</span>
              )}
            </div>
          </div>
        </div>

        {isPro ? (
          <ProProfileSection />
        ) : (
          <>
            {/* George's Home Knowledge */}
            <div className="flex items-start gap-3 mb-4">
              <GeorgeAvatar size="sm" />
              <GeorgeSays className="flex-1">
                {addressesQuery.isLoading ? (
                  <p style={{ color: T.textMuted }}>Let me pull up your homes...</p>
                ) : defaultAddress ? (
                  <p>
                    I'm tracking <strong>{addressesQuery.data?.length || 0}</strong> home{(addressesQuery.data?.length || 0) !== 1 ? "s" : ""} for you.
                    {defaultAddress.street && <> Your primary home is at <strong>{defaultAddress.street}</strong>.</>}
                    {" "}Here's what I know:
                  </p>
                ) : (
                  <p>I don't have any homes on file yet. <strong>Add one</strong> so I can start keeping track of maintenance, history, and value!</p>
                )}
              </GeorgeSays>
            </div>

            {/* Addresses */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold" style={{ color: T.text }}>Your Homes</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-200 hover:bg-amber-50"
                  onClick={() => { setEditingAddress(null); setAddressDialogOpen(true); }}
                  data-testid="button-add-address"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Home
                </Button>
              </div>

              {addressesQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.primary }} />
                </div>
              ) : addressesQuery.data && addressesQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {addressesQuery.data.map((address) => (
                    <GeorgeHomeCard
                      key={address.id}
                      address={address}
                      onEdit={() => handleEditAddress(address)}
                      onDelete={() => deleteAddressMutation.mutate(address.id)}
                      onSetDefault={() => setDefaultAddressMutation.mutate(address.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-2xl border border-dashed border-amber-200" style={{ color: T.textMuted }}>
                  <Home className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No homes yet</p>
                  <p className="text-sm">Add your first home to get started</p>
                </div>
              )}
            </div>

            {/* DwellScan, Maintenance, Impact */}
            <div className="mb-6"><DwellScanWidget /></div>
            <div className="mb-6"><MaintenancePlan /></div>
            <div className="mb-6"><ImpactDashboard /></div>

            {/* Digital Home link */}
            <Link href="/my-home">
              <div className="rounded-2xl p-4 border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow mb-6" style={{ background: T.card }} data-testid="link-my-home-inventory">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" style={{ color: T.primary }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: T.text }}>My Digital Home</p>
                    <p className="text-xs" style={{ color: T.textMuted }}>View your AI-cataloged inventory</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Home History */}
            <div className="rounded-2xl p-6 border border-amber-100 shadow-sm mb-6" style={{ background: T.card }} data-testid="card-home-history">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: T.primary }} />
                  <h3 className="font-bold" style={{ color: T.text }}>Home History</h3>
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">
                  <Shield className="w-3 h-3 mr-1" /> Verified by George
                </Badge>
              </div>

              {propertiesQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.primary }} />
                </div>
              ) : propertiesQuery.data && propertiesQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {propertiesQuery.data.map((property) => (
                    <div key={property.id} className="rounded-xl p-4 border border-amber-50" style={{ background: "#FFFDF7" }} data-testid={`card-property-${property.id}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Home className="w-4 h-4 shrink-0" style={{ color: T.primary }} />
                            <span className="font-medium truncate" style={{ color: T.text }}>{property.fullAddress || "Unknown Address"}</span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                            Maintenance score: <strong style={{ color: T.text }}>{property.maintenanceScore || 0}/100</strong>
                            {" · "}Value added: <strong style={{ color: T.text }}>+${property.estimatedValueIncrease || 0}</strong>
                          </p>
                          {property.transfers.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {property.transfers.map((t) => (
                                <div key={t.id} className="flex items-center gap-2 text-xs" style={{ color: T.textMuted }}>
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>
                                    Transfer to {t.toEmail.replace(/(.{3}).*@/, "$1***@")} —{" "}
                                    <Badge className={`text-xs border-0 ${t.status === "claimed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
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
                          className="border-amber-200 hover:bg-amber-50"
                          onClick={() => {
                            setTransferPropertyHash(property.addressHash || "");
                            setTransferPropertyAddress(property.fullAddress || "");
                            setTransferDialogOpen(true);
                          }}
                          data-testid={`button-transfer-${property.id}`}
                        >
                          <ArrowRightLeft className="w-4 h-4 mr-1" /> Transfer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: T.textMuted }}>
                  <Home className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No property history yet</p>
                  <p className="text-sm">Complete a service to start building your home's record</p>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="rounded-2xl p-6 border border-amber-100 shadow-sm" style={{ background: T.card }} data-testid="card-payment-methods">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" style={{ color: T.primary }} />
                  <h3 className="font-bold" style={{ color: T.text }}>Payment Methods</h3>
                </div>
                <Link href="/payment-setup">
                  <Button variant="outline" size="sm" className="border-amber-200 hover:bg-amber-50" data-testid="button-add-payment">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </Link>
              </div>

              {paymentMethodsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.primary }} />
                </div>
              ) : paymentMethodsQuery.data && paymentMethodsQuery.data.length > 0 ? (
                <div className="space-y-3">
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
                <div className="text-center py-8" style={{ color: T.textMuted }}>
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No payment methods</p>
                  <p className="text-sm">Add a card for instant booking</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Ask George CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => openGeorge("What should I do next for my home?")}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
            style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
          >
            <MessageCircle className="w-5 h-5" />
            Ask George anything
          </button>
        </div>
      </main>

      <Footer />

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
              Enter the buyer's email. They'll get an invitation to claim the verified maintenance history for {transferPropertyAddress}.
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
                <Input id="buyerEmail" type="email" placeholder="buyer@email.com" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required data-testid="input-buyer-email" />
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-sm" style={{ color: T.text }}>
                <p className="font-medium mb-1">What gets transferred:</p>
                <ul className="space-y-1 list-disc list-inside" style={{ color: T.textMuted }}>
                  <li>Verified maintenance history with before/after photos</li>
                  <li>Property maintenance score</li>
                  <li>Service certificates from UpTend-verified pros</li>
                  <li>Documented value added from professional services</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)} data-testid="button-cancel-transfer">Cancel</Button>
              <Button type="submit" disabled={transferMutation.isPending || !buyerEmail} style={{ background: T.primary }} className="text-white" data-testid="button-send-transfer">
                {transferMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Send Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
