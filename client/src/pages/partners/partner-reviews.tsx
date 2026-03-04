import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/landing/header";
import { 
  Star, StarIcon, Search, Filter, ArrowLeft, 
  TrendingUp, MessageSquare, Calendar
} from "lucide-react";
import { Link } from "wouter";

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  review_text?: string;
  service_type: string;
  pro_first_name: string;
  pro_last_name: string;
  created_at: string;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClasses = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`${sizeClasses} ${
            star <= rating 
              ? "text-yellow-500 fill-yellow-500" 
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold">{review.customer_name}</h3>
              <StarRating rating={review.rating} />
              <Badge variant="outline" className="ml-auto">
                {review.service_type}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Serviced by {review.pro_first_name} {review.pro_last_name} • {' '}
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {review.review_text && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm leading-relaxed">"{review.review_text}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewsSummary({ reviews }: { reviews: Review[] }) {
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  const recentReviews = reviews.filter(r => 
    new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Average Rating */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="mb-2">
            <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground ml-1">/ 5.0</span>
          </div>
          <StarRating rating={Math.round(averageRating)} size="lg" />
          <p className="text-sm text-muted-foreground mt-2">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingCounts.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3">{rating}</span>
                <StarIcon className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-6 text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <div className="mb-2">
            <span className="text-2xl font-bold text-green-500">{recentReviews}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            New reviews this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PartnerReviews() {
  const { slug } = useParams<{ slug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [proFilter, setProFilter] = useState("all");

  // Fetch reviews data
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-reviews", slug],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch/${slug}/reviews`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("UPGRADE_REQUIRED");
        }
        throw new Error("Failed to load reviews");
      }
      return res.json();
    },
  });

  const reviews: Review[] = data?.reviews || [];

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    if (searchQuery && !review.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(review.review_text?.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    if (ratingFilter !== "all" && review.rating !== parseInt(ratingFilter)) {
      return false;
    }
    
    if (proFilter !== "all" && `${review.pro_first_name} ${review.pro_last_name}` !== proFilter) {
      return false;
    }
    
    return true;
  });

  // Get unique pros for filter
  const uniquePros = Array.from(new Set(
    reviews.map(r => `${r.pro_first_name} ${r.pro_last_name}`)
  )).sort();

  if (error) {
    if (error.message === "UPGRADE_REQUIRED") {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Link href={`/partners/${slug}/dashboard`} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Customer Reviews</h1>
              <Badge variant="outline">{slug}</Badge>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Upgrade to Scale Plan</h2>
                <p className="text-muted-foreground mb-4">
                  Customer reviews and ratings are available on our Scale plan. 
                  Build trust and improve your services with customer feedback.
                </p>
                <Button>Upgrade Plan</Button>
              </CardContent>
            </Card>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load reviews</p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/partners/${slug}/dashboard`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Customer Reviews</h1>
          <Badge variant="outline">{slug}</Badge>
        </div>

        {reviews.length > 0 && <ReviewsSummary reviews={reviews} />}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={proFilter} onValueChange={setProFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pros</SelectItem>
              {uniquePros.map(pro => (
                <SelectItem key={pro} value={pro}>{pro}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        <div>
          {filteredReviews.length > 0 ? (
            filteredReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-lg font-semibold mb-2">No Reviews Yet</h2>
                <p className="text-muted-foreground">
                  Customer reviews will appear here after jobs are completed. 
                  We automatically request reviews from satisfied customers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-lg font-semibold mb-2">No Reviews Found</h2>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setRatingFilter("all");
                    setProFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}