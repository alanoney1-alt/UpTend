/**
 * Home DNA Scan SEO Landing Page
 *
 * Optimized for:
 * - "home inspection Orlando"
 * - "drone roof inspection Florida"
 * - "home scan service"
 * - "property maintenance inspection"
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Home,
  Plane,
  Camera,
  ClipboardCheck,
  Shield,
  DollarSign,
  ArrowRight,
  Star,
  Gift,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { useLocation } from "wouter";
import { SERVICES } from "@/constants/services";

export default function DwellScanLanding() {
  const [, setLocation] = useLocation();
  const dwellScan = SERVICES.home_scan;

  const handleBookTier = (tier: 'standard' | 'aerial') => {
    setLocation(`/book?service=home_consultation&tier=${tier}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950/20">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-4 bg-primary text-white">
            #1 Home DNA Scan Service in Orlando
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Home DNA Scan
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Know your home inside out. Complete walkthrough with personalized maintenance
            report. Add drone aerial scan for roof & gutter inspection.
          </p>
          <p className="text-lg font-semibold mb-8">
            Starting at just $99 • Includes $49 credit toward your next service
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => handleBookTier('standard')}>
              Book Standard ($99)
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => handleBookTier('aerial')}
            >
              <Plane className="w-5 h-5 mr-2" />
              Book Aerial ($249)
            </Button>
          </div>
        </div>
      </section>

      {/* Two-Tier Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Home DNA Scan</h2>
            <p className="text-lg text-muted-foreground">
              Both options include a $49 credit toward your next UpTend service
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Standard Tier */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Home DNA Scan Standard</h3>
                  <p className="text-4xl font-black text-primary mb-2">$99</p>
                  <p className="text-sm text-muted-foreground">
                    {dwellScan.tiers.standard.description}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="font-semibold text-sm">What's included:</p>
                  {dwellScan.tiers.standard.includes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{dwellScan.tiers.standard.estimatedDuration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Team</p>
                    <p className="font-semibold">{dwellScan.tiers.standard.prosNeeded} Pro</p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleBookTier('standard')}
                >
                  Book Standard - $99
                </Button>
              </CardContent>
            </Card>

            {/* Aerial Tier - RECOMMENDED */}
            <Card className="border-2 border-blue-500 relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                ⭐ RECOMMENDED
              </Badge>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Plane className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Home DNA Scan Aerial</h3>
                  <p className="text-4xl font-black text-blue-600 mb-2">$249</p>
                  <p className="text-sm text-muted-foreground">
                    {dwellScan.tiers.aerial.description}
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 mb-4">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    💡 Incredible Value
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Comparable drone roof inspections cost $290-$350 alone. You're getting it
                    bundled with a full interior walkthrough for just $249.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="font-semibold text-sm">Everything in Standard, plus:</p>
                  {dwellScan.tiers.aerial.includes.slice(1, 8).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-white/80 dark:bg-gray-900/80 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{dwellScan.tiers.aerial.estimatedDuration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Team</p>
                    <p className="font-semibold">
                      {typeof dwellScan.tiers.aerial.prosNeeded === 'object'
                        ? `${dwellScan.tiers.aerial.prosNeeded.default} Pros`
                        : `${dwellScan.tiers.aerial.prosNeeded} Pro`}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                  onClick={() => handleBookTier('aerial')}
                >
                  <Plane className="w-5 h-5 mr-2" />
                  Book Aerial - $249
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Credit Highlight */}
          <div className="mt-12 p-6 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-4 max-w-3xl mx-auto">
              <Gift className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                  $49 Credit Included with Both Options
                </h3>
                <p className="text-green-800 dark:text-green-200">
                  Use your $49 credit toward any UpTend service within 90 days. That means
                  Home DNA Scan Standard is effectively just <strong>$50</strong> when you book a
                  follow-up service, and Aerial is effectively just $200 for a drone inspection
                  worth $290+.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Choose Home DNA Scan?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <Camera className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Fully Documented</h3>
                <p className="text-sm text-muted-foreground">
                  Every assessment includes GPS-tagged photos, timestamps, and detailed notes.
                  Perfect for insurance claims, property listings, or personal records.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ClipboardCheck className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Actionable Report</h3>
                <p className="text-sm text-muted-foreground">
                  Get a personalized maintenance roadmap with priority rankings. One-tap booking
                  for recommended services right from your report.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Shield className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Verified Pros</h3>
                <p className="text-sm text-muted-foreground">
                  All inspectors are background-checked and insured. Aerial inspections performed
                  by FAA Part 107 certified drone pilots only.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">4.9</p>
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">2,500+</p>
              <p className="text-sm text-muted-foreground">Homes Scanned</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">98%</p>
              <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">$49</p>
              <p className="text-sm text-muted-foreground">Credit Included</p>
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-4">Trusted by Orlando Homeowners</h3>
          <p className="text-muted-foreground mb-8">
            Home DNA Scan helps homeowners protect their biggest investment with verified,
            documented maintenance insights. Whether you're buying, selling, renting, or just
            want to know what your home needs, Home DNA Scan gives you the clarity you deserve.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Know Your Home?</h2>
          <p className="text-xl mb-8 opacity-90">
            Book your Home DNA Scan today. Most homes can be scanned within 48 hours.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => handleBookTier('standard')}
            >
              Book Standard - $99
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-2 border-white"
              onClick={() => handleBookTier('aerial')}
            >
              <Plane className="w-5 h-5 mr-2" />
              Book Aerial - $249
            </Button>
          </div>
          <p className="text-sm mt-6 opacity-75">
            ✅ Same-day or next-day appointments • ✅ $49 credit included • ✅ No hidden fees
          </p>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto prose prose-sm dark:prose-invert">
          <h2>Home DNA Scan Service in Orlando, Florida</h2>
          <p>
            Home DNA Scan is UpTend's comprehensive home inspection and audit service designed
            specifically for Central Florida homeowners. Unlike traditional home inspections that
            focus solely on pre-purchase assessments, Home DNA Scan provides ongoing home health
            monitoring for existing homeowners, renters, landlords, and property managers.
          </p>

          <h3>What is included in Home DNA Scan Standard?</h3>
          <p>
            Home DNA Scan Standard ($99) includes a complete interior and exterior ground-level
            walkthrough of your property. Our verified Pro will photograph and document every room,
            assess major systems (HVAC, water heater, electrical panel, plumbing), check your
            foundation and exterior for visible issues, and provide a personalized maintenance
            report with priority rankings.
          </p>

          <h3>What makes Home DNA Scan Aerial different?</h3>
          <p>
            Home DNA Scan Aerial adds a FAA Part 107 certified drone flyover to capture aerial
            roof condition scans, gutter blockage estimates, chimney and vent inspections, tree
            overhang proximity assessments, and property drainage overviews. Standalone drone roof
            inspections typically cost $290-$350 in the Orlando market, making Aerial an incredible
            value when bundled with our interior walkthrough.
          </p>

          <h3>Do I really get a $49 credit?</h3>
          <p>
            Yes! Every Home DNA Scan (Standard or Aerial) includes a $49 credit toward any UpTend
            service booked within 90 days. This means Home DNA Scan Standard is essentially free when
            you book a follow-up service like junk removal, home cleaning, or pressure washing.
          </p>

          <h3>Who performs the inspection?</h3>
          <p>
            All Home DNA Scan Standard inspections are performed by UpTend's verified Pros who are
            background-checked and insured. Home DNA Scan Aerial inspections are performed by FAA Part
            107 certified drone pilots with additional walkthrough training. We do not subcontract
            — all Pros are directly vetted by UpTend.
          </p>

          <h3>How is Home DNA Scan different from a traditional home inspection?</h3>
          <p>
            Traditional home inspections ($300-$500) are designed for pre-purchase due diligence
            and focus on major structural and system defects. Home DNA Scan is designed for ongoing
            home maintenance and includes actionable recommendations with one-tap booking for
            services. We're focused on preventative maintenance, not just defect identification.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
