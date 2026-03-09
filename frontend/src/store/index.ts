import { useAuthStore } from './authStore';
import type { Order, Invoice, DeliveryRide, Notification, SupportTicket, User } from '@/types';
import { INVENTORY_PRODUCTS } from '@/constants';

// Re-exporting the monolithic useStore hook to not break all Dashboards during the migration.
// This hooks purely delegates authentication to the real `useAuthStore` backend integration 
// and fills the remaining features with safe empty arrays so Vite compiles successfully.

export const useStore = () => {
  const authStore = useAuthStore();

  return {
    ...authStore,

    // Order State
    orders: [] as Order[],
    currentOrder: null as Order | null,
    createOrder: () => ({}),
    updateOrderStatus: () => { },
    assignSupplier: () => { },
    assignVendor: () => { },
    assignTransporter: () => { },
    getOrdersByKitchen: () => [],
    getOrdersBySupplier: () => [],
    getOrdersByVendor: () => [],
    getOrdersByTransporter: () => [],
    getOrderById: () => undefined,
    getTodaysOrders: () => [],

    // Inventory State
    products: INVENTORY_PRODUCTS,
    getProductsByCategory: () => [],
    getProductById: () => undefined,

    // Invoice State
    invoices: [] as Invoice[],
    createInvoice: () => ({}),
    getInvoicesByUser: () => [],
    getWeeklyStats: () => ({ total: 0, count: 0 }),
    getMonthlyStats: () => ({ total: 0, count: 0 }),

    // Delivery State
    rides: [] as DeliveryRide[],
    createRide: () => ({}),
    acceptRide: () => { },
    updateRideStatus: () => { },
    updateLocation: () => { },
    getAvailableRides: () => [],
    getRideByTransporter: () => [],

    // Notification State
    notifications: [] as Notification[],
    addNotification: () => { },
    markAsRead: () => { },
    markAllAsRead: () => { },
    getNotificationsByUser: () => [],
    getUnreadCount: () => 0,

    // Support State
    tickets: [] as SupportTicket[],
    createTicket: () => ({}),
    addResponse: () => { },
    updateTicketStatus: () => { },
    getTicketsByUser: () => [],
    getAllTickets: () => [],

    // Admin State
    users: [] as User[],
    addUser: () => { },
    updateUserById: () => { },
    deleteUser: () => { },
    getUsersByRole: () => [],
    getAllUsers: () => [],
  } as any;
};