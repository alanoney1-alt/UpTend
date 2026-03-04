import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Edit, 
  Eye, 
  PhoneCall, 
  User, 
  Clock, 
  TrendingUp, 
  Volume2, 
  Save, 
  X,
  Play,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhoneData {
  twilio_phone_number: string;
  greeting: string;
  active: boolean;
  created_at: string;
}

interface CallStats {
  total_calls: number;
  completed_calls: number;
  leads_created: number;
  jobs_created: number;
  avg_duration: number;
  total_cost: number;
}

interface Call {
  call_sid: string;
  caller_number: string;
  status: string;
  duration_seconds: number;
  lead_created: boolean;
  job_created: boolean;
  transcriptPreview: string;
  created_at: string;
}

interface CallDetails {
  call: {
    call_sid: string;
    caller_number: string;
    duration_seconds: number;
    status: string;
    lead_created: boolean;
    job_created: boolean;
    recording_url?: string;
  };
  conversation: Array<{
    role: 'caller' | 'george';
    content: string;
    created_at: string;
  }>;
  summary: {
    totalTurns: number;
    callerTurns: number;
    georgeTurns: number;
    durationFormatted: string;
  };
}

export default function PartnerPhonePage() {
  const { slug } = useParams<{ slug: string }>();
  const [editingGreeting, setEditingGreeting] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallDetails | null>(null);
  const [callDetailsOpen, setCallDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch phone data
  const { data: phoneData, isLoading: phoneLoading, error: phoneError } = useQuery({
    queryKey: ['partner-phone', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/phone`);
      if (!response.ok) throw new Error('Failed to fetch phone data');
      return response.json();
    }
  });

  // Fetch call stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['partner-phone-stats', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/phone/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Fetch calls
  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ['partner-phone-calls', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/phone/calls`);
      if (!response.ok) throw new Error('Failed to fetch calls');
      return response.json();
    }
  });

  const phone: PhoneData | null = phoneData?.phone || null;
  const stats: CallStats = statsData?.stats || { 
    total_calls: 0, 
    completed_calls: 0, 
    leads_created: 0,
    jobs_created: 0,
    avg_duration: 0,
    total_cost: 0
  };
  const calls: Call[] = callsData?.calls || [];

  // Update greeting mutation
  const updateGreetingMutation = useMutation({
    mutationFn: async (greeting: string) => {
      const response = await fetch(`/api/partners/${slug}/phone/greeting`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ greeting })
      });
      if (!response.ok) throw new Error('Failed to update greeting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-phone', slug] });
      setEditingGreeting(false);
      toast({ title: 'Success', description: 'Greeting updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update greeting', variant: 'destructive' });
    }
  });

  // Toggle phone active status
  const toggleActiveMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const response = await fetch(`/api/partners/${slug}/phone/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      if (!response.ok) throw new Error('Failed to toggle phone status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-phone', slug] });
      toast({ title: 'Success', description: 'Phone status updated!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update phone status', variant: 'destructive' });
    }
  });

  // Fetch call details
  const fetchCallDetails = async (callSid: string) => {
    try {
      const response = await fetch(`/api/partners/${slug}/phone/calls/${callSid}/details`);
      if (!response.ok) throw new Error('Failed to fetch call details');
      const data = await response.json();
      setSelectedCall(data);
      setCallDetailsOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load call details', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (phone) {
      setGreetingText(phone.greeting);
    }
  }, [phone]);

  const handleSaveGreeting = () => {
    updateGreetingMutation.mutate(greetingText);
  };

  const handleCancelGreeting = () => {
    setGreetingText(phone?.greeting || '');
    setEditingGreeting(false);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const areaCode = cleaned.slice(1, 4);
      const exchange = cleaned.slice(4, 7);
      const local = cleaned.slice(7);
      return `+1 (${areaCode}) ${exchange}-${local}`;
    }
    return number;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'busy':
        return 'secondary';
      case 'no-answer':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (phoneLoading || statsLoading || callsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phoneError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading phone data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!phone) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No phone number configured</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact support to set up your dedicated phone line
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Partner Phone</h1>
          <p className="text-muted-foreground">Manage your dedicated phone line and call handling</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="phone-active">Active</Label>
            <Switch
              id="phone-active"
              checked={phone.active}
              onCheckedChange={(checked) => toggleActiveMutation.mutate(checked)}
              disabled={toggleActiveMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Phone Number Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Your Dedicated Number</span>
            </CardTitle>
            <Badge variant={phone.active ? 'default' : 'secondary'}>
              {phone.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold tracking-wider">
              {formatPhoneNumber(phone.twilio_phone_number)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Set up since {new Date(phone.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <Separator />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="greeting">Custom Greeting</Label>
              {!editingGreeting ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingGreeting(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveGreeting}
                    disabled={updateGreetingMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelGreeting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            {editingGreeting ? (
              <Textarea
                id="greeting"
                value={greetingText}
                onChange={(e) => setGreetingText(e.target.value)}
                placeholder="Enter your custom phone greeting..."
                rows={3}
              />
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm">{phone.greeting || 'No custom greeting set'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <PhoneCall className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total_calls}</p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <User className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.leads_created}</p>
                <p className="text-sm text-muted-foreground">Leads Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(stats.avg_duration)}</p>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.jobs_created}</p>
                <p className="text-sm text-muted-foreground">Jobs Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Call History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Completed Calls:</span>
                  <span className="font-semibold">{stats.completed_calls}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate:</span>
                  <span className="font-semibold">
                    {stats.total_calls > 0 
                      ? `${((stats.completed_calls / stats.total_calls) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lead Conversion:</span>
                  <span className="font-semibold">
                    {stats.completed_calls > 0 
                      ? `${((stats.leads_created / stats.completed_calls) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="font-semibold">{formatCurrency(stats.total_cost)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calls.slice(0, 5).map((call) => (
                    <div key={call.call_sid} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatPhoneNumber(call.caller_number)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                        {call.lead_created && (
                          <Badge variant="secondary">Lead</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {calls.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No calls yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.call_sid}>
                      <TableCell className="font-medium">
                        {formatPhoneNumber(call.caller_number)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {call.lead_created && (
                            <Badge variant="secondary">Lead</Badge>
                          )}
                          {call.job_created && (
                            <Badge variant="default">Job</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(call.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchCallDetails(call.call_sid)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {calls.length === 0 && (
                <div className="text-center py-8">
                  <PhoneCall className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No calls recorded</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Call activity will appear here once your phone number receives calls
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Volume Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Call volume chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Track incoming calls and conversion trends
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Hourly Call Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Hourly distribution chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Optimize your availability based on peak call times
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Call Details Dialog */}
      <Dialog open={callDetailsOpen} onOpenChange={setCallDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          
          {selectedCall && (
            <div className="space-y-6">
              {/* Call Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Caller</Label>
                  <p className="font-medium">{formatPhoneNumber(selectedCall.call.caller_number)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusColor(selectedCall.call.status)}>
                    {selectedCall.call.status}
                  </Badge>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="font-medium">{formatDuration(selectedCall.call.duration_seconds)}</p>
                </div>
                <div>
                  <Label>Results</Label>
                  <div className="flex space-x-1">
                    {selectedCall.call.lead_created && (
                      <Badge variant="secondary">Lead</Badge>
                    )}
                    {selectedCall.call.job_created && (
                      <Badge variant="default">Job</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Conversation */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Conversation Transcript</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedCall.conversation.map((turn, index) => (
                    <div
                      key={index}
                      className={`flex ${turn.role === 'caller' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          turn.role === 'caller' 
                            ? 'bg-gray-100 dark:bg-gray-800' 
                            : 'bg-blue-100 dark:bg-blue-900'
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">
                          {turn.role === 'caller' ? 'Caller' : 'George (AI)'}
                        </p>
                        <p className="text-sm">{turn.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(turn.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recording */}
              {selectedCall.call.recording_url && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Call Recording</h3>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedCall.call.recording_url, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play Recording
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedCall.call.recording_url!;
                        link.download = `call-${selectedCall.call.call_sid}.mp3`;
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}