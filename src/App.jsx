import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Badge, Avatar, Dropdown, Space, Typography, ConfigProvider, Drawer } from 'antd';
import {
    ShoppingCartOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    ShoppingOutlined,
    MedicineBoxOutlined,
    MenuOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PublicProducts from './pages/PublicProducts';
import Cart from './pages/Cart';
import PharmacyDashboard from './pages/PharmacyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';
import api from './api';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const fetchUser = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const res = await api.get('/accounts/me/');
                setUser(res.data);
            } catch (err) {
                localStorage.clear();
                setUser(null);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/';
    };

    const userMenuItems = [
        { key: 'profile', icon: <UserOutlined />, label: 'My Profile' },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', onClick: handleLogout, danger: true },
    ];

    const toggleDrawer = () => setDrawerVisible(!drawerVisible);

    const navItems = [
        {
            key: 'home',
            label: <Link to="/">Home</Link>,
        },
        {
            key: 'products',
            label: <Link to="/products">Catalog</Link>,
        },
        ...(user ? [{
            key: 'dashboard',
            label: <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>Dashboard</Link>,
            icon: <DashboardOutlined />
        }] : []),
        ...(user && user.role === 'admin' ? [{
            key: 'reports',
            label: <Link to="/reports">Intelligence</Link>,
            icon: <LineChartOutlined />
        }] : []),
    ];

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <Title level={3} style={{ marginBottom: '16px', fontWeight: 800 }}>SurgicalDistro</Title>
                <div className="shimmer" style={{ width: '200px', height: '10px', borderRadius: '5px', margin: '0 auto' }}></div>
                <Text type="secondary" style={{ marginTop: '20px', display: 'block' }}>Establishing Secure Session...</Text>
            </div>
        </div>
    );

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#6366f1',
                    borderRadius: 12,
                    fontFamily: 'Outfit, sans-serif',
                },
                components: {
                    Button: {
                        controlHeight: 40,
                        fontWeight: 600,
                    },
                }
            }}
        >
            <Router>
                <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
                    <Header className="glass-navbar">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {/* Mobile Menu Toggle */}
                                <Button
                                    type="text"
                                    icon={<MenuOutlined />}
                                    onClick={toggleDrawer}
                                    style={{ marginRight: '8px', display: 'none' }}
                                    className="mobile-menu-btn"
                                />

                                <Link to="/" style={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '8px',
                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                    }}>
                                        <MedicineBoxOutlined style={{ fontSize: '18px', color: '#fff' }} />
                                    </div>
                                    <Title level={4} className="nav-logo-text" style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(to right, #1e293b, #64748b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        SurgicalDistro
                                    </Title>
                                </Link>

                                <div className="desktop-menu" style={{ marginLeft: '24px' }}>
                                    <Menu
                                        mode="horizontal"
                                        items={navItems}
                                        className="glass-menu"
                                        style={{ border: 'none', background: 'transparent', minWidth: '300px' }}
                                    />
                                </div>
                            </div>

                            <Space size="middle">
                                <Link to="/cart">
                                    <Badge count={cartCount} offset={[5, 5]} color="#6366f1">
                                        <Button type="text" icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />} />
                                    </Badge>
                                </Link>

                                {user ? (
                                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                                        <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                            <Avatar size="small" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} icon={<UserOutlined />} />
                                            <div className="user-email-text" style={{ lineHeight: '1' }}>
                                                <Text strong style={{ fontSize: '13px' }}>{user.email.split('@')[0]}</Text>
                                            </div>
                                        </Space>
                                    </Dropdown>
                                ) : (
                                    <Space size="small">
                                        <Link to="/login"><Button type="primary">Sign In</Button></Link>
                                    </Space>
                                )}
                            </Space>
                        </div>

                        {/* Mobile Drawer */}
                        <Drawer
                            title="SurgicalDistro"
                            placement="left"
                            onClose={toggleDrawer}
                            open={drawerVisible}
                            width={280}
                            styles={{ body: { padding: 0 } }}
                        >
                            <Menu
                                mode="vertical"
                                items={navItems.map(item => ({ ...item, onClick: toggleDrawer }))}
                                style={{ border: 'none' }}
                            />
                        </Drawer>
                    </Header>

                    <Content style={{ padding: '40px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                        <div className="glass-appear">
                            <Routes>
                                <Route path="/" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <LandingPage />} />
                                <Route path="/products" element={<PublicProducts setCartCount={setCartCount} />} />
                                <Route path="/cart" element={<Cart setCartCount={setCartCount} user={user} />} />
                                {user && user.role === 'pharmacy' && <Route path="/dashboard" element={<PharmacyDashboard user={user} />} />}
                                {user && user.role === 'admin' && <Route path="/admin" element={<AdminDashboard />} />}
                                {user && user.role === 'admin' && <Route path="/reports" element={<Reports />} />}
                                <Route path="/login" element={<Login fetchUser={fetchUser} />} />
                            </Routes>
                        </div>
                    </Content>

                    <Footer style={{ textAlign: 'center', background: 'transparent', color: '#64748b' }}>
                        <Text type="secondary">SurgicalDistro ©2026 • Premium Medical Distribution Network</Text>
                    </Footer>
                </Layout>
            </Router>
        </ConfigProvider>
    );
};

export default App;
