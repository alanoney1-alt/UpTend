import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, ArrowLeft, Shield, Phone, Mail, Clock, DollarSign, 
  CheckCircle, Star, Users, MapPin, Zap 
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function ServiceGuarantee() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-service-guarantee">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12 pt-28">
        <div className="text-center mb-12">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Service Guarantee</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We stand behind every pickup. Here's our commitment to you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Price Match Promise</h3>
                <Badge variant="secondary">Guaranteed</Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              The price you see is the price you pay. No surprise fees, no hidden charges. 
              If items match your description, the price won't change.
            </p>
          </Card>

          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">On-Time Arrival</h3>
                <Badge variant="secondary">Guaranteed</Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Your Pro will arrive within the scheduled window. If they're more than 
              30 minutes late without notice, you get $10 off your next booking.
            </p>
          </Card>

          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Complete Cleanup</h3>
                <Badge variant="secondary">Guaranteed</Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Pros are expected to leave the area clean after removal. This includes 
              sweeping up debris and ensuring nothing is left behind.
            </p>
          </Card>

          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Property Protection</h3>
                <Badge variant="secondary">$1M Insured</Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Pros are required to carry liability insurance. If damage occurs during 
              service, claims are handled through the Pro's insurance up to $1 million.
            </p>
          </Card>
        </div>

        <Card className="p-8 prose prose-gray dark:prose-invert max-w-none">
          <h2>The UpTend Promise</h2>
          <p>
            Every booking with UpTend comes with these guarantees. No exceptions.
          </p>

          <h2>1. Transparent Pricing Guarantee</h2>
          <p>
            We believe in honest, upfront pricing:
          </p>
          <ul>
            <li><strong>No hidden fees:</strong> The quoted price includes labor, disposal, and basic mileage</li>
            <li><strong>$99 minimum:</strong> Our minimum charge is clearly stated upfront</li>
            <li><strong>$1/mile (moving only):</strong> Distance charges are calculated before you book</li>
            <li><strong>$25/flight:</strong> Stair charges are disclosed before confirmation</li>
            <li><strong>Price lock:</strong> Your price is locked once you approve the quote</li>
          </ul>
          <p>
            <strong>If we're wrong:</strong> If you were charged more than the approved quote for the same 
            items, we'll refund the difference plus give you $10 credit.
          </p>

          <h2>2. Punctuality Guarantee</h2>
          <p>
            Your time matters:
          </p>
          <ul>
            <li>Pros will arrive within your selected time window</li>
            <li>Real-time GPS tracking so you always know when they'll arrive</li>
            <li>Automatic notifications when they're on the way</li>
          </ul>
          <p>
            <strong>If we're late:</strong> More than 30 minutes past your window without prior 
            communication = $10 credit on your next booking.
          </p>

          <h2>3. Professionalism Guarantee</h2>
          <p>
            Every Pro on our platform is:
          </p>
          <ul>
            <li><strong>Background checked:</strong> Verified for your safety</li>
            <li><strong>Highly rated:</strong> Minimum 4.5-star rating to remain active</li>
            <li><strong>Properly equipped:</strong> Right vehicle and tools for the job</li>
            <li><strong>Trained:</strong> Knows proper lifting techniques and disposal methods</li>
          </ul>
          <p>
            <strong>If there's an issue:</strong> Report unprofessional behavior and we'll investigate 
            within 24 hours. Confirmed issues result in Pro penalties and credits for you.
          </p>

          <h2>4. Satisfaction Guarantee</h2>
          <p>
            We want you to be 100% satisfied:
          </p>
          <ul>
            <li>Review and approve the items to be removed before service starts</li>
            <li>Verify the work is complete before the job is marked done</li>
            <li>Rate your experience to help us maintain quality</li>
          </ul>
          <p>
            <strong>If you're not satisfied:</strong> Contact us within 48 hours. We'll work to 
            make it right - whether that means sending another Pro or issuing a refund.
          </p>

          <h2>5. Environmental Responsibility</h2>
          <p>
            We care about responsible disposal:
          </p>
          <ul>
            <li>Items in good condition are donated when possible</li>
            <li>Recyclable materials go to appropriate facilities</li>
            <li>Electronics are disposed of per e-waste regulations</li>
            <li>Hazardous materials are never illegally dumped</li>
          </ul>
          <p>
            <strong>Our commitment:</strong> We divert at least 40% of collected items from landfills 
            through donation and recycling programs.
          </p>

          <h2>How to Make a Guarantee Claim</h2>
          <p>
            If we haven't met these guarantees:
          </p>
          <ol>
            <li>Contact us within 48 hours of your service</li>
            <li>Provide your booking number and describe the issue</li>
            <li>Include photos if relevant (damage claims)</li>
            <li>We'll respond within 24 hours with a resolution</li>
          </ol>

          <h2>Contact Us</h2>
          <p>
            Questions about our guarantees? We're here 7 AM - 10 PM, 7 days a week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 not-prose mt-4">
            <Button variant="outline" asChild data-testid="button-email-support">
              <a href="mailto:support@uptend.app">
                <Mail className="w-4 h-4 mr-2" />
                support@uptend.app
              </a>
            </Button>
            <Button asChild data-testid="button-call-support">
              <a href="tel:407-338-3342">
                <Phone className="w-4 h-4 mr-2" />
                (407) 338-3342
              </a>
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground not-prose">
            <strong>Marketplace Notice:</strong> UpTend is a technology platform connecting customers with independent 
            service providers (Pros). These guarantees describe the standards we require of Pros on our platform 
            and the support UpTend provides when issues arise. Pros are independent contractors, not UpTend employees. 
            Insurance claims are handled through the Pro's own liability coverage.
          </div>
        </Card>

        <Card className="p-6 mt-8 bg-primary/5 border-primary/20 text-center">
          <h3 className="text-xl font-bold mb-2">Ready to experience the UpTend difference?</h3>
          <p className="text-muted-foreground mb-4">
            Book with confidence. Every job is backed by our platform standards.
          </p>
          <Link href="/book">
            <Button size="lg" data-testid="button-book-now">
              <Zap className="w-4 h-4 mr-2" />
              Book Now
            </Button>
          </Link>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
