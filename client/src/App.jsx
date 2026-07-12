import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import SalesHistory from './pages/SalesHistory';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Catalog from './pages/Catalog';
import ProtectedRoute from './pages/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-stone-50">
                  <Navbar />
                  <div className="max-w-7xl mx-auto p-8">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/sales" element={<Sales />} />
                      <Route path="/sales/history" element={<SalesHistory />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/catalog" element={<Catalog />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}