// User Roles and Sub-roles
export type UserRole = 'admin' | 'kitchen' | 'supplier' | 'vendor' | 'transporter';

export type SubRole = 
  | 'chef' 
  | 'restaurant_manager'
  | 'veggies_vendor' 
  | 'fruit_vendor' 
  | 'butcher' 
  | 'dairy_vendor' 
  | 'driver' 
  | 'delivery_agent';

// Product Categories
export type ProductCategory = 'fruits' | 'vegetables' | 'meat' | 'dairy' | 'grains' | 'spices';

// Order Status
export type OrderStatus = 
  | 'draft'
  | 'pending_supplier'
  | 'vendor_assigned'
  | 'packing'
  | 'packed_ready'
  | 'pickup_requested'
  | 'in_transit'
  | 'delivered'
  | 'kitchen_confirmed'
  | 'completed'
  | 'cancelled';

// User Interface
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  subRole?: SubRole;
  businessName?: string;
  address: Address;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Address Interface
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Product Interface
export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subCategory?: string;
  unit: string;
  basePrice: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

// Order Item Interface
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  price: number;
  vendorId?: string;
  vendorName?: string;
}

// Order Interface
export interface Order {
  id: string;
  orderNumber: string;
  kitchenId: string;
  kitchenName: string;
  kitchenAddress: Address;
  supplierId?: string;
  supplierName?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  invoiceUrl?: string;
  notes?: string;
  transporterId?: string;
  transporterName?: string;
  pickupTime?: Date;
  deliveryTime?: Date;
}

// Vendor Assignment Interface
export interface VendorAssignment {
  category: ProductCategory;
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  status: 'pending' | 'accepted' | 'packing' | 'packed' | 'picked_up';
}

// Delivery Ride Interface
export interface DeliveryRide {
  id: string;
  orderId: string;
  transporterId: string;
  transporterName: string;
  pickupAddress: Address;
  dropAddress: Address;
  status: 'requested' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered';
  createdAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Invoice Interface
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  userRole: UserRole;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  createdAt: Date;
  dueDate: Date;
  paidAt?: Date;
}

// Dashboard Stats Interface
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Support Ticket Interface
export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: Date;
}
