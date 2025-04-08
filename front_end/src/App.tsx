import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NotFoundPage from './pages/NotFoundPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import { ProtectedRoute, AdminProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './components/AuthContext'
import Layout from './components/Layout'
import { useEffect } from 'react'

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard'
import UserManagement from './pages/Admin/UserManagement'
import ProductManagement from './pages/Admin/ProductManagement'
import OrderManagement from './pages/Admin/OrderManagement'
import AdminLayout from './pages/Admin/AdminLayout'

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
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
    if (isAuthenticated && user?.isAdmin === true && location.pathname === '/') {
      const lastPath = sessionStorage.getItem('lastAdminPath');
      const targetPath = lastPath || '/admin/dashboard';

      // Use immediate navigation without timeout
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  return (
    <div className="app-container">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
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
          <Route path="change-password" element={
            <ProtectedRoute>
              <ChangePasswordPage />
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
