/**
 * Pro Dashboard for Trade Partners
 * Route: /pro/:slug
 *
 * Shows incoming photo quote leads and allows submitting quotes.
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
import {
  Phone, Calendar, DollarSign, Clock, MapPin, Camera, AlertCircle,
  CheckCircle, Eye, Send, Loader2
} from "lucide-react";
import { getPartnerConfig } from "@/config/partner-configs";
import { useToast } from "@/hooks/use-toast";

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

interface QuoteFormData {
  quotedPrice: string;
  quoteNotes: string;
  estimatedDuration: string;
  scheduledDate: string;
}

export default function ProDashboard() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "comfort-solutions-tech";
  const config = getPartnerConfig(slug);
  const { toast } = useToast();

  const [photoQuotes, setPhotoQuotes] = useState<PhotoQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<PhotoQuote | null>(null);
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    quotedPrice: "",
    quoteNotes: "",
    estimatedDuration: "",
    scheduledDate: "",
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Fetch photo quotes
  const fetchPhotoQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partners/${slug}/photo-quote/list`);
      const data = await response.json();

      if (data.success) {
        setPhotoQuotes(data.quotes || []);
      } else {
        setError("Failed to load photo quotes");
      }
    } catch (err) {
      setError("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotoQuotes();
  }, [slug]);

  // Submit quote
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
        fetchPhotoQuotes();
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

  // Calculate stats
  const stats = {
    total: photoQuotes.length,
    pending: photoQuotes.filter(q => q.status === 'pending').length,
    quoted: photoQuotes.filter(q => q.status === 'quoted').length,
    completed: photoQuotes.filter(q => ['completed', 'closed'].includes(q.status)).length,
  };

  // Get customer first name only
  const getCustomerFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  // Get city from address
  const getCityFromAddress = (address: string) => {
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim(); // City is usually second to last
    }
    return 'Orlando area'; // Fallback
  };

  // Format relative time
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

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'quoted': return 'secondary';
      case 'confirmed': return 'outline';
      case 'completed':
      case 'closed': return 'outline';
      default: return 'default';
    }
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">{stats.quoted}</div>
              <div className="text-sm text-muted-foreground">Quoted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Incoming Leads Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Incoming Leads</h2>

          {photoQuotes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No photo quote requests yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your photo quote link to start receiving leads.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {photoQuotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Customer & Location Info */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">
                            {getCustomerFirstName(quote.customer_name)}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(quote.status)}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{getCityFromAddress(quote.customer_address)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatRelativeTime(quote.created_at)}</span>
                          </div>
                        </div>

                        {quote.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                className="mt-4 w-full"
                                onClick={() => setSelectedQuote(quote)}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Submit Quote
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Submit Quote for {getCustomerFirstName(quote.customer_name)}</DialogTitle>
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
                      </div>

                      {/* AI Analysis */}
                      <div>
                        <h4 className="font-medium mb-3">AI Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Service:</span> {config.serviceType}
                          </div>
                          {quote.ai_analysis?.condition && (
                            <div>
                              <span className="font-medium">Condition:</span>{" "}
                              <span className={
                                quote.ai_analysis.condition === 'excellent' ? 'text-green-600' :
                                quote.ai_analysis.condition === 'good' ? 'text-blue-600' :
                                quote.ai_analysis.condition === 'fair' ? 'text-yellow-600' :
                                quote.ai_analysis.condition === 'poor' ? 'text-orange-600' :
                                quote.ai_analysis.condition === 'critical' ? 'text-red-600' :
                                'text-muted-foreground'
                              }>
                                {quote.ai_analysis.condition}
                              </span>
                            </div>
                          )}
                          {quote.ai_analysis?.urgency && (
                            <div>
                              <span className="font-medium">Urgency:</span>{" "}
                              <span className={
                                quote.ai_analysis.urgency === 'emergency' ? 'text-red-600' :
                                quote.ai_analysis.urgency === 'urgent' ? 'text-orange-600' :
                                quote.ai_analysis.urgency === 'soon' ? 'text-yellow-600' :
                                'text-muted-foreground'
                              }>
                                {quote.ai_analysis.urgency}
                              </span>
                            </div>
                          )}
                          {quote.ai_analysis?.recommended_services && quote.ai_analysis.recommended_services.length > 0 && (
                            <div>
                              <span className="font-medium">Recommended:</span>
                              <div className="text-muted-foreground">
                                {quote.ai_analysis.recommended_services.join(', ')}
                              </div>
                            </div>
                          )}
                          {quote.ai_analysis?.technician_notes && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                              {quote.ai_analysis.technician_notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Photos */}
                      <div>
                        <h4 className="font-medium mb-3">
                          Photos ({quote.photo_urls.length})
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {quote.photo_urls.map((url, index) => (
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

                        {quote.notes && (
                          <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                            <span className="font-medium">Customer notes:</span> {quote.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

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
