import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import RequisitionsPage from './pages/RequisitionsPage';
import ReportsPage from './pages/ReportsPage';

// Dashboards
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ClerkDashboard from './pages/ClerkDashboard';

// --- Protected Route Component ---
// Ensures user is authenticated and has the correct role
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { token, user, isLoading } = useAuthStore();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[10px] tracking-widest text-gray-400 uppercase">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if user's role is not allowed
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// --- Dashboard Switcher ---
// Dynamically renders the correct dashboard based on user role
function DashboardSwitcher() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[10px] tracking-widest text-gray-400 uppercase">Loading...</span>
        </div>
      </div>
    );
  }

  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'manager') return <ManagerDashboard />;
  return <ClerkDashboard />;
}

// --- Main App Component ---
export default function App() {
  return (
    <Routes>
      {/* Public Route (No Auth Required) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes (Require Auth) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Default Redirect: / → /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard (Role-Specific) */}
        <Route path="/dashboard" element={<DashboardSwitcher />} />

        {/* Common Routes (All Roles) */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/requisitions" element={<RequisitionsPage />} />

        {/* Admin + Manager Routes */}
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <SuppliersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <PurchaseOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-Only Route */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Fallback: Redirect to Dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}