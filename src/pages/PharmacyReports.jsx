import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Empty, Row, Col } from 'antd';
import { DollarOutlined, OrderedListOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../api';
import PageHeader from '../components/PageHeader';
import { TableSkeleton } from '../components/Skeleton';

const { Title, Text } = Typography;

const PharmacyReports = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState([]);
  const [outstanding, setOutstanding] = useState(null);
  const [invoiceList, setInvoiceList] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [orderRes, outstandingRes, invoiceRes] = await Promise.all([
          api.get('/reports/pharmacy/order-summary/'),
          api.get('/reports/pharmacy/outstanding/'),
          api.get('/reports/pharmacy/invoice-list/'),
        ]);
        setOrderSummary(orderRes.data || []);
        setOutstanding(outstandingRes.data || null);
        setInvoiceList(invoiceRes.data || []);
      } catch (err) {
        setOrderSummary([]);
        setOutstanding(null);
        setInvoiceList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          breadcrumbItems={[{ title: 'Dashboard', link: '/dashboard' }, { title: 'Reports', link: null }]}
          title="Reports"
          subtitle="Your orders, payments, and invoices"
        />
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}><div className="app-card" style={{ padding: 24, minHeight: 120 }}><TableSkeleton rows={3} /></div></Col>
          <Col xs={24} md={16}><div className="app-card" style={{ padding: 24 }}><TableSkeleton rows={5} /></div></Col>
        </Row>
        <div className="app-card" style={{ padding: 24 }}><TableSkeleton rows={6} /></div>
      </>
    );
  }

  const orderSummaryColumns = [
    { title: 'Status', dataIndex: 'status', key: 'status', render: (t) => <Text strong>{String(t).toUpperCase()}</Text> },
    { title: 'Count', dataIndex: 'count', key: 'count', align: 'right', render: (c) => <Text>{c}</Text> },
  ];

  const invoiceColumns = [
    { title: 'Invoice', dataIndex: 'invoice_number', key: 'invoice_number', render: (t) => <Text strong>{t}</Text> },
    { title: 'Order', dataIndex: 'order_number', key: 'order_number' },
    { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { title: 'Amount', dataIndex: 'total_amount', key: 'total_amount', align: 'right', render: (v) => `₹${Number(v || 0).toFixed(2)}` },
  ];

  return (
    <>
      <PageHeader
        breadcrumbItems={[{ title: 'Dashboard', link: '/dashboard' }, { title: 'Reports', link: null }]}
        title="Reports"
        subtitle="Your orders, payments, and invoices"
      />

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card
            title={
              <span><DollarOutlined style={{ marginRight: 8 }} />Outstanding</span>
            }
            size="small"
            className="app-card"
            style={{ borderRadius: 12 }}
          >
            {outstanding ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Dispatched</Text>
                  <Text strong>₹{Number(outstanding.dispatched_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Paid</Text>
                  <Text strong>₹{Number(outstanding.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--color-accent-slate-border)' }}>
                  <Text strong>Outstanding</Text>
                  <Text strong style={{ color: 'var(--color-error)' }}>₹{Number(outstanding.outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </div>
              </div>
            ) : (
              <Empty description="No data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card
            title={
              <span><OrderedListOutlined style={{ marginRight: 8 }} />Order summary</span>
            }
            size="small"
            className="app-card"
            style={{ borderRadius: 12 }}
          >
            {orderSummary.length === 0 ? (
              <Empty description="No orders yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                dataSource={orderSummary}
                columns={orderSummaryColumns}
                rowKey="status"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span><FileTextOutlined style={{ marginRight: 8 }} />Invoices</span>
        }
        size="small"
        className="app-card"
        style={{ borderRadius: 12 }}
      >
        {invoiceList.length === 0 ? (
          <Empty description="No invoices yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            dataSource={invoiceList}
            columns={invoiceColumns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            size="small"
          />
        )}
      </Card>
    </>
  );
};

export default PharmacyReports;
