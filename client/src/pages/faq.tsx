import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck, ArrowLeft, ChevronDown, ChevronUp, Search,
  HelpCircle, Package, DollarSign, Clock, Shield, Users, Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { useTranslation } from "react-i18next";

type FAQCategory = "customers" | "pyckers" | "pricing" | "safety" | "b2b";

interface FAQ {
  question: string;
  answer: string;
  category: FAQCategory;
}

function useFaqs(): FAQ[] {
  const { t } = useTranslation();
  return [
    // === CUSTOMERS ===
    { category: "customers", question: t("faq.customers.q1"), answer: t("faq.customers.a1") },
    { category: "customers", question: t("faq.customers.q2"), answer: t("faq.customers.a2") },
    { category: "customers", question: t("faq.customers.q3"), answer: t("faq.customers.a3") },
    { category: "customers", question: t("faq.customers.q4"), answer: t("faq.customers.a4") },
    { category: "customers", question: t("faq.customers.q5"), answer: t("faq.customers.a5") },
    { category: "customers", question: t("faq.customers.q6"), answer: t("faq.customers.a6") },
    { category: "customers", question: t("faq.customers.q7"), answer: t("faq.customers.a7") },
    { category: "customers", question: t("faq.customers.q8"), answer: t("faq.customers.a8") },
    { category: "customers", question: t("faq.customers.q9"), answer: t("faq.customers.a9") },
    { category: "customers", question: t("faq.customers.q10"), answer: t("faq.customers.a10") },
    { category: "customers", question: t("faq.customers.q11"), answer: t("faq.customers.a11") },
    { category: "customers", question: t("faq.customers.q12"), answer: t("faq.customers.a12") },
    { category: "customers", question: t("faq.customers.q13"), answer: t("faq.customers.a13") },
    { category: "customers", question: t("faq.customers.q14"), answer: t("faq.customers.a14") },
    { category: "customers", question: t("faq.customers.q15"), answer: t("faq.customers.a15") },
    { category: "customers", question: t("faq.customers.q16"), answer: t("faq.customers.a16") },
    { category: "customers", question: t("faq.customers.q17"), answer: t("faq.customers.a17") },
    { category: "customers", question: t("faq.customers.q18"), answer: t("faq.customers.a18") },
    { category: "customers", question: t("faq.customers.q19"), answer: t("faq.customers.a19") },
    { category: "customers", question: t("faq.customers.q20"), answer: t("faq.customers.a20") },
    { category: "customers", question: t("faq.customers.q21"), answer: t("faq.customers.a21") },
    { category: "customers", question: t("faq.customers.q22"), answer: t("faq.customers.a22") },
    { category: "customers", question: t("faq.customers.q23"), answer: t("faq.customers.a23") },
    { category: "customers", question: t("faq.customers.q24"), answer: t("faq.customers.a24") },
    { category: "customers", question: t("faq.customers.q25"), answer: t("faq.customers.a25") },
    // === B2B ===
    { category: "b2b", question: t("faq.b2b.q1"), answer: t("faq.b2b.a1") },
    { category: "b2b", question: t("faq.b2b.q2"), answer: t("faq.b2b.a2") },
    { category: "b2b", question: t("faq.b2b.q3"), answer: t("faq.b2b.a3") },
    { category: "b2b", question: t("faq.b2b.q4"), answer: t("faq.b2b.a4") },
    { category: "b2b", question: t("faq.b2b.q5"), answer: t("faq.b2b.a5") },
    { category: "b2b", question: t("faq.b2b.q6"), answer: t("faq.b2b.a6") },
    { category: "b2b", question: t("faq.b2b.q7"), answer: t("faq.b2b.a7") },
    { category: "b2b", question: t("faq.b2b.q8"), answer: t("faq.b2b.a8") },
    { category: "b2b", question: t("faq.b2b.q9"), answer: t("faq.b2b.a9") },
    { category: "b2b", question: t("faq.b2b.q10"), answer: t("faq.b2b.a10") },
    { category: "b2b", question: t("faq.b2b.q11"), answer: t("faq.b2b.a11") },
    { category: "b2b", question: t("faq.b2b.q12"), answer: t("faq.b2b.a12") },
    { category: "b2b", question: t("faq.b2b.q13"), answer: t("faq.b2b.a13") },
    { category: "b2b", question: t("faq.b2b.q14"), answer: t("faq.b2b.a14") },
    { category: "b2b", question: t("faq.b2b.q15"), answer: t("faq.b2b.a15") },
    // === PRICING ===
    { category: "pricing", question: t("faq.pricing.q1"), answer: t("faq.pricing.a1") },
    { category: "pricing", question: t("faq.pricing.q2"), answer: t("faq.pricing.a2") },
    { category: "pricing", question: t("faq.pricing.q3"), answer: t("faq.pricing.a3") },
    { category: "pricing", question: t("faq.pricing.q4"), answer: t("faq.pricing.a4") },
    { category: "pricing", question: t("faq.pricing.q5"), answer: t("faq.pricing.a5") },
    { category: "pricing", question: t("faq.pricing.q6"), answer: t("faq.pricing.a6") },
    { category: "pricing", question: t("faq.pricing.q7"), answer: t("faq.pricing.a7") },
    { category: "pricing", question: t("faq.pricing.q8"), answer: t("faq.pricing.a8") },
    { category: "pricing", question: t("faq.pricing.q9"), answer: t("faq.pricing.a9") },
    { category: "pricing", question: t("faq.pricing.q10"), answer: t("faq.pricing.a10") },
    // === SAFETY ===
    { category: "safety", question: t("faq.safety.q1"), answer: t("faq.safety.a1") },
    { category: "safety", question: t("faq.safety.q2"), answer: t("faq.safety.a2") },
    { category: "safety", question: t("faq.safety.q3"), answer: t("faq.safety.a3") },
    { category: "safety", question: t("faq.safety.q4"), answer: t("faq.safety.a4") },
    { category: "safety", question: t("faq.safety.q5"), answer: t("faq.safety.a5") },
    { category: "safety", question: t("faq.safety.q6"), answer: t("faq.safety.a6") },
    { category: "safety", question: t("faq.safety.q7"), answer: t("faq.safety.a7") },
    { category: "safety", question: t("faq.safety.q8"), answer: t("faq.safety.a8") },
    // === PROS ===
    { category: "pyckers", question: t("faq.pros.q1"), answer: t("faq.pros.a1") },
    { category: "pyckers", question: t("faq.pros.q2"), answer: t("faq.pros.a2") },
    { category: "pyckers", question: t("faq.pros.q3"), answer: t("faq.pros.a3") },
    { category: "pyckers", question: t("faq.pros.q4"), answer: t("faq.pros.a4") },
    { category: "pyckers", question: t("faq.pros.q5"), answer: t("faq.pros.a5") },
    { category: "pyckers", question: t("faq.pros.q6"), answer: t("faq.pros.a6") },
    { category: "pyckers", question: t("faq.pros.q7"), answer: t("faq.pros.a7") },
    { category: "pyckers", question: t("faq.pros.q8"), answer: t("faq.pros.a8") },
    { category: "pyckers", question: t("faq.pros.q9"), answer: t("faq.pros.a9") },
    { category: "pyckers", question: t("faq.pros.q10"), answer: t("faq.pros.a10") },
    { category: "pyckers", question: t("faq.pros.q11"), answer: t("faq.pros.a11") },
    { category: "pyckers", question: t("faq.pros.q12"), answer: t("faq.pros.a12") },
    { category: "pyckers", question: t("faq.pros.q13"), answer: t("faq.pros.a13") },
    { category: "pyckers", question: t("faq.pros.q14"), answer: t("faq.pros.a14") },
    { category: "pyckers", question: t("faq.pros.q15"), answer: t("faq.pros.a15") },
    { category: "pyckers", question: t("faq.pros.q16"), answer: t("faq.pros.a16") },
    { category: "pyckers", question: t("faq.pros.q17"), answer: t("faq.pros.a17") },
    { category: "pyckers", question: t("faq.pros.q18"), answer: t("faq.pros.a18") },
    { category: "pyckers", question: t("faq.pros.q19"), answer: t("faq.pros.a19") },
    { category: "pyckers", question: t("faq.pros.q20"), answer: t("faq.pros.a20") },
    { category: "pyckers", question: t("faq.pros.q21"), answer: t("faq.pros.a21") },
  ];
}

export default function FAQ() {
  usePageTitle("FAQ | UpTend");
  const { t } = useTranslation();
  const faqs = useFaqs();
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

  const categories = [
    { id: "customers" as const, label: t("faq.cat_customers"), icon: Users },
    { id: "b2b" as const, label: t("faq.cat_businesses"), icon: Building2 },
    { id: "pricing" as const, label: t("faq.cat_pricing"), icon: DollarSign },
    { id: "safety" as const, label: t("faq.cat_safety"), icon: Shield },
    { id: "pyckers" as const, label: t("faq.cat_pros"), icon: Truck },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative max-w-4xl mx-auto px-4 py-12 pt-28">
        <div className="absolute inset-0 h-[400px] -mx-[50vw] left-1/2 right-1/2 w-screen overflow-hidden -z-10">
          <img src="/images/site/hero-faq.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-background/90" />
        </div>
        <div className="text-center mb-12">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">{t("faq.page_title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("faq.page_subtitle")}
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("faq.search_placeholder")}
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
            {t("faq.all_questions")}
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
              <p className="text-muted-foreground">{t("faq.no_results")}</p>
            </Card>
          ) : (
            filteredFaqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
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
          <h2 className="text-xl font-semibold mb-2">{t("faq.still_questions")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("faq.support_available")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <a href="mailto:support@uptendapp.com">{t("faq.email_support")}</a>
            </Button>
            <Button asChild>
              <a href="tel:407-338-3342">{t("faq.call_support")}</a>
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
