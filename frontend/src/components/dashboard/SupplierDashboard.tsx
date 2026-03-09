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
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { CURRENCY } from '@/constants';
import { formatDistanceToNow } from '@/lib/utils';

export function SupplierDashboard() {
  const navigate = useNavigate();
  const { currentUser, orders, getWeeklyStats, getMonthlyStats } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get all orders that need supplier assignment or are assigned to this supplier
  const assignedOrders = orders.filter(o => o.supplierId === currentUser?.id);
  const pendingOrders = orders.filter(o =>
    !o.supplierId &&
    o.status === 'pending_supplier' &&
    (currentUser?.agreements.includes(o.kitchenId) || false)
  );
  const todaysOrders = orders.filter(o => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(o.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime() && (o.supplierId === currentUser?.id || !o.supplierId);
  });

  const weeklyStats = currentUser ? getWeeklyStats(currentUser.id) : { total: 0, count: 0 };
  const monthlyStats = currentUser ? getMonthlyStats(currentUser.id) : { total: 0, count: 0 };

  const activeOrders = assignedOrders.filter(o =>
    ['vendor_assigned', 'packing', 'packed_ready', 'pickup_requested', 'in_transit'].includes(o.status)
  );
  const completedOrders = assignedOrders.filter(o =>
    ['kitchen_confirmed', 'completed'].includes(o.status)
  );

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
                Manage orders and coordinate with vendors
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Today's Orders"
                value={todaysOrders.length}
                icon={ShoppingCart}
                description="New orders today"
              />
              <StatCard
                title="Pending Assignment"
                value={pendingOrders.length}
                icon={AlertCircle}
                description="Awaiting your action"
              />
              <StatCard
                title="Active Orders"
                value={activeOrders.length}
                icon={Package}
                description="In progress"
              />
              <StatCard
                title="Monthly Revenue"
                value={`${CURRENCY}${monthlyStats.total.toLocaleString()}`}
                icon={TrendingUp}
                trend={{ value: 8, isPositive: true }}
              />
            </div>

            {/* Today's Orders Section */}
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Today's Orders</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Orders requiring your attention today
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {todaysOrders.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {todaysOrders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="No orders today"
                    description="Check back later for new orders"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kitchen</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Items</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todaysOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                            <td className="py-3 px-4">{order.kitchenName}</td>
                            <td className="py-3 px-4">{order.items.length} items</td>
                            <td className="py-3 px-4">{CURRENCY}{order.totalAmount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/supplier/orders/${order.id}`)}
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

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pending Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingOrders.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle}
                      title="All caught up!"
                      description="No pending orders awaiting assignment"
                    />
                  ) : (
                    <div className="space-y-4">
                      {pendingOrders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => navigate(`/supplier/orders/${order.id}`)}
                        >
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{order.kitchenName}</p>
                            <p className="text-sm text-gray-400">
                              {formatDistanceToNow(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{CURRENCY}{order.totalAmount.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{order.items.length} items</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Active Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeOrders.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title="No active orders"
                      description="Your active orders will appear here"
                    />
                  ) : (
                    <div className="space-y-4">
                      {activeOrders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => navigate(`/supplier/orders/${order.id}`)}
                        >
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{order.kitchenName}</p>
                            <div className="mt-1">
                              <OrderStatusBadge status={order.status} />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{CURRENCY}{order.totalAmount.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{order.items.length} items</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{completedOrders.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Completed Orders</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{CURRENCY}{weeklyStats.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">Weekly Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">{assignedOrders.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
