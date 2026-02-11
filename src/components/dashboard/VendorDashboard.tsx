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
  Package, 
  CheckCircle,
  Eye,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import { CURRENCY, PRODUCT_CATEGORIES } from '@/constants';
import { formatDistanceToNow } from '@/lib/utils';

export function VendorDashboard() {
  const navigate = useNavigate();
  const { currentUser, orders, getWeeklyStats } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get vendor's category based on subRole
  const vendorCategory = currentUser?.subRole 
    ? (() => {
        switch (currentUser.subRole) {
          case 'fruit_vendor': return 'fruits';
          case 'veggies_vendor': return 'vegetables';
          case 'butcher': return 'meat';
          case 'dairy_vendor': return 'dairy';
          default: return null;
        }
      })()
    : null;

  const categoryLabel = PRODUCT_CATEGORIES.find(c => c.value === vendorCategory)?.label || 'General';

  // Get orders where vendor is assigned to their category
  const vendorOrders = orders.filter(order => 
    order.items.some(item => item.vendorId === currentUser?.id)
  );

  const pendingOrders = vendorOrders.filter(o => 
    o.items.some(item => item.vendorId === currentUser?.id && !item.vendorName)
  );

  const packingOrders = vendorOrders.filter(o => 
    o.status === 'vendor_assigned' || o.status === 'packing'
  );

  const readyOrders = vendorOrders.filter(o => 
    o.status === 'packed_ready'
  );

  const completedOrders = vendorOrders.filter(o => 
    ['kitchen_confirmed', 'completed'].includes(o.status)
  );

  const weeklyStats = currentUser ? getWeeklyStats(currentUser.id) : { total: 0, count: 0 };

  // Calculate category-specific revenue
  const categoryRevenue = vendorOrders.reduce((sum, order) => {
    const categoryItems = order.items.filter(item => item.category === vendorCategory);
    return sum + categoryItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome back, {currentUser?.name}
                </h1>
                <Badge variant="secondary" className="text-sm">
                  {categoryLabel} Vendor
                </Badge>
              </div>
              <p className="text-gray-600">
                Manage your {categoryLabel.toLowerCase()} orders and fulfillments
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="New Orders"
                value={pendingOrders.length}
                icon={ShoppingBag}
                description="Awaiting acceptance"
              />
              <StatCard
                title="Packing"
                value={packingOrders.length}
                icon={Package}
                description="Orders to pack"
              />
              <StatCard
                title="Ready for Pickup"
                value={readyOrders.length}
                icon={CheckCircle}
                description="Awaiting pickup"
              />
              <StatCard
                title="Weekly Revenue"
                value={`${CURRENCY}${weeklyStats.total.toLocaleString()}`}
                icon={TrendingUp}
                trend={{ value: 15, isPositive: true }}
              />
            </div>

            {/* Orders Requiring Action */}
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Orders Requiring Action</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Orders that need your immediate attention
                  </p>
                </div>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {pendingOrders.length + packingOrders.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {pendingOrders.length === 0 && packingOrders.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="All caught up!"
                    description="No orders requiring immediate action"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kitchen</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category Items</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...pendingOrders, ...packingOrders].slice(0, 10).map((order) => {
                          const categoryItems = order.items.filter(item => item.category === vendorCategory);
                          const categoryAmount = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                          
                          return (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                              <td className="py-3 px-4">{order.kitchenName}</td>
                              <td className="py-3 px-4">{categoryItems.length} items</td>
                              <td className="py-3 px-4">{CURRENCY}{categoryAmount.toLocaleString()}</td>
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

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ready for Pickup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Ready for Pickup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {readyOrders.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title="No orders ready"
                      description="Orders ready for pickup will appear here"
                    />
                  ) : (
                    <div className="space-y-4">
                      {readyOrders.slice(0, 5).map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer"
                          onClick={() => navigate(`/vendor/orders/${order.id}`)}
                        >
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{order.kitchenName}</p>
                            <p className="text-sm text-gray-400">
                              {formatDistanceToNow(order.updatedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">Ready</p>
                            <p className="text-sm text-gray-500">
                              {order.items.filter(i => i.category === vendorCategory).length} items
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Total Orders</span>
                      <span className="font-semibold text-lg">{vendorOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-lg text-green-600">{completedOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{categoryLabel} Revenue</span>
                      <span className="font-semibold text-lg text-blue-600">
                        {CURRENCY}{categoryRevenue.toLocaleString()}
                      </span>
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
