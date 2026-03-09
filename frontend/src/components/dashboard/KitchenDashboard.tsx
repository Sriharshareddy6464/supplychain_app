import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/shared/StatCard';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  CheckCircle,
  Plus,
  Eye,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { CURRENCY } from '@/constants';
import { formatDistanceToNow } from '@/lib/utils';

export function KitchenDashboard() {
  const navigate = useNavigate();
  const { currentUser, getOrdersByKitchen, getWeeklyStats, getMonthlyStats } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const orders = currentUser ? getOrdersByKitchen(currentUser.id) : [];
  const weeklyStats = currentUser ? getWeeklyStats(currentUser.id) : { total: 0, count: 0 };
  const monthlyStats = currentUser ? getMonthlyStats(currentUser.id) : { total: 0, count: 0 };

  const pendingOrders = orders.filter(o => ['pending_supplier', 'vendor_assigned', 'packing', 'packed_ready'].includes(o.status));
  const activeOrders = orders.filter(o => ['pickup_requested', 'in_transit', 'delivered'].includes(o.status));
  const completedOrders = orders.filter(o => ['kitchen_confirmed', 'completed'].includes(o.status));

  const recentOrders = [...orders].sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome back, {currentUser?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your orders and track deliveries
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Orders"
                value={orders.length}
                icon={ShoppingCart}
                description="All time orders"
              />
              <StatCard
                title="Pending Orders"
                value={pendingOrders.length}
                icon={Clock}
                description="Awaiting processing"
              />
              <StatCard
                title="Active Deliveries"
                value={activeOrders.length}
                icon={Package}
                description="In transit"
              />
              <StatCard
                title="Monthly Spend"
                value={`${CURRENCY}${monthlyStats.total.toLocaleString()}`}
                icon={Wallet}
                trend={{ value: 12, isPositive: true }}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button 
                onClick={() => navigate('/kitchen/new-order')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Order
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/kitchen/orders')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Orders
              </Button>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/kitchen/orders')}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="No orders yet"
                    description="Create your first order to get started"
                    actionLabel="Create Order"
                    onAction={() => navigate('/kitchen/new-order')}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Items</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                            <td className="py-3 px-4">{order.items.length} items</td>
                            <td className="py-3 px-4">{CURRENCY}{order.totalAmount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {formatDistanceToNow(order.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/kitchen/orders/${order.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Weekly Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Orders This Week</span>
                      <span className="font-semibold">{weeklyStats.count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Spend</span>
                      <span className="font-semibold">{CURRENCY}{weeklyStats.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Order Value</span>
                      <span className="font-semibold">
                        {CURRENCY}{weeklyStats.count > 0 ? Math.round(weeklyStats.total / weeklyStats.count) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed Orders</span>
                      <span className="font-semibold text-green-600">{completedOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Orders</span>
                      <span className="font-semibold text-yellow-600">{pendingOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">In Transit</span>
                      <span className="font-semibold text-blue-600">{activeOrders.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
