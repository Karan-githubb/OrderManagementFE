import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Drawer } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    ShoppingOutlined,
    MedicineBoxOutlined,
    MenuOutlined,
    LineChartOutlined,
    DollarOutlined,
    HomeOutlined,
    AppstoreOutlined,
    ShopOutlined,
    OrderedListOutlined,
    TagsOutlined,
    WarningOutlined,
    HistoryOutlined,
    InboxOutlined,
    BankOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SIDEBAR_WIDTH = 240;
const TOP_BAR_HEIGHT = 56;

const getSidebarItems = (user) => {
  const base = [
    {
      key: 'home',
      label: <Link to="/">Home</Link>,
      icon: <HomeOutlined />,
    },
    { key: '/products', label: <Link to="/products">Browse</Link>, icon: <AppstoreOutlined /> },
    { key: '/order-management', label: <Link to="/order-management">Requisition</Link>, icon: <ShoppingOutlined /> },
  ];
  if (user?.role === 'pharmacy') {
    base.push({ key: '/dashboard/reports', label: <Link to="/dashboard/reports">Reports</Link>, icon: <LineChartOutlined /> });
  }
  if (user?.role === 'admin') {
    base.push(
      {
        type: 'group',
        label: 'Operations',
        children: [
          { key: '/admin/orders', label: <Link to="/admin/orders">Orders</Link>, icon: <OrderedListOutlined /> },
          { key: '/admin/partners', label: <Link to="/admin/partners">Partners</Link>, icon: <ShopOutlined /> },
          { key: '/admin/inventory', label: <Link to="/admin/inventory">Inventory</Link>, icon: <MedicineBoxOutlined /> },
          { key: '/admin/batches', label: <Link to="/admin/batches">Batches</Link>, icon: <InboxOutlined /> },
          { key: '/admin/stock-requirements', label: <Link to="/admin/stock-requirements">Replenishment</Link>, icon: <WarningOutlined /> },
          { key: '/admin/purchase-history', label: <Link to="/admin/purchase-history">Purchases</Link>, icon: <HistoryOutlined /> },
        ],
      },
      { key: '/payments', label: <Link to="/payments">Payments</Link>, icon: <DollarOutlined /> },
      { key: '/reports', label: <Link to="/reports">Reports</Link>, icon: <LineChartOutlined /> },
      {
        type: 'group',
        label: 'Settings',
        children: [
          { key: '/admin/company', label: <Link to="/admin/company">Company profile</Link>, icon: <BankOutlined /> },
          { key: '/admin/categories', label: <Link to="/admin/categories">Categories</Link>, icon: <TagsOutlined /> },
        ],
      }
    );
  }
  return base;
};

