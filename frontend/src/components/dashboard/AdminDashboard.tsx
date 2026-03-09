import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/shared/StatCard';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { CURRENCY, USER_ROLES } from '@/constants';
import { formatDistanceToNow } from '@/lib/utils';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { users, orders, tickets } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calculate stats
  const totalUsers = users.filter(u => u.isActive).length;
  const usersByRole = USER_ROLES.map(role => ({
    ...role,
    count: users.filter(u => u.role === role.value && u.isActive).length
  }));

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => ['pending_supplier', 'vendor_assigned'].includes(o.status));
  const activeOrders = orders.filter(o => ['packing', 'packed_ready', 'pickup_requested', 'in_transit'].includes(o.status));
  const completedOrders = orders.filter(o => ['kitchen_confirmed', 'completed'].includes(o.status));

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  const openTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status));

  const recentOrders = [...orders].sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  ).slice(0, 10);

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
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                System overview and management
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Users"
                value={totalUsers}
                icon={Users}
                description="Active accounts"
              />
              <StatCard
                title="Total Orders"
                value={totalOrders}
                icon={ShoppingCart}
                description="All time orders"
              />
              <StatCard
                title="Pending Orders"
                value={pendingOrders.length}
                icon={Clock}
                description="Awaiting action"
              />
              <StatCard
                title="Total Revenue"
                value={`${CURRENCY}${(totalRevenue / 100000).toFixed(1)}L`}
                icon={TrendingUp}
                trend={{ value: 15, isPositive: true }}
              />
            </div>

            {/* Users by Role */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {usersByRole.map((role) => (
                    <div 
                      key={role.value}
                      className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 cursor-pointer"
                      onClick={() => navigate(`/admin/users?role=${role.value}`)}
                    >
                      <p className="text-2xl font-bold text-blue-600">{role.count}</p>
                      <p className="text-sm text-gray-600 mt-1">{role.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Status Overview */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Order Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Pending</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{activeOrders.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Active</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Completed</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {orders.filter(o => o.status === 'cancelled').length}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
                <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                <TabsTrigger value="support">
                  Support Tickets
                  {openTickets.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {openTickets.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/admin/orders')}
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
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
                          {recentOrders.map((order) => (
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
                                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="support">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Open Support Tickets</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/admin/support')}
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {openTickets.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No open tickets</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {openTickets.slice(0, 5).map((ticket) => (
                          <div 
                            key={ticket.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                            onClick={() => navigate(`/admin/support/${ticket.id}`)}
                          >
                            <div>
                              <p className="font-medium">{ticket.subject}</p>
                              <p className="text-sm text-gray-500">{ticket.userName}</p>
                              <p className="text-sm text-gray-400">
                                {formatDistanceToNow(ticket.createdAt)}
                              </p>
                            </div>
                            <Badge 
                              variant={ticket.priority === 'high' ? 'destructive' : 'secondary'}
                            >
                              {ticket.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
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
