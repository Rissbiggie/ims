import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
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
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { token, user, isLoading } = useAuthStore();

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

  if (!token) return <Navigate to="/login" replace />;

  // CRITICAL FIX: Normalize role to lowercase for comparison
  const userRole = user?.role?.toLowerCase();

  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// --- Dashboard Switcher ---
function DashboardSwitcher() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return null;

  // Normalize role check here too
  const role = user?.role?.toLowerCase();
  
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'manager') return <ManagerDashboard />;
  if (role === 'store_clerk') return <ClerkDashboard />;
  return <div className="p-8 font-mono text-xs text-red-500">Error: Unknown Role ({user?.role})</div>;
}

// --- Main App Component ---
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Main Wrapper */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardSwitcher />} />

        {/* Common Routes */}
        <Route path="/products" element={<ProductsPage />} />
        
        {/* Requisitions: All roles can access */}
        <Route path="/requisitions" element={<RequisitionsPage />} />

        {/* Categories & Suppliers: Admin and Manager only */}
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

        {/* Purchase Orders: FIX - Added 'store_clerk' to allowed roles */}
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'store_clerk']}>
              <PurchaseOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Reports: FIX - Strictly 'admin' only (Removed 'manager') */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin','manager']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}