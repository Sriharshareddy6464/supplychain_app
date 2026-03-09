import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Order,
  Product,
  Invoice,
  DeliveryRide,
  Notification,
  SupportTicket,
  OrderItem,
  UserRole,
  ProductCategory,
  Address,
  VendorInventoryItem,
  VerificationDetails
} from '@/types';
import { INVENTORY_PRODUCTS, DEMO_USERS } from '@/constants';
import { v4 as uuidv4 } from 'uuid';

// Auth Store
interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; message: string };
  register: (userData: Partial<User> & { email: string; password: string; name: string; role: UserRole }) => { success: boolean; message: string };
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  // New Actions
  establishAgreement: (targetUserId: string) => { success: boolean; message: string };
  updateVendorInventory: (inventory: VendorInventoryItem[]) => void;
  updateVerification: (details: VerificationDetails) => void;
}

// Order Store
interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (kitchenId: string, kitchenName: string, kitchenAddress: Address, items: OrderItem[], notes?: string) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  assignSupplier: (orderId: string, supplierId: string, supplierName: string) => void;
  assignVendor: (orderId: string, category: ProductCategory, vendorId: string, vendorName: string) => void;
  assignTransporter: (orderId: string, transporterId: string, transporterName: string) => void;
  getOrdersByKitchen: (kitchenId: string) => Order[];
  getOrdersBySupplier: (supplierId: string) => Order[];
  getOrdersByVendor: (vendorId: string, category: ProductCategory) => Order[];
  getOrdersByTransporter: (transporterId: string) => Order[];
  getOrderById: (orderId: string) => Order | undefined;
  getTodaysOrders: () => Order[];
}

// Inventory Store
interface InventoryState {
  products: Product[];
  getProductsByCategory: (category: ProductCategory) => Product[];
  getProductById: (id: string) => Product | undefined;
}

// Invoice Store
interface InvoiceState {
  invoices: Invoice[];
  createInvoice: (orderId: string, userId: string, userRole: UserRole, items: OrderItem[]) => Invoice;
  getInvoicesByUser: (userId: string) => Invoice[];
  getWeeklyStats: (userId: string) => { total: number; count: number };
  getMonthlyStats: (userId: string) => { total: number; count: number };
}

// Delivery Store
interface DeliveryState {
  rides: DeliveryRide[];
  createRide: (orderId: string, pickupAddress: Address, dropAddress: Address) => DeliveryRide;
  acceptRide: (rideId: string, transporterId: string, transporterName: string) => void;
  updateRideStatus: (rideId: string, status: DeliveryRide['status']) => void;
  updateLocation: (rideId: string, lat: number, lng: number) => void;
  getAvailableRides: () => DeliveryRide[];
  getRideByTransporter: (transporterId: string) => DeliveryRide[];
}

// Notification Store
interface NotificationState {
  notifications: Notification[];
  addNotification: (userId: string, title: string, message: string, type: Notification['type']) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  getNotificationsByUser: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
}

// Support Store
interface SupportState {
  tickets: SupportTicket[];
  createTicket: (userId: string, userName: string, subject: string, message: string, priority: SupportTicket['priority']) => SupportTicket;
  addResponse: (ticketId: string, userId: string, userName: string, message: string) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  getTicketsByUser: (userId: string) => SupportTicket[];
  getAllTickets: () => SupportTicket[];
}

