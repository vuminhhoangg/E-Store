import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NotFoundPage from './pages/NotFoundPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import OrderSummaryPage from './pages/OrderSummaryPage'
import CheckoutPage from './pages/CheckoutPage'
import { ProtectedRoute, AdminProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './components/AuthContext'
import Layout from './components/Layout'
import { useEffect } from 'react'
import { isLoggedIn, getCurrentUser, isAdmin } from './utils/auth'

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard'
import UserManagement from './pages/Admin/UserManagement'
import ProductManagement from './pages/Admin/ProductManagement'
import OrderManagement from './pages/Admin/OrderManagement'
import AdminLayout from './pages/Admin/AdminLayout'
import WarrantyManagementPage from './pages/Admin/WarrantyManagementPage'
import WarrantyClaimDetailPage from './pages/Admin/WarrantyClaimDetailPage'
import OrderSuccessPage from "./pages/OrderSuccessPage.tsx";
import UserOrders from './pages/UserOrders'

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Store admin path only on direct access
  useEffect(() => {
    const isDirectAccess = performance.navigation ?
      performance.navigation.type === 0 :
      window.performance.getEntriesByType('navigation').some((nav: any) => nav.type === 'navigate');

    if (isDirectAccess &&
      location.pathname.startsWith('/admin') &&
      location.pathname !== '/admin' &&
      location.pathname !== '/admin/dashboard') {
      sessionStorage.setItem('lastAdminPath', location.pathname);
    }
  }, [location.pathname]);

  // Handle admin redirects
  useEffect(() => {
    const authenticated = isLoggedIn();
    const user = getCurrentUser();

    if (authenticated && user?.isAdmin === true && location.pathname === '/') {
      const lastPath = sessionStorage.getItem('lastAdminPath');
      const targetPath = lastPath || '/admin/dashboard';

      // Use immediate navigation without timeout
      navigate(targetPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="app-container">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Routes */}
          <Route path="cart" element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="change-password" element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          } />
          <Route path="order-summary" element={
            <ProtectedRoute>
              <OrderSummaryPage />
            </ProtectedRoute>
          } />
          <Route path="order-success/:id" element={
            <ProtectedRoute>
              <OrderSuccessPage />
            </ProtectedRoute>
          } />
          <Route path="order-success" element={
            <ProtectedRoute>
              <OrderSuccessPage />
            </ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute>
              <UserOrders />
            </ProtectedRoute>
          } />

          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="warranty" element={<WarrantyManagementPage />} />
          <Route path="warranty/:id" element={<WarrantyClaimDetailPage />} />
        </Route>
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
