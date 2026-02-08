import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, ArrowLeft, ChevronDown, ChevronUp, Search,
  HelpCircle, Package, DollarSign, Clock, Shield, Users
} from "lucide-react";
import { Input } from "@/components/ui/input";

type FAQCategory = "customers" | "pyckers" | "pricing" | "safety";

interface FAQ {
  question: string;
  answer: string;
  category: FAQCategory;
}

const faqs: FAQ[] = [
  {
    category: "customers",
    question: "How does UpTend work?",
    answer: "It's simple! 1) Take photos of items or select from our item list, 2) Get an instant price quote, 3) Choose your pickup time, 4) A verified Pro arrives and hauls everything away. You can track their arrival in real-time and pay securely through the app."
  },
  {
    category: "customers",
    question: "What items can you pick up?",
    answer: "We can haul most household items including furniture, appliances, electronics, yard waste, construction debris, and general junk. We cannot accept hazardous materials (chemicals, paint, asbestos), medical waste, or extremely heavy items (hot tubs, pianos over 500 lbs) without special arrangements."
  },
  {
    category: "customers",
    question: "How soon can you pick up my items?",
    answer: "We offer same-day pickup in most areas! When you book, you'll see available time slots. Many customers get pickups within 2-4 hours during peak times. Weekend and evening slots are available."
  },
  {
    category: "customers",
    question: "Do I need to be home for the pickup?",
    answer: "Yes, someone 18 or older should be present to show the Pro which items to take and to verify the final price. If items are outside and easily accessible, you can arrange a contactless pickup by noting this in your booking."
  },
  {
    category: "customers",
    question: "What if there are more items than I listed?",
    answer: "Our Pros verify items on arrival. If there are additional items, you'll be notified of the adjusted price and must approve it before the job starts. We believe in transparent pricing — no surprise charges after the fact."
  },
  {
    category: "pricing",
    question: "How is pricing calculated?",
    answer: "We offer two pricing methods: 1) Item-based pricing where you select specific items (couch $75, mattress $40, etc.), or 2) Load-based pricing for mixed junk ($99 minimum up to $499 for a full truck). Both methods show you the exact price before you book — no hidden fees."
  },
  {
    category: "pricing",
    question: "Are there any hidden fees?",
    answer: "No! The price you see is the price you pay. We don't charge booking fees, fuel surcharges, or environmental fees. The only time your price might change is if there are more items than originally listed, and you must approve any changes before the job starts."
  },
  {
    category: "pricing",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards through our secure payment system. Payment is processed only after the job is completed to your satisfaction. We do not accept cash or checks."
  },
  {
    category: "pricing",
    question: "Can I tip my Pro?",
    answer: "Absolutely! Tips are optional but appreciated. 100% of tips go directly to your Pro — we don't take any cut. You can add a tip through the app after the job is completed."
  },
  {
    category: "safety",
    question: "How do you verify Pros?",
    answer: "Every Pro undergoes a comprehensive background check including criminal history, driving record, and identity verification. They must also provide proof of insurance and vehicle registration. We take your safety seriously."
  },
  {
    category: "safety",
    question: "What happens if something gets damaged?",
    answer: "All Pros carry liability insurance. If any damage occurs during the job, report it immediately through the app. We'll investigate and work with the Pro's insurance to resolve the issue."
  },
  {
    category: "safety",
    question: "How do I contact my Pro?",
    answer: "Once a Pro accepts your job, you can message them through the app. Phone numbers are masked for privacy — calls go through our system so your personal number stays private."
  },
  {
    category: "pyckers",
    question: "How do I become a Pro?",
    answer: "Apply on our website! You'll need a truck or large vehicle (2010 or newer), valid driver's license, vehicle insurance, and to pass a background check. The application takes about 10 minutes, and most approvals happen within 2-3 business days."
  },
  {
    category: "pyckers",
    question: "How much can I earn as a Pro?",
    answer: "Earnings vary based on your area and how often you work. Active Pros in Orlando earn $800-$2,000+ per week. You keep 75% of every job plus 100% of tips. There are no lead fees, subscription fees, or hidden charges."
  },
  {
    category: "pyckers",
    question: "When do I get paid?",
    answer: "You get paid instantly after each job is completed! Funds are transferred to your connected bank account via Stripe. Most banks show the deposit within 1-2 business days, though some support instant transfer."
  },
  {
    category: "pyckers",
    question: "What if a customer has more items than listed?",
    answer: "You'll verify items on arrival using the app. If there are discrepancies, you can adjust the item list and send the new price to the customer for approval. The job won't start until they accept — protecting both you and them."
  },
  {
    category: "pyckers",
    question: "What happens if I can't complete a job?",
    answer: "We understand things happen! If you need to cancel, do so as early as possible through the app. Repeated cancellations or no-shows may result in penalties. Incomplete jobs without valid reason incur a $25 fee."
  }
];

const categories = [
  { id: "customers" as const, label: "For Customers", icon: Users },
  { id: "pricing" as const, label: "Pricing", icon: DollarSign },
  { id: "safety" as const, label: "Safety & Trust", icon: Shield },
  { id: "pyckers" as const, label: "For Pros", icon: Truck },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FAQCategory | "all">("all");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (question: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(question)) {
      newOpenItems.delete(question);
    } else {
      newOpenItems.add(question);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">UpTend</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find answers to common questions about UpTend, pricing, and becoming a Pro.
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-faq-search"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            data-testid="button-category-all"
          >
            All Questions
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              data-testid={`button-category-${cat.id}`}
            >
              <cat.icon className="w-4 h-4 mr-2" />
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No questions match your search. Try different keywords.</p>
            </Card>
          ) : (
            filteredFaqs.map((faq) => (
              <Card key={faq.question} className="overflow-hidden">
                <button
                  className="w-full p-4 flex items-start justify-between gap-4 text-left hover-elevate"
                  onClick={() => toggleItem(faq.question)}
                  data-testid={`faq-toggle-${faq.question.slice(0, 20).replace(/\s/g, '-')}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.id === faq.category)?.label}
                      </Badge>
                    </div>
                    <h3 className="font-medium">{faq.question}</h3>
                  </div>
                  {openItems.has(faq.question) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openItems.has(faq.question) && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <Card className="p-6 mt-12 text-center bg-primary/5 border-primary/20">
          <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you 7 days a week.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <a href="mailto:support@uptend.app">Email Support</a>
            </Button>
            <Button asChild>
              <a href="tel:407-338-3342">Call (407) 338-3342</a>
            </Button>
          </div>
        </Card>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} UpTend. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/about" className="hover:text-foreground">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
