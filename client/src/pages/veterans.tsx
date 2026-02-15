import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  Shield, Star, Users, Award, Upload, ArrowRight,
  CheckCircle, Heart, Briefcase, MapPin, DollarSign,
  TrendingUp, Target, Wrench, Zap, Home, FileText
} from "lucide-react";

const mosToTrade: Record<string, string> = {
  "12B": "Combat Engineer → General Contractor",
  "12K": "Plumber → Licensed Plumber",
  "12R": "Interior Electrician → Licensed Electrician",
  "12W": "Carpentry & Masonry → Carpenter / Mason",
  "51C": "Plumber → Licensed Plumber",
  "51K": "Plumber → Plumbing Specialist",
  "12N": "Horizontal Construction → Heavy Equipment Operator",
  "12T": "Technical Engineer → Project Manager",
  "91B": "Wheeled Vehicle Mechanic → Fleet Maintenance",
  "91C": "Utilities Equipment Repairer → HVAC Technician",
};

const benefits = [
  { icon: Award, title: "SDVOSB Certification Support", desc: "We help you navigate VA verification and SBA certification so you can compete for set-aside contracts." },
  { icon: Users, title: "Veteran Mentor Network", desc: "Connect with experienced veteran contractors who've built successful businesses on UpTend." },
  { icon: DollarSign, title: "Priority Government Contracts", desc: "Access VA, DoD, and federal contract opportunities with set-aside preferences." },
  { icon: Target, title: "MOS-to-Trade Mapping", desc: "Your military skills translate directly. We map your MOS to civilian trade certifications." },
  { icon: Heart, title: "Military Spouse Program", desc: "Portable careers for military spouses — work from any base with UpTend's remote-friendly services." },
  { icon: TrendingUp, title: "Business Growth Tools", desc: "Free business coaching, marketing support, and equipment financing partnerships." },
];

const testimonials = [
  { name: "SGT Marcus Rivera (Ret.)", branch: "Army", mos: "12B", trade: "General Contractor", quote: "UpTend helped me turn 8 years of combat engineering into a thriving contracting business. The MOS mapping made licensing a breeze.", rating: 5 },
  { name: "PO2 Jennifer Walsh (Ret.)", branch: "Navy", mos: "UT", trade: "Plumber", quote: "As a Navy Utilitiesman, plumbing was second nature. UpTend connected me with my first 20 clients in the first month.", rating: 5 },
  { name: "SSG David Kim (Ret.)", branch: "Army", mos: "91C", trade: "HVAC Technician", quote: "The veteran mentor program matched me with a fellow vet who helped me get my SDVOSB cert and land government contracts.", rating: 5 },
];

