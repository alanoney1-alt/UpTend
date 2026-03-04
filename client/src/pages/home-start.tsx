import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Home, Calendar, Star, Phone, Mail } from "lucide-react";

interface PartnerInfo {
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface JobInfo {
  id: string;
  customer_name?: string;
  service_type?: string;
  completed_at?: string;
  equipment_type?: string;
}

export default function HomeStart() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });
  
  // Extract URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const partnerSlug = urlParams.get('partner');
  const jobId = urlParams.get('job');
  const equipmentId = urlParams.get('unit');
  
  // Mock data - in real app, fetch from API
  const partnerInfo: PartnerInfo = {
    name: partnerSlug ? partnerSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Service Pro',
    phone: '(555) 123-4567',
    email: 'info@servicepro.com',
    website: 'https://servicepro.com'
  };
  
  const jobInfo: JobInfo | null = jobId ? {
    id: jobId,
    service_type: 'HVAC Maintenance',
    completed_at: new Date().toISOString(),
    equipment_type: equipmentId || 'HVAC Unit'
  } : null;

  useEffect(() => {
    // Pre-fill form if customer data is available from job
    if (jobInfo?.customer_name) {
      const [firstName, ...lastNameParts] = jobInfo.customer_name.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: firstName || '',
        lastName: lastNameParts.join(' ') || ''
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In real app, create customer profile and equipment records
    console.log('Creating home profile:', {
      customer: formData,
      partner: partnerSlug,
      equipment: equipmentId,
      job: jobId
    });
    
    // Simulate profile creation
    setTimeout(() => {
      setStep(3);
      setTimeout(() => {
        setLocation('/my-home-profile');
      }, 3000);
    }, 1000);
  };

  const equipmentTypes = [
    'HVAC System',
    'Water Heater',
    'Furnace',
    'Air Conditioner',
    'Heat Pump',
    'Boiler',
    'Thermostat',
    'Air Ducts',
    'Other'
  ];

  if (!partnerSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-4">Invalid Link</h1>
            <p className="text-muted-foreground">
              This link appears to be invalid or expired. Please contact your service provider.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Home className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold">Welcome to Your Home Profile</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Get started with free maintenance tracking and reminders
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              step >= 1 ? 'border-primary bg-primary text-white' : 'border-gray-300'
            }`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="ml-2 font-medium">Service Confirmed</span>
          </div>
          
          <div className={`mx-4 h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              step >= 2 ? 'border-primary bg-primary text-white' : 'border-gray-300'
            }`}>
              {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <span className="ml-2 font-medium">Create Profile</span>
          </div>
          
          <div className={`mx-4 h-1 w-16 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              step >= 3 ? 'border-primary bg-primary text-white' : 'border-gray-300'
            }`}>
              {step >= 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
            </div>
            <span className="ml-2 font-medium">All Set!</span>
          </div>
        </div>

        {/* Step 1: Service Confirmation */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span>Service Completed Successfully!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Partner Info */}
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{partnerInfo.name}</h2>
                <p className="text-muted-foreground">just completed your service</p>
              </div>

              {/* Service Details */}
              {jobInfo && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Service Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Service:</span> {jobInfo.service_type}</p>
                    <p><span className="font-medium">Equipment:</span> {jobInfo.equipment_type}</p>
                    <p><span className="font-medium">Date:</span> {new Date(jobInfo.completed_at || '').toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div>
                <h3 className="font-semibold mb-3">What you'll get with your Home Profile:</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Automatic maintenance reminders</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Service history tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Warranty management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Priority booking with {partnerInfo.name}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                size="lg"
              >
                Get Started - It's Free!
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Profile Creation */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Home Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Home Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Main St, City, State"
                    required
                  />
                </div>

                {equipmentId && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Equipment to Track:</h4>
                    <Badge variant="secondary" className="mb-2">
                      {equipmentId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      This equipment will be automatically added to your home profile
                    </p>
                  </div>
                )}

                <Separator />

                <div className="text-xs text-muted-foreground">
                  By creating your profile, you agree to receive maintenance reminders and updates from {partnerInfo.name}. 
                  You can unsubscribe at any time.
                </div>

                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Welcome to UpTend!</h2>
                <p className="text-muted-foreground">
                  Your home profile has been created successfully
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">What's Next?</h3>
                  <div className="text-sm space-y-1">
                    <p>✓ Your equipment has been added to your profile</p>
                    <p>✓ Maintenance reminders are now active</p>
                    <p>✓ Service history tracking is enabled</p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Redirecting to your home profile in a few seconds...
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partner Contact Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Stay Connected with {partnerInfo.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {partnerInfo.phone && (
                <a href={`tel:${partnerInfo.phone}`} className="flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">{partnerInfo.phone}</span>
                </a>
              )}
              
              {partnerInfo.email && (
                <a href={`mailto:${partnerInfo.email}`} className="flex items-center justify-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">Email</span>
                </a>
              )}
              
              <div className="flex items-center justify-center space-x-2 p-3 border rounded-lg">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">5-Star Service</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}