/**
 * Shared Partner Configuration
 * Used by both partner photo quote page and pro dashboard
 */

export interface PartnerConfig {
  companyName: string;
  tagline: string;
  phone: string;
  ownerName: string;
  accentColor: string;
  serviceType: string;
}

export const PARTNER_CONFIGS: Record<string, PartnerConfig> = {
  "comfort-solutions-tech": {
    companyName: "Comfort Solutions Tech LLC",
    tagline: "Your Comfort, Our Mission",
    phone: "(855) 901-2072",
    ownerName: "Alex",
    accentColor: "#2563EB",
    serviceType: "HVAC",
  },
  "a2-nona-junk-removal": {
    companyName: "A² Nona Junk Removal",
    tagline: "Lake Nona's Junk Removal Pros",
    phone: "(855) 901-2072",
    ownerName: "Alan",
    accentColor: "#16A34A",
    serviceType: "Junk Removal",
  },
  "demo-hvac": {
    companyName: "Orlando Air Pro",
    tagline: "Orlando's Trusted HVAC Experts",
    phone: "(855) 901-2072",
    ownerName: "Team",
    accentColor: "#2563EB",
    serviceType: "HVAC",
  },
};

export const DEFAULT_CONFIG: PartnerConfig = {
  companyName: "Comfort Solutions Tech LLC",
  tagline: "Your Comfort, Our Mission",
  phone: "(855) 901-2072",
  ownerName: "Alex",
  accentColor: "#2563EB",
  serviceType: "HVAC",
};

export function getPartnerConfig(slug: string): PartnerConfig {
  return PARTNER_CONFIGS[slug] ?? DEFAULT_CONFIG;
}
