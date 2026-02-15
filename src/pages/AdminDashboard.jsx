import React, { useState, useEffect } from 'react';
import {
    Tabs, Table, Tag, Button, Typography, Card, Row, Col,
    message, Space, Select, Modal, Form,
    Input, InputNumber, Divider, Avatar, Descriptions,
    Badge, Tooltip, Popconfirm, Upload, DatePicker
} from 'antd';
import {
    DashboardOutlined,
    MedicineBoxOutlined,
    OrderedListOutlined,
    AlertOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    ShopOutlined,
    TagsOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    FilePdfOutlined,
    ArrowUpOutlined,
    CloudUploadOutlined,
    UploadOutlined,
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined
} from '@ant-design/icons';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import api from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const getImageUrl = (product) => {
    const path = product.image_url || product.image;
    if (!path) return `https://images.unsplash.com/photo-1583912267550-d44d7a12517a?auto=format&fit=crop&q=80&w=100`;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/media/')) return path;
    return path.startsWith('/') ? `/media${path}` : `/media/${path}`;
};

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ revenue: 0, receivables: 0, balance: 0, activeOrders: 0, lowStock: 0 });

    // Modals visibility
    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isPharmacyModalVisible, setIsPharmacyModalVisible] = useState(false);
    const [isOrderViewVisible, setIsOrderViewVisible] = useState(false);
    const [isInvoiceConfigVisible, setIsInvoiceConfigVisible] = useState(false);
    const [isStoreViewVisible, setIsStoreViewVisible] = useState(false);

    // Editing state
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedStore, setSelectedStore] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [reportData, setReportData] = useState(null);

    // Forms
    const [productForm] = Form.useForm();
    const [categoryForm] = Form.useForm();
    const [pharmacyForm] = Form.useForm();
    const [invoiceForm] = Form.useForm();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [ordersRes, invRes, catRes, userRes] = await Promise.all([
                api.get('/orders/'),
                api.get('/products/'),
                api.get('/products/categories/'),
                api.get('/accounts/users/')
            ]);

            const allOrders = ordersRes.data.results || ordersRes.data;
            const allProducts = invRes.data.results || invRes.data;
            setOrders(Array.isArray(allOrders) ? allOrders : []);
            setInventory(Array.isArray(allProducts) ? allProducts : []);
            setCategories(catRes.data.results || catRes.data);

            const users = userRes.data.results || userRes.data;
            setPharmacies(users.filter(u => u.role === 'pharmacy'));

            // Fetch Report Summary
            const reportRes = await api.get('/orders/summary/');
            setReportData(reportRes.data);

            setStats({
                revenue: allOrders.filter(o => o.status !== 'rejected').reduce((acc, o) => acc + parseFloat(o.total_amount), 0),
                receivables: allOrders.filter(o => o.status !== 'rejected').reduce((acc, o) => acc + parseFloat(o.paid_amount), 0),
                balance: allOrders.filter(o => o.status !== 'rejected').reduce((acc, o) => acc + parseFloat(o.balance_amount), 0),
                activeOrders: allOrders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length,
                lowStock: allProducts.filter(p => p.stock_quantity < 10).length
            });
        } catch (err) {
            message.error("Sync failed");
        } finally {
            setLoading(false);
        }
    };

    // Product CRUD
    const handleProductSubmit = async (values) => {
        try {
            const formData = new FormData();
            Object.keys(values).forEach(key => {
                if (key === 'image') {
                    const fileObj = values[key]?.originFileObj || values[key];
                    if (fileObj instanceof File) {
                        formData.append('image', fileObj);
                    }
                } else if (values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            });

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success("Product updated");
            } else {
                await api.post('/products/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success("Product added");
            }
            setIsProductModalVisible(false);
            productForm.resetFields();
            fetchAllData();
        } catch (err) {
            message.error("Failed to save product");
        }
    };

    const deleteProduct = async (id) => {
        try {
            await api.delete(`/products/${id}/`);
            message.success("Product deleted");
            fetchAllData();
        } catch (err) {
            message.error("Failed to delete product");
        }
    };

    // Category CRUD
    const handleCategorySubmit = async (values) => {
        try {
            if (editingCategory) {
                await api.put(`/products/categories/${editingCategory.id}/`, values);
                message.success("Category updated");
            } else {
                await api.post('/products/categories/', values);
                message.success("Category added");
            }
            setIsCategoryModalVisible(false);
            categoryForm.resetFields();
            fetchAllData();
        } catch (err) {
            message.error("Failed to save category");
        }
    };

    const deleteCategory = async (id) => {
        try {
            await api.delete(`/products/categories/${id}/`);
            message.success("Category deleted");
            fetchAllData();
        } catch (err) {
            message.error("Failed to delete category");
        }
    };

    // Pharmacy/User CRUD
    const handlePharmacySubmit = async (values) => {
        try {
            await api.post('/accounts/users/', { ...values, role: 'pharmacy' });
            message.success("Pharmacy onboarded successfully");
            setIsPharmacyModalVisible(false);
            pharmacyForm.resetFields();
            fetchAllData();
        } catch (err) {
            message.error("Failed to onboard pharmacy");
        }
    };

    const approveOrder = async (id) => {
        try {
            await api.put(`/orders/${id}/approve/`);
            message.success("Order approved");
            fetchAllData();
        } catch (err) {
            message.error("Approval failed");
        }
    };

    const updateOrderStatus = async (id, status) => {
        try {
            await api.put(`/orders/${id}/update_status/`, { status });
            message.success(`Status updated to ${status.toUpperCase()}`);
            fetchAllData();
            // Also update selectedOrder if it's the one being modified
            if (selectedOrder && selectedOrder.id === id) {
                setSelectedOrder({ ...selectedOrder, status });
            }
        } catch (err) {
            message.error("Status update failed");
        }
    };

    const handleRecordPayment = async () => {
        if (paymentAmount <= 0) {
            message.warning("Invalid payment amount");
            return;
        }
        try {
            const res = await api.put(`/orders/${selectedOrder.id}/record_payment/`, { amount: paymentAmount });
            message.success("Payment recorded successfully");
            setPaymentAmount(0);
            fetchAllData();
            // Refresh selected order
            const updatedOrder = {
                ...selectedOrder,
                paid_amount: res.data.paid_amount,
                payment_status: res.data.payment_status,
                balance_amount: selectedOrder.total_amount - res.data.paid_amount
            };
            setSelectedOrder(updatedOrder);
        } catch (err) {
            message.error("Failed to record payment");
        }
    };

    const generateInvoice = async (values) => {
        try {
            // Logic to update delivery info then download
            await api.put(`/orders/${selectedOrder.id}/`, values);
            const res = await api.get(`/invoices/`, { params: { order: selectedOrder.id } });
            const invoices = res.data.results || res.data;
            if (invoices.length > 0) {
                const pdfRes = await api.get(`/invoices/${invoices[0].id}/download/`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `invoice_${selectedOrder.order_number}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                setIsInvoiceConfigVisible(false);
            }
        } catch (err) {
            message.error("Failed to generate bill");
        }
    };

    const renderStatCard = (title, value, icon, color) => (
        <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    boxShadow: `0 8px 16px ${color}40`
                }}>
                    {icon}
                </div>
            </div>
            <Text type="secondary" strong style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</Text>
            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', letterSpacing: '-1px' }}>{value}</div>
        </div>
    );

    const orderColumns = [
        { title: 'ORDER #', dataIndex: 'order_number', render: (t) => <Text strong>{t}</Text> },
        { title: 'PHARMACY', dataIndex: 'pharmacy_name' },
        { title: 'AMOUNT', dataIndex: 'total_amount', render: (v) => <Text strong>₹{v}</Text> },
        { title: 'STATUS', dataIndex: 'status', render: (s) => <Tag color={s === 'pending' ? 'orange' : 'blue'}>{s.toUpperCase()}</Tag> },
        {
            title: 'PAYMENT',
            dataIndex: 'payment_status',
            render: (s, record) => (
                <Space direction="vertical" size={0}>
                    <Tag color={s === 'paid' ? 'success' : s === 'partial' ? 'warning' : 'error'}>{s.toUpperCase()}</Tag>
                    {s !== 'paid' && <Text type="secondary" style={{ fontSize: '10px' }}>Bal: ₹{record.balance_amount}</Text>}
                </Space>
            )
        },
        {
            title: 'ACTIONS',
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setIsOrderViewVisible(true); }} />
                    {record.status === 'pending' ? (
                        <Button type="primary" size="small" onClick={() => approveOrder(record.id)}>Approve</Button>
                    ) : (
                        <Button type="primary" ghost size="small" icon={<FilePdfOutlined />} onClick={() => { setSelectedOrder(record); setIsInvoiceConfigVisible(true); }}>Bill</Button>
                    )}
                </Space>
            )
        }
    ];

    const inventoryColumns = [
        {
            title: 'PRODUCT',
            render: (_, record) => (
                <Space>
                    <Avatar
                        shape="square"
                        src={getImageUrl(record)}
                        onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1583912267550-d44d7a12517a?auto=format&fit=crop&q=80&w=100';
                            return true;
                        }}
                    />
                    <Text strong>{record.name}</Text>
                </Space>
            )
        },
        { title: 'CATEGORY', dataIndex: 'category_name' },
        {
            title: 'STATUS',
            dataIndex: 'is_active',
            render: (active, record) => (
                <Tag
                    color={active ? 'success' : 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={async () => {
                        try {
                            await api.patch(`/products/${record.id}/`, { is_active: !active });
                            message.success(`Product ${!active ? 'activated' : 'deactivated'}`);
                            fetchAllData();
                        } catch (err) {
                            message.error("Status update failed");
                        }
                    }}
                >
                    {active ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
            )
        },
        { title: 'STOCK', dataIndex: 'stock_quantity', render: (v) => <Badge status={v < 10 ? 'error' : 'success'} text={`${v} Units`} /> },
        { title: 'PRICE', dataIndex: 'selling_price', render: (v) => `₹${v}` },
        {
            title: 'ACTIONS',
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => {
                        setEditingProduct(record);
                        productForm.setFieldsValue(record);
                        setIsProductModalVisible(true);
                    }} />
                    <Popconfirm title="Delete product?" onConfirm={() => deleteProduct(record.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const deletePharmacy = async (id) => {
        try {
            await api.delete(`/accounts/users/${id}/`);
            message.success("Pharmacy removed");
            fetchAllData();
        } catch (err) {
            message.error("Failed to remove pharmacy");
        }
    };

    const pharmacyColumns = [
        {
            title: 'STORE NAME',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<ShopOutlined />} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }} />
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.pharmacy?.pharmacy_name || record.username}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                    </Space>
                </Space>
            )
        },
        { title: 'DL NUMBER', render: (_, record) => record.pharmacy?.license_number || 'N/A' },
        { title: 'CONTACT', render: (_, record) => record.pharmacy?.phone || 'N/A' },
        {
            title: 'ACTIONS',
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => { setSelectedStore(record); setIsStoreViewVisible(true); }} />
                    <Button type="text" icon={<EditOutlined />} onClick={() => {
                        setEditingProduct(null); // Clear other edit state
                        pharmacyForm.setFieldsValue({
                            username: record.username,
                            email: record.email,
                            pharmacy_name: record.pharmacy?.pharmacy_name,
                            license_number: record.pharmacy?.license_number
                        });
                        setIsPharmacyModalVisible(true);
                    }} />
                    <Popconfirm title="Remove partner?" onConfirm={() => deletePharmacy(record.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="glass-appear">
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>Admin Command Center</Title>
                    <Text type="secondary">Centralized oversight for medical distribution and inventory</Text>
                </div>
                <Space>
                    <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => {
                        setEditingProduct(null);
                        productForm.resetFields();
                        setIsProductModalVisible(true);
                    }} style={{ height: '50px', padding: '0 28px' }}>
                        Add Product
                    </Button>
                </Space>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Total Sales', `₹${stats.revenue.toFixed(0)}`, <ArrowUpOutlined />, '#3b82f6')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Collections', `₹${stats.receivables.toFixed(0)}`, <CheckCircleOutlined />, '#10b981')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Outstanding', `₹${stats.balance.toFixed(0)}`, <AlertOutlined />, '#ef4444')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Active Orders', stats.activeOrders, <OrderedListOutlined />, '#8b5cf6')}</Col>
            </Row>

            <div className="glass-card" style={{ padding: '12px' }}>
                <Tabs
                    defaultActiveKey="1"
                    size="large"
                    items={[
                        {
                            key: '1',
                            label: <Space><OrderedListOutlined />Order Pipeline</Space>,
                            children: <Table className="glass-table" columns={orderColumns} dataSource={orders} loading={loading} rowKey="id" pagination={{ pageSize: 6 }} />
                        },
                        {
                            key: '2',
                            label: <Space><MedicineBoxOutlined />Inventory</Space>,
                            children: (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                        <Button type="primary" ghost icon={<CloudUploadOutlined />}>Bulk Import</Button>
                                    </div>
                                    <Table className="glass-table" columns={inventoryColumns} dataSource={inventory} loading={loading} rowKey="id" />
                                </>
                            )
                        },
                        {
                            key: '3',
                            label: <Space><ShopOutlined />Pharmacies</Space>,
                            children: (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                        <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setIsPharmacyModalVisible(true)}>Onboard Partner</Button>
                                    </div>
                                    <Table className="glass-table" columns={pharmacyColumns} dataSource={pharmacies} loading={loading} rowKey="id" />
                                </>
                            )
                        },
                        {
                            key: '4',
                            label: <Space><TagsOutlined />Categories</Space>,
                            children: (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                        <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setIsCategoryModalVisible(true)}>New Category</Button>
                                    </div>
                                    <Table className="glass-table" columns={[{ title: 'Name', dataIndex: 'name' }, {
                                        title: 'Actions', align: 'right', render: (_, r) => (
                                            <Popconfirm title="Delete category?" onConfirm={() => deleteCategory(r.id)}>
                                                <Button type="text" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        )
                                    }]} dataSource={categories} loading={loading} rowKey="id" />
                                </>
                            )
                        },
                    ]}
                />
            </div>

            {/* Order View Modal */}
            <Modal
                title={<Title level={4}>Order Details: {selectedOrder?.order_number}</Title>}
                open={isOrderViewVisible}
                onCancel={() => setIsOrderViewVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsOrderViewVisible(false)}>Close</Button>,
                    selectedOrder?.status === 'pending' && (
                        <Button key="approve" type="primary" onClick={() => { approveOrder(selectedOrder.id); setIsOrderViewVisible(false); }}>Approve Order</Button>
                    )
                ]}
                width={800}
                centered
            >
                {selectedOrder && (
                    <div style={{ padding: '20px' }}>
                        <Descriptions title="Pharmacy Information" bordered column={2} size="small" style={{ marginBottom: '24px' }}>
                            <Descriptions.Item label="Store Name">{selectedOrder.pharmacy_name}</Descriptions.Item>
                            <Descriptions.Item label="Contact">{selectedOrder.pharmacy_details?.phone || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Email" span={2}>{selectedOrder.pharmacy_details?.email || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="DL Number">{selectedOrder.pharmacy_details?.license_number || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Address">{selectedOrder.pharmacy_details?.address || 'N/A'}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="Order Information" bordered column={2} size="small" style={{ marginBottom: '24px' }}>
                            <Descriptions.Item label="Status">
                                <Select
                                    value={selectedOrder.status}
                                    style={{ width: 140 }}
                                    onChange={(val) => updateOrderStatus(selectedOrder.id, val)}
                                >
                                    <Option value="pending">PENDING</Option>
                                    <Option value="approved">APPROVED</Option>
                                    <Option value="processing">PROCESSING</Option>
                                    <Option value="shipped">SHIPPED</Option>
                                    <Option value="delivered">DELIVERED</Option>
                                    <Option value="rejected">REJECTED</Option>
                                </Select>
                            </Descriptions.Item>
                            <Descriptions.Item label="Total Amount">₹{selectedOrder.total_amount}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                            <Row gutter={24} align="middle">
                                <Col span={10}>
                                    <Space direction="vertical" size={4}>
                                        <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Financial Summary</Text>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '11px' }}>Paid</Text>
                                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>₹{selectedOrder.paid_amount}</div>
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '11px' }}>Balance</Text>
                                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>₹{selectedOrder.balance_amount}</div>
                                            </div>
                                        </div>
                                    </Space>
                                </Col>
                                <Col span={14}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>Record Payment (₹)</Text>
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                max={selectedOrder.balance_amount}
                                                value={paymentAmount}
                                                onChange={setPaymentAmount}
                                                placeholder="Amount"
                                            />
                                        </div>
                                        <Button
                                            type="primary"
                                            onClick={handleRecordPayment}
                                            disabled={paymentAmount <= 0}
                                        >
                                            Record
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <Title level={5} style={{ marginBottom: '16px' }}>Order Items</Title>
                        <Table
                            dataSource={selectedOrder.items}
                            pagination={false}
                            rowKey="id"
                            size="small"
                            columns={[
                                { title: 'Product', dataIndex: ['product_details', 'name'] },
                                { title: 'Rate', dataIndex: 'unit_price', render: (v) => `₹${v}` },
                                { title: 'Qty', dataIndex: 'quantity' },
                                { title: 'Free', dataIndex: 'free_qty' },
                                { title: 'Total', dataIndex: 'total_price', render: (v) => <Text strong>₹{v}</Text> }
                            ]}
                        />
                    </div>
                )}
            </Modal>

            {/* Store Detail Modal */}
            <Modal
                title={<Title level={4}>Store Performance: {selectedStore?.pharmacy?.pharmacy_name || selectedStore?.username}</Title>}
                open={isStoreViewVisible}
                onCancel={() => setIsStoreViewVisible(false)}
                footer={[<Button key="close" onClick={() => setIsStoreViewVisible(false)}>Close</Button>]}
                width={1000}
                centered
            >
                {selectedStore && (
                    <div style={{ padding: '20px' }}>
                        <Row gutter={24} style={{ marginBottom: '32px' }}>
                            <Col span={12}>
                                <Descriptions title="Facility Details" bordered column={1} size="small">
                                    <Descriptions.Item label="Contact Name">{selectedStore.pharmacy?.contact_person || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Phone">{selectedStore.pharmacy?.phone || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="DL Number">{selectedStore.pharmacy?.license_number || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Address">{selectedStore.pharmacy?.address || 'N/A'}</Descriptions.Item>
                                </Descriptions>
                            </Col>
                            <Col span={12}>
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Card size="small" style={{ background: '#f0f9ff', border: 'none' }}>
                                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Total Buy</Text>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0369a1' }}>
                                                ₹{orders.filter(o => o.pharmacy === selectedStore.pharmacy?.id).reduce((a, b) => a + parseFloat(b.total_amount), 0).toFixed(0)}
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card size="small" style={{ background: '#fff1f2', border: 'none' }}>
                                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Total Balance</Text>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#be123c' }}>
                                                ₹{orders.filter(o => o.pharmacy === selectedStore.pharmacy?.id).reduce((a, b) => a + parseFloat(b.balance_amount), 0).toFixed(0)}
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={24}>
                                        <Card size="small" style={{ background: '#f0fdf4', border: 'none' }}>
                                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Loyalty Status</Text>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Badge status="processing" color="#22c55e" />
                                                <Text strong style={{ color: '#15803d' }}>ACTIVE PARTNER</Text>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        <Divider orientation="left">Order History</Divider>
                        <Table
                            size="small"
                            columns={[
                                { title: 'Order #', dataIndex: 'order_number' },
                                { title: 'Date', dataIndex: 'created_at', render: d => dayjs(d).format('DD MMM YYYY') },
                                { title: 'Total', dataIndex: 'total_amount', render: v => `₹${v}` },
                                { title: 'Paid', dataIndex: 'paid_amount', render: v => `₹${v}` },
                                { title: 'Status', dataIndex: 'status', render: s => <Tag color="blue">{s.toUpperCase()}</Tag> },
                                { title: 'Payment', dataIndex: 'payment_status', render: s => <Tag color={s === 'paid' ? 'success' : 'warning'}>{s.toUpperCase()}</Tag> },
                            ]}
                            dataSource={orders.filter(o => o.pharmacy === selectedStore.pharmacy?.id)}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                        />
                    </div>
                )}
            </Modal>

            {/* Product Modal */}
            <Modal
                title={editingProduct ? "Edit Surgical Product" : "New Surgical Product"}
                open={isProductModalVisible}
                onCancel={() => setIsProductModalVisible(false)}
                onOk={() => productForm.submit()}
                width={700}
                centered
            >
                <Form form={productForm} layout="vertical" onFinish={handleProductSubmit}>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item name="name" label="Product Name" rules={[{ required: true }]}><Input placeholder="e.g. Surgical Gloves" /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                                <Select placeholder="Select type">
                                    {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="mrp" label="MRP (₹)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="selling_price" label="Selling (₹)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="stock_quantity" label="Stock" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Notes / Description">
                        <Input.TextArea placeholder="Surgical grade specifications..." rows={2} />
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label="Product Image"
                        valuePropName="file"
                        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList[0])}
                    >
                        <Upload name="image" listType="picture" maxCount={1} beforeUpload={() => false}>
                            <Button icon={<UploadOutlined />}>Click to Upload Image</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Onboard Pharmacy Modal */}
            <Modal
                title="Onboard Partner Pharmacy"
                open={isPharmacyModalVisible}
                onCancel={() => setIsPharmacyModalVisible(false)}
                onOk={() => pharmacyForm.submit()}
                centered
            >
                <Form form={pharmacyForm} layout="vertical" onFinish={handlePharmacySubmit}>
                    <Form.Item
                        name="email"
                        label="Account Email (used for login)"
                        rules={[{ required: true, type: 'email' }]}
                    >
                        <Input placeholder="pharmacy@example.com" />
                    </Form.Item>
                    <Form.Item name="password" label="Temporary Password" rules={[{ required: true }]}><Input.Password /></Form.Item>
                    <Divider>Store Details</Divider>
                    <Form.Item name="pharmacy_name" label="Pharmacy Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="license_number" label="DL Number" rules={[{ required: true }]}><Input /></Form.Item>
                </Form>
            </Modal>

            {/* Category Modal */}
            <Modal
                title="New Product Category"
                open={isCategoryModalVisible}
                onCancel={() => setIsCategoryModalVisible(false)}
                onOk={() => categoryForm.submit()}
                centered
            >
                <Form form={categoryForm} layout="vertical" onFinish={handleCategorySubmit}>
                    <Form.Item name="name" label="Category Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea /></Form.Item>
                </Form>
            </Modal>

            {/* Invoice Bill Modal */}
            <Modal title="Configure Sales Bill" open={isInvoiceConfigVisible} onCancel={() => setIsInvoiceConfigVisible(false)} onOk={() => invoiceForm.submit()} centered>
                <Form form={invoiceForm} layout="vertical" onFinish={generateInvoice}>
                    <Form.Item name="salesman_name" label="Assigned Salesperson" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="delivery_type" label="Logistics Method" initialValue="DIRECT">
                        <Select>
                            <Option value="DIRECT">DIRECT</Option>
                            <Option value="COURIER">COURIER</Option>
                            <Option value="PICKUP">PICKUP</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
