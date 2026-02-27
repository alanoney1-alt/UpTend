import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  Wrench, Droplets, Wind, Home, AlertTriangle, Hammer, Waves, Trash2, MapPin,
} from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

const posts: BlogPost[] = [
  {
    slug: "home-services-lake-nona",
    title: "Home Services in Lake Nona: The Complete Guide for Homeowners (2026)",
    date: "2026-02-21",
    excerpt:
      "From junk removal to pool cleaning, here's everything Lake Nona homeowners need to know about maintaining their homes in 2026.",
    gradient: "from-violet-500 to-purple-700",
    icon: MapPin,
  },
  {
    slug: "when-to-replace-water-heater",
    title: "5 Signs Your Water Heater Is About to Fail (and What to Do)",
    date: "2026-02-14",
    excerpt:
      "Learn the 5 warning signs your water heater is failing. George explains what Orlando homeowners should watch for and when to replace.",
    gradient: "from-orange-400 to-red-600",
    icon: Wrench,
  },
  {
    slug: "pressure-washing-guide-orlando",
    title: "Pressure Washing in Orlando: What Every Homeowner Should Know",
    date: "2026-02-07",
    excerpt:
      "Orlando pressure washing guide from George. Learn what to clean, how often, costs, and mistakes to avoid for your Central Florida home.",
    gradient: "from-cyan-400 to-blue-600",
    icon: Droplets,
  },
  {
    slug: "hurricane-prep-home-checklist",
    title: "Hurricane Season Home Prep: The Complete Orlando Checklist",
    date: "2026-01-28",
    excerpt:
      "Complete hurricane preparation checklist for Orlando homeowners. George covers everything from roof inspections to yard cleanup.",
    gradient: "from-slate-600 to-gray-900",
    icon: Wind,
  },
  {
    slug: "gutter-cleaning-frequency",
    title: "How Often Should You Clean Your Gutters in Florida?",
    date: "2026-01-21",
    excerpt:
      "Find out how often Florida homeowners should clean their gutters. George explains the risks of neglect and what gutter cleaning costs.",
    gradient: "from-emerald-400 to-teal-700",
    icon: Home,
  },
  {
    slug: "first-time-homeowner-mistakes",
    title: "7 Maintenance Mistakes First-Time Homeowners Make",
    date: "2026-01-14",
    excerpt:
      "First-time homeowner? Avoid these 7 costly maintenance mistakes. George shares what Orlando homeowners get wrong and how to fix it.",
    gradient: "from-amber-400 to-orange-600",
    icon: AlertTriangle,
  },
  {
    slug: "diy-vs-pro-when-to-call",
    title: "DIY vs. Hiring a Pro: How to Know When It's Time to Call",
    date: "2026-01-07",
    excerpt:
      "Not sure if you should DIY or hire a pro? George breaks down which home projects Orlando homeowners can handle and which need an expert.",
    gradient: "from-indigo-400 to-blue-700",
    icon: Hammer,
  },
  {
    slug: "pool-maintenance-basics-florida",
    title: "Pool Maintenance 101: A Florida Homeowner's Guide",
    date: "2025-12-30",
    excerpt:
      "Essential pool maintenance guide for Florida homeowners. George covers chemicals, cleaning schedules, costs, and common mistakes.",
    gradient: "from-sky-400 to-cyan-600",
    icon: Waves,
  },
  {
    slug: "junk-removal-cost-orlando",
    title: "How Much Does Junk Removal Cost in Orlando? (2026 Pricing Guide)",
    date: "2025-12-18",
    excerpt:
      "2026 junk removal pricing for Orlando. George breaks down costs by load size, item type, and what affects your final price.",
    gradient: "from-green-500 to-emerald-700",
    icon: Trash2,
  },
];

export default function BlogIndex() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>UpTend Blog | Home Services Tips & Guides | Orlando</title>
        <meta
          name="description"
          content="Expert tips, seasonal guides, and cost breakdowns for home services in Orlando. From UpTend, your trusted local home services platform."
        />
        <link rel="canonical" href="https://uptendapp.com/blog" />
      </Helmet>

      <Header />

      <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-16">
        <div className="absolute inset-0 h-[350px] -mx-[50vw] left-1/2 right-1/2 w-screen overflow-hidden -z-10">
          <img src="/images/site/hero-blog.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-background/90" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{t("blog.title")}</h1>
        <p className="text-muted-foreground mb-12 text-lg">
          {t("blog.subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const Icon = post.icon;
            return (
            <article key={post.slug} className="border rounded-xl overflow-hidden hover:border-primary/30 transition-colors flex flex-col">
              <Link href={`/blog/${post.slug}`}>
                <div className={`h-40 bg-gradient-to-br ${post.gradient} flex items-center justify-center`}>
                  <Icon className="w-12 h-12 text-white/80" />
                </div>
              </Link>
              <div className="p-6 flex flex-col flex-1">
              <time className="text-sm text-muted-foreground">{post.date}</time>
              <h2 className="text-lg font-semibold mt-2 mb-3 flex-1">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="text-primary font-medium text-sm hover:underline mt-auto">
                {t("blog.read_more")} &rarr;
              </Link>
              </div>
            </article>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
