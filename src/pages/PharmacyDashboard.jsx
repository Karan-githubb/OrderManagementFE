import React, { useState, useEffect } from 'react';
import {
  Table, Button, Typography, Row, Col, Space, Modal, message,
} from 'antd';
import {
  FilePdfOutlined, ShoppingCartOutlined, WalletOutlined, EyeOutlined,
  ClockCircleOutlined, CheckCircleOutlined, ShopOutlined, AlertOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { TableSkeleton, StatCardSkeleton } from '../components/Skeleton';

const { Title, Text } = Typography;

const statusPillMap = {
  pending: 'status-pill--pending',
  approved: 'status-pill--approved',
  delivered: 'status-pill--delivered',
  rejected: 'status-pill--rejected',
  processing: 'status-pill--processing',
  shipped: 'status-pill--shipped',
  paid: 'status-pill--paid',
  partial: 'status-pill--partial',
  unpaid: 'status-pill--unpaid',
};

const PharmacyDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/');
      setOrders(res.data.results || res.data || []);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const res = await api.get(`/invoices/`, { params: { order: orderId } });
      const invoices = res.data.results || res.data;
      if (invoices.length > 0) {
        const pdfRes = await api.get(`/invoices/${invoices[0].id}/download/`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        message.info('Invoice pending approval');
      }
    } catch (err) {
      message.error('Download failed');
    }
  };

  const statsData = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
    totalSpent: orders.filter((o) => o.status !== 'rejected').reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0).toFixed(0),
    totalBalance: orders.filter((o) => o.status !== 'rejected').reduce((acc, curr) => acc + parseFloat(curr.outstanding_amount ?? curr.balance_amount ?? 0), 0).toFixed(0),
  };

  const columns = [
    { title: 'Reference', dataIndex: 'order_number', render: (t) => <Text strong style={{ color: 'var(--color-primary)' }}>{t}</Text> },
    { title: 'Date', dataIndex: 'created_at', render: (val) => new Date(val).toLocaleDateString() },
    { title: 'Amount', dataIndex: 'total_amount', render: (val) => <Text strong>₹{val}</Text> },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v) => <span className={`status-pill ${statusPillMap[v] || ''}`}>{v?.toUpperCase()}</span>,
    },
    {
      title: 'Payment',
      dataIndex: 'payment_status',
      render: (s, record) => (
        <span className={`status-pill ${statusPillMap[s] || ''}`}>
          {s === 'paid' ? 'PAID' : s === 'partial' ? `BAL ₹${(record.outstanding_amount ?? record.balance_amount ?? 0)}` : 'UNPAID'}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setIsViewModalVisible(true); }}>Details</Button>
          <Button type="primary" ghost size="small" icon={<FilePdfOutlined />} disabled={record.status === 'pending'} onClick={() => downloadInvoice(record.id)}>Invoice</Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Your orders and procurement overview" />
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}><StatCardSkeleton /></Col>
          ))}
        </Row>
        <TableSkeleton rows={6} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbItems={[{ title: 'Dashboard', link: '/dashboard' }]}
        title="Dashboard"
        subtitle={user?.pharmacy?.pharmacy_name ? `Partner ID: ${user.pharmacy.license_number || '—'}` : 'Your orders and procurement overview'}
        extra={
          <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={() => navigate('/order-management')} style={{ borderRadius: 8 }}>
            New order
          </Button>
        }
      />

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <div className="stat-label">Procurement</div>
            <div className="stat-value">₹{statsData.totalSpent}</div>
            <WalletOutlined style={{ fontSize: 20, color: 'var(--color-primary)', marginTop: 8, opacity: 0.8 }} />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <div className="stat-label">Outstanding</div>
            <div className="stat-value" style={{ color: 'var(--color-error)' }}>₹{statsData.totalBalance}</div>
            <AlertOutlined style={{ fontSize: 20, color: 'var(--color-error)', marginTop: 8, opacity: 0.8 }} />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <div className="stat-label">Pending Orders</div>
            <div className="stat-value">{statsData.pendingOrders}</div>
            <ClockCircleOutlined style={{ fontSize: 20, color: 'var(--color-warning)', marginTop: 8, opacity: 0.8 }} />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{statsData.deliveredOrders}</div>
            <CheckCircleOutlined style={{ fontSize: 20, color: 'var(--color-success)', marginTop: 8, opacity: 0.8 }} />
          </div>
        </Col>
      </Row>

      <div className="app-card" style={{ padding: 24 }}>
        <Title level={5} style={{ marginBottom: 24, fontWeight: 600 }}>My orders</Title>
        {orders.length === 0 ? (
          <EmptyState
            icon={<ShopOutlined />}
            title="No orders yet"
            description="Create your first requisition to place an order."
            actionLabel="Create order"
            onAction={() => navigate('/order-management')}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({ onClick: () => { setSelectedOrder(record); setIsViewModalVisible(true); }, style: { cursor: 'pointer' } })}
            style={{ marginTop: -8 }}
          />
        )}
      </div>

      <Modal
        title="Order details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={null}
        width={640}
        centered
        styles={{ body: { padding: 24 } }}
      >
        {selectedOrder && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 16, background: 'var(--color-accent-slate-bg)', borderRadius: 8 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Order</Text>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-primary)' }}>{selectedOrder.order_number}</div>
              </div>
              <span className={`status-pill ${statusPillMap[selectedOrder.status] || ''}`}>{selectedOrder.status?.toUpperCase()}</span>
            </div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {[
                { label: 'Order total', value: `₹${selectedOrder.total_amount}` },
                { label: 'Dispatched value', value: `₹${(selectedOrder.dispatched_amount != null ? Number(selectedOrder.dispatched_amount).toFixed(2) : '—')}` },
                { label: 'Paid', value: `₹${selectedOrder.paid_amount}`, color: 'var(--color-success)' },
                { label: 'Outstanding', value: `₹${selectedOrder.outstanding_amount != null ? Number(selectedOrder.outstanding_amount).toFixed(2) : (selectedOrder.balance_amount != null ? Number(selectedOrder.balance_amount).toFixed(2) : '0.00')}`, color: 'var(--color-error)' },
                { label: 'Payment', value: selectedOrder.payment_status?.toUpperCase() },
              ].map((info, idx) => (
                <Col span={12} key={idx}>
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{info.label}</Text>
                    <div style={{ fontWeight: 600, color: info.color || undefined }}>{info.value}</div>
                  </div>
                </Col>
              ))}
            </Row>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Items</Text>
            <Table
              size="small"
              dataSource={selectedOrder.items || []}
              pagination={false}
              rowKey="id"
              columns={[
                { title: 'Product', dataIndex: ['product_details', 'name'], render: (t) => <Text strong>{t}</Text> },
                { title: 'Qty', dataIndex: 'quantity', width: 80, align: 'center' },
                { title: 'Total', dataIndex: 'total_price', align: 'right', render: (v) => <Text strong>₹{v}</Text> },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
};

export default PharmacyDashboard;
