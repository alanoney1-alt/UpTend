import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Truck, DollarSign, Clock, Shield, Star, CheckCircle, 
  MapPin, Zap, Users, Gift, ChevronRight, ArrowRight,
  Smartphone, CreditCard, BadgeCheck
} from "lucide-react";

const serviceRoles = [
  {
    id: "mover",
    title: "Mover",
    description: "Help with residential moves, large-item deliveries, and furniture transport.",
    earnings: "$40–$120 per job",
    hourly: "$30–$60/hr average",
    icon: Truck,
  },
  {
    id: "hauler", 
    title: "Hauler",
    description: "Specialize in junk removal, heavy lifting, and eco-friendly pickups.",
    earnings: "$50–$150 per job",
    hourly: "$35–$70/hr average",
    icon: Truck,
  },
  {
    id: "helper",
    title: "Helper",
    description: "Provide labor assistance for loading, unloading, and moving tasks.",
    earnings: "$25–$75 per job",
    hourly: "$20–$40/hr average",
    icon: Users,
  },
];

const requirements = [
  { icon: BadgeCheck, text: "Valid Driver's License – Must be at least 18 years old" },
  { icon: Smartphone, text: "Smartphone with UpTend App – Accept and manage jobs from your phone" },
  { icon: Truck, text: "Vehicle Requirements – Car, SUV, pickup truck, cargo van, or box truck" },
  { icon: Shield, text: "Pass a Background Check – Safety is our top priority" },
  { icon: Zap, text: "Ability to Lift & Carry – Movers & Pros must lift 75-100+ lbs" },
];

const perks = [
  { icon: DollarSign, title: "No Lead Fees", description: "Unlike Thumbtack, Yelp, or TaskRabbit - you never pay for leads" },
  { icon: Zap, title: "Instant Payouts", description: "Money goes directly to you when the job is done" },
  { icon: Gift, title: "Keep 100% of Tips", description: "Every tip goes straight to your pocket - we take nothing" },
  { icon: Star, title: "No Subscription Fees", description: "No monthly costs - just complete jobs and get paid" },
  { icon: Clock, title: "Flexible Schedule", description: "Work when you want, no minimum hours" },
  { icon: MapPin, title: "Orlando Focus", description: "Local jobs in the greater Orlando area" },
];

const steps = [
  { number: "01", title: "Apply Online", description: "Sign up in minutes & submit your details" },
  { number: "02", title: "Get Approved", description: "Complete background check & vehicle verification" },
  { number: "03", title: "Accept Jobs", description: "Choose jobs that fit your schedule" },
  { number: "04", title: "Get Paid Fairly", description: "Transparent payouts after every completed job" },
];

export default function Drive() {
  usePageTitle("Drive with UpTend | Earn on Your Schedule");
  const [selectedRole, setSelectedRole] = useState("hauler");
  const [jobsPerDay, setJobsPerDay] = useState([3]);

  const roleData: Record<string, { min: number; max: number }> = {
    mover: { min: 40, max: 120 },
    hauler: { min: 50, max: 150 },
    helper: { min: 25, max: 75 },
  };

  const avgPerJob = (roleData[selectedRole].min + roleData[selectedRole].max) / 2;
  const dailyEarnings = avgPerJob * jobsPerDay[0];
  const weeklyEarnings = dailyEarnings * 6;
  const monthlyEarnings = weeklyEarnings * 4;
  const yearlyEarnings = weeklyEarnings * 52;

  return (
    <div className="min-h-screen bg-background" data-testid="page-drive">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">UpTend</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/book">
              <Button variant="outline" data-testid="link-book-service">Book Your Home Service</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">Now Hiring in Orlando</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Stop Paying for Leads.<br />
              <span className="text-primary">Start Building Impact.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              No lead fees. No hidden cuts. Just real jobs, fair pay, and a verified track record
              that makes you the first choice for homeowners who care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pro/signup">
                <Button size="lg" className="gap-2" data-testid="button-apply-now">
                  Start Earning Today <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Pros Love UpTend</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Skip the lead-gen runaround. Get jobs, get paid, keep your tips.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                    <perk.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{perk.title}</h3>
                    <p className="text-sm text-muted-foreground">{perk.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Find Your Perfect Role</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pick the jobs that match your skills and start earning.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {serviceRoles.map((role) => (
              <Card 
                key={role.id} 
                className={`p-6 cursor-pointer transition-all hover-elevate ${selectedRole === role.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedRole(role.id)}
                data-testid={`button-role-${role.id}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                    <role.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">{role.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                <div className="space-y-1">
                  <p className="font-semibold text-primary">{role.earnings}</p>
                  <p className="text-sm text-muted-foreground">{role.hourly}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Calculate Your Earnings</h2>
              <p className="text-muted-foreground">
                See how much you could earn driving with UpTend in Orlando
              </p>
            </div>
            
            <Card className="p-8">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium mb-3">Service Type</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mover">Mover</SelectItem>
                      <SelectItem value="hauler">Hauler</SelectItem>
                      <SelectItem value="helper">Helper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium">Jobs per Day</label>
                    <span className="text-sm font-bold text-primary">{jobsPerDay[0]} jobs</span>
                  </div>
                  <Slider
                    value={jobsPerDay}
                    onValueChange={setJobsPerDay}
                    min={1}
                    max={8}
                    step={1}
                    className="mb-2"
                    data-testid="slider-jobs"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 job</span>
                    <span>8 jobs</span>
                  </div>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg" data-testid="text-avg-per-job">
                  <p className="text-sm text-muted-foreground mb-1">Average per job</p>
                  <p className="text-2xl font-bold">${avgPerJob.toFixed(0)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 text-center" data-testid="text-daily-earnings">
                    <p className="text-xs text-muted-foreground mb-1">Daily</p>
                    <p className="text-xl font-bold text-primary">${dailyEarnings.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 text-center" data-testid="text-weekly-earnings">
                    <p className="text-xs text-muted-foreground mb-1">Weekly (6 days)</p>
                    <p className="text-xl font-bold text-primary">${weeklyEarnings.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 text-center" data-testid="text-monthly-earnings">
                    <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                    <p className="text-xl font-bold text-primary">${monthlyEarnings.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 text-center bg-primary text-primary-foreground" data-testid="text-yearly-earnings">
                    <p className="text-xs opacity-80 mb-1">Yearly</p>
                    <p className="text-xl font-bold">${yearlyEarnings.toLocaleString()}</p>
                  </Card>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  *Earnings are estimates based on Orlando averages and may vary by location and seasonality.
                </p>

                <Button size="lg" className="w-full mt-4 gap-2" data-testid="button-calculator-apply">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Requirements</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              What you need to start earning with UpTend
            </p>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {requirements.map((req, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                    <req.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm">{req.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How to Get Started</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary/20 mb-3">{step.number}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Refer Friends, Earn $50 Each
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Know someone who'd be a great Pro? Refer them and you'll both earn $50 
              after they complete their first job.
            </p>
            <Button size="lg" variant="secondary" className="gap-2" data-testid="button-refer-friend">
              <Gift className="w-4 h-4" /> Start Referring
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground mb-8">
              Join the growing community of verified Pros in Orlando. Fair pay, proven impact, full accountability.
            </p>
            <Link href="/pro/signup">
              <Button size="lg" className="gap-2" data-testid="button-apply-bottom">
                Apply Now <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span className="font-bold">UpTend</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} UpTend. All rights reserved. Orlando, FL
            </p>
            <div className="flex gap-4">
              <Link href="/">
                <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                  Customer Site
                </span>
              </Link>
              <Link href="/pro/dashboard">
                <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                  Pro Portal
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
