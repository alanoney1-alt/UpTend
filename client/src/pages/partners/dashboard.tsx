import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/landing/header";
import { ArrowLeft, Building2, DollarSign, ShoppingCart, TrendingDown, Loader2, Key } from "lucide-react";

export default function PartnerDashboard() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("partnerApiKey") || "");
  const [inputKey, setInputKey] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["partner-dashboard", apiKey],
    queryFn: async () => {
      const res = await fetch("/api/partners/dashboard", {
        headers: { "X-Partner-API-Key": apiKey },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      return res.json();
    },
    enabled: !!apiKey,
  });

  const handleConnect = () => {
    localStorage.setItem("partnerApiKey", inputKey);
    setApiKey(inputKey);
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> Partner Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your partner API key to access the dashboard.</p>
              <Input value={inputKey} onChange={(e) => setInputKey(e.target.value)} placeholder="uptend_partner_..." />
              <Button className="w-full" onClick={handleConnect} disabled={!inputKey}>Connect</Button>
              <p className="text-xs text-muted-foreground text-center">
                Don't have an account? <Link href="/partners/register" className="text-primary underline">Register here</Link>
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/partners">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Partner Program</Button>
            </Link>
            <h1 className="text-3xl font-bold mt-2">Partner Dashboard</h1>
            {data?.partner && (
              <p className="text-muted-foreground">{data.partner.companyName} · <Badge variant="outline">{data.partner.type.replace("_", " ")}</Badge></p>
            )}
          </div>
          <Button variant="outline" onClick={() => { localStorage.removeItem("partnerApiKey"); setApiKey(""); }}>Logout</Button>
        </div>

        {isLoading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>}
        {error && <Card><CardContent className="py-8 text-center text-red-500">{(error as Error).message}</CardContent></Card>}

        {data && (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{data.stats.totalBookings}</p>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">${data.stats.totalSpend}</p>
                      <p className="text-sm text-muted-foreground">Total Spend</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">${data.stats.totalSaved}</p>
                      <p className="text-sm text-muted-foreground">Saved ({data.stats.discountRate} discount)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No bookings yet. Use the API or contact support to create your first booking.</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentBookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{b.serviceRequestId || b.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{b.notes || "No notes"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${b.finalAmount || "0.00"}</p>
                          {b.discountAmount && Number(b.discountAmount) > 0 && (
                            <p className="text-xs text-green-600">Saved ${b.discountAmount}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
