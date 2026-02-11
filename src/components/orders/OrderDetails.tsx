import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { CURRENCY, PRODUCT_CATEGORIES, CATEGORY_TO_VENDOR_SUBROLE } from '@/constants';
import { formatDistanceToNow } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProductCategory } from '@/types';

interface OrderDetailsProps {
  role: 'kitchen' | 'supplier' | 'vendor' | 'admin';
}

export function OrderDetails({ role }: OrderDetailsProps) {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const {
    currentUser,
    orders,
    users,
    updateOrderStatus,
    assignSupplier,
    assignVendor,
    createRide
  } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full text-center p-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </Card>
        </div>
      </div>
    );
  }

  const getBackPath = () => {
    switch (role) {
      case 'kitchen': return '/kitchen/orders';
      case 'supplier': return '/supplier/orders';
      case 'vendor': return '/vendor/orders';
      case 'admin': return '/admin/orders';
      default: return '/';
    }
  };

  // Group items by category
  const itemsByCategory = order.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof order.items>);

  // Get available vendors for each category
  const getVendorsForCategory = (category: string) => {
    const validSubRoles = CATEGORY_TO_VENDOR_SUBROLE[category as ProductCategory] || [];

    return users.filter(u =>
      u.role === 'vendor' &&
      u.isActive &&
      validSubRoles.includes(u.subRole as any) &&
      (currentUser?.agreements.includes(u.id) || false) // Only vendors with agreement
    );
  };

  const handleAcceptOrder = async () => {
    if (!currentUser) return;
    setIsProcessing(true);

    try {
      assignSupplier(order.id, currentUser.id, currentUser.name);

      // Assign vendors for each category
      let missingVendors = false;
      Object.keys(itemsByCategory).forEach(category => {
        const vendors = getVendorsForCategory(category);
        if (vendors.length > 0) {
          // Auto-assign first available vendor
          const vendor = vendors[0];
          assignVendor(order.id, category as ProductCategory, vendor.id, vendor.name);
          toast.success(`Assigned ${category} to ${vendor.name}`);
        } else {
          missingVendors = true;
          toast.error(`No connected vendor found for ${category}`);
        }
      });

      if (missingVendors) {
        toast.warning('Some items could not be assigned to vendors. Please check your agreements.');
      } else {
        toast.success('Order accepted and vendors assigned');
      }

    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPacked = async () => {
    setIsProcessing(true);
    try {
      updateOrderStatus(order.id, 'packed_ready');
      // Create delivery ride
      createRide(order.id, order.kitchenAddress, order.kitchenAddress); // Drop address needs to be real
      toast.success('Order marked as packed and delivery requested');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKitchenConfirm = async () => {
    setIsProcessing(true);
    try {
      updateOrderStatus(order.id, 'completed');
      toast.success('Order completed successfully');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderActionButtons = () => {
    switch (role) {
      case 'supplier':
        if (order.status === 'pending_supplier' && !order.supplierId) {
          return (
            <Button
              className="w-full"
              size="lg"
              onClick={handleAcceptOrder}
              disabled={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept & Assign Vendors
            </Button>
          );
        }
        return null;

      case 'vendor':
        // For vendors, we need to see if they are assigned to any item in this order
        const myItems = order.items.filter(item => item.vendorId === currentUser?.id);
        if (myItems.length === 0) return null;

        if (order.status === 'vendor_assigned') {
          return (
            <Button
              className="w-full"
              size="lg"
              onClick={() => updateOrderStatus(order.id, 'packing')}
              disabled={isProcessing}
            >
              <Package className="w-4 h-4 mr-2" />
              Start Packing
            </Button>
          );
        }
        if (order.status === 'packing') {
          return (
            <Button
              className="w-full"
              size="lg"
              onClick={handleConfirmPacked}
              disabled={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Packed & Ready
            </Button>
          );
        }
        return null;

      case 'kitchen':
        if (order.status === 'delivered') {
          return (
            <Button
              className="w-full"
              size="lg"
              onClick={handleKitchenConfirm}
              disabled={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Receipt & Complete Order
            </Button>
          );
        }
        return null;

      default:
        return null;
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(getBackPath())}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-gray-600">
                  Created {formatDistanceToNow(new Date(order.createdAt))} ago
                </p>
              </div>
            </div>

            {/* Action Button */}
            {renderActionButtons() && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  {renderActionButtons()}
                </CardContent>
              </Card>
            )}

            {/* Order Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Kitchen Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Kitchen Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="font-medium">{order.kitchenName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-medium flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-gray-400" />
                      {order.kitchenAddress.street}, {order.kitchenAddress.city}, {order.kitchenAddress.state} {order.kitchenAddress.zipCode}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items</span>
                    <span className="font-medium">{order.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{CURRENCY}{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18%)</span>
                    <span className="font-medium">{CURRENCY}{Math.round(order.totalAmount * 0.18).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{CURRENCY}{Math.round(order.totalAmount * 1.18).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Items by Category */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(itemsByCategory).map(([category, items]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-medium text-gray-600 mb-3 capitalize flex items-center gap-2">
                      <Badge variant="secondary">
                        {PRODUCT_CATEGORIES.find(c => c.value === category)?.label || category}
                      </Badge>
                      {items.length} items
                    </h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              {CURRENCY}{item.price} per {item.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">x{item.quantity}</p>
                            <p className="text-sm text-gray-600">
                              {CURRENCY}{(item.price * item.quantity).toLocaleString()}
                            </p>
                            {/* Show vendor assignment status if user is supplier */}
                            {role === 'supplier' && (
                              <p className="text-xs text-blue-600 mt-1">
                                {item.vendorName ? `Assigned to: ${item.vendorName}` : 'Pending assignment'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {order.supplierId && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Supplier Assigned</p>
                        <p className="text-sm text-gray-500">{order.supplierName}</p>
                      </div>
                    </div>
                  )}

                  {order.status !== 'pending_supplier' && order.status !== 'vendor_assigned' && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Packing Started</p>
                        <p className="text-sm text-gray-500">Vendors are packing your items</p>
                      </div>
                    </div>
                  )}

                  {(order.status === 'packed_ready' || order.status === 'pickup_requested' || order.status === 'in_transit' || order.status === 'delivered' || order.status === 'completed') && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">Packed & Ready</p>
                        <p className="text-sm text-gray-500">Items are ready for pickup</p>
                      </div>
                    </div>
                  )}

                  {(order.status === 'in_transit' || order.status === 'delivered' || order.status === 'completed') && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Truck className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-medium">In Transit</p>
                        <p className="text-sm text-gray-500">Your order is on the way</p>
                      </div>
                    </div>
                  )}

                  {(order.status === 'delivered' || order.status === 'completed') && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Delivered</p>
                        <p className="text-sm text-gray-500">Order has been delivered</p>
                      </div>
                    </div>
                  )}

                  {order.status === 'completed' && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Order Completed</p>
                        <p className="text-sm text-gray-500">
                          {order.updatedAt && new Date(order.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
