import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/shared/StatCard';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  CheckCircle,
  Eye,
  TrendingUp,
  ShoppingBag,
  Plus,
  Trash2
} from 'lucide-react';
import { CURRENCY, PRODUCT_CATEGORIES } from '@/constants';

import type { VendorInventoryItem, ProductCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function VendorDashboard() {
  const navigate = useNavigate();
  const { currentUser, orders, getWeeklyStats, updateVendorInventory } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Inventory State
  const [inventory, setInventory] = useState<VendorInventoryItem[]>(currentUser?.inventory || []);

  const [newItem, setNewItem] = useState<Partial<VendorInventoryItem>>({
    name: '',
    category: 'vegetables',
    price: 0,
    inStock: true
  });

  // Get vendor's orders (Fix: rely on vendorId match, not category derivation)
  const vendorOrders = orders.filter(order =>
    order.items.some(item => item.vendorId === currentUser?.id)
  );

  const pendingOrders = vendorOrders.filter(o =>
    o.status === 'vendor_assigned'
  );

  const packingOrders = vendorOrders.filter(o =>
    o.status === 'packing'
  );

  const readyOrders = vendorOrders.filter(o =>
    o.status === 'packed_ready'
  );



  const weeklyStats = currentUser ? getWeeklyStats(currentUser.id) : { total: 0, count: 0 };



  // Inventory Handlers
  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) return;

    const item: VendorInventoryItem = {
      id: uuidv4(),
      name: newItem.name,
      category: newItem.category as ProductCategory,
      price: Number(newItem.price),
      inStock: true,
    };

    const updatedInventory = [...inventory, item];
    setInventory(updatedInventory);
    setNewItem({ name: '', category: 'vegetables', price: 0, inStock: true });
    // Auto-save logic
    updateVendorInventory(updatedInventory);
  };

  const handleDeleteItem = (id: string) => {
    const updatedInventory = inventory.filter(i => i.id !== id);
    setInventory(updatedInventory);
    updateVendorInventory(updatedInventory);
  };

  const handleUpdateStock = (id: string, inStock: boolean) => {
    const updatedInventory = inventory.map(i => i.id === id ? { ...i, inStock } : i);
    setInventory(updatedInventory);
    updateVendorInventory(updatedInventory);
  };

  const categoryLabel = currentUser?.subRole
    ? currentUser.subRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Vendor';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome back, {currentUser?.name}
                </h1>
                <Badge variant="secondary" className="text-sm">
                  {categoryLabel}
                </Badge>
              </div>
              <p className="text-gray-600">
                Manage your inventory and orders
              </p>
            </div>

            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="inventory">My Inventory</TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    title="New Assignments"
                    value={pendingOrders.length}
                    icon={ShoppingBag}
                    description="Awaiting processing"
                  />
                  <StatCard
                    title="Packing"
                    value={packingOrders.length}
                    icon={Package}
                    description="In progress"
                  />
                  <StatCard
                    title="Ready"
                    value={readyOrders.length}
                    icon={CheckCircle}
                    description="For pickup"
                  />
                  <StatCard
                    title="Weekly Revenue"
                    value={`${CURRENCY}${weeklyStats.total.toLocaleString()}`}
                    icon={TrendingUp}
                    trend={{ value: 15, isPositive: true }}
                  />
                </div>

                {/* Orders Table */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Active Orders</CardTitle>
                    <CardDescription>Orders assigned to you</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingOrders.length === 0 && packingOrders.length === 0 ? (
                      <EmptyState
                        icon={CheckCircle}
                        title="All caught up!"
                        description="No active orders at the moment"
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kitchen</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">My Items</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">My Share</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...pendingOrders, ...packingOrders].map((order) => {
                              const myItems = order.items.filter(item => item.vendorId === currentUser?.id);
                              const myAmount = myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                              return (
                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                                  <td className="py-3 px-4">{order.kitchenName}</td>
                                  <td className="py-3 px-4">{myItems.length} items</td>
                                  <td className="py-3 px-4">{CURRENCY}{myAmount.toLocaleString()}</td>
                                  <td className="py-3 px-4">
                                    <OrderStatusBadge status={order.status} />
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/vendor/orders/${order.id}`)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Inventory Management</CardTitle>
                      <CardDescription>Manage your products and pricing</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Add New Item */}
                    <div className="grid gap-4 md:grid-cols-4 items-end mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input
                          placeholder="e.g. Red Apple"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value as ProductCategory })}
                        >
                          {PRODUCT_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Price ({CURRENCY})</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={newItem.price}
                          onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                        />
                      </div>
                      <Button onClick={handleAddItem}>
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                      </Button>
                    </div>

                    {/* Inventory List */}
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium">Name</th>
                            <th className="text-left py-3 px-4 font-medium">Category</th>
                            <th className="text-left py-3 px-4 font-medium">Price</th>
                            <th className="text-left py-3 px-4 font-medium">Status</th>
                            <th className="text-right py-3 px-4 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-gray-500">
                                No items in inventory. Add some above.
                              </td>
                            </tr>
                          ) : (
                            inventory.map((item) => (
                              <tr key={item.id} className="border-b last:border-0">
                                <td className="py-3 px-4">{item.name}</td>
                                <td className="py-3 px-4 capitalize">{item.category}</td>
                                <td className="py-3 px-4">{CURRENCY}{item.price}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={item.inStock}
                                      onCheckedChange={(checked) => handleUpdateStock(item.id, checked)}
                                    />
                                    <span className="text-sm text-gray-600">
                                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
