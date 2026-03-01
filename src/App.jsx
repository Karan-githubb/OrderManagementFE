import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Typography, ConfigProvider } from 'antd';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PublicProducts from './pages/PublicProducts';
import PharmacyDashboard from './pages/PharmacyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OrderDispatch from './pages/OrderDispatch';
import Reports from './pages/Reports';
import PharmacyReports from './pages/PharmacyReports';
import Profile from './pages/Profile';
import OrderManagement from './pages/OrderManagement';
import Payments from './pages/Payments';
import AppShell from './components/AppShell';
import api from './api';
import { PageSkeleton } from './components/Skeleton';

const { Title, Text } = Typography;

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const res = await api.get('/accounts/me/');
        setUser(res.data);
      } catch (err) {
        localStorage.clear();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#6366f1', borderRadius: 8, fontFamily: 'Outfit, Inter, sans-serif' } }}>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-accent-slate-bg)' }}>
          <div className="app-card" style={{ padding: 48, textAlign: 'center', maxWidth: 320 }}>
            <Title level={3} style={{ marginBottom: 16, fontWeight: 600 }}>SurgicalDistro</Title>
            <div className="shimmer" style={{ width: 200, height: 8, borderRadius: 4, margin: '0 auto' }} />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>Loading...</Text>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: 'Outfit, Inter, sans-serif',
        },
        components: {
          Button: { controlHeight: 40, fontWeight: 600 },
          Input: { borderRadius: 8 },
          Select: { borderRadius: 8 },
          Card: { borderRadius: 12 },
        },
      }}
    >
      <Router>
        <AppShell user={user} loading={loading} fetchUser={fetchUser}>
          <Routes>
            <Route path="/" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <LandingPage />} />
            <Route path="/products" element={<PublicProducts user={user} />} />
            {user && <Route path="/profile" element={<Profile user={user} fetchUser={fetchUser} />} />}
            {user && <Route path="/order-management" element={<OrderManagement user={user} />} />}
            {user && user.role === 'pharmacy' && <Route path="/dashboard" element={<PharmacyDashboard user={user} />} />}
            {user && user.role === 'pharmacy' && <Route path="/dashboard/reports" element={<PharmacyReports user={user} />} />}
            {user && user.role === 'admin' && <Route path="/admin" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/admin/orders" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/admin/orders/:orderId/dispatch" element={<OrderDispatch />} />}
            {user && user.role === 'admin' && <Route path="/admin/inventory" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/admin/batches" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/admin/partners" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/admin/categories" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/admin/stock-requirements" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/admin/purchase-history" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/admin/company" element={<AdminDashboard />} />}
            {user && user.role === 'admin' && <Route path="/payments" element={<Payments />} />}
            {user && user.role === 'admin' && <Route path="/reports" element={<Reports />} />}
            <Route path="/login" element={<Login fetchUser={fetchUser} />} />
          </Routes>
        </AppShell>
      </Router>
    </ConfigProvider>
  );
};

export default App;
