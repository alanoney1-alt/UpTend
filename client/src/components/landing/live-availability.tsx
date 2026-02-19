import type { FormEvent } from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Bell, Truck, Clock, Users } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const launchAreas = [
  { city: "Orlando", state: "FL", status: "launching", counties: "Orange, Seminole, Osceola" },
  { city: "Tampa", state: "FL", status: "coming", counties: "Hillsborough, Pinellas" },
  { city: "Miami", state: "FL", status: "coming", counties: "Miami-Dade, Broward" },
  { city: "Jacksonville", state: "FL", status: "planned", counties: "Duval, St. Johns" },
];

export function LiveAvailability() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNotifyMe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/launch-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "You're on the list!",
          description: data.message || "We'll notify you when UpTend launches in your area.",
        });
        setEmail("");
      } else {
        toast({
          title: "Something went wrong",
          description: data.error || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-muted/30" data-testid="section-availability">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Clock className="w-3 h-3 mr-2" />
            Launching Soon
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Coming to Your Area
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're building a network of trusted, verified Pros. Be the first to know when we launch in your city.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {launchAreas.map((area) => (
            <Card 
              key={area.city} 
              className="p-5 text-center"
              data-testid={`card-area-${area.city.toLowerCase()}`}
            >
              <MapPin className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-lg mb-1">{area.city}, {area.state}</h3>
              <p className="text-xs text-muted-foreground mb-2">{area.counties}</p>
              <Badge 
                variant={area.status === "launching" ? "default" : "secondary"}
                className="text-xs"
              >
                {area.status === "launching" && "Launching First"}
                {area.status === "coming" && "Coming Soon"}
                {area.status === "planned" && "Planned"}
              </Badge>
            </Card>
          ))}
        </div>

        <Card className="p-6 mb-12 bg-primary/5 border-primary/20 max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <h3 className="font-semibold text-lg mb-1">Hours of Operation</h3>
              <p className="text-muted-foreground">7 AM - 10 PM, 7 days a week</p>
              <p className="text-sm text-muted-foreground mt-1">Same-day service available when Pros are online</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Average Response</p>
              <p className="text-2xl font-bold text-primary">5 minutes</p>
            </div>
          </div>
        </Card>

        <Card className="p-8 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <Bell className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">
              Get Notified When We Launch
            </h3>
            <p className="text-muted-foreground">
              Enter your email to be first in line for exclusive launch discounts.
            </p>
          </div>
          
          <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              data-testid="input-notify-email"
              required
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              data-testid="button-notify-me"
            >
              {isSubmitting ? "Submitting..." : "Notify Me"}
            </Button>
          </form>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Verified Pros</h4>
            <p className="text-sm text-muted-foreground">
              Every Pro is background-checked and insured
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Same-Day Service</h4>
            <p className="text-sm text-muted-foreground">
              Book Your Home Service and get your job done today
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Join Our Network</h4>
            <p className="text-sm text-muted-foreground">
              <Link href="/drive" className="text-primary hover:underline">
                Become a Pro
              </Link>
              {" "}and start earning
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
