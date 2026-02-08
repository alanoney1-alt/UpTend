import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MapPin, 
  Truck, 
  Clock, 
  Package,
  ArrowRight,
  Phone,
  Mail
} from "lucide-react";

export default function TrackingLookup() {
  const [jobId, setJobId] = useState("");
  const [email, setEmail] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleTrackByJobId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId.trim()) {
      toast({
        title: "Job ID Required",
        description: "Please enter your job ID to track your order.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/track/${jobId.trim()}`);
  };

  const handleTrackByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Check Your Email",
      description: "If you have active jobs, we've sent tracking links to your email.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your job ID or email to see real-time updates on your hauling service.
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Track by Job ID
                </CardTitle>
                <CardDescription>
                  Enter the job ID from your confirmation email or receipt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrackByJobId} className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="jobId" className="sr-only">Job ID</Label>
                    <Input
                      id="jobId"
                      placeholder="e.g., JOB-12345 or 12345"
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                      data-testid="input-job-id"
                    />
                  </div>
                  <Button type="submit" data-testid="button-track-job">
                    Track
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Track by Email
                </CardTitle>
                <CardDescription>
                  We'll send tracking links for all your active orders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrackByEmail} className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-tracking-email"
                    />
                  </div>
                  <Button type="submit" variant="outline" data-testid="button-send-links">
                    Send Links
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Real-Time Location</h3>
              <p className="text-sm text-muted-foreground">
                See exactly where your Pro is on the map.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Live ETA Updates</h3>
              <p className="text-sm text-muted-foreground">
                Know exactly when your Pro will arrive.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Direct Contact</h3>
              <p className="text-sm text-muted-foreground">
                Message or call your Pro directly.
              </p>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <p className="text-muted-foreground mb-4">
              Can't find your job ID? Contact our support team.
            </p>
            <Button variant="outline" onClick={() => navigate("/contact")} data-testid="button-contact-support">
              <Phone className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
