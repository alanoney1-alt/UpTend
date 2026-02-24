import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

const posts: BlogPost[] = [
  {
    slug: "home-services-lake-nona",
    title: "Home Services in Lake Nona: The Complete Guide for Homeowners (2026)",
    date: "2026-02-20",
    excerpt:
      "From junk removal to pool cleaning, here's everything Lake Nona homeowners need to know about maintaining their homes in 2026.",
  },
  {
    slug: "when-to-replace-water-heater",
    title: "5 Signs Your Water Heater Is About to Fail (and What to Do)",
    date: "2026-02-24",
    excerpt:
      "Learn the 5 warning signs your water heater is failing. Mr. George explains what Orlando homeowners should watch for and when to replace.",
  },
  {
    slug: "pressure-washing-guide-orlando",
    title: "Pressure Washing in Orlando: What Every Homeowner Should Know",
    date: "2026-02-24",
    excerpt:
      "Orlando pressure washing guide from Mr. George. Learn what to clean, how often, costs, and mistakes to avoid for your Central Florida home.",
  },
  {
    slug: "hurricane-prep-home-checklist",
    title: "Hurricane Season Home Prep: The Complete Orlando Checklist",
    date: "2026-02-24",
    excerpt:
      "Complete hurricane preparation checklist for Orlando homeowners. Mr. George covers everything from roof inspections to yard cleanup.",
  },
  {
    slug: "gutter-cleaning-frequency",
    title: "How Often Should You Clean Your Gutters in Florida?",
    date: "2026-02-24",
    excerpt:
      "Find out how often Florida homeowners should clean their gutters. Mr. George explains the risks of neglect and what gutter cleaning costs.",
  },
  {
    slug: "first-time-homeowner-mistakes",
    title: "7 Maintenance Mistakes First-Time Homeowners Make",
    date: "2026-02-24",
    excerpt:
      "First-time homeowner? Avoid these 7 costly maintenance mistakes. Mr. George shares what Orlando homeowners get wrong and how to fix it.",
  },
  {
    slug: "diy-vs-pro-when-to-call",
    title: "DIY vs. Hiring a Pro: How to Know When It's Time to Call",
    date: "2026-02-24",
    excerpt:
      "Not sure if you should DIY or hire a pro? Mr. George breaks down which home projects Orlando homeowners can handle and which need an expert.",
  },
  {
    slug: "pool-maintenance-basics-florida",
    title: "Pool Maintenance 101: A Florida Homeowner's Guide",
    date: "2026-02-24",
    excerpt:
      "Essential pool maintenance guide for Florida homeowners. Mr. George covers chemicals, cleaning schedules, costs, and common mistakes.",
  },
  {
    slug: "junk-removal-cost-orlando",
    title: "How Much Does Junk Removal Cost in Orlando? (2026 Pricing Guide)",
    date: "2026-02-24",
    excerpt:
      "2026 junk removal pricing for Orlando. Mr. George breaks down costs by load size, item type, and what affects your final price.",
  },
];

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>UpTend Blog -- Home Services Tips & Guides | Orlando</title>
        <meta
          name="description"
          content="Expert tips, seasonal guides, and cost breakdowns for home services in Orlando. From UpTend -- your trusted local home services platform."
        />
        <link rel="canonical" href="https://uptendapp.com/blog" />
      </Helmet>

      <Header />

      <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">
        <h1 className="text-4xl font-bold mb-2">UpTend Blog</h1>
        <p className="text-muted-foreground mb-12 text-lg">
          Home maintenance tips, cost guides, and local insights for Orlando homeowners.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.slug} className="border rounded-xl p-6 hover:border-primary/30 transition-colors flex flex-col">
              <time className="text-sm text-muted-foreground">{post.date}</time>
              <h2 className="text-lg font-semibold mt-2 mb-3 flex-1">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="text-primary font-medium text-sm hover:underline mt-auto">
                Read more &rarr;
              </Link>
            </article>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
