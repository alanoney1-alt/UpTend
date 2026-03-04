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
import { AlertTriangle, Plus, Package, Wrench, Clock, DollarSign, TrendingDown, Edit, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: number;
  partner_slug: string;
  sku: string;
  name: string;
  description: string;
  category: 'parts' | 'tools' | 'consumables' | 'equipment';
  quantity: number;
  unit_cost: number;
  retail_price: number;
  reorder_level: number;
  supplier: string;
  location: string;
  condition: 'new' | 'used' | 'refurbished';
  last_updated: string;
  created_at: string;
}

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoryCounts: Record<string, number>;
  topExpensiveItems: InventoryItem[];
  recentActivity: any[];
}

export default function PartnerInventory() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch inventory items
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory', slug, filterCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/partners/${slug}/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    }
  });
  
  // Fetch inventory stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-stats', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/inventory/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const items = inventoryData?.items || [];
  const stats: InventoryStats = statsData?.stats || { 
    totalItems: 0, 
    totalValue: 0, 
    lowStockItems: 0,
    outOfStockItems: 0,
    categoryCounts: {},
    topExpensiveItems: [],
    recentActivity: []
  };

  // Create inventory item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: Omit<InventoryItem, 'id' | 'partner_slug' | 'last_updated' | 'created_at'>) => {
      const response = await fetch(`/api/partners/${slug}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      if (!response.ok) throw new Error('Failed to create inventory item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats', slug] });
      setIsCreateItemOpen(false);
      toast({ title: "Success", description: "Inventory item created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create inventory item", variant: "destructive" });
    }
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, itemData }: { itemId: number, itemData: Partial<InventoryItem> }) => {
      const response = await fetch(`/api/partners/${slug}/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      if (!response.ok) throw new Error('Failed to update inventory item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats', slug] });
      setIsEditItemOpen(false);
      setSelectedItem(null);
      toast({ title: "Success", description: "Inventory item updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update inventory item", variant: "destructive" });
    }
  });

  // Bulk reorder mutation
  const bulkReorderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/partners/${slug}/inventory/bulk-reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to process bulk reorder');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats', slug] });
      toast({ 
        title: "Success", 
        description: `Reorder requests created for ${data.reordered} items!` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to process bulk reorder", variant: "destructive" });
    }
  });

  const formatCurrency = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'parts': return Package;
      case 'tools': return Wrench;
      case 'equipment': return Wrench;
      default: return Package;
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { status: 'out', color: 'destructive', text: 'Out of Stock' };
    if (item.quantity <= item.reorder_level) return { status: 'low', color: 'secondary', text: 'Low Stock' };
    return { status: 'good', color: 'default', text: 'In Stock' };
  };

  const InventoryForm = ({ 
    item, 
    onSubmit, 
    isLoading 
  }: { 
    item?: InventoryItem, 
    onSubmit: (data: any) => void, 
    isLoading: boolean 
  }) => {
    const [formData, setFormData] = useState({
      sku: item?.sku || '',
      name: item?.name || '',
      description: item?.description || '',
      category: item?.category || 'parts',
      quantity: item?.quantity || 0,
      unit_cost: item?.unit_cost || 0,
      retail_price: item?.retail_price || 0,
      reorder_level: item?.reorder_level || 0,
      supplier: item?.supplier || '',
      location: item?.location || '',
      condition: item?.condition || 'new'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g., FLTR-001"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as InventoryItem['category'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parts">Parts</SelectItem>
                <SelectItem value="tools">Tools</SelectItem>
                <SelectItem value="consumables">Consumables</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="name">Item Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., HVAC Air Filter 16x20x1"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of the item"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Current Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="reorder_level">Reorder Level</Label>
            <Input
              id="reorder_level"
              type="number"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) })}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unit_cost">Unit Cost ($)</Label>
            <Input
              id="unit_cost"
              type="number"
              step="0.01"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="retail_price">Retail Price ($)</Label>
            <Input
              id="retail_price"
              type="number"
              step="0.01"
              value={formData.retail_price}
              onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) })}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="e.g., HVAC Supply Co."
            />
          </div>
          <div>
            <Label htmlFor="location">Storage Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Warehouse A-1"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="condition">Condition</Label>
          <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value as InventoryItem['condition'] })}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="refurbished">Refurbished</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : item ? "Update Item" : "Add Item"}
        </Button>
      </form>
    );
  };

  if (inventoryLoading || statsLoading) {
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
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track parts, tools, and equipment inventory</p>
        </div>
        
        <div className="flex space-x-2">
          {stats.lowStockItems > 0 && (
            <Button
              variant="outline"
              onClick={() => bulkReorderMutation.mutate()}
              disabled={bulkReorderMutation.isPending}
            >
              <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
              {bulkReorderMutation.isPending ? "Processing..." : "Bulk Reorder"}
            </Button>
          )}
          
          <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
              </DialogHeader>
              <InventoryForm 
                onSubmit={(data) => createItemMutation.mutate(data)}
                isLoading={createItemMutation.isPending}
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
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.lowStockItems}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.outOfStockItems}</p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="parts">Parts</SelectItem>
            <SelectItem value="tools">Tools</SelectItem>
            <SelectItem value="consumables">Consumables</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.categoryCounts).map(([category, count]) => {
                    const IconComponent = getCategoryIcon(category);
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-5 h-5" />
                          <span className="capitalize">{category}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Most Expensive Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topExpensiveItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.unit_cost)}</p>
                        <Badge variant="outline">{item.quantity} in stock</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {items.map((item: InventoryItem) => {
              const stockStatus = getStockStatus(item);
              const IconComponent = getCategoryIcon(item.category);
              
              return (
                <Card key={item.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span>Supplier: {item.supplier}</span>
                            <span>Location: {item.location}</span>
                            <span className="capitalize">Condition: {item.condition}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right space-y-1">
                          <Badge variant={stockStatus.color as any}>
                            {stockStatus.text}
                          </Badge>
                          <p className="font-bold text-lg">{item.quantity}</p>
                          <p className="text-sm text-muted-foreground">
                            Reorder at {item.reorder_level}
                          </p>
                        </div>
                        
                        <Separator orientation="vertical" className="h-16" />
                        
                        <div className="text-right space-y-1">
                          <p className="text-sm text-muted-foreground">Cost</p>
                          <p className="font-semibold">{formatCurrency(item.unit_cost)}</p>
                          <p className="text-sm text-muted-foreground">
                            Retail: {formatCurrency(item.retail_price)}
                          </p>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsEditItemOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {items.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No items found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchQuery ? "Try adjusting your search" : "Add your first inventory item to get started"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {/* Low Stock Alerts */}
            {items.filter((item: InventoryItem) => item.quantity <= item.reorder_level && item.quantity > 0).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>Low Stock Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items
                      .filter((item: InventoryItem) => item.quantity <= item.reorder_level && item.quantity > 0)
                      .map((item: InventoryItem) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} remaining (reorder at {item.reorder_level})
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Reorder
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Out of Stock Alerts */}
            {items.filter((item: InventoryItem) => item.quantity === 0).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span>Out of Stock</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items
                      .filter((item: InventoryItem) => item.quantity === 0)
                      .map((item: InventoryItem) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Out of stock</p>
                          </div>
                          <Button size="sm" variant="destructive">
                            Urgent Reorder
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {items.filter((item: InventoryItem) => item.quantity <= item.reorder_level).length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">All items are well stocked!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    No low stock or out of stock alerts
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <InventoryForm 
              item={selectedItem}
              onSubmit={(data) => updateItemMutation.mutate({ itemId: selectedItem.id, itemData: data })}
              isLoading={updateItemMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}