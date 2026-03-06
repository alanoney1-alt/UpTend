/**
 * Unified Pro Dashboard for Trade Partners
 * Route: /pro/:slug
 *
 * Combines leads, SEO performance, quote management, and jobs into ONE page.
 * No authentication required for now.
 */

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone, Calendar, DollarSign, Clock, MapPin, Camera, AlertCircle,
  CheckCircle, Eye, Send, Loader2, Star, TrendingUp, Globe, Briefcase,
  Users, MessageSquare, Search, ExternalLink, CheckCircle2, XCircle
} from "lucide-react";
import { getPartnerConfig } from "@/config/partner-configs";
import { useToast } from "@/hooks/use-toast";

// Existing PhotoQuote interface
interface PhotoQuote {
  id: string;
  partner_slug: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  photo_urls: string[];
  ai_analysis: {
    unit_type?: string;
    manufacturer?: string;
    condition?: string;
    visible_issues?: string[];
    recommended_services?: string[];
    urgency?: string;
    technician_notes?: string;
  };
  status: 'pending' | 'quoted' | 'confirmed' | 'completed' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
  service_request_id?: string;
}

// New interfaces for unified dashboard
interface PartnerStats {
  monthly_leads: number;
  active_jobs: number;
  revenue_this_month: number;
  avg_rating: number;
  completed_jobs: number;
  total_reviews: number;
}

interface GeneralLead {
  id: string;
  partner_slug: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  service_type: string;
  description?: string;
  source: 'george_lead' | 'phone' | 'web' | 'referral';
  status: 'new' | 'contacted' | 'quoted' | 'confirmed' | 'completed' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface SEOPage {
  id: string;
  partner_slug: string;
  page_title: string;
  page_url: string;
  neighborhood: string;
  city: string;
  state: string;
  is_indexed: boolean;
  created_at: string;
  updated_at: string;
}

interface PartnerJob {
  id: string;
  partner_slug: string;
  customer_name: string;
  service_type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  amount?: number;
  scheduled_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

interface QuoteFormData {
  quotedPrice: string;
  quoteNotes: string;
  estimatedDuration: string;
  scheduledDate: string;
}

// Combined lead type for unified display
type CombinedLead = (PhotoQuote | GeneralLead) & {
  leadType: 'photo_quote' | 'general_lead';
  sortDate: string;
};

export default function ProDashboard() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "comfort-solutions-tech";
  const config = getPartnerConfig(slug);
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState("leads");

  // Data states
  const [photoQuotes, setPhotoQuotes] = useState<PhotoQuote[]>([]);
  const [generalLeads, setGeneralLeads] = useState<GeneralLead[]>([]);
  const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null);
  const [seoPages, setSeoPages] = useState<SEOPage[]>([]);
  const [jobs, setJobs] = useState<PartnerJob[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quote modal states
  const [selectedQuote, setSelectedQuote] = useState<PhotoQuote | null>(null);
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    quotedPrice: "",
    quoteNotes: "",
    estimatedDuration: "",
    scheduledDate: "",
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [photoQuotesRes, statsRes, leadsRes, seoRes, jobsRes] = await Promise.all([
        fetch(`/api/partners/${slug}/photo-quote/list`),
        fetch(`/api/partners/${slug}/stats`),
        fetch(`/api/partners/${slug}/leads`),
        fetch(`/api/partners/${slug}/seo-pages`),
        fetch(`/api/partners/${slug}/jobs`)
      ]);

      // Parse responses
      const photoQuotesData = await photoQuotesRes.json();
      const statsData = await statsRes.json();
      const leadsData = await leadsRes.json();
      const seoData = await seoRes.json();
      const jobsData = await jobsRes.json();

      // Set data states
      if (photoQuotesData.success) {
        setPhotoQuotes(photoQuotesData.quotes || []);
      }

      if (statsData.success) {
        setPartnerStats(statsData.stats);
      }

      if (leadsData.success) {
        setGeneralLeads(leadsData.leads || []);
      }

      if (seoData.success) {
        setSeoPages(seoData.pages || []);
      }

      if (jobsData.success) {
        setJobs(jobsData.jobs || []);
      }

      // Check for any critical failures
      if (!photoQuotesData.success && !leadsData.success) {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      setError("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [slug]);

  // Submit quote (keep existing functionality)
  const handleSubmitQuote = async () => {
    if (!selectedQuote) return;
    if (!quoteForm.quotedPrice || !quoteForm.quoteNotes) {
      toast({
        title: "Missing Information",
        description: "Please enter quote price and notes.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingQuote(true);
    try {
      const response = await fetch(`/api/partners/${slug}/photo-quote/${selectedQuote.id}/quote`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quotedPrice: parseFloat(quoteForm.quotedPrice),
          quoteNotes: quoteForm.quoteNotes,
          estimatedDuration: quoteForm.estimatedDuration,
          scheduledDate: quoteForm.scheduledDate || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Quote Submitted",
          description: "Customer will receive your quote via email.",
        });

        // Reset form and close modal
        setQuoteForm({ quotedPrice: "", quoteNotes: "", estimatedDuration: "", scheduledDate: "" });
        setSelectedQuote(null);

        // Refresh data
        fetchDashboardData();
      } else {
        throw new Error(data.error || "Failed to submit quote");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to submit quote",
        variant: "destructive",
      });
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Helper functions (keep existing ones)
  const getCustomerFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getCityFromAddress = (address: string) => {
    if (!address) return 'Orlando area';
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    return 'Orlando area';
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return "Less than an hour ago";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
      case 'new': return 'default';
      case 'quoted':
      case 'contacted': return 'secondary';
      case 'confirmed': return 'outline';
      case 'completed':
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  // Get source badge info
  const getSourceBadge = (leadType: string, source?: string) => {
    if (leadType === 'photo_quote') {
      return { label: 'Photo Quote', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    }

    switch (source) {
      case 'george_lead':
        return { label: 'George Lead', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
      case 'phone':
        return { label: 'Phone', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
      case 'web':
        return { label: 'Web', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
      default:
        return { label: 'Lead', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
    }
  };

  // Combine and sort leads for unified display
  const getCombinedLeads = (): CombinedLead[] => {
    const photoQuoteLeads: CombinedLead[] = photoQuotes.map(pq => ({
      ...pq,
      leadType: 'photo_quote' as const,
      sortDate: pq.created_at
    }));

    const generalLeadsList: CombinedLead[] = generalLeads.map(gl => ({
      ...gl,
      leadType: 'general_lead' as const,
      sortDate: gl.created_at
    }));

    return [...photoQuoteLeads, ...generalLeadsList]
      .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
  };

  // Calculate unified stats
  const getUnifiedStats = () => {
    const totalLeads = photoQuotes.length + generalLeads.length;
    const pendingQuotes = photoQuotes.filter(pq => pq.status === 'pending').length;

    return {
      totalLeads,
      pendingQuotes,
      activeJobs: partnerStats?.active_jobs || 0,
      revenueThisMonth: partnerStats?.revenue_this_month || 0,
      avgRating: partnerStats?.avg_rating || 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  const stats = getUnifiedStats();
  const combinedLeads = getCombinedLeads();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div>
            <span className="font-bold text-lg">{config.companyName}</span>
            <span className="text-muted-foreground text-sm ml-3">Pro Dashboard</span>
          </div>
          <a
            href={`tel:${config.phone.replace(/\D/g, "")}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">{config.phone}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {error && (
          <div className="mb-6 p-4 bg-destructive/15 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Unified Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <div className="text-sm text-muted-foreground">Total Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">{stats.pendingQuotes}</div>
              <div className="text-sm text-muted-foreground">Pending Quotes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">{stats.activeJobs}</div>
              <div className="text-sm text-muted-foreground">Active Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                ${stats.revenueThisMonth.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Revenue This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold flex items-center gap-1">
                {stats.avgRating.toFixed(1)}
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              </div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Leads & Quotes</span>
              <span className="sm:hidden">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">SEO & Visibility</span>
              <span className="sm:hidden">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Jobs
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Leads & Quotes */}
          <TabsContent value="leads">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">All Leads & Quotes</h2>

              {combinedLeads.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No leads or quotes yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Share your contact links to start receiving leads.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {combinedLeads.map((lead) => {
                    const sourceBadge = getSourceBadge(lead.leadType, 'source' in lead ? lead.source : undefined);

                    return (
                      <Card key={`${lead.leadType}_${lead.id}`}>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Customer Info */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">
                                    {getCustomerFirstName(lead.customer_name)}
                                  </h3>
                                  <Badge className={sourceBadge.color}>
                                    {sourceBadge.label}
                                  </Badge>
                                </div>
                                <Badge variant={getStatusBadgeVariant(lead.status)}>
                                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{getCityFromAddress(lead.customer_address || '')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatRelativeTime(lead.sortDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Briefcase className="w-4 h-4" />
                                  <span>
                                    {'service_type' in lead ? lead.service_type : config.serviceType}
                                  </span>
                                </div>
                              </div>

                              {/* Action buttons */}
                              {lead.leadType === 'photo_quote' && lead.status === 'pending' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      className="mt-4 w-full"
                                      onClick={() => setSelectedQuote(lead as PhotoQuote)}
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Submit Quote
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Submit Quote for {getCustomerFirstName(lead.customer_name)}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="quotedPrice">Quoted Price ($) *</Label>
                                        <Input
                                          id="quotedPrice"
                                          type="number"
                                          placeholder="450"
                                          value={quoteForm.quotedPrice}
                                          onChange={(e) => setQuoteForm(prev => ({
                                            ...prev,
                                            quotedPrice: e.target.value
                                          }))}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="quoteNotes">Notes *</Label>
                                        <Textarea
                                          id="quoteNotes"
                                          placeholder="Compressor replacement, 2-man crew"
                                          value={quoteForm.quoteNotes}
                                          onChange={(e) => setQuoteForm(prev => ({
                                            ...prev,
                                            quoteNotes: e.target.value
                                          }))}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                                        <Select
                                          value={quoteForm.estimatedDuration}
                                          onValueChange={(value) => setQuoteForm(prev => ({
                                            ...prev,
                                            estimatedDuration: value
                                          }))}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select duration" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                                            <SelectItem value="2-3 hours">2-3 hours</SelectItem>
                                            <SelectItem value="3-4 hours">3-4 hours</SelectItem>
                                            <SelectItem value="half day">Half day</SelectItem>
                                            <SelectItem value="full day">Full day</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="scheduledDate">Preferred Date</Label>
                                        <Input
                                          id="scheduledDate"
                                          type="date"
                                          value={quoteForm.scheduledDate}
                                          onChange={(e) => setQuoteForm(prev => ({
                                            ...prev,
                                            scheduledDate: e.target.value
                                          }))}
                                        />
                                      </div>
                                      <Button
                                        onClick={handleSubmitQuote}
                                        disabled={submittingQuote}
                                        className="w-full"
                                      >
                                        {submittingQuote ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Submit Quote
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {(lead.status === 'quoted' || lead.status === 'confirmed' || lead.status === 'completed') && (
                                <Button variant="outline" className="mt-4 w-full">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              )}
                            </div>

                            {/* Analysis/Description Column */}
                            <div>
                              {lead.leadType === 'photo_quote' ? (
                                <>
                                  <h4 className="font-medium mb-3">AI Analysis</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="font-medium">Service:</span> {config.serviceType}
                                    </div>
                                    {'ai_analysis' in lead && lead.ai_analysis?.condition && (
                                      <div>
                                        <span className="font-medium">Condition:</span>{" "}
                                        <span className={
                                          lead.ai_analysis.condition === 'excellent' ? 'text-green-600' :
                                          lead.ai_analysis.condition === 'good' ? 'text-blue-600' :
                                          lead.ai_analysis.condition === 'fair' ? 'text-yellow-600' :
                                          lead.ai_analysis.condition === 'poor' ? 'text-orange-600' :
                                          lead.ai_analysis.condition === 'critical' ? 'text-red-600' :
                                          'text-muted-foreground'
                                        }>
                                          {lead.ai_analysis.condition}
                                        </span>
                                      </div>
                                    )}
                                    {'ai_analysis' in lead && lead.ai_analysis?.urgency && (
                                      <div>
                                        <span className="font-medium">Urgency:</span>{" "}
                                        <span className={
                                          lead.ai_analysis.urgency === 'emergency' ? 'text-red-600' :
                                          lead.ai_analysis.urgency === 'urgent' ? 'text-orange-600' :
                                          lead.ai_analysis.urgency === 'soon' ? 'text-yellow-600' :
                                          'text-muted-foreground'
                                        }>
                                          {lead.ai_analysis.urgency}
                                        </span>
                                      </div>
                                    )}
                                    {'ai_analysis' in lead && lead.ai_analysis?.recommended_services && lead.ai_analysis.recommended_services.length > 0 && (
                                      <div>
                                        <span className="font-medium">Recommended:</span>
                                        <div className="text-muted-foreground">
                                          {lead.ai_analysis.recommended_services.join(', ')}
                                        </div>
                                      </div>
                                    )}
                                    {'ai_analysis' in lead && lead.ai_analysis?.technician_notes && (
                                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                        {lead.ai_analysis.technician_notes}
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <h4 className="font-medium mb-3">Lead Details</h4>
                                  <div className="space-y-2 text-sm">
                                    {'priority' in lead && (
                                      <div>
                                        <span className="font-medium">Priority:</span>{" "}
                                        <Badge variant={
                                          lead.priority === 'urgent' ? 'destructive' :
                                          lead.priority === 'high' ? 'secondary' :
                                          'outline'
                                        }>
                                          {lead.priority}
                                        </Badge>
                                      </div>
                                    )}
                                    {'description' in lead && lead.description && (
                                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                        <span className="font-medium">Description:</span> {lead.description}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Photos or Contact Info Column */}
                            <div>
                              {lead.leadType === 'photo_quote' && 'photo_urls' in lead ? (
                                <>
                                  <h4 className="font-medium mb-3">
                                    Photos ({lead.photo_urls.length})
                                  </h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    {lead.photo_urls.map((url, index) => (
                                      <div
                                        key={index}
                                        className="relative aspect-square cursor-pointer"
                                        onClick={() => setExpandedPhoto(url)}
                                      >
                                        <img
                                          src={url}
                                          alt={`Photo ${index + 1}`}
                                          className="w-full h-full object-cover rounded border border-border hover:border-primary transition-colors"
                                        />
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                                          <Eye className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <h4 className="font-medium mb-3">Contact Info</h4>
                                  <div className="space-y-2 text-sm text-muted-foreground">
                                    {lead.customer_email && (
                                      <div className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        <a href={`mailto:${lead.customer_email}`} className="hover:text-foreground">
                                          {lead.customer_email}
                                        </a>
                                      </div>
                                    )}
                                    {lead.customer_phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        <a href={`tel:${lead.customer_phone.replace(/\D/g, "")}`} className="hover:text-foreground">
                                          {lead.customer_phone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}

                              {'notes' in lead && lead.notes && (
                                <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                                  <span className="font-medium">Notes:</span> {lead.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: SEO & Visibility */}
          <TabsContent value="seo">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">SEO & Digital Presence</h2>

              {/* Branded URLs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Your UpTend Pages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Partner Profile Page</span>
                    <a
                      href={`https://uptendapp.com/partners/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      uptendapp.com/partners/{slug}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Photo Quote Page</span>
                    <a
                      href={`https://uptendapp.com/partners/${slug}/quote`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      uptendapp.com/partners/{slug}/quote
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Neighborhood Pages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    SEO Neighborhood Pages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seoPages.length === 0 ? (
                    <p className="text-muted-foreground">No SEO pages configured yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {seoPages.map((page) => (
                        <div key={page.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                          <div>
                            <div className="font-medium">{page.page_title}</div>
                            <div className="text-sm text-muted-foreground">{page.neighborhood}, {page.city}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={page.is_indexed ? 'default' : 'secondary'}>
                              {page.is_indexed ? 'Indexed' : 'Pending'}
                            </Badge>
                            <a
                              href={page.page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Directory Listings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Directory Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Google Business Profile', status: 'live' },
                      { name: 'Yelp', status: 'live' },
                      { name: 'Better Business Bureau', status: 'pending' },
                      { name: 'Nextdoor', status: 'live' },
                      { name: 'Bing Places', status: 'not_started' }
                    ].map((listing) => (
                      <div key={listing.name} className="flex justify-between items-center">
                        <span>{listing.name}</span>
                        <Badge variant={
                          listing.status === 'live' ? 'default' :
                          listing.status === 'pending' ? 'secondary' :
                          'outline'
                        }>
                          {listing.status === 'live' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Live
                            </>
                          ) : listing.status === 'pending' ? (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Not Started
                            </>
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Jobs */}
          <TabsContent value="jobs">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Active & Recent Jobs</h2>

              {jobs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No jobs scheduled yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Jobs will appear here when customers confirm quotes.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {jobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{getCustomerFirstName(job.customer_name)}</h3>
                            <p className="text-sm text-muted-foreground">{job.service_type}</p>
                          </div>
                          <Badge variant={
                            job.status === 'scheduled' ? 'default' :
                            job.status === 'in_progress' ? 'secondary' :
                            job.status === 'completed' ? 'outline' :
                            'destructive'
                          }>
                            {job.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {job.amount && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span>${job.amount.toLocaleString()}</span>
                            </div>
                          )}

                          {job.scheduled_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{formatRelativeTime(job.created_at)}</span>
                          </div>
                        </div>

                        {job.completed_date && (
                          <div className="mt-3 text-sm text-muted-foreground">
                            Completed: {new Date(job.completed_date).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Photo Expansion Dialog */}
        {expandedPhoto && (
          <Dialog open={!!expandedPhoto} onOpenChange={() => setExpandedPhoto(null)}>
            <DialogContent className="max-w-3xl">
              <img
                src={expandedPhoto}
                alt="Expanded view"
                className="w-full h-auto rounded"
              />
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
