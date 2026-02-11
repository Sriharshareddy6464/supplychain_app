import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Search,
  Upload,
  FileText,
  CheckCircle,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { PRODUCT_CATEGORIES, CURRENCY, INVENTORY_PRODUCTS } from '@/constants';
import type { ProductCategory, OrderItem } from '@/types';


export function CreateOrder() {
  const navigate = useNavigate();
  const { currentUser, products, createOrder } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  // Group cart items by category
  const cartByCategory = cart.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  const addToCart = (product: typeof INVENTORY_PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: `${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: 1,
        unit: product.unit,
        price: product.basePrice,
      }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async () => {
    if (!currentUser || cart.length === 0) return;

    setIsSubmitting(true);
    
    try {
      createOrder(
        currentUser.id,
        currentUser.businessName || currentUser.name,
        currentUser.address,
        cart,
        notes
      );

      setShowConfirmation(true);
      
      setTimeout(() => {
        navigate('/kitchen/orders');
      }, 2000);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Created!</h2>
            <p className="text-gray-600 mb-4">
              Your order has been submitted and is waiting for supplier assignment.
            </p>
            <Button onClick={() => navigate('/kitchen/orders')} className="w-full">
              View My Orders
            </Button>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/kitchen')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
                <p className="text-gray-600">Browse inventory or upload an invoice</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
                <TabsTrigger value="browse">Browse Inventory</TabsTrigger>
                <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Products Section */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Search and Filter */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Search products..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant={selectedCategory === 'all' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedCategory('all')}
                            >
                              All
                            </Button>
                            {PRODUCT_CATEGORIES.map((cat) => (
                              <Button
                                key={cat.value}
                                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.value)}
                              >
                                {cat.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => (
                        <Card key={product.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {PRODUCT_CATEGORIES.find(c => c.value === product.category)?.label}
                              </Badge>
                              <span className="text-sm font-semibold text-blue-600">
                                {CURRENCY}{product.basePrice}/{product.unit}
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                            <p className="text-sm text-gray-500 mb-3">{product.description}</p>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => addToCart(product)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add to Order
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Cart Section */}
                  <div className="lg:col-span-1">
                    <Card className="sticky top-4">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          Order Summary
                          {cartItemCount > 0 && (
                            <Badge variant="secondary">{cartItemCount} items</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {cart.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>Your cart is empty</p>
                            <p className="text-sm">Add products to create an order</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <ScrollArea className="h-[300px]">
                              {Object.entries(cartByCategory).map(([category, items]) => (
                                <div key={category} className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">
                                    {category}
                                  </h4>
                                  <div className="space-y-2">
                                    {items.map((item) => (
                                      <div 
                                        key={item.id} 
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{item.productName}</p>
                                          <p className="text-xs text-gray-500">
                                            {CURRENCY}{item.price}/{item.unit}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => updateQuantity(item.id, -1)}
                                          >
                                            <Minus className="w-3 h-3" />
                                          </Button>
                                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => updateQuantity(item.id, 1)}
                                          >
                                            <Plus className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-500"
                                            onClick={() => removeFromCart(item.id)}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </ScrollArea>

                            <Separator />

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span>{CURRENCY}{cartTotal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax (18%)</span>
                                <span>{CURRENCY}{Math.round(cartTotal * 0.18).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>{CURRENCY}{Math.round(cartTotal * 1.18).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="notes">Order Notes (Optional)</Label>
                              <Input
                                id="notes"
                                placeholder="Add any special instructions..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </div>

                            <Button 
                              className="w-full"
                              size="lg"
                              onClick={handleSubmit}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Creating Order...' : 'Place Order'}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload">
                <Card>
                  <CardContent className="p-8">
                    <div className="max-w-md mx-auto text-center">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Upload Invoice</h3>
                      <p className="text-gray-600 mb-6">
                        Upload an invoice image or PDF and we'll automatically extract the items for your order.
                      </p>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors cursor-pointer">
                        <Input 
                          type="file" 
                          accept="image/*,.pdf"
                          className="hidden"
                          id="invoice-upload"
                        />
                        <label 
                          htmlFor="invoice-upload"
                          className="cursor-pointer"
                        >
                          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Supports: JPG, PNG, PDF (max 10MB)
                          </p>
                        </label>
                      </div>
                      <Button className="w-full mt-6" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Invoice
                      </Button>
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
