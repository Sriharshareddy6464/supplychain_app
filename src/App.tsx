import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Login } from '@/components/auth/Login';
import { Register } from '@/components/auth/Register';
import { KitchenDashboard } from '@/components/dashboard/KitchenDashboard';
import { SupplierDashboard } from '@/components/dashboard/SupplierDashboard';
import { VendorDashboard } from '@/components/dashboard/VendorDashboard';
import { TransporterDashboard } from '@/components/dashboard/TransporterDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { CreateOrder } from '@/components/orders/CreateOrder';
import { OrderList } from '@/components/orders/OrderList';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { SupportTickets } from '@/components/admin/SupportTickets';
import { Profile } from '@/components/profile/Profile';
import { Toaster } from '@/components/ui/sonner';

// Protected Route Component
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[];
}) {
  const { isAuthenticated, currentUser } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    // Redirect to appropriate dashboard based on role
    switch (currentUser.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'kitchen':
        return <Navigate to="/kitchen" replace />;
      case 'supplier':
        return <Navigate to="/supplier" replace />;
      case 'vendor':
        return <Navigate to="/vendor" replace />;
      case 'transporter':
        return <Navigate to="/transporter" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

// Role-based redirect for home route
function HomeRedirect() {
  const { isAuthenticated, currentUser } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (currentUser?.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'kitchen':
      return <Navigate to="/kitchen" replace />;
    case 'supplier':
      return <Navigate to="/supplier" replace />;
    case 'vendor':
      return <Navigate to="/vendor" replace />;
    case 'transporter':
      return <Navigate to="/transporter" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Home Redirect */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Kitchen Routes */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['kitchen']}>
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen/orders"
          element={
            <ProtectedRoute allowedRoles={['kitchen']}>
              <OrderList role="kitchen" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={['kitchen']}>
              <OrderDetails role="kitchen" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen/new-order"
          element={
            <ProtectedRoute allowedRoles={['kitchen']}>
              <CreateOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen/billing"
          element={
            <ProtectedRoute allowedRoles={['kitchen']}>
              <BillingDashboard role="kitchen" />
            </ProtectedRoute>
          }
        />

        {/* Supplier Routes */}
        <Route
          path="/supplier"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <SupplierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/orders"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <OrderList role="supplier" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <OrderDetails role="supplier" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/billing"
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <BillingDashboard role="supplier" />
            </ProtectedRoute>
          }
        />

        {/* Vendor Routes */}
        <Route
          path="/vendor"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/orders"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <OrderList role="vendor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <OrderDetails role="vendor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/billing"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <BillingDashboard role="vendor" />
            </ProtectedRoute>
          }
        />

        {/* Transporter Routes */}
        <Route
          path="/transporter"
          element={
            <ProtectedRoute allowedRoles={['transporter']}>
              <TransporterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transporter/billing"
          element={
            <ProtectedRoute allowedRoles={['transporter']}>
              <BillingDashboard role="transporter" />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <OrderList role="admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <OrderDetails role="admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SupportTickets />
            </ProtectedRoute>
          }
        />

        {/* Common Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* 404 - Redirect to home */}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
