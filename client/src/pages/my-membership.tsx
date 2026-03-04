import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Star, Phone, CreditCard, Shield, CheckCircle } from "lucide-react";

interface CustomerMembership {
  id: number;
  plan_id: number;
  customer_id: string;
  partner_slug: string;
  status: 'active' | 'cancelled' | 'paused';
  stripe_subscription_id?: string;
  started_at: string;
  next_tune_up_date?: string;
  cancelled_at?: string;
  plan_name: string;
  monthly_price: number;
  benefits: string[];
  discount_percent: number;
  priority_scheduling: boolean;
  tune_ups_per_year: number;
  upcomingTuneUps: Array<{
    id: number;
    scheduled_date: string;
    completed_date?: string;
    pro_id?: string;
    job_id?: string;
    notes?: string;
  }>;
}

export default function MyMembership() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // In a real app, get customer ID from auth context
  const customerId = "customer-123";
  
  // Fetch customer membership
  const { data: membershipData, isLoading } = useQuery({
    queryKey: ['customer-membership', customerId],
    queryFn: async () => {
      const response = await fetch('/api/memberships/my-plan', {
        headers: {
          'x-customer-id': customerId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch membership');
      return response.json();
    }
  });

  const membership: CustomerMembership | null = membershipData?.membership;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const calculateNextPaymentDate = (startDate: string, monthsFromStart: number = 1) => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + monthsFromStart);
    return start;
  };

  const getDaysUntilNextTuneUp = (tuneUpDate: string) => {
    const today = new Date();
    const tuneUp = new Date(tuneUpDate);
    const diffTime = tuneUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No Membership Found</h1>
            <p className="text-muted-foreground">
              You don't have an active membership plan yet.
            </p>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto text-blue-600" />
                  <h3 className="text-lg font-semibold mt-2">Join Our Membership Program</h3>
                  <p className="text-sm text-muted-foreground">
                    Get priority scheduling, discounts, and regular maintenance
                  </p>
                </div>
                
                <Button className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Us to Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const nextPaymentDate = calculateNextPaymentDate(membership.started_at);
  const memberSince = new Date(membership.started_at);
  const monthsActive = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Membership</h1>
          <Badge className={getStatusColor(membership.status)}>
            {membership.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage your membership plan and upcoming services
        </p>
      </div>

      {/* Membership Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>{membership.plan_name}</span>
              </CardTitle>
              {membership.priority_scheduling && (
                <Badge className="bg-gold text-gold-foreground">Priority</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(membership.monthly_price)}
              </span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Tune-ups per year:</span>
                <Badge variant="secondary">{membership.tune_ups_per_year}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Member discount:</span>
                <Badge variant="secondary">{membership.discount_percent}%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Member since:</span>
                <span className="text-sm">{memberSince.toLocaleDateString()}</span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Your Benefits:</h4>
              <ul className="space-y-1">
                {membership.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Next Service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>Upcoming Service</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {membership.upcomingTuneUps.length > 0 ? (
              <div className="space-y-4">
                {membership.upcomingTuneUps.slice(0, 2).map((tuneUp) => {
                  const daysUntil = getDaysUntilNextTuneUp(tuneUp.scheduled_date);
                  return (
                    <div key={tuneUp.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Scheduled Tune-up</span>
                        <Badge variant={daysUntil <= 7 ? "default" : "secondary"}>
                          {daysUntil > 0 ? `${daysUntil} days` : 'Overdue'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(tuneUp.scheduled_date).toLocaleDateString()}</span>
                        </p>
                        {tuneUp.pro_id && (
                          <p className="flex items-center space-x-2">
                            <Star className="w-4 h-4" />
                            <span>Technician assigned</span>
                          </p>
                        )}
                      </div>
                      {daysUntil <= 14 && daysUntil > 0 && (
                        <Button size="sm" className="w-full">
                          Confirm Appointment
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : membership.next_tune_up_date ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Calendar className="w-12 h-12 mx-auto text-green-600 mb-3" />
                  <h3 className="text-lg font-semibold">Next Tune-up</h3>
                  <p className="text-2xl font-bold text-primary">
                    {new Date(membership.next_tune_up_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getDaysUntilNextTuneUp(membership.next_tune_up_date)} days away
                  </p>
                </div>
                <Button className="w-full">Schedule Now</Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold">No Service Scheduled</h3>
                <p className="text-sm text-muted-foreground">
                  We'll reach out when it's time for your next tune-up
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing & Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span>Billing Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Monthly charge:</span>
                <span className="font-medium">{formatCurrency(membership.monthly_price)}</span>
              </div>
              <div className="flex justify-between">
                <span>Next payment:</span>
                <span className="text-sm">{nextPaymentDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment method:</span>
                <span className="text-sm text-muted-foreground">•••• •••• •••• 1234</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
              <Button variant="outline" className="w-full">
                View Billing History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Membership Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Need to make changes to your membership? We're here to help.
              </p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              
              {membership.status === 'active' && (
                <>
                  <Button variant="outline" className="w-full">
                    Pause Membership
                  </Button>
                  <Button variant="outline" className="w-full text-red-600">
                    Cancel Membership
                  </Button>
                </>
              )}
              
              {membership.status === 'paused' && (
                <Button className="w-full">
                  Resume Membership
                </Button>
              )}
            </div>

            <Separator />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Questions? Call us at{" "}
                <a href="tel:+15551234567" className="text-primary hover:underline">
                  (555) 123-4567
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service History */}
      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold">No Service History Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your completed services and tune-ups will appear here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Annual Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Annual Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{monthsActive}</p>
              <p className="text-sm text-muted-foreground">Months Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(membership.monthly_price * monthsActive)}
              </p>
              <p className="text-sm text-muted-foreground">Total Saved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Services Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{membership.discount_percent}%</p>
              <p className="text-sm text-muted-foreground">Member Discount</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}