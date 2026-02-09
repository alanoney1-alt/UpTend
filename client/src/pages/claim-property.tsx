import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Home,
  Shield,
  FileText,
  CheckCircle,
  Loader2,
  Calendar,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface ClaimData {
  address: string;
  maintenanceScore: number | null;
  estimatedValueIncrease: number | null;
  eventCount: number;
  events: Array<{
    type: string;
    description: string;
    date: string;
    verifiedBy: string;
  }>;
  toEmail: string;
  createdAt: string | null;
}

export default function ClaimProperty() {
  const [, params] = useRoute("/claim/:token");
  const token = params?.token || "";
  const { toast } = useToast();
  const [claimed, setClaimed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const claimQuery = useQuery<ClaimData>({
    queryKey: ["/api/properties/claim", token],
    queryFn: async () => {
      const res = await fetch(`/api/properties/claim/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load claim");
      }
      return res.json();
    },
    enabled: !!token,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/properties/claim/${token}`, {
        email: email || undefined,
        firstName,
        lastName,
      });
      return res.json();
    },
    onSuccess: () => {
      setClaimed(true);
      toast({
        title: "Property Claimed",
        description: "You are now the verified owner of this property's maintenance history.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Could not claim this property.",
        variant: "destructive",
      });
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-[#3B1D5A] flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
          <p className="text-muted-foreground">This claim link is invalid or expired.</p>
          <Link href="/">
            <Button className="mt-4" data-testid="button-go-home">Go to UpTend</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-[#3B1D5A] flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Property Claimed</h2>
          <p className="text-muted-foreground mb-4">
            You are now the verified owner of the maintenance history for this property.
            Continue using UpTend services to build your home's score.
          </p>
          <Link href="/signup">
            <Button className="w-full" data-testid="button-create-account">
              Create Your UpTend Account
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full mt-2" data-testid="button-explore">
              Explore UpTend
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3B1D5A]" data-testid="page-claim-property">
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-12">
        <div className="flex justify-center mb-6">
          <Logo className="w-10 h-10" textClassName="text-xl" />
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Claim Your Home's History
        </h1>
        <p className="text-white/70 text-center mb-8">
          A verified maintenance record is waiting for you
        </p>

        {claimQuery.isLoading ? (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading property details...</p>
          </Card>
        ) : claimQuery.isError ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Link Expired or Invalid</h2>
            <p className="text-muted-foreground">
              {(claimQuery.error as any)?.message || "This transfer link is no longer valid."}
            </p>
            <Link href="/">
              <Button className="mt-4" data-testid="button-go-home-error">Go to UpTend</Button>
            </Link>
          </Card>
        ) : claimQuery.data ? (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Home className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">{claimQuery.data.address}</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-md bg-muted">
                  <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold">{claimQuery.data.maintenanceScore || 0}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
                <div className="text-center p-3 rounded-md bg-muted">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <div className="text-2xl font-bold">+${claimQuery.data.estimatedValueIncrease || 0}</div>
                  <div className="text-xs text-muted-foreground">Value Add</div>
                </div>
                <div className="text-center p-3 rounded-md bg-muted">
                  <Wrench className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-2xl font-bold">{claimQuery.data.eventCount}</div>
                  <div className="text-xs text-muted-foreground">Services</div>
                </div>
              </div>

              {claimQuery.data.events.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Verified Service History</h4>
                  {claimQuery.data.events.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-muted">
                      <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{event.description}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                          <span>{event.verifiedBy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Claim This Property</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your details to become the verified owner of this maintenance history.
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                claimMutation.mutate();
              }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="claimFirstName">First Name</Label>
                    <Input
                      id="claimFirstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      data-testid="input-claim-first-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="claimLastName">Last Name</Label>
                    <Input
                      id="claimLastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      data-testid="input-claim-last-name"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="claimEmail">Email (optional, defaults to invited email)</Label>
                  <Input
                    id="claimEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={claimQuery.data.toEmail}
                    data-testid="input-claim-email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={claimMutation.isPending}
                  data-testid="button-claim-property"
                >
                  {claimMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  Claim Property History
                </Button>
              </form>
            </Card>

            <div className="text-center">
              <Badge variant="outline" className="text-white border-white/30">
                <Shield className="w-3 h-3 mr-1" />
                Verified by UpTend
              </Badge>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
