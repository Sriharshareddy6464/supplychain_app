import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Search,
  Eye,
  Filter,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { CURRENCY, ORDER_STATUS_LABELS } from '@/constants';
import type { OrderStatus } from '@/types';
import { formatDistanceToNow } from '@/lib/utils';

interface OrderListProps {
  role: 'kitchen' | 'supplier' | 'vendor' | 'admin';
}

export function OrderList({ role }: OrderListProps) {
  const navigate = useNavigate();
  const { currentUser, orders, getOrdersByKitchen, getOrdersBySupplier, getOrdersByVendor } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Get orders based on role
  const getOrders = () => {
    switch (role) {
      case 'kitchen':
        return currentUser ? getOrdersByKitchen(currentUser.id) : [];
      case 'supplier':
        return currentUser ? getOrdersBySupplier(currentUser.id) : [];
      case 'vendor':
        return currentUser && currentUser.subRole 
          ? getOrdersByVendor(currentUser.id, currentUser.subRole.includes('fruit') ? 'fruits' : 
              currentUser.subRole.includes('veggies') ? 'vegetables' :
              currentUser.subRole.includes('butcher') ? 'meat' :
              currentUser.subRole.includes('dairy') ? 'dairy' : 'fruits')
          : [];
      case 'admin':
        return orders;
      default:
        return [];
    }
  };

  const userOrders = getOrders();

  // Filter orders
  const filteredOrders = userOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.kitchenName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  );

  const getBackPath = () => {
    switch (role) {
      case 'kitchen': return '/kitchen';
      case 'supplier': return '/supplier';
      case 'vendor': return '/vendor';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  const getDetailPath = (orderId: string) => {
    switch (role) {
      case 'kitchen': return `/kitchen/orders/${orderId}`;
      case 'supplier': return `/supplier/orders/${orderId}`;
      case 'vendor': return `/vendor/orders/${orderId}`;
      case 'admin': return `/admin/orders/${orderId}`;
      default: return `/orders/${orderId}`;
    }
  };

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate(getBackPath())}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                  <p className="text-gray-600">
                    {sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {role === 'kitchen' && (
                <Button 
                  onClick={() => navigate('/kitchen/new-order')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              )}
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(ORDER_STATUS_LABELS).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <Card>
              <CardContent className="p-0">
                {sortedOrders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="No orders found"
                    description={searchQuery || statusFilter !== 'all' 
                      ? "Try adjusting your filters" 
                      : "Your orders will appear here"}
                    actionLabel={role === 'kitchen' ? "Create Order" : undefined}
                    onAction={role === 'kitchen' ? () => navigate('/kitchen/new-order') : undefined}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Order #</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Kitchen</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Items</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Total</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Date</th>
                          <th className="text-right py-4 px-4 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sortedOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-medium">{order.orderNumber}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{order.kitchenName}</p>
                                <p className="text-sm text-gray-500">{order.kitchenAddress.city}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="secondary">{order.items.length} items</Badge>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold">{CURRENCY}{order.totalAmount.toLocaleString()}</span>
                            </td>
                            <td className="py-4 px-4">
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-sm text-gray-600">
                                  {formatDistanceToNow(order.createdAt)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(getDetailPath(order.id))}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
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
          </div>
        </main>
      </div>
    </div>
  );
}
