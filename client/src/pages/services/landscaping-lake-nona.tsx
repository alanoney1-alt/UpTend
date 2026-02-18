import { SeoServicePage } from "./seo-service-page";
import { Leaf } from "lucide-react";

const data = {
  slug: "landscaping-lake-nona",
  h1: "Landscaping Services in Lake Nona",
  metaTitle: "Landscaping Lake Nona | Lawn Care, Design & Maintenance | UpTend",
  metaDescription: "Professional landscaping in Lake Nona, FL. Lawn care, garden design, tree trimming, and ongoing maintenance. Book trusted pros with UpTend today.",
  heroTagline: "Beautiful, maintained landscapes for Lake Nona homes. From weekly lawn care to full landscape design — trusted Pros, transparent pricing.",
  heroGradient: "from-green-600 to-emerald-500",
  icon: Leaf,
  serviceDescription: [
    "UpTend's landscaping service keeps Lake Nona properties looking their best year-round. Our Pros handle everything from weekly lawn mowing and edging to hedge trimming, mulching, flower bed maintenance, and seasonal plantings tailored to Central Florida's climate.",
    "Need a full landscape refresh? We offer design consultations, sod installation, irrigation adjustments, tree and shrub planting, and hardscape coordination. Whether you're maintaining a Laureate Park townhome or a sprawling Lake Nona estate, we match you with Pros who know the local soil, climate, and HOA requirements.",
  ],
  features: [
    "Weekly & bi-weekly lawn mowing and edging",
    "Hedge & shrub trimming",
    "Mulching & flower bed maintenance",
    "Tree trimming & palm frond removal",
    "Sod installation & overseeding",
    "Seasonal plantings for Florida climate",
    "Irrigation system checks",
    "HOA-compliant landscape maintenance",
  ],
  pricing: {
    label: "Landscaping",
    startingAt: "From $49/visit",
    details: "Basic lawn mow & edge from $49. Full-service maintenance plans from $149/month. Landscape design projects quoted separately.",
  },
  neighborhoods: [
    "Laureate Park", "Lake Nona Town Center", "North Lake Nona", "Moss Park",
    "Randal Park", "Storey Park", "Eagle Creek", "Narcoossee",
    "Boggy Creek", "Medical City", "Vista Lakes", "Lake Nona Golf & Country Club",
  ],
  localContent: {
    areaName: "Lake Nona",
    areaDescription: "Lake Nona's master-planned communities have high standards for curb appeal, and many HOAs require regular landscape maintenance. UpTend connects you with local landscaping Pros who understand Lake Nona's sandy soil, subtropical plantings, and community-specific requirements — keeping your property beautiful and compliant year-round.",
    whyLocalsChoose: [
      "Pros who know Lake Nona's soil, climate, and HOA rules",
      "Recurring maintenance plans with consistent crews",
      "Florida-native plant expertise for sustainable landscapes",
      "Flexible scheduling including weekends",
      "Transparent flat-rate pricing per visit",
      "Before/after photos with every service",
    ],
  },
  faqs: [
    { q: "Do you offer recurring lawn care in Lake Nona?", a: "Yes! We offer weekly and bi-weekly maintenance plans. You get a consistent crew who knows your property, scheduled on the same day each week." },
    { q: "Can you work with my HOA's landscape requirements?", a: "Absolutely. Our Pros are familiar with Lake Nona community guidelines for Laureate Park, Randal Park, Storey Park, and other neighborhoods. We ensure all work meets HOA standards." },
    { q: "What plants work best in Lake Nona?", a: "We recommend Florida-native and drought-tolerant species like muhly grass, coontie, firebush, and Simpson's stopper. Our Pros can suggest plantings that thrive in Lake Nona's sandy soil with minimal irrigation." },
    { q: "Do you handle tree trimming?", a: "Yes — we handle tree trimming, palm frond removal, and light tree pruning. For large tree removal, we coordinate with licensed arborists." },
  ],
  schemaService: {
    serviceType: "Landscaping",
    description: "Professional landscaping and lawn care services in Lake Nona, FL. Weekly maintenance, garden design, tree trimming, and seasonal plantings.",
    areaServed: "Lake Nona, Orlando, FL",
  },
};

export default function LandscapingLakeNona() {
  return <SeoServicePage data={data} />;
}
