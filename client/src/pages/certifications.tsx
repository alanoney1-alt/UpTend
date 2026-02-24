import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Home, Cpu, Package, AlertTriangle, Landmark,
  CheckCircle, Clock, Lock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const certifications = [
  {
    id: "b2b_pm",
    icon: Building2,
    name: "B2B Property Management",
    description:
      "Certifies Pros to handle commercial and residential property management contracts. Covers multi-unit maintenance coordination, vendor management, and compliance reporting.",
    status: "available" as const,
  },
  {
    id: "b2b_hoa",
    icon: Home,
    name: "B2B HOA Services",
    description:
      "Qualifies Pros for Homeowners Association service contracts. Includes community standards compliance, scheduled maintenance protocols, and HOA board reporting.",
    status: "available" as const,
  },
  {
    id: "ai_home_scan",
    icon: Cpu,
    name: "AI Home Scan Specialist",
    description:
      "Trains Pros to conduct AI-powered home health audits using the UpTend Home DNA Scan system. Covers interior walkthrough methodology, drone-assisted roof scans, and report generation.",
    status: "available" as const,
  },
  {
    id: "parts_materials",
    icon: Package,
    name: "Parts & Materials Handling",
    description:
      "Certifies Pros in proper sourcing, handling, and documentation of parts and materials. Ensures compliance with UpTend's supply chain standards and circular economy commitments.",
    status: "coming_soon" as const,
  },
  {
    id: "emergency_response",
    icon: AlertTriangle,
    name: "Emergency Response",
    description:
      "Prepares Pros for rapid-deployment emergency and disaster response jobs. Covers FEMA coordination, storm damage assessment, hazardous material awareness, and 24/7 activation protocols.",
    status: "coming_soon" as const,
  },
  {
    id: "government_contract",
    icon: Landmark,
    name: "Government Contract Ready",
    description:
      "Qualifies Pros for government and municipal contracts. Includes prevailing wage compliance, Davis-Bacon Act awareness, security clearance readiness, and SAM.gov registration guidance.",
    status: "coming_soon" as const,
  },
];

const statusConfig = {
  available: { label: "Enrolling Now", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100", icon: CheckCircle },
  coming_soon: { label: "Coming Soon", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100", icon: Clock },
  locked: { label: "Locked", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: Lock },
};

export default function Certifications() {
  usePageTitle("Pro Certifications | UpTend");
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background" data-testid="page-certifications">
      <Header />

      <section className="bg-slate-900 dark:bg-slate-950 pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Pro Certification Programs
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Unlock higher-paying jobs and specialized contracts. Each certification is built
            by industry experts and verified by UpTend.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((cert) => {
            const st = statusConfig[cert.status];
            const StatusIcon = st.icon;
            return (
              <Card key={cert.id} className="flex flex-col" data-testid={`card-cert-${cert.id}`}>
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <cert.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{cert.name}</h3>
                      <Badge className={st.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {st.label}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cert.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
