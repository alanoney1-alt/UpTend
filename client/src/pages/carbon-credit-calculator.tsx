import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Leaf, DollarSign, TrendingUp, Building2, Users, ArrowRight, Sparkles } from "lucide-react";

export default function CarbonCreditCalculator() {
  const [properties, setProperties] = useState(50);
  const [jobsPerProperty, setJobsPerProperty] = useState(0.3);
  const [avgWeightPerJob, setAvgWeightPerJob] = useState(500);
  const [diversionRate, setDiversionRate] = useState(0.65);

  // Calculate carbon credits
  const totalJobs = Math.round(properties * jobsPerProperty);
  const totalWeightLbs = totalJobs * avgWeightPerJob;
  const divertedWeightLbs = totalWeightLbs * diversionRate;
  const divertedWeightTons = divertedWeightLbs / 2204.62;
  const annualCredits = divertedWeightTons * 2.0; // EPA WARM mixed waste factor
  const monthlyCredits = annualCredits / 12;

  // Market value calculations
  const annualRevenueLow = Math.round(annualCredits * 10); // $10/ton voluntary
  const annualRevenueAvg = Math.round(annualCredits * 20); // $20/ton average
  const annualRevenueHigh = Math.round(annualCredits * 100); // $100/ton premium verified

  // Referral fee calculations (10% of jobs)
  const avgJobRevenue = 250; // Conservative average
  const totalJobRevenue = totalJobs * avgJobRevenue;
  const annualReferralFees = Math.round(totalJobRevenue * 0.10);

  // Total community income
  const totalIncomeLow = annualRevenueLow + annualReferralFees;
  const totalIncomeAvg = annualRevenueAvg + annualReferralFees;
  const totalIncomeHigh = annualRevenueHigh + annualReferralFees;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-background">
      <Header />

      <div className="pt-24 pb-16 px-6">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge className="mb-4 bg-green-500 hover:bg-green-600">
            <Sparkles className="w-3 h-3 mr-1" />
            Carbon Credit Revenue Calculator
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            Turn Your Community's Waste Into
            <span className="text-green-600 dark:text-green-400"> Income</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            HOAs and Property Managers: Discover how much your community can earn from
            carbon credits + referral fees through UpTend's sustainability platform.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Calculator Inputs */}
          <Card className="p-8 bg-white dark:bg-card">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold">Your Community</h2>
            </div>

            <div className="space-y-6">
              {/* Number of Properties */}
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center justify-between">
                  <span>Number of Properties</span>
                  <Badge variant="outline">{properties}</Badge>
                </Label>
                <Slider
                  value={[properties]}
                  onValueChange={([val]) => setProperties(val)}
                  min={10}
                  max={500}
                  step={10}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10 homes</span>
                  <span>500+ homes</span>
                </div>
              </div>

              {/* Jobs Per Property Per Year */}
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center justify-between">
                  <span>Annual Jobs Per Property</span>
                  <Badge variant="outline">{(jobsPerProperty * 100).toFixed(0)}%</Badge>
                </Label>
                <Slider
                  value={[jobsPerProperty * 100]}
                  onValueChange={([val]) => setJobsPerProperty(val / 100)}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Conservative estimate: {(jobsPerProperty * 100).toFixed(0)}% of homes use UpTend per year
                  ({totalJobs} total jobs)
                </p>
              </div>

              {/* Average Weight Per Job */}
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center justify-between">
                  <span>Avg Weight Per Job (lbs)</span>
                  <Badge variant="outline">{avgWeightPerJob} lbs</Badge>
                </Label>
                <Slider
                  value={[avgWeightPerJob]}
                  onValueChange={([val]) => setAvgWeightPerJob(val)}
                  min={100}
                  max={2000}
                  step={50}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Typical junk removal job: 300-800 lbs
                </p>
              </div>

              {/* Landfill Diversion Rate */}
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center justify-between">
                  <span>Landfill Diversion Rate</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300">
                    {(diversionRate * 100).toFixed(0)}%
                  </Badge>
                </Label>
                <Slider
                  value={[diversionRate * 100]}
                  onValueChange={([val]) => setDiversionRate(val / 100)}
                  min={40}
                  max={90}
                  step={5}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  UpTend average: 65-75% diverted through recycling, donation, and reuse
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Leaf className="w-4 h-4 text-green-600" />
                <span>Based on EPA WARM Model (Waste Reduction Algorithm)</span>
              </div>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {/* Annual Carbon Credits */}
            <Card className="p-8 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Carbon Credits Generated</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {annualCredits.toFixed(1)} <span className="text-base font-normal">metric tons CO2e</span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="text-lg font-bold">{monthlyCredits.toFixed(2)} tons</p>
                </div>
                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Waste Diverted</p>
                  <p className="text-lg font-bold">{(divertedWeightLbs / 1000).toFixed(1)}k lbs</p>
                </div>
              </div>
            </Card>

            {/* Carbon Credit Revenue */}
            <Card className="p-8 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carbon Credit Market Value</p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                    ${annualRevenueAvg.toLocaleString()}/year
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conservative ($10/ton)</span>
                  <span className="font-semibold">${annualRevenueLow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Market ($20/ton)</span>
                  <span className="font-semibold">${annualRevenueAvg.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Premium Verified ($100/ton)</span>
                  <span className="font-semibold text-green-600">${annualRevenueHigh.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Referral Fees */}
            <Card className="p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Referral Fees (10%)</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    ${annualReferralFees.toLocaleString()}/year
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn 10% of every job from your community (first 10 jobs guaranteed, then ongoing based on partnership)
              </p>
            </Card>

            {/* Total Community Income */}
            <Card className="p-8 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Annual Income</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                    ${totalIncomeAvg.toLocaleString()}/year
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center bg-white/60 dark:bg-black/20 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Low</p>
                  <p className="text-sm font-bold">${(totalIncomeLow / 1000).toFixed(1)}k</p>
                </div>
                <div className="text-center bg-amber-500/20 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-sm font-bold">${(totalIncomeAvg / 1000).toFixed(1)}k</p>
                </div>
                <div className="text-center bg-white/60 dark:bg-black/20 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">High</p>
                  <p className="text-sm font-bold">${(totalIncomeHigh / 1000).toFixed(1)}k</p>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <h3 className="text-xl font-bold mb-3">Ready to Start Earning?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Join UpTend as a preferred vendor partner. We handle the work, you earn the credits + referral fees.
                <strong className="block mt-2">100% free for HOAs. No upfront costs.</strong>
              </p>
              <Button size="lg" className="w-full text-lg" onClick={() => window.location.href = "/auth?accountType=business"}>
                Get Started - Claim Your Credits
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                First 10 jobs: Guaranteed 10% referral fee
              </p>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold mb-2">Partner with UpTend</h3>
              <p className="text-sm text-muted-foreground">
                Free signup. Submit HOA violations, residents book services, we handle everything.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold mb-2">Residents Use UpTend</h3>
              <p className="text-sm text-muted-foreground">
                We track waste diversion (recycling, donation) using EPA methodology. You earn 10% referral fee.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold mb-2">Claim Carbon Credits</h3>
              <p className="text-sm text-muted-foreground">
                Carbon credits generated belong to YOUR HOA. Sell them on marketplace or hold for value.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