const AppShell = ({ user, loading, fetchUser, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'My Profile', onClick: () => navigate('/profile') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', onClick: handleLogout, danger: true },
  ];

  const sidebarItems = getSidebarItems(user);
  const path = location.pathname;
  const isHome = path === '/' || path === '/admin' || path === '/dashboard';
  const selectedKey = isHome ? 'home' : path;

  const isAdmin = user?.role === 'admin';
  const sidebarStyle = {
    background: isAdmin ? 'var(--color-admin-sidebar)' : 'var(--color-pharmacy-bg)',
    borderRight: isAdmin ? 'none' : '1px solid var(--color-accent-slate-border)',
  };

  const isLanding = !user && path === '/';

  const LandingTopBar = () => (
    <Header
      style={{
        height: TOP_BAR_HEIGHT,
        padding: '0 24px',
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: 'none',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <MedicineBoxOutlined style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.95)' }} />
        </div>
        <Text strong style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.95)' }}>SurgicalDistro</Text>
      </Link>
      <Link to="/login">
        <Button
          type="default"
          style={{
            borderRadius: 20,
            height: 38,
            paddingLeft: 18,
            paddingRight: 18,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          Sign In
        </Button>
      </Link>
    </Header>
  );

  const TopBar = () => (
    <Header
      style={{
        height: TOP_BAR_HEIGHT,
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid var(--color-accent-slate-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Space size="middle">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileDrawerOpen(true)}
          style={{ display: 'none' }}
          className="mobile-menu-btn"
        />
        <Link to="/" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <MedicineBoxOutlined style={{ fontSize: 18, color: '#fff' }} />
          </div>
          <Text strong style={{ fontSize: 18, color: '#0f172a' }}>SurgicalDistro</Text>
        </Link>
      </Space>

      <Space size="middle">
        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              borderRadius: 12,
              background: 'var(--color-accent-slate-bg)',
              border: '1px solid var(--color-accent-slate-border)',
              overflow: 'hidden',
              height: 50,
            }}
          >
            {isAdmin ? (
              <Link to="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Space
                  size={6}
                  style={{
                    padding: '8px 12px',
                    height: 40,
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                  }}
                >
                  <SettingOutlined style={{ fontSize: 14 }} />
                  Admin
                </Space>
              </Link>
            ) : (
              <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Space
                  size={6}
                  style={{
                    padding: '8px 12px',
                    height: 40,
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                  }}
                >
                  <MedicineBoxOutlined style={{ fontSize: 14 }} />
                  Pharmacy
                </Space>
              </Link>
            )}
            <div
              style={{
                width: 1,
                height: 20,
                background: 'var(--color-accent-slate-border)',
              }}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={['click']}>
              <Space
                size={10}
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px 8px 10px',
                  height: 40,
                  boxSizing: 'border-box',
                }}
              >
                <Avatar size={28} style={{ background: 'var(--color-primary)' }} icon={<UserOutlined />} />
                <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user.username}</Text>
              </Space>
            </Dropdown>
          </div>
        ) : (
          <Link to="/login">
            <Button type="primary" style={{ borderRadius: 8 }}>Sign In</Button>
          </Link>
        )}
      </Space>
    </Header>
  );

  const SidebarMenu = () => (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={sidebarItems}
      style={{
        border: 'none',
        paddingTop: 16,
        background: 'transparent',
        color: isAdmin ? '#94a3b8' : '#475569',
      }}
      className={isAdmin ? 'sidebar-menu-admin' : 'sidebar-menu-pharmacy'}
    />
  );

  const DesktopSidebar = () => (
    <Sider
      width={SIDEBAR_WIDTH}
      collapsed={sidebarCollapsed}
      style={{
        ...sidebarStyle,
        position: 'fixed',
        left: 0,
        top: TOP_BAR_HEIGHT,
        bottom: 0,
        overflow: 'auto',
        zIndex: 999,
      }}
    >
      <SidebarMenu />
    </Sider>
  );

  const mainAndFooter = (
    <>
      <Layout
        className="app-main-inner"
        style={{
          minHeight: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minWidth: 0,
        }}
      >
        <Content style={{ padding: 24, width: '100%', flex: 1, minWidth: 0, textAlign: 'left' }}>
          {children}
        </Content>
      </Layout>
      <footer
        style={{
          textAlign: 'center',
          padding: 16,
          color: 'var(--text-muted)',
          fontSize: 13,
          borderTop: '1px solid var(--color-accent-slate-border)',
          width: '100%',
          flexShrink: 0,
        }}
      >
        SurgicalDistro ©2026 • Premium Medical Distribution Network
      </footer>
    </>
  );

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'var(--color-accent-slate-bg)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isLanding ? <LandingTopBar /> : <TopBar />}

      {user ? (
        <>
          <div className="desktop-menu" style={{ display: 'block' }}>
            <DesktopSidebar />
          </div>
          <Drawer
            title="Menu"
            placement="left"
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
            width={280}
            styles={{ body: { padding: 0 } }}
            className="mobile-menu-drawer"
          >
            <SidebarMenu />
          </Drawer>

          <div
            className="app-main-with-sidebar app-main-content"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
              marginTop: TOP_BAR_HEIGHT,
              marginLeft: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
            }}
          >
            {mainAndFooter}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, marginTop: TOP_BAR_HEIGHT }}>
          {mainAndFooter}
        </div>
      )}
    </Layout>
  );
};

export default AppShell;
