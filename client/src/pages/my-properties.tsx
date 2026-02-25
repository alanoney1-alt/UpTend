import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Home,
  Plus,
  Star,
  Trash2,
  Edit2,
  X,
  Building2,
  Palmtree,
  Users,
  MapPin,
  Activity,
  Calendar,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

interface Property {
  id: string;
  address: string;
  nickname: string;
  relationship: string;
  isPrimary: boolean;
  lastServiceDate: string | null;
  homeHealthScore: number | null;
}

const RELATIONSHIPS = [
  { value: "my_home", label: "My Home", icon: Home },
  { value: "parents_home", label: "Parent's Home", icon: Users },
  { value: "rental_property", label: "Rental Property", icon: Building2 },
  { value: "vacation_home", label: "Vacation Home", icon: Palmtree },
] as const;

function getRelationshipIcon(rel: string) {
  const r = RELATIONSHIPS.find((x) => x.value === rel);
  return r?.icon || Home;
}

function getRelationshipLabel(rel: string) {
  return RELATIONSHIPS.find((x) => x.value === rel)?.label || rel;
}

export default function MyProperties() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formAddress, setFormAddress] = useState("");
  const [formNickname, setFormNickname] = useState("");
  const [formRelationship, setFormRelationship] = useState("my_home");

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/customer/properties"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: { address: string; nickname: string; relationship: string }) => {
      const res = await apiRequest("POST", "/api/customer/properties", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/properties"] });
      setShowForm(false);
      setFormAddress("");
      setFormNickname("");
      setFormRelationship("my_home");
      toast({ title: "Property added!", description: "You can now book services for this property." });
    },
    onError: () => toast({ title: "Failed to add property", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customer/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/properties"] });
      toast({ title: "Property removed" });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PUT", `/api/customer/properties/${id}/primary`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/properties"] });
      toast({ title: "Primary property updated" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAddress || !formNickname) return;
    addMutation.mutate({ address: formAddress, nickname: formNickname, relationship: formRelationship });
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/customer-dashboard">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">My Properties</h1>
            <p className="text-sm text-white/60">Manage Mom's house too ✨</p>
          </div>
        </div>

        {/* Add Property Button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </Button>
        )}

        {/* Add Property Form */}
        {showForm && (
          <Card className="p-4 mb-6 border-primary/30 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Add a Property</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-sm text-white/70">Address</Label>
                <AddressAutocomplete
                  value={formAddress}
                  onChange={setFormAddress}
                  onSelectAddress={(addr) => setFormAddress(addr)}
                  placeholder="123 Main St, Orlando, FL"
                />
              </div>
              <div>
                <Label className="text-sm text-white/70">Nickname</Label>
                <Input
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  placeholder="e.g., Mom's House"
                />
              </div>
              <div>
                <Label className="text-sm text-white/70 mb-2 block">Relationship</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RELATIONSHIPS.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setFormRelationship(r.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                          formRelationship === r.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addMutation.isPending || !formAddress || !formNickname}>
                {addMutation.isPending ? "Adding..." : "Add Property"}
              </Button>
            </form>
          </Card>
        )}

        {/* Properties List */}
        {isLoading ? (
          <div className="text-center py-12 text-white/50">Loading properties...</div>
        ) : properties.length === 0 && !showForm ? (
          <Card className="p-8 text-center">
            <Home className="w-12 h-12 mx-auto mb-3 text-white/30" />
            <h3 className="font-semibold mb-1">No properties yet</h3>
            <p className="text-sm text-white/50 mb-4">
              Add your home and manage services for your family's properties. all from one account.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Property
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {properties.map((prop) => {
              const Icon = getRelationshipIcon(prop.relationship);
              return (
                <Card
                  key={prop.id}
                  className={`p-4 transition-colors hover:border-primary/40 cursor-pointer ${
                    prop.isPrimary ? "border-primary/50 bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!prop.isPrimary) setPrimaryMutation.mutate(prop.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      prop.isPrimary ? "bg-primary/20" : "bg-white/10"
                    }`}>
                      <Icon className={`w-5 h-5 ${prop.isPrimary ? "text-primary" : "text-white/60"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{prop.nickname}</h3>
                        {prop.isPrimary && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-white/50 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{prop.address}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {prop.homeHealthScore !== null ? `Score: ${prop.homeHealthScore}` : "No score yet"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {prop.lastServiceDate || "No services yet"}
                        </span>
                      </div>
                      <p className="text-xs text-white/30 mt-1">{getRelationshipLabel(prop.relationship)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Remove this property?")) deleteMutation.mutate(prop.id);
                        }}
                        className="p-2 rounded-full hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400/60" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {properties.length > 0 && (
          <p className="text-center text-xs text-white/30 mt-4">
            Tap a property to set it as active for booking • ⭐ = primary
          </p>
        )}
      </div>
    </div>
  );
}