// Admin Store
interface AdminState {
  users: User[];
  addUser: (user: User) => void;
  updateUserById: (userId: string, userData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  getUsersByRole: (role: UserRole) => User[];
  getAllUsers: () => User[];
}

// Combined Store
interface AppState extends AuthState, OrderState, InventoryState, InvoiceState, DeliveryState, NotificationState, SupportState, AdminState { }

// Generate unique order number
const generateOrderNumber = () => {
  const date = new Date();
  const prefix = 'ORD';
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Generate unique invoice number
const generateInvoiceNumber = () => {
  const date = new Date();
  const prefix = 'INV';
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Generate unique 12-char ID
const generateUniqueId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create initial demo users
const createDemoUsers = (): User[] => {
  return DEMO_USERS.map((demo, index) => ({
    id: `user-${index}`,
    uniqueId: generateUniqueId(),
    email: demo.email,
    password: demo.password,
    name: demo.name,
    phone: `+91 ${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
    role: demo.role,
    subRole: demo.subRole as any,
    businessName: `${demo.name} Business`,
    address: {
      street: '123 Demo Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      coordinates: { lat: 19.0760, lng: 72.8777 },
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    agreements: [], // Initialize empty agreements
    inventory: demo.role === 'vendor' ? [] : undefined,
  }));
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth State
      currentUser: null,
      isAuthenticated: false,

      login: (email: string, password: string) => {
        const users = get().users;
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
          if (!user.isActive) {
            return { success: false, message: 'Account is deactivated. Contact admin.' };
          }
          set({ currentUser: user, isAuthenticated: true });
          return { success: true, message: 'Login successful!' };
        }
        return { success: false, message: 'Invalid email or password' };
      },

      register: (userData) => {
        const users = get().users;

        if (users.find(u => u.email === userData.email)) {
          return { success: false, message: 'Email already registered' };
        }

        const newUser: User = {
          id: uuidv4(),
          email: userData.email,
          password: userData.password,
          name: userData.name,
          phone: userData.phone || '',
          role: userData.role,
          subRole: userData.subRole,
          businessName: userData.businessName,
          address: userData.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          uniqueId: generateUniqueId(),
          agreements: [],
          inventory: userData.role === 'vendor' ? [] : undefined,
        };

        set({ users: [...users, newUser] });
        return { success: true, message: 'Registration successful! Please login.' };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false, currentOrder: null });
      },

      updateUser: (userData) => {
        const { currentUser, users } = get();
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...userData, updatedAt: new Date() };
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);

        set({ currentUser: updatedUser, users: updatedUsers });
      },

      establishAgreement: (targetUserId) => {
        const { currentUser, users } = get();
        if (!currentUser) return { success: false, message: 'Not authenticated' };

        const targetUser = users.find(u => u.uniqueId === targetUserId || u.id === targetUserId);
        if (!targetUser) return { success: false, message: 'User not found' };

        // Check if already connected
        if (currentUser.agreements.includes(targetUser.id)) {
          return { success: false, message: 'Agreement already exists' };
        }

        // Update both users
        const updatedCurrentUser = {
          ...currentUser,
          agreements: [...currentUser.agreements, targetUser.id]
        };

        const updatedTargetUser = {
          ...targetUser,
          agreements: [...targetUser.agreements, currentUser.id]
        };

        const updatedUsers = users.map(u => {
          if (u.id === currentUser.id) return updatedCurrentUser;
          if (u.id === targetUser.id) return updatedTargetUser;
          return u;
        });

        set({ currentUser: updatedCurrentUser, users: updatedUsers });
        return { success: true, message: `Agreement established with ${targetUser.name}` };
      },

      updateVendorInventory: (inventory) => {
        const { currentUser, users } = get();
        if (!currentUser || currentUser.role !== 'vendor') return;

        const updatedUser = { ...currentUser, inventory, updatedAt: new Date() };
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);

        set({ currentUser: updatedUser, users: updatedUsers });
      },

      updateVerification: (details) => {
        const { currentUser, users } = get();
        if (!currentUser || currentUser.role !== 'transporter') return;

        const updatedUser = { ...currentUser, verificationDetails: details, updatedAt: new Date() };
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);

        set({ currentUser: updatedUser, users: updatedUsers });
      },

      // Order State
      orders: [],
      currentOrder: null,

      createOrder: (kitchenId, kitchenName, kitchenAddress, items, notes) => {
        const newOrder: Order = {
          id: uuidv4(),
          orderNumber: generateOrderNumber(),
          kitchenId,
          kitchenName,
          kitchenAddress,
          items,
          status: 'pending_supplier',
          totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          createdAt: new Date(),
          updatedAt: new Date(),
          notes,
        };

        set(state => ({
          orders: [...state.orders, newOrder],
          currentOrder: newOrder
        }));

        // Notify suppliers (ONLY those with agreements)
        const kitchenUser = get().users.find(u => u.id === kitchenId);
        const suppliers = get().users.filter(u => u.role === 'supplier');

        // Filter suppliers who have an agreement with this kitchen
        const relevantSuppliers = suppliers.filter(supplier =>
          kitchenUser?.agreements.includes(supplier.id) ||
          supplier.agreements.includes(kitchenId) // Check bidirectional just in case
        );

        // Fallback: If no agreements, maybe notify all? No, user requested logic change.
        // But for development/demo safety if no agreements exist yet, we might want a warning.
        // For now, implementing strict logic as requested.

        relevantSuppliers.forEach(supplier => {
          get().addNotification(
            supplier.id,
            'New Order Available',
            `Order #${newOrder.orderNumber} from ${kitchenName} is waiting for assignment`,
            'info'
          );
        });

        return newOrder;
      },

      updateOrderStatus: (orderId, status) => {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? { ...order, status, updatedAt: new Date() }
              : order
          )
        }));

        const order = get().orders.find(o => o.id === orderId);
        if (order) {
          // Send notifications based on status
          let notification: { title: string; message: string; type: Notification['type'] } =
            { title: '', message: '', type: 'info' };

          switch (status) {
            case 'vendor_assigned':
              notification = {
                title: 'Vendor Assigned',
                message: `Vendors have been assigned to your order #${order.orderNumber}`,
                type: 'info'
              };
              get().addNotification(order.kitchenId, notification.title, notification.message, notification.type);
              break;
            case 'packed_ready':
              notification = {
                title: 'Order Ready for Pickup',
                message: `Order #${order.orderNumber} is packed and ready for pickup`,
                type: 'success'
              };
              get().addNotification(order.kitchenId, notification.title, notification.message, notification.type);
              break;
            case 'in_transit':
              notification = {
                title: 'Order In Transit',
                message: `Your order #${order.orderNumber} is on the way`,
                type: 'info'
              };
              get().addNotification(order.kitchenId, notification.title, notification.message, notification.type);
              break;
            case 'delivered':
              notification = {
                title: 'Order Delivered',
                message: `Order #${order.orderNumber} has been delivered. Please confirm receipt.`,
                type: 'success'
              };
              get().addNotification(order.kitchenId, notification.title, notification.message, notification.type);
              break;
            case 'completed':
              notification = {
                title: 'Order Completed',
                message: `Order #${order.orderNumber} has been completed`,
                type: 'success'
              };
              get().addNotification(order.kitchenId, notification.title, notification.message, notification.type);
              // Generate invoices
              get().createInvoice(orderId, order.kitchenId, 'kitchen', order.items);
              if (order.supplierId) {
                get().createInvoice(orderId, order.supplierId, 'supplier', order.items);
              }
              break;
          }
        }
      },

      assignSupplier: (orderId, supplierId, supplierName) => {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? { ...order, supplierId, supplierName, status: 'vendor_assigned', updatedAt: new Date() }
              : order
          )
        }));
      },

      assignVendor: (orderId, category, vendorId, vendorName) => {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? {
                ...order,
                items: order.items.map(item =>
                  item.category === category
                    ? { ...item, vendorId, vendorName }
                    : item
                ),
                updatedAt: new Date()
              }
              : order
          )
        }));

        // Notify vendor
        const order = get().orders.find(o => o.id === orderId);
        if (order) {
          get().addNotification(
            vendorId,
            'New Order Assignment',
            `You have been assigned to fulfill ${category} items for order #${order.orderNumber}`,
            'info'
          );
        }
      },

      assignTransporter: (orderId, transporterId, transporterName) => {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? { ...order, transporterId, transporterName, updatedAt: new Date() }
              : order
          )
        }));
      },

      getOrdersByKitchen: (kitchenId) => {
        return get().orders.filter(order => order.kitchenId === kitchenId);
      },

      getOrdersBySupplier: (supplierId) => {
        return get().orders.filter(order => order.supplierId === supplierId);
      },

      getOrdersByVendor: (vendorId) => {
        return get().orders.filter(order =>
          order.items.some(item => item.vendorId === vendorId)
        );
      },

      getOrdersByTransporter: (transporterId) => {
        return get().orders.filter(order => order.transporterId === transporterId);
      },

      getOrderById: (orderId) => {
        return get().orders.find(order => order.id === orderId);
      },

      getTodaysOrders: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });
      },

      // Inventory State
      products: INVENTORY_PRODUCTS,

      getProductsByCategory: (category) => {
        return get().products.filter(product => product.category === category);
      },

      getProductById: (id) => {
        return get().products.find(product => product.id === id);
      },

      // Invoice State
      invoices: [],

      createInvoice: (orderId, userId, userRole, items) => {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.18;
        const total = subtotal + tax;

        const newInvoice: Invoice = {
          id: uuidv4(),
          invoiceNumber: generateInvoiceNumber(),
          orderId,
          userId,
          userRole,
          items,
          subtotal,
          tax,
          total,
          status: 'draft',
          createdAt: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        set(state => ({ invoices: [...state.invoices, newInvoice] }));

        // Notify user
        get().addNotification(
          userId,
          'New Invoice Generated',
          `Invoice #${newInvoice.invoiceNumber} has been generated for your order`,
          'info'
        );

        return newInvoice;
      },

      getInvoicesByUser: (userId) => {
        return get().invoices.filter(invoice => invoice.userId === userId);
      },

      getWeeklyStats: (userId) => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const userInvoices = get().invoices.filter(
          inv => inv.userId === userId && inv.createdAt >= weekAgo
        );
        return {
          total: userInvoices.reduce((sum, inv) => sum + inv.total, 0),
          count: userInvoices.length,
        };
      },

      getMonthlyStats: (userId) => {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const userInvoices = get().invoices.filter(
          inv => inv.userId === userId && inv.createdAt >= monthAgo
        );
        return {
          total: userInvoices.reduce((sum, inv) => sum + inv.total, 0),
          count: userInvoices.length,
        };
      },

      // Delivery State
      rides: [],

      createRide: (orderId, pickupAddress, dropAddress) => {
        const newRide: DeliveryRide = {
          id: uuidv4(),
          orderId,
          transporterId: '',
          transporterName: '',
          pickupAddress,
          dropAddress,
          status: 'requested',
          createdAt: new Date(),
        };

        set(state => ({ rides: [...state.rides, newRide] }));

        // Notify transporters
        const transporters = get().users.filter(u => u.role === 'transporter');
        transporters.forEach(transporter => {
          get().addNotification(
            transporter.id,
            'New Delivery Request',
            'A new delivery pickup is available near you',
            'info'
          );
        });

        return newRide;
      },

      acceptRide: (rideId, transporterId, transporterName) => {
        set(state => ({
          rides: state.rides.map(ride =>
            ride.id === rideId
              ? { ...ride, transporterId, transporterName, status: 'accepted', acceptedAt: new Date() }
              : ride
          )
        }));
      },

      updateRideStatus: (rideId, status) => {
        set(state => ({
          rides: state.rides.map(ride => {
            if (ride.id === rideId) {
              const updates: Partial<DeliveryRide> = { status };
              if (status === 'picked_up') updates.pickedUpAt = new Date();
              if (status === 'delivered') updates.deliveredAt = new Date();
              return { ...ride, ...updates };
            }
            return ride;
          })
        }));

        // Update order status based on ride status
        const ride = get().rides.find(r => r.id === rideId);
        if (ride) {
          if (status === 'picked_up') {
            get().updateOrderStatus(ride.orderId, 'in_transit');
          } else if (status === 'delivered') {
            get().updateOrderStatus(ride.orderId, 'delivered');
          }
        }
      },

      updateLocation: (rideId, lat, lng) => {
        set(state => ({
          rides: state.rides.map(ride =>
            ride.id === rideId
              ? { ...ride, coordinates: { lat, lng } }
              : ride
          )
        }));
      },

      getAvailableRides: () => {
        return get().rides.filter(ride => ride.status === 'requested');
      },

      getRideByTransporter: (transporterId) => {
        return get().rides.filter(ride => ride.transporterId === transporterId);
      },

      // Notification State
      notifications: [],

      addNotification: (userId, title, message, type: Notification['type']) => {
        const newNotification: Notification = {
          id: uuidv4(),
          userId,
          title,
          message,
          type,
          isRead: false,
          createdAt: new Date(),
        };

        set(state => ({ notifications: [...state.notifications, newNotification] }));
      },

      markAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(notif =>
            notif.id === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        }));
      },

      markAllAsRead: (userId) => {
        set(state => ({
          notifications: state.notifications.map(notif =>
            notif.userId === userId
              ? { ...notif, isRead: true }
              : notif
          )
        }));
      },

      getNotificationsByUser: (userId) => {
        return get().notifications
          .filter(notif => notif.userId === userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },

      getUnreadCount: (userId) => {
        return get().notifications.filter(notif => notif.userId === userId && !notif.isRead).length;
      },

      // Support State
      tickets: [],

      createTicket: (userId, userName, subject, message, priority) => {
        const newTicket: SupportTicket = {
          id: uuidv4(),
          userId,
          userName,
          subject,
          message,
          status: 'open',
          priority,
          createdAt: new Date(),
          updatedAt: new Date(),
          responses: [],
        };

        set(state => ({ tickets: [...state.tickets, newTicket] }));
        return newTicket;
      },

      addResponse: (ticketId, userId, userName, message) => {
        const newResponse = {
          id: uuidv4(),
          ticketId,
          userId,
          userName,
          message,
          createdAt: new Date(),
        };

        set(state => ({
          tickets: state.tickets.map(ticket =>
            ticket.id === ticketId
              ? {
                ...ticket,
                responses: [...ticket.responses, newResponse],
                updatedAt: new Date(),
                status: ticket.status === 'open' ? 'in_progress' : ticket.status
              }
              : ticket
          )
        }));
      },

      updateTicketStatus: (ticketId, status) => {
        set(state => ({
          tickets: state.tickets.map(ticket =>
            ticket.id === ticketId
              ? { ...ticket, status, updatedAt: new Date() }
              : ticket
          )
        }));
      },

      getTicketsByUser: (userId) => {
        return get().tickets
          .filter(ticket => ticket.userId === userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },

      getAllTickets: () => {
        return get().tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },

      // Admin State
      users: createDemoUsers(),

      addUser: (user) => {
        set(state => ({ users: [...state.users, user] }));
      },

      updateUserById: (userId, userData) => {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, ...userData, updatedAt: new Date() } : u)
        }));
      },

      deleteUser: (userId) => {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, isActive: false } : u)
        }));
      },

      getUsersByRole: (role) => {
        return get().users.filter(u => u.role === role);
      },

      getAllUsers: () => {
        return get().users;
      },
    }),
    {
      name: 'supplychain-storage',
      partialize: (state) => ({
        users: state.users,
        orders: state.orders,
        invoices: state.invoices,
        rides: state.rides,
        notifications: state.notifications,
        tickets: state.tickets,
      }),
    }
  )
);
