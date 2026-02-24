import { SeoServicePage } from "./seo-service-page";
import { Home } from "lucide-react";

const data = {
  slug: "home-services-lake-nona",
  h1: "Home Services in Lake Nona",
  metaTitle: "Home Services Lake Nona | Cleaning, Repairs, Lawn & More | UpTend",
  metaDescription: "All-in-one home services in Lake Nona, FL. Cleaning, handyman, landscaping, junk removal, pool care & more. One app, trusted pros. Book with UpTend.",
  heroTagline: "One app for every home service in Lake Nona. Cleaning, repairs, landscaping, junk removal, pool care, and more — all from vetted, local Pros.",
  heroGradient: "from-violet-600 to-purple-500",
  icon: Home,
  serviceDescription: [
    "UpTend is Lake Nona's all-in-one home services platform. Instead of juggling multiple contractors, phone calls, and invoices, book everything through one app — cleaning, handyman, landscaping, junk removal, pool maintenance, pressure washing, gutter cleaning, and more.",
    "Every Pro on the UpTend platform is background-checked, skills-verified, and insured. You get transparent pricing, real-time tracking, before/after documentation, and a satisfaction guarantee on every job. Whether you need a one-time deep clean or year-round property maintenance, UpTend is the smarter way to care for your Lake Nona home.",
  ],
  features: [
    "Home cleaning & deep cleaning",
    "Handyman repairs & installations",
    "Landscaping & lawn maintenance",
    "Junk removal & hauling",
    "Pool cleaning & maintenance",
    "Pressure washing",
    "Gutter cleaning",
    "Moving labor & heavy lifting",
  ],
  pricing: {
    label: "Home Services",
    startingAt: "From $49",
    details: "Pricing varies by service. Lawn care from $49, cleaning from $99, handyman from $75/hr. Bundle multiple services and save. See individual service pages for details.",
  },
  neighborhoods: [
    "Laureate Park", "Lake Nona Town Center", "North Lake Nona", "Randal Park",
    "Storey Park", "Eagle Creek", "Moss Park", "Narcoossee",
    "Medical City", "Boggy Creek", "Vista Lakes", "Lake Nona Golf & Country Club",
  ],
  localContent: {
    areaName: "Lake Nona",
    areaDescription: "Lake Nona is a premier planned community with homes that deserve premier care. From the modern townhomes of Laureate Park to the estates of Eagle Creek, UpTend serves every corner of Lake Nona with a full suite of home services. Our platform makes it easy to find, book, and manage trusted Pros for any job — big or small.",
    whyLocalsChoose: [
      "Every home service in one app — no more juggling contractors",
      "All Pros are background-checked and insured",
      "Transparent pricing with no hidden fees",
      "Real-time job tracking and before/after photos",
      "Satisfaction guarantee on every service",
      "Built for Lake Nona's standards and HOA requirements",
    ],
  },
  faqs: [
    { q: "What services does UpTend offer in Lake Nona?", a: "We offer cleaning, handyman, landscaping, junk removal, pool maintenance, pressure washing, gutter cleaning, moving labor, and more. All bookable through one platform with vetted Pros." },
    { q: "Can I bundle multiple services?", a: "Yes! Many Lake Nona homeowners bundle recurring services (e.g., weekly pool + bi-weekly lawn + monthly cleaning) for convenience and savings." },
    { q: "How do I know the Pros are trustworthy?", a: "Every UpTend Pro passes a background check, skills verification, and our Pro Academy training program. They're also rated by other homeowners after every job." },
    { q: "Do you serve all of Lake Nona?", a: "Yes — we serve all Lake Nona neighborhoods including Laureate Park, Randal Park, Storey Park, Eagle Creek, Moss Park, Narcoossee, and the Town Center area." },
  ],
  schemaService: {
    serviceType: "Home Services",
    description: "Comprehensive home services in Lake Nona, FL. Cleaning, handyman, landscaping, junk removal, pool maintenance, and more. One platform, trusted professionals.",
    areaServed: "Lake Nona, Orlando, FL",
  },
};

export default function HomeServicesLakeNona() {
  return <SeoServicePage data={data} />;
}
