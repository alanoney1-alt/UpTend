import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, Plus, Clock, MapPin, User, Phone,
  ArrowLeft, Edit, Trash2, ChevronLeft, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

interface Job {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address: string;
  service_type: string;
  description?: string;
  assigned_pro_id?: string;
  pro_first_name?: string;
  pro_last_name?: string;
  status: string;
  scheduled_date: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  notes?: string;
  invoice_amount?: number;
}

const statusColors = {
  scheduled: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  dispatched: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  en_route: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  arrived: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  in_progress: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400"
};

const serviceTypes = [
  "HVAC Service",
  "Plumbing",
  "Electrical",
  "Appliance Repair",
  "Water Heater",
  "Preventive Maintenance",
  "Emergency Service",
  "Installation",
  "Other"
];

function CreateJobDialog({ slug, onSuccess }: { slug: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    serviceType: "",
    description: "",
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTimeStart: "",
    scheduledTimeEnd: ""
  });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/dispatch/${slug}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create job");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Job created successfully" });
      setOpen(false);
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
        serviceType: "",
        description: "",
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTimeStart: "",
        scheduledTimeEnd: ""
      });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create job", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerAddress || !formData.serviceType) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="customerAddress">Address *</Label>
            <Input
              id="customerAddress"
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="scheduledDate">Date *</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="scheduledTimeStart">Start Time</Label>
              <Input
                id="scheduledTimeStart"
                type="time"
                value={formData.scheduledTimeStart}
                onChange={(e) => setFormData({ ...formData, scheduledTimeStart: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="scheduledTimeEnd">End Time</Label>
              <Input
                id="scheduledTimeEnd"
                type="time"
                value={formData.scheduledTimeEnd}
                onChange={(e) => setFormData({ ...formData, scheduledTimeEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JobCard({ job, onEdit }: { job: Job; onEdit: (job: Job) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{job.customer_name}</h3>
              <Badge className={statusColors[job.status as keyof typeof statusColors]} variant="outline">
                {job.status.replace(/_/g, " ")}
              </Badge>
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{job.customer_address}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{job.service_type}</span>
                {job.scheduled_time_start && (
                  <span>at {job.scheduled_time_start}</span>
                )}
              </div>
              
              {job.pro_first_name && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{job.pro_first_name} {job.pro_last_name}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(job)}
            className="h-8 px-2"
          >
            <Edit className="w-3 h-3" />
          </Button>
        </div>
        
        {job.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {job.description}
          </p>
        )}
        
        <div className="flex gap-1">
          {job.customer_phone && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
              <Phone className="w-3 h-3" />
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function JobScheduler() {
  const { slug } = useParams<{ slug: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const queryClient = useQueryClient();

  // Get week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);
  const startDate = weekDates[0].toISOString().split('T')[0];
  const endDate = weekDates[6].toISOString().split('T')[0];

  // Fetch jobs for the week
  const { data, isLoading } = useQuery({
    queryKey: ["scheduler-jobs", slug, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch/${slug}/jobs?date=${startDate}&endDate=${endDate}&limit=200`);
      if (!res.ok) throw new Error("Failed to load jobs");
      return res.json();
    }
  });

  // Group jobs by date
  const jobsByDate = (data?.jobs || []).reduce((acc: Record<string, Job[]>, job: Job) => {
    const date = job.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(job);
    return acc;
  }, {});

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleJobSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["scheduler-jobs"] });
  };

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
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/partners/${slug}/dashboard`} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Job Scheduler</h1>
            <Badge variant="outline">{slug}</Badge>
          </div>
          
          <CreateJobDialog slug={slug!} onSuccess={handleJobSuccess} />
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4 h-[calc(100vh-280px)]">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayJobs = jobsByDate[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <div
                key={dateStr}
                className={`border rounded-lg p-3 ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`text-center mb-3 pb-2 border-b ${
                  isToday ? 'border-primary/20' : 'border-border'
                }`}>
                  <div className="text-xs text-muted-foreground">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isToday ? 'text-primary' : ''
                  }`}>
                    {date.getDate()}
                  </div>
                  {dayJobs.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {dayJobs.length} job{dayJobs.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 max-h-full overflow-y-auto">
                  {dayJobs.map((job: Job) => (
                    <JobCard key={job.id} job={job} onEdit={() => {}} />
                  ))}
                  
                  {dayJobs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No jobs</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}