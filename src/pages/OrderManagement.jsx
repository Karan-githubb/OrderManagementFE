import React, { useState, useEffect } from 'react';
import {
  Table, Button, InputNumber, Typography, Space, message, Row, Col,
  Select, Popconfirm,
} from 'antd';
import { DeleteOutlined, PlusOutlined, SendOutlined, ReloadOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';

const { Title, Text } = Typography;
const { Option } = Select;

const OrderManagement = ({ user }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);
  const [addProductId, setAddProductId] = useState(null);
  const [addQty, setAddQty] = useState(1);
  const [products, setProducts] = useState([]);

  const pharmacyId = user?.role === 'admin' ? selectedPharmacyId : user?.pharmacy?.id;
  const selectedProduct = products.find((p) => p.id === addProductId);
  const unitPrice = selectedProduct ? Number(selectedProduct.selling_price) : 0;
  const discountPercent = selectedProduct ? Number(selectedProduct.default_discount_percent || 0) : 0;
  const addLineTotal = unitPrice * (addQty || 0) * (1 - discountPercent / 100);

  const fetchDraft = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/drafts/mine/');
      setDraft(res.data);
    } catch (err) {
      if (err.response?.status === 400) setDraft({ items: [] });
      else message.error('Failed to load requisition');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/');
      const data = res.data.results || res.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error('Failed to load products');
    }
  };

  const fetchPharmacies = async () => {
    try {
      const res = await api.get('/accounts/users/');
      const data = res.data.results || res.data;
      const list = Array.isArray(data) ? data.filter((u) => u.role === 'pharmacy' && u.pharmacy) : [];
      setPharmacies(list);
      if (list.length && !selectedPharmacyId) setSelectedPharmacyId(list[0].pharmacy?.id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchPharmacies();
  }, [user]);
  useEffect(() => {
    fetchDraft();
  }, [user]);
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddLine = async () => {
    if (!addProductId || addQty < 1) {
      message.warning('Select product and quantity');
      return;
    }
    try {
      await api.post('/drafts/items/', { product: addProductId, quantity: addQty });
      message.success('Added to requisition');
      setAddProductId(null);
      setAddQty(1);
      fetchDraft();
    } catch (err) {
      message.error(err.response?.data?.detail || 'Failed to add');
    }
  };

  const handleUpdateQuantity = async (itemId, value) => {
    try {
      await api.patch(`/drafts/items/${itemId}/`, { quantity: value });
      fetchDraft();
    } catch (err) {
      message.error('Failed to update');
    }
  };

  const handleRemoveLine = async (itemId) => {
    try {
      await api.delete(`/drafts/items/${itemId}/`);
      message.success('Line removed');
      fetchDraft();
    } catch (err) {
      message.error('Failed to remove');
    }
  };

  const handleSubmit = async () => {
    if (!draft?.items?.length) {
      message.warning('Add at least one item');
      return;
    }
    if (user?.role === 'admin' && !pharmacyId) {
      message.warning('Select a pharmacy');
      return;
    }
    setSubmitting(true);
    try {
      const payload = user?.role === 'admin' ? { pharmacy: pharmacyId } : {};
      await api.post('/drafts/submit/', payload);
      message.success('Order placed');
      setDraft(null);
      setTimeout(() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard'), 1000);
    } catch (err) {
      message.error(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const items = draft?.items || [];
  const subtotal = items.reduce((s, i) => s + (i.unit_price * i.quantity), 0);
  const totalDiscount = items.reduce((s, i) => s + (Number(i.discount_amount) || 0), 0);
  const grandTotal = subtotal - totalDiscount;

  const columns = [
    {
      title: 'Product',
      key: 'product',
      ellipsis: true,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.product_details?.name || r.product}</Text>
          {(r.product_details?.pack_size > 1 || r.product_details?.unit) && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.product_details?.pack_size > 1 ? `Pack: ${r.product_details.pack_size}` : ''}
              {r.product_details?.unit ? ` • ${r.product_details.unit}` : ''}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      width: 96,
      align: 'center',
      render: (val, record) => (
        <InputNumber
          min={1}
          value={val}
          onChange={(v) => v != null && handleUpdateQuantity(record.id, v)}
          style={{ width: 64, borderRadius: 8 }}
        />
      ),
    },
    {
      title: 'Unit price',
      dataIndex: 'unit_price',
      width: 100,
      align: 'right',
      render: (v) => `₹${Number(v).toFixed(2)}`,
    },
    {
      title: 'Discount',
      key: 'discount',
      width: 90,
      align: 'right',
      render: (_, r) => <Text type="secondary">− ₹{(Number(r.discount_amount) || 0).toFixed(2)}</Text>,
    },
    {
      title: 'Total',
      key: 'total',
      width: 100,
      align: 'right',
      render: (_, r) => {
        const t = (r.unit_price * r.quantity) - (Number(r.discount_amount) || 0);
        return <Text strong>₹{t.toFixed(2)}</Text>;
      },
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: (_, record) => (
        <Popconfirm title="Remove line?" onConfirm={() => handleRemoveLine(record.id)} okText="Remove">
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const summaryCard = (
    <div className="app-card" style={{ padding: 24, position: 'sticky', top: 80 }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Order summary</Text>
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary">Subtotal </Text>
        <Text strong>₹{subtotal.toFixed(2)}</Text>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary">Discount </Text>
        <Text>− ₹{totalDiscount.toFixed(2)}</Text>
      </div>
      <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--color-accent-slate-border)' }}>
        <Text strong>Grand total </Text>
        <Text strong style={{ fontSize: 20, color: 'var(--color-primary)' }}>₹{grandTotal.toFixed(2)}</Text>
      </div>
      <Button
        type="primary"
        size="large"
        icon={<SendOutlined />}
        loading={submitting}
        onClick={handleSubmit}
        disabled={items.length === 0}
        block
        style={{ borderRadius: 8 }}
      >
        Place order
      </Button>
    </div>
  );

  if (loading && !draft) {
    return (
      <>
        <PageHeader
          breadcrumbItems={[{ title: user?.role === 'admin' ? 'Admin' : 'Dashboard', link: user?.role === 'admin' ? '/admin' : '/dashboard' }, { title: 'Requisition' }]}
          title="My Requisition"
          subtitle="Add product lines and place order when ready."
        />
        <TableSkeleton rows={5} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbItems={[
          { title: user?.role === 'admin' ? 'Admin' : 'Dashboard', link: user?.role === 'admin' ? '/admin' : '/dashboard' },
          { title: 'Requisition' },
        ]}
        title="My Requisition"
        subtitle="Add product lines and place order when ready."
      />

      {user.role === 'admin' && (
        <div className="app-card" style={{ padding: 16, marginBottom: 24 }}>
          <Space align="center" wrap>
            <Text strong style={{ minWidth: 100 }}>Place order for</Text>
            <Select
              style={{ width: 280 }}
              placeholder="Select a pharmacy (required)"
              value={selectedPharmacyId}
              onChange={setSelectedPharmacyId}
              showSearch
              optionFilterProp="children"
              options={pharmacies.map((u) => ({ value: u.pharmacy?.id, label: u.pharmacy?.pharmacy_name || u.username }))}
            />
          </Space>
        </div>
      )}

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={14}>
          <div className="app-card" style={{ padding: 24 }}>
            <Title level={5} style={{ marginBottom: 16, fontWeight: 600 }}>Add product line</Title>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={10}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Product</Text>
                <Select
                  placeholder="Search product"
                  style={{ width: '100%' }}
                  value={addProductId}
                  onChange={(v) => { setAddProductId(v); setAddQty(1); }}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={products.filter((p) => p.is_active).map((p) => ({ value: p.id, label: p.name }))}
                />
              </Col>
              {selectedProduct && (
                <>
                  <Col xs={12} md={4}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Price</Text>
                    <Text strong>₹{unitPrice.toFixed(2)}</Text>
                  </Col>
                  {discountPercent > 0 && (
                    <Col xs={12} md={3}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Discount</Text>
                      <Text>{discountPercent}%</Text>
                    </Col>
                  )}
                  <Col xs={10} md={3}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Qty</Text>
                    <InputNumber min={1} value={addQty} onChange={setAddQty} style={{ width: '100%' }} />
                  </Col>
                  <Col xs={14} md={4}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Line total</Text>
                    <Text strong>₹{addLineTotal.toFixed(2)}</Text>
                  </Col>
                  <Col xs={24} md={4}>
                    <div style={{ marginTop: 22 }}>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLine} block style={{ borderRadius: 8 }}>
                        Add
                      </Button>
                    </div>
                  </Col>
                </>
              )}
              {!selectedProduct && (
                <Col>
                  <Button type="primary" icon={<PlusOutlined />} disabled style={{ borderRadius: 8 }}>Add</Button>
                </Col>
              )}
            </Row>
          </div>
        </Col>
        <Col xs={24} lg={10}>
          {summaryCard}
        </Col>
      </Row>

      <div className="app-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, fontWeight: 600 }}>Your lines</Title>
          <Button type="text" icon={<ReloadOutlined />} onClick={fetchDraft} loading={loading}>
            Refresh
          </Button>
        </div>
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingOutlined />}
            title="No lines yet"
            description="Select a product above and add to your requisition."
          />
        ) : (
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            pagination={false}
            loading={loading}
            onRow={() => ({ style: { cursor: 'default' } })}
          />
        )}
      </div>
    </>
  );
};

export default OrderManagement;
