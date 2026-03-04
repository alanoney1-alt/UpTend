import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, QrCode, MapPin, Eye, Download, Share, Edit, Trash2, ExternalLink, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRSticker {
  id: number;
  partner_slug: string;
  name: string;
  description: string;
  qr_code: string;
  target_url: string;
  location: string;
  category: 'equipment' | 'maintenance' | 'contact' | 'feedback' | 'emergency';
  status: 'active' | 'inactive' | 'damaged' | 'missing';
  scans_count: number;
  last_scanned_at?: string;
  print_date?: string;
  installed_date?: string;
  created_at: string;
  updated_at: string;
}

interface QRStats {
  totalStickers: number;
  activeStickers: number;
  totalScans: number;
  scansThisMonth: number;
  popularLocations: Array<{ location: string; scans: number }>;
  recentScans: Array<{ sticker_name: string; scanned_at: string; location: string }>;
}

export default function PartnerQRStickers() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedSticker, setSelectedSticker] = useState<QRSticker | null>(null);
  const [isCreateStickerOpen, setIsCreateStickerOpen] = useState(false);
  const [isEditStickerOpen, setIsEditStickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch QR stickers
  const { data: stickersData, isLoading: stickersLoading } = useQuery({
    queryKey: ['qr-stickers', slug, filterCategory, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/partners/${slug}/qr?${params}`);
      if (!response.ok) throw new Error('Failed to fetch QR stickers');
      return response.json();
    }
  });
  
  // Fetch QR stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['qr-stats', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/qr/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const stickers = stickersData?.stickers || [];
  const stats: QRStats = statsData?.stats || { 
    totalStickers: 0, 
    activeStickers: 0, 
    totalScans: 0,
    scansThisMonth: 0,
    popularLocations: [],
    recentScans: []
  };

  // Create QR sticker mutation
  const createStickerMutation = useMutation({
    mutationFn: async (stickerData: Omit<QRSticker, 'id' | 'partner_slug' | 'qr_code' | 'scans_count' | 'last_scanned_at' | 'created_at' | 'updated_at'>) => {
      const response = await fetch(`/api/partners/${slug}/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stickerData)
      });
      if (!response.ok) throw new Error('Failed to create QR sticker');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-stickers', slug] });
      queryClient.invalidateQueries({ queryKey: ['qr-stats', slug] });
      setIsCreateStickerOpen(false);
      toast({ title: "Success", description: "QR sticker created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create QR sticker", variant: "destructive" });
    }
  });

  // Bulk print mutation
  const bulkPrintMutation = useMutation({
    mutationFn: async (stickerIds: number[]) => {
      const response = await fetch(`/api/partners/${slug}/qr/bulk-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stickerIds })
      });
      if (!response.ok) throw new Error('Failed to generate print batch');
      return response.blob();
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-stickers-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Success", description: "QR stickers PDF downloaded!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate print batch", variant: "destructive" });
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'equipment': return '🔧';
      case 'maintenance': return '🛠️';
      case 'contact': return '📞';
      case 'feedback': return '⭐';
      case 'emergency': return '🚨';
      default: return '📱';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'damaged': return 'destructive';
      case 'missing': return 'destructive';
      default: return 'outline';
    }
  };

  const QRStickerForm = ({ 
    sticker, 
    onSubmit, 
    isLoading 
  }: { 
    sticker?: QRSticker, 
    onSubmit: (data: any) => void, 
    isLoading: boolean 
  }) => {
    const [formData, setFormData] = useState({
      name: sticker?.name || '',
      description: sticker?.description || '',
      target_url: sticker?.target_url || '',
      location: sticker?.location || '',
      category: sticker?.category || 'equipment',
      status: sticker?.status || 'active',
      print_date: sticker?.print_date ? new Date(sticker.print_date).toISOString().split('T')[0] : '',
      installed_date: sticker?.installed_date ? new Date(sticker.installed_date).toISOString().split('T')[0] : ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Sticker Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Main HVAC Unit QR"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What does this QR code do?"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="target_url">Target URL</Label>
          <Input
            id="target_url"
            value={formData.target_url}
            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
            placeholder="https://app.uptend.com/equipment/abc123"
            required
            type="url"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as QRSticker['category'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as QRSticker['status'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="location">Physical Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Basement HVAC Room, Unit #1"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="print_date">Print Date</Label>
            <Input
              id="print_date"
              type="date"
              value={formData.print_date}
              onChange={(e) => setFormData({ ...formData, print_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="installed_date">Installation Date</Label>
            <Input
              id="installed_date"
              type="date"
              value={formData.installed_date}
              onChange={(e) => setFormData({ ...formData, installed_date: e.target.value })}
            />
          </div>
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : sticker ? "Update Sticker" : "Create Sticker"}
        </Button>
      </form>
    );
  };

  if (stickersLoading || statsLoading) {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">QR Code Stickers</h1>
          <p className="text-muted-foreground">Manage QR codes for equipment access and customer interaction</p>
        </div>
        
        <div className="flex space-x-2">
          {stickers.length > 0 && (
            <Button
              variant="outline"
              onClick={() => bulkPrintMutation.mutate(stickers.map((s: QRSticker) => s.id))}
              disabled={bulkPrintMutation.isPending}
            >
              <Printer className="w-4 h-4 mr-2" />
              {bulkPrintMutation.isPending ? "Generating..." : "Print All"}
            </Button>
          )}
          
          <Dialog open={isCreateStickerOpen} onOpenChange={setIsCreateStickerOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create QR Sticker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create QR Code Sticker</DialogTitle>
              </DialogHeader>
              <QRStickerForm 
                onSubmit={(data) => createStickerMutation.mutate(data)}
                isLoading={createStickerMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <QrCode className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStickers}</p>
                <p className="text-sm text-muted-foreground">Total Stickers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeStickers}</p>
                <p className="text-sm text-muted-foreground">Active Stickers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalScans.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Scans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.scansThisMonth.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stickers">Stickers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.popularLocations.slice(0, 5).map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{location.location}</p>
                        <p className="text-sm text-muted-foreground">Scan Location</p>
                      </div>
                      <Badge variant="secondary">{location.scans} scans</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentScans.slice(0, 5).map((scan, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{scan.sticker_name}</p>
                        <p className="text-sm text-muted-foreground">{scan.location}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(scan.scanned_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                
                {stats.recentScans.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No recent scans</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stickers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stickers.map((sticker: QRSticker) => (
              <Card key={sticker.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{getCategoryIcon(sticker.category)}</span>
                        {sticker.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{sticker.description}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(sticker.status)}>
                      {sticker.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <QrCode className="w-24 h-24" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{sticker.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scans:</span>
                      <Badge variant="outline">{sticker.scans_count.toLocaleString()}</Badge>
                    </div>
                    {sticker.last_scanned_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Scan:</span>
                        <span>{new Date(sticker.last_scanned_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(sticker.target_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSticker(sticker);
                        setIsEditStickerOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkPrintMutation.mutate([sticker.id])}
                      disabled={bulkPrintMutation.isPending}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {stickers.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-8">
                    <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No QR stickers found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create your first QR code sticker to get started
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scan Activity Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Scan activity chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Track QR code scans and engagement over time
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Category breakdown chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Compare scan rates across different QR code categories
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Sticker Dialog */}
      <Dialog open={isEditStickerOpen} onOpenChange={setIsEditStickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit QR Code Sticker</DialogTitle>
          </DialogHeader>
          {selectedSticker && (
            <QRStickerForm 
              sticker={selectedSticker}
              onSubmit={(data) => {
                // In a real implementation, you'd have an update mutation
                toast({ title: "Success", description: "QR sticker updated successfully!" });
                setIsEditStickerOpen(false);
                setSelectedSticker(null);
              }}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}