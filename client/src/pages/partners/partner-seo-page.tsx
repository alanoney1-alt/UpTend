import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, MapPin, Star, MessageCircle } from "lucide-react";
import { UpTendGuide } from "@/components/ai/uptend-guide";
import { trackPageView } from "@/lib/page-tracker";

interface SEOPageData {
  id: string;
  partner_slug: string;
  neighborhood_slug: string;
  neighborhood_name: string;
  title: string;
  meta_description: string;
  hero_headline: string;
  body_content: string;
  faqs: Array<{ question: string; answer: string }>;
  services_highlighted: string[];
  company_name: string;
  phone_number?: string;
  address?: string;
}

export default function PartnerSEOPage() {
  const { slug, neighborhood } = useParams<{ slug: string; neighborhood: string }>();

  // Track page view for analytics
  useEffect(() => {
    if (slug) {
      trackPageView(slug, 'seo_page');
    }
  }, [slug]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-seo-page", slug, neighborhood],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/seo-pages/${neighborhood}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch SEO page");
      return response.json() as Promise<{ success: boolean; page: SEOPageData }>;
    },
    enabled: !!slug && !!neighborhood
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-4">
              The requested service page could not be found.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const page = data.page;

  return (
    <>
      {/* SEO Meta Tags */}
      <title>{page.title}</title>
      <meta name="description" content={page.meta_description} />
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.meta_description} />
      <meta property="og:type" content="website" />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {page.hero_headline}
              </h1>
              <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto">
                Professional {page.services_highlighted[0]?.toLowerCase() || 'home services'} in {page.neighborhood_name}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {page.phone_number && (
                  <Button 
                    size="lg" 
                    className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8"
                    onClick={() => window.open(`tel:${page.phone_number}`, '_self')}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call {page.phone_number}
                  </Button>
                )}
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-transparent border-white text-white hover:bg-white hover:text-orange-600 font-semibold px-8"
                  onClick={() => window.open(`/partners/${page.partner_slug}`, '_blank')}
                >
                  Get Free Quote
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info Bar */}
        <div className="bg-gray-50 border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {page.company_name}
                </h2>
                
                {page.address && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{page.address}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">5.0 Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Body Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Service in {page.neighborhood_name}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-lg max-w-none">
                  {page.body_content.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Our Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {page.services_highlighted.map((service, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        </div>
                        <span className="font-medium text-gray-900">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAQs */}
              {page.faqs && page.faqs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {page.faqs.map((faq, index) => (
                      <div key={index}>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {faq.question}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                        {index < page.faqs.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-center">Get Service Today</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {page.phone_number && (
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600" 
                      size="lg"
                      onClick={() => window.open(`tel:${page.phone_number}`, '_self')}
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call Now: {page.phone_number}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`/partners/${page.partner_slug}`, '_blank')}
                  >
                    Get Free Quote Online
                  </Button>
                  
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓ Licensed & Insured
                    </Badge>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-gray-900 mb-2">Service Areas</h4>
                    <p className="text-sm text-gray-600">
                      Proudly serving {page.neighborhood_name} and surrounding areas
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-lg">Why Choose Us?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Same-day service available</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Local {page.neighborhood_name} experts</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>100% satisfaction guarantee</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Upfront, honest pricing</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* George Chat Widget */}
        <UpTendGuide />
      </div>
    </>
  );
}