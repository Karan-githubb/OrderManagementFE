import React, { useState, useEffect } from 'react';
import {
    Tabs, Table, Tag, Button, Typography, Card, Row, Col,
    message, Space, Select, Modal, Form,
    Input, InputNumber, Divider, Avatar, Descriptions,
    Badge, Tooltip, Popconfirm, Upload, DatePicker, Empty
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
    PieChartOutlined,
    HistoryOutlined,
    WarningOutlined,
    DollarOutlined
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

    const [requirements, setRequirements] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [isPurchaseModalVisible, setIsPurchaseModalVisible] = useState(false);

    // Forms
    const [productForm] = Form.useForm();
    const [categoryForm] = Form.useForm();
    const [pharmacyForm] = Form.useForm();
    const [purchaseForm] = Form.useForm();
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
        fetchRequirements();
        fetchPurchases();
    };

    const fetchRequirements = async () => {
        try {
            const res = await api.get('/orders/stock_requirements/');
            setRequirements(res.data);
        } catch (err) {
            console.error("Failed to fetch requirements");
        }
    };

    const fetchPurchases = async () => {
        try {
            const res = await api.get('/products/purchases/');
            setPurchases(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch purchases");
        }
    };

    const handlePurchaseSubmit = async (values) => {
        try {
            // Transform items to backend format
            const purchaseData = {
                supplier_name: values.supplier_name,
                total_amount: values.total_amount,
                notes: values.notes,
                items: values.items.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            };
            await api.post('/products/purchases/', purchaseData);
            message.success("Purchase recorded and stock updated");
            setIsPurchaseModalVisible(false);
            purchaseForm.resetFields();
            fetchAllData();
        } catch (err) {
            message.error("Failed to record purchase");
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
        <div className="glass-card" style={{
            padding: '24px',
            flex: 1,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                background: `${color}15`,
                filter: 'blur(50px)',
                borderRadius: '50%'
            }} />
            <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: `${color}`, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                marginBottom: '20px',
                boxShadow: `0 8px 16px ${color}40`,
                position: 'relative',
                zIndex: 1
            }}>
                {icon}
            </div>
            <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px', position: 'relative', zIndex: 1 }}>{title}</Text>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', position: 'relative', zIndex: 1 }}>{value}</div>
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
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>Admin Command Center</Title>
                    <Text type="secondary">Centralized oversight for medical distribution and inventory</Text>
                </div>
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingProduct(null);
                        productForm.resetFields();
                        setIsProductModalVisible(true);
                    }}
                    style={{ height: '50px', borderRadius: '12px', fontWeight: 600 }}
                    block={window.innerWidth < 576}
                >
                    Add Product
                </Button>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Total Sales', `₹${stats.revenue.toFixed(0)}`, <ArrowUpOutlined />, '#3b82f6')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Collections', `₹${stats.receivables.toFixed(0)}`, <CheckCircleOutlined />, '#10b981')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Outstanding', `₹${stats.balance.toFixed(0)}`, <AlertOutlined />, '#ef4444')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Active Orders', stats.activeOrders, <OrderedListOutlined />, '#8b5cf6')}</Col>
            </Row>

            <div className="glass-card" style={{ padding: '8px 12px' }}>
                <Tabs
                    defaultActiveKey="1"
                    size="large"
                    items={[
                        {
                            key: '1',
                            label: <Space><OrderedListOutlined />Orders</Space>,
                            children: <Table className="glass-table" columns={orderColumns} dataSource={orders} loading={loading} rowKey="id" pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }} scroll={{ x: 'max-content' }} />
                        },
                        {
                            key: '2',
                            label: <Space><MedicineBoxOutlined />Inventory</Space>,
                            children: (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                        <Button type="primary" ghost icon={<CloudUploadOutlined />}>Bulk Import</Button>
                                    </div>
                                    <Table className="glass-table" columns={inventoryColumns} dataSource={inventory} loading={loading} rowKey="id" pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }} scroll={{ x: 'max-content' }} />
                                </>
                            )
                        },
                        {
                            key: '3',
                            label: <Space><ShopOutlined />Partners</Space>,
                            children: (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                        <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setIsPharmacyModalVisible(true)}>Onboard Partner</Button>
                                    </div>
                                    <Table className="glass-table" columns={pharmacyColumns} dataSource={pharmacies} loading={loading} rowKey="id" pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }} scroll={{ x: 'max-content' }} />
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
                                    <Table className="glass-table" scroll={{ x: 'max-content' }} columns={[{ title: 'Name', dataIndex: 'name' }, {
                                        title: 'Actions', align: 'right', render: (_, r) => (
                                            <Popconfirm title="Delete category?" onConfirm={() => deleteCategory(r.id)}>
                                                <Button type="text" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        )
                                    }]} dataSource={categories} loading={loading} rowKey="id" pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }} />
                                </>
                            )
                        },
                        {
                            key: '5',
                            label: <Space><WarningOutlined />Stock Requirements</Space>,
                            children: (
                                <>
                                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary">Based on active orders (Pending, Approved, Processing, Shipped)</Text>
                                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsPurchaseModalVisible(true)}>Record Purchase</Button>
                                    </div>
                                    {requirements.length === 0 ? (
                                        <Empty description="No stock requirements at the moment" />
                                    ) : (
                                        <Table
                                            className="glass-table"
                                            columns={[
                                                { title: 'PRODUCT', dataIndex: 'name', render: (t) => <Text strong>{t}</Text> },
                                                {
                                                    title: 'IN HAND',
                                                    dataIndex: 'in_hand',
                                                    render: (v) => <Badge status={v < 0 ? 'error' : v < 10 ? 'warning' : 'success'} text={`${v} Units`} />
                                                },
                                                { title: 'REQUIRED', dataIndex: 'required', render: (v) => <Text>{v} Units</Text> },
                                                {
                                                    title: 'SHORTFALL',
                                                    dataIndex: 'shortfall',
                                                    render: (v) => v > 0 ? <Tag color="error">{v} Units</Tag> : <Tag color="success">Sufficient</Tag>
                                                },
                                                {
                                                    title: 'TO PURCHASE',
                                                    dataIndex: 'to_purchase',
                                                    render: (v) => v > 0 ? <Text strong style={{ color: '#ef4444' }}>{v} Units</Text> : <Text type="secondary">-</Text>
                                                }
                                            ]}
                                            dataSource={requirements}
                                            rowKey="id"
                                            pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
                                            scroll={{ x: 'max-content' }}
                                        />
                                    )}
                                </>
                            )
                        },
                        {
                            key: '6',
                            label: <Space><HistoryOutlined />Purchase History</Space>,
                            children: (
                                <>
                                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setIsPurchaseModalVisible(true)}>New Purchase Entry</Button>
                                    </div>
                                    <Table
                                        className="glass-table"
                                        columns={[
                                            { title: 'DATE', dataIndex: 'purchase_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
                                            { title: 'SUPPLIER', dataIndex: 'supplier_name', render: (t) => <Text strong>{t}</Text> },
                                            { title: 'AMOUNT', dataIndex: 'total_amount', render: (v) => `₹${parseFloat(v).toFixed(2)}` },
                                            {
                                                title: 'PAYMENT',
                                                dataIndex: 'is_paid',
                                                render: (paid) => <Tag color={paid ? 'success' : 'warning'}>{paid ? 'PAID' : 'PENDING'}</Tag>
                                            },
                                            { title: 'NOTES', dataIndex: 'notes', render: (t) => <Text type="secondary">{t || '-'}</Text> }
                                        ]}
                                        dataSource={purchases}
                                        rowKey="id"
                                        loading={loading}
                                        pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
                                        scroll={{ x: 'max-content' }}
                                    />
                                </>
                            )
                        }
                    ]}
                />
            </div>

            {/* Order View Modal */}
            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Command: Order #{selectedOrder?.order_number}</Title>}
                open={isOrderViewVisible}
                onCancel={() => setIsOrderViewVisible(false)}
                footer={[
                    <Button key="close" shape="round" onClick={() => setIsOrderViewVisible(false)}>Dismiss</Button>,
                    selectedOrder?.status === 'pending' && (
                        <Button key="approve" type="primary" shape="round" onClick={() => { approveOrder(selectedOrder.id); setIsOrderViewVisible(false); }}>Authorize Shipment</Button>
                    )
                ]}
                width={850}
                centered
                className="glass-modal"
            >
                {selectedOrder && (
                    <div style={{ padding: '24px' }}>
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.05)',
                            padding: '24px',
                            borderRadius: '24px',
                            marginBottom: '24px',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Space size="middle">
                                <Avatar size={54} icon={<ShopOutlined />} style={{ backgroundColor: 'var(--accent-blue)' }} />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>{selectedOrder.pharmacy_name}</Title>
                                    <Text type="secondary">{selectedOrder.pharmacy_details?.phone || 'No Contact Info'}</Text>
                                </div>
                            </Space>
                            <div style={{ textAlign: 'right' }}>
                                <Text type="secondary" style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Current Flow</Text>
                                <Select
                                    value={selectedOrder.status}
                                    style={{ width: 160, marginTop: '4px' }}
                                    onChange={(val) => updateOrderStatus(selectedOrder.id, val)}
                                    className="premium-select"
                                >
                                    <Option value="pending">PENDING</Option>
                                    <Option value="approved">APPROVED</Option>
                                    <Option value="processing">PROCESSING</Option>
                                    <Option value="shipped">SHIPPED</Option>
                                    <Option value="delivered">DELIVERED</Option>
                                    <Option value="rejected">REJECTED</Option>
                                </Select>
                            </div>
                        </div>

                        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                            <Col span={8}>
                                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Net Revenue</Text>
                                    <Text style={{ fontSize: '20px', fontWeight: 800 }}>₹{selectedOrder.total_amount}</Text>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Collections</Text>
                                    <Text style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{selectedOrder.paid_amount}</Text>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Outstanding</Text>
                                    <Text style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>₹{selectedOrder.balance_amount}</Text>
                                </div>
                            </Col>
                        </Row>

                        <div className="info-glass" style={{ marginBottom: '32px' }}>
                            <Title level={5} style={{ fontSize: '14px', marginBottom: '16px' }}>Terminal Payment Processing</Title>
                            <Space align="end">
                                <div style={{ width: '200px' }}>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Enter Settlement Amount</Text>
                                    <InputNumber
                                        style={{ width: '100%', marginTop: '4px' }}
                                        size="large"
                                        min={0}
                                        max={selectedOrder.balance_amount}
                                        value={paymentAmount}
                                        onChange={setPaymentAmount}
                                        prefix="₹"
                                    />
                                </div>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleRecordPayment}
                                    disabled={paymentAmount <= 0}
                                    style={{ borderRadius: '12px' }}
                                >
                                    Record Settlement
                                </Button>
                            </Space>
                        </div>

                        <Title level={5} style={{ fontSize: '14px', marginBottom: '12px' }}>Inventory Items</Title>
                        <Table
                            dataSource={selectedOrder.items}
                            pagination={false}
                            rowKey="id"
                            size="small"
                            className="glass-table"
                            columns={[
                                { title: 'PRODUCT', dataIndex: ['product_details', 'name'] },
                                { title: 'RATE', dataIndex: 'unit_price', render: (v) => `₹${v}` },
                                { title: 'QTY', dataIndex: 'quantity' },
                                { title: 'TOTAL', dataIndex: 'total_price', render: (v) => <Text strong>₹{v}</Text> }
                            ]}
                        />
                    </div>
                )}
            </Modal>

            {/* Store Detail Modal */}
            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Portfolio: {selectedStore?.pharmacy?.pharmacy_name || selectedStore?.username}</Title>}
                open={isStoreViewVisible}
                onCancel={() => setIsStoreViewVisible(false)}
                footer={[<Button key="close" shape="round" onClick={() => setIsStoreViewVisible(false)}>Close Portfolio</Button>]}
                width={1000}
                centered
                className="glass-modal"
            >
                {selectedStore && (
                    <div style={{ padding: '24px' }}>
                        <Row gutter={24}>
                            <Col span={10}>
                                <div className="info-glass" style={{ height: '100%' }}>
                                    <Space size="large" align="start" style={{ marginBottom: '20px' }}>
                                        <Avatar size={64} icon={<ShopOutlined />} style={{ background: 'var(--accent-blue)' }} />
                                        <div>
                                            <Title level={4} style={{ margin: 0 }}>{selectedStore.pharmacy?.pharmacy_name}</Title>
                                            <Tag color="blue">{selectedStore.pharmacy?.license_number || 'DL REG PENDING'}</Tag>
                                        </div>
                                    </Space>

                                    <Divider style={{ margin: '16px 0' }} />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>Primary Liaison</Text>
                                            <div style={{ fontWeight: 600 }}>{selectedStore.pharmacy?.contact_person || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>Contact Terminal</Text>
                                            <div style={{ fontWeight: 600 }}>{selectedStore.pharmacy?.phone || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>Dispatch Address</Text>
                                            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{selectedStore.pharmacy?.address || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col span={14}>
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Card className="glass-card" styles={{ body: { padding: '20px' } }}>
                                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Purchase Volume</Text>
                                            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-blue)', marginTop: '4px' }}>
                                                ₹{orders.filter(o => o.pharmacy === selectedStore.pharmacy?.id).reduce((a, b) => a + parseFloat(b.total_amount), 0).toLocaleString()}
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card className="glass-card" styles={{ body: { padding: '20px' } }}>
                                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Current Exposure</Text>
                                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', marginTop: '4px' }}>
                                                ₹{orders.filter(o => o.pharmacy === selectedStore.pharmacy?.id).reduce((a, b) => a + parseFloat(b.balance_amount), 0).toLocaleString()}
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={24}>
                                        <div className="glass-card" style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <Title level={5} style={{ margin: 0 }}>Recent Activity Ledger</Title>
                                                <Button type="link" size="small">Export History</Button>
                                            </div>
                                            <Table
                                                size="small"
                                                pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                                                className="glass-table"
                                                columns={[
                                                    { title: 'REF', dataIndex: 'order_number' },
                                                    { title: 'DATE', dataIndex: 'created_at', render: d => dayjs(d).format('DD/MM') },
                                                    { title: 'TOTAL', dataIndex: 'total_amount', render: v => `₹${v}` },
                                                    { title: 'STATUS', dataIndex: 'status', render: s => <Tag color="blue" size="small">{s.toUpperCase()}</Tag> }
                                                ]}
                                                dataSource={orders.filter(o => o.pharmacy === selectedStore.pharmacy?.id)}
                                                rowKey="id"
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
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

            {/* Purchase Entry Modal */}
            <Modal
                title={<Title level={4} style={{ margin: 0 }}><DollarOutlined /> Record Purchase Entry</Title>}
                open={isPurchaseModalVisible}
                onCancel={() => {
                    setIsPurchaseModalVisible(false);
                    purchaseForm.resetFields();
                }}
                onOk={() => purchaseForm.submit()}
                width={900}
                centered
                className="glass-modal"
            >
                <Form form={purchaseForm} layout="vertical" onFinish={handlePurchaseSubmit}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="supplier_name" label="Supplier Name" rules={[{ required: true }]}>
                                <Input placeholder="e.g. MedSupply Co." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="total_amount" label="Total Amount (₹)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} placeholder="0.00" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="notes" label="Notes / Reference">
                        <Input.TextArea rows={2} placeholder="Invoice number, PO reference, etc." />
                    </Form.Item>

                    <Divider>Purchase Items</Divider>

                    <Form.List name="items" initialValue={[{}]}>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{
                                        background: 'rgba(99, 102, 241, 0.03)',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        marginBottom: '12px',
                                        border: '1px solid rgba(99, 102, 241, 0.1)'
                                    }}>
                                        <Row gutter={12} align="middle">
                                            <Col span={10}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'product']}
                                                    label="Product"
                                                    rules={[{ required: true, message: 'Select product' }]}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder="Select product"
                                                        optionFilterProp="children"
                                                        filterOption={(input, option) =>
                                                            option.children.toLowerCase().includes(input.toLowerCase())
                                                        }
                                                    >
                                                        {inventory.map(p => (
                                                            <Option key={p.id} value={p.id}>{p.name}</Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'quantity']}
                                                    label="Quantity"
                                                    rules={[{ required: true, message: 'Enter qty' }]}
                                                >
                                                    <InputNumber style={{ width: '100%' }} min={1} placeholder="0" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'unit_price']}
                                                    label="Unit Price (₹)"
                                                    rules={[{ required: true, message: 'Enter price' }]}
                                                >
                                                    <InputNumber style={{ width: '100%' }} min={0} placeholder="0.00" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={3}>
                                                {fields.length > 1 && (
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => remove(name)}
                                                        style={{ marginTop: '30px' }}
                                                    />
                                                )}
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                    style={{ marginTop: '8px' }}
                                >
                                    Add Item
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