export default function Veterans() {
  const [selectedMos, setSelectedMos] = useState("");
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [mosCode, setMosCode] = useState("");
  const [disabilityRating, setDisabilityRating] = useState("");
  const [dd214File, setDd214File] = useState<File | null>(null);
  const [dd214Uploading, setDd214Uploading] = useState(false);
  const [dd214Url, setDd214Url] = useState("");

  const handleDd214Upload = async (file: File) => {
    setDd214File(file);
    setDd214Uploading(true);
    try {
      const formData = new FormData();
      formData.append("dd214", file);
      const res = await fetch("/api/veterans/upload-dd214", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setDd214Url(data.url);
      toast({ title: "DD-214 uploaded successfully" });
    } catch (err) {
      toast({ title: "Failed to upload DD-214", variant: "destructive" });
      setDd214File(null);
    } finally {
      setDd214Uploading(false);
    }
  };

  const createVeteranMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/veterans/profiles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/veterans/profiles"] });
      toast({ title: "Account Created!", description: "Welcome to UpTend, veteran pro!" });
      setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setBranch(""); setMosCode(""); setDisabilityRating("");
    },
    onError: (err: Error) => { toast({ title: "Failed to create account", description: err.message, variant: "destructive" }); },
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm px-4 py-1">
              <Shield className="w-4 h-4 mr-1" /> Veteran-Owned & Operated
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your Service Built <span className="text-orange-500">America</span>.
            <br />Now Build Your <span className="text-orange-500">Business</span>.
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            UpTend helps veterans transition their military skills into thriving home service businesses.
            SDVOSB support, MOS mapping, mentor networks, and priority government contracts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 text-lg">
              <Shield className="w-5 h-5 mr-2" /> Join as a Veteran Pro <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg">
              Learn More
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-slate-400">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> VA Verified</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> SDVOSB Support</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> DD-214 Verified</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> All Branches Welcome</span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Veterans Choose UpTend</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">Purpose-built tools and support designed specifically for veteran service professionals.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(b => (
              <Card key={b.title} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                    <b.icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{b.title}</h3>
                  <p className="text-sm text-slate-400">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MOS Mapping */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">MOS → Civilian Trade Mapping</h2>
          <p className="text-slate-400 text-center mb-10">Your military occupational specialty translates to in-demand civilian trades.</p>
          
          <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
            <Label className="text-white mb-2 block">Find Your MOS</Label>
            <Select value={selectedMos} onValueChange={setSelectedMos}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select your MOS code" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(mosToTrade).map(([code, mapping]) => (
                  <SelectItem key={code} value={code}>{code} — {mapping}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMos && (
              <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-orange-400 font-medium text-lg">{mosToTrade[selectedMos]}</p>
                <p className="text-slate-400 text-sm mt-1">UpTend will help you get licensed and find your first clients.</p>
              </div>
            )}
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(mosToTrade).slice(0, 6).map(([code, mapping]) => (
              <div key={code} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono">{code}</Badge>
                <span className="text-slate-300 text-sm">{mapping}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Veteran Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <Card key={t.name} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />)}
                  </div>
                  <p className="text-slate-300 text-sm mb-4 italic">"{t.quote}"</p>
                  <div className="border-t border-slate-700 pt-3">
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-slate-400">{t.branch} • MOS {t.mos} → {t.trade}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section className="py-20 px-4" id="signup">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Start Your Journey</h2>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-white">First Name</Label><Input className="bg-slate-700 border-slate-600 text-white" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div><Label className="text-white">Last Name</Label><Input className="bg-slate-700 border-slate-600 text-white" placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
              <div><Label className="text-white">Email</Label><Input type="email" className="bg-slate-700 border-slate-600 text-white" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label className="text-white">Phone</Label><Input type="tel" className="bg-slate-700 border-slate-600 text-white" placeholder="(555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Branch</Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="army">Army</SelectItem>
                      <SelectItem value="navy">Navy</SelectItem>
                      <SelectItem value="air_force">Air Force</SelectItem>
                      <SelectItem value="marines">Marines</SelectItem>
                      <SelectItem value="coast_guard">Coast Guard</SelectItem>
                      <SelectItem value="space_force">Space Force</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-white">MOS Code</Label><Input className="bg-slate-700 border-slate-600 text-white" placeholder="e.g., 12B" value={mosCode} onChange={e => setMosCode(e.target.value)} /></div>
              </div>
              <div>
                <Label className="text-white">Upload DD-214 (optional)</Label>
                <div
                  className="mt-2 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors cursor-pointer relative"
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleDd214Upload(f); }}
                  onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".pdf,.jpg,.jpeg,.png"; input.onchange = (e: any) => { const f = e.target.files?.[0]; if (f) handleDd214Upload(f); }; input.click(); }}
                >
                  {dd214Uploading ? (
                    <p className="text-sm text-orange-400">Uploading...</p>
                  ) : dd214Url ? (
                    <>
                      <CheckCircle className="w-8 h-8 mx-auto text-green-400 mb-2" />
                      <p className="text-sm text-green-400">DD-214 uploaded successfully</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-400">{dd214File ? dd214File.name : "Drop your DD-214 here or click to upload"}</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, JPG, or PNG • Encrypted & secure</p>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-white">Disability Rating (optional)</Label>
                <Select value={disabilityRating} onValueChange={setDisabilityRating}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Select if applicable" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="60">60%</SelectItem>
                    <SelectItem value="70">70%</SelectItem>
                    <SelectItem value="80">80%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-6" disabled={createVeteranMutation.isPending} onClick={() => createVeteranMutation.mutate({ firstName, lastName, email, phone, branch, mosCode, disabilityRating: disabilityRating ? Number(disabilityRating) : undefined })}>
                <Shield className="w-5 h-5 mr-2" /> {createVeteranMutation.isPending ? "Creating Account..." : "Create Veteran Pro Account"}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                By signing up, you agree to UpTend's Terms of Service. Your DD-214 is encrypted and only used for verification.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-3xl font-bold mb-4">Thank You for Your Service</h2>
          <p className="text-slate-400 mb-6">Let UpTend serve you. Join thousands of veteran pros building successful businesses.</p>
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10">
            Get Started Today <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
