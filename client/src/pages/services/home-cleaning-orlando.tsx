import { SeoServicePage } from "./seo-service-page";
import { Sparkles } from "lucide-react";

const data = {
  slug: "home-cleaning-orlando",
  h1: "Home Cleaning in Orlando",
  metaTitle: "Home Cleaning Orlando | Deep Clean & Recurring Service | UpTend",
  metaDescription: "Professional home cleaning in Orlando, FL. Standard, deep, and move-in/out cleans. Background-checked cleaners, eco-friendly products. Book with UpTend.",
  heroTagline: "Spotless homes, every time. Professional cleaning for Orlando homes. standard, deep, and move-in/out cleans with eco-friendly products and trusted cleaners.",
  heroGradient: "from-pink-600 to-rose-500",
  icon: Sparkles,
  serviceDescription: [
    "UpTend's home cleaning service brings professional-grade cleanliness to your Orlando home. Our vetted cleaning Pros handle everything from routine maintenance cleans to deep cleans, move-in/move-out cleaning, and post-construction cleanup. Every session follows a detailed checklist customized to your home.",
    "We use eco-friendly, non-toxic cleaning products that are safe for families and pets. Our Pros arrive on time, follow your specific preferences, and leave your home sparkling. With recurring service options, you can keep your home consistently clean without lifting a finger.",
  ],
  features: [
    "Standard, deep, & move-in/out cleaning",
    "Kitchen deep cleaning & appliance detailing",
    "Bathroom sanitization & grout cleaning",
    "Dusting, vacuuming & mopping all rooms",
    "Eco-friendly, non-toxic products",
    "Customizable cleaning checklists",
    "Recurring weekly, bi-weekly, or monthly plans",
    "Post-construction & post-renovation cleanup",
  ],
  pricing: {
    label: "Home Cleaning",
    startingAt: "From $99",
    details: "Standard clean from $99 (up to 2BR). Deep clean from $179. Move-out clean from $249. Recurring service discounts available.",
  },
  neighborhoods: [
    "Downtown Orlando", "Winter Park", "College Park", "Baldwin Park",
    "Dr. Phillips", "Thornton Park", "MetroWest", "Windermere",
    "Lake Nona", "Waterford Lakes", "Avalon Park", "Audubon Park",
    "Horizon West", "Mills 50", "Hunters Creek", "UCF Area",
  ],
  localContent: {
    areaName: "Orlando",
    areaDescription: "Orlando's active lifestyle. from theme park adventures to outdoor living. means homes need regular professional attention. Whether you're a busy professional in Downtown Orlando, a family in Baldwin Park, or managing a vacation rental in Dr. Phillips, UpTend connects you with reliable cleaners who deliver consistent, quality results.",
    whyLocalsChoose: [
      "Background-checked, vetted cleaning professionals",
      "Eco-friendly products safe for kids and pets",
      "Customizable checklists for your specific needs",
      "Consistent recurring crews who know your home",
      "Flexible scheduling including evenings and weekends",
      "Satisfaction guarantee. we'll re-clean if you're not happy",
    ],
  },
  faqs: [
    { q: "What's included in a standard clean?", a: "Dusting all surfaces, vacuuming and mopping floors, kitchen counters and sink, bathroom cleaning and sanitization, making beds, and emptying trash. Deep clean adds inside appliances, baseboards, window sills, and more." },
    { q: "Do I need to provide cleaning supplies?", a: "No. our Pros bring all supplies and equipment, including eco-friendly cleaning products. If you prefer specific products, just let us know and we'll use yours." },
    { q: "Can I get the same cleaner each time?", a: "Yes! With recurring service, we assign a consistent Pro or team to your home. They'll learn your preferences and deliver personalized service every visit." },
    { q: "Do you clean vacation rentals?", a: "Absolutely. We offer turnover cleaning for Orlando vacation rentals and Airbnbs, with fast turnaround between guests and checklist documentation for hosts." },
  ],
  schemaService: {
    serviceType: "House Cleaning",
    description: "Professional home cleaning services in Orlando, FL. Standard, deep, and move-in/out cleans with eco-friendly products and background-checked cleaners.",
    areaServed: "Orlando, FL",
  },
};

export default function HomeCleaningOrlando() {
  return <SeoServicePage data={data} />;
}
