import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Table, Button, Typography, Row, Col,
    message, Space, Select, Modal, Form,
    Input, InputNumber, Divider, Avatar,
    Popconfirm, Upload, DatePicker, Empty, Drawer, Tag, Card, AutoComplete,
    Alert, Tooltip,
} from 'antd';
import api from '../api';
import dayjs from 'dayjs';
import {
    MedicineBoxOutlined,
    OrderedListOutlined,
    AlertOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ShopOutlined,
    TagsOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    FilePdfOutlined,
    ArrowUpOutlined,
    CloudUploadOutlined,
    UploadOutlined,
    HistoryOutlined,
    WarningOutlined,
    DollarOutlined,
    SendOutlined,
    CalendarOutlined,
    InboxOutlined,
    LineChartOutlined,
} from '@ant-design/icons';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';

const { Title, Text } = Typography;
const { Option } = Select;

const ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'rejected', label: 'Rejected' },
];

const getOrderDispatchStatus = (order) => {
    const items = order?.items || [];
    if (items.length === 0) return null;
    const totalRemaining = items.reduce((s, i) => s + (i.remaining_quantity ?? 0), 0);
    const totalOrdered = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
    if (totalRemaining <= 0) return 'dispatched';
    if (totalRemaining < totalOrdered) return 'partial';
    return 'pending';
};
const hasRemainingToDispatch = (order) => (order?.items || []).some((i) => (i.remaining_quantity ?? 0) > 0);

const getImageUrl = (product) => {
    const path = product?.image_url;
    if (!path) return `https://images.unsplash.com/photo-1583912267550-d44d7a12517a?auto=format&fit=crop&q=80&w=100`;
    if (path.startsWith('http')) return path;
    return path.startsWith('/') ? `${path}` : path;
};

const LOW_STOCK_THRESHOLD = 10;
const stockHealth = (qty) => (qty <= 0 ? 'out' : qty < LOW_STOCK_THRESHOLD ? 'low' : 'ok');

const PurchaseItemRow = ({ name, restField, inventory, purchaseForm, fieldsLength, onRemove }) => {
    const items = Form.useWatch('items', purchaseForm) || [];
    const productId = items[name]?.product;
    const existingBatches = useMemo(() => {
        if (!productId) return [];
        const product = inventory.find((p) => p.id === productId);
        return (product?.batches || []).slice().sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
    }, [productId, inventory]);
    const batchOptions = useMemo(() =>
        existingBatches.map((b) => ({
            value: b.batch_number,
            label: `${b.batch_number} (exp: ${dayjs(b.expiry_date).format('DD MMM YYYY')})`,
            expiry_date: b.expiry_date,
        })),
        [existingBatches]
    );
    const handleBatchSelect = (value, option) => {
        if (option?.expiry_date) {
            purchaseForm.setFieldValue(['items', name, 'expiry_date'], dayjs(option.expiry_date));
        }
    };
    const handleProductChange = () => {
        purchaseForm.setFieldValue(['items', name, 'batch_number'], undefined);
        purchaseForm.setFieldValue(['items', name, 'expiry_date'], undefined);
    };
    return (
        <div style={{
            background: 'rgba(99, 102, 241, 0.03)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '12px',
            border: '1px solid rgba(99, 102, 241, 0.1)'
        }}>
            <Row gutter={12} align="middle">
                <Col span={8}>
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
                                (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            onChange={handleProductChange}
                        >
                            {inventory.map((p) => (
                                <Option key={p.id} value={p.id}>{p.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={3}>
                    <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Quantity"
                        rules={[{ required: true, message: 'Enter qty' }]}
                    >
                        <InputNumber style={{ width: '100%' }} min={1} placeholder="0" />
                    </Form.Item>
                </Col>
                <Col span={4}>
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
                    <Form.Item
                        {...restField}
                        name={[name, 'batch_number']}
                        label="Batch"
                        tooltip="Select existing batch (same expiry) or type new. One batch = one expiry per line."
                    >
                        <AutoComplete
                            options={batchOptions}
                            placeholder="Type or select batch"
                            filterOption={(input, option) =>
                                (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            onSelect={handleBatchSelect}
                        />
                    </Form.Item>
                </Col>
                <Col span={3}>
                    <Form.Item
                        {...restField}
                        name={[name, 'expiry_date']}
                        label="Expiry"
                        tooltip="Auto-filled when you select an existing batch; you can edit. One batch, one expiry."
                    >
                        <DatePicker style={{ width: '100%' }} placeholder="Required if batch set" />
                    </Form.Item>
                </Col>
                <Col span={3}>
                    {fieldsLength > 1 && (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={onRemove}
                            style={{ marginTop: '30px' }}
                        />
                    )}
                </Col>
            </Row>
        </div>
    );
};

const EXPIRING_DAYS = 30;
const batchExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'ok';
    const exp = dayjs(expiryDate);
    const today = dayjs().startOf('day');
    if (exp.isBefore(today)) return 'expired';
    if (exp.diff(today, 'day') <= EXPIRING_DAYS) return 'expiring_soon';
    return 'ok';
};

const BATCH_STATUS_BORDER = { ok: '#10b981', expiring_soon: '#f59e0b', expired: '#ef4444' };
const BATCH_PAGE_SIZE = 8;

const BatchListExpanded = ({ record, onWriteOff }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('expiry_asc');
    const [page, setPage] = useState(1);

    const batches = (record.batches || []).slice();
    const withStatus = batches.map((b) => ({ ...b, _status: batchExpiryStatus(b.expiry_date) }));
    const filtered = statusFilter === 'all' ? withStatus : withStatus.filter((b) => b._status === statusFilter);
    const sorted = [...filtered].sort((a, b) => {
        const da = new Date(a.expiry_date);
        const db = new Date(b.expiry_date);
        return sortOrder === 'expiry_asc' ? da - db : db - da;
    });
    const totalQty = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const start = (page - 1) * BATCH_PAGE_SIZE;
    const paged = sorted.slice(start, start + BATCH_PAGE_SIZE);

    const countByStatus = { ok: 0, expiring_soon: 0, expired: 0 };
    withStatus.forEach((b) => { countByStatus[b._status] = (countByStatus[b._status] || 0) + 1; });

    if (batches.length === 0) {
        return <Text type="secondary">No batch details. Stock is added via Purchase approval.</Text>;
    }

    return (
        <div className="batch-list-expanded">
            <div className="batch-list-header">
                <div className="batch-list-title">
                    <InboxOutlined style={{ color: 'var(--color-primary)', marginRight: 8 }} />
                    <span>Batch inventory</span>
                    <Text type="secondary" style={{ marginLeft: 8, fontWeight: 400 }}>{batches.length} batch{batches.length !== 1 ? 'es' : ''} · {totalQty} units</Text>
                </div>
                <Space wrap size="small">
                    {['all', 'ok', 'expiring_soon', 'expired'].map((key) => (
                        <Tag
                            key={key}
                            style={{ marginRight: 0, cursor: 'pointer' }}
                            color={statusFilter === key ? 'blue' : 'default'}
                            onClick={() => { setStatusFilter(key); setPage(1); }}
                        >
                            {key === 'all' ? 'All' : key === 'ok' ? 'OK' : key === 'expiring_soon' ? 'Expiring soon' : 'Expired'}
                            {key !== 'all' && countByStatus[key] != null && ` (${countByStatus[key]})`}
                        </Tag>
                    ))}
                    <Select size="small" value={sortOrder} onChange={(v) => { setSortOrder(v); setPage(1); }} style={{ width: 160 }} options={[
                        { value: 'expiry_asc', label: 'Expiry: soonest first' },
                        { value: 'expiry_desc', label: 'Expiry: latest first' },
                    ]} />
                </Space>
            </div>
            <div className="batch-list-body">
                {paged.map((row) => {
                    const status = row._status;
                    const borderColor = BATCH_STATUS_BORDER[status] || '#e2e8f0';
                    const label = status === 'expired' ? 'Expired' : status === 'expiring_soon' ? 'Expiring soon' : 'OK';
                    const pillClass = status === 'expired' ? 'status-pill--error' : status === 'expiring_soon' ? 'status-pill--warning' : 'status-pill--success';
                    return (
                        <div key={row.id} className="batch-row" style={{ borderLeftColor: borderColor }}>
                            <div className="batch-row-main">
                                <Text strong className="batch-row-id">{row.batch_number}</Text>
                                <Space size="middle" className="batch-row-meta">
                                    <span className="batch-row-expiry"><CalendarOutlined style={{ marginRight: 4, color: 'var(--text-muted)' }} />{dayjs(row.expiry_date).format('DD MMM YYYY')}</span>
                                    <span className="batch-row-qty">{row.quantity ?? 0} units</span>
                                </Space>
                            </div>
                            <div className="batch-row-right">
                                <span className={`status-pill ${pillClass}`}>{label}</span>
                                {status === 'expired' && row.quantity > 0 && (
                                    <Popconfirm title="Write off this expired batch? Stock will be reduced." onConfirm={() => onWriteOff(row.id)}>
                                        <Button type="link" danger size="small">Write off</Button>
                                    </Popconfirm>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {sorted.length > BATCH_PAGE_SIZE && (
                <div className="batch-list-footer">
                    <Text type="secondary">Showing {start + 1}-{Math.min(start + BATCH_PAGE_SIZE, sorted.length)} of {sorted.length}</Text>
                    <Space>
                        <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                        <Button size="small" disabled={page >= Math.ceil(sorted.length / BATCH_PAGE_SIZE)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                    </Space>
                </div>
            )}
        </div>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
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
    const [isStoreViewVisible, setIsStoreViewVisible] = useState(false);
    const [billDetailsOpen, setBillDetailsOpen] = useState(false);

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
    const [batchFilter, setBatchFilter] = useState('all'); // 'all' | 'expired' | 'expiring_soon'
    const [productForBatches, setProductForBatches] = useState(null); // product for right-side batch drawer

    // Orders list filters
    const [orderFilterDateRange, setOrderFilterDateRange] = useState(null);
    const [orderFilterStatus, setOrderFilterStatus] = useState(undefined);
    const [orderFilterOrderId, setOrderFilterOrderId] = useState('');
    const [orderFilterPharmacy, setOrderFilterPharmacy] = useState(undefined);

    // Forms
    const [productForm] = Form.useForm();
    const [categoryForm] = Form.useForm();
    const [pharmacyForm] = Form.useForm();
    const [purchaseForm] = Form.useForm();
    const [invoiceForm] = Form.useForm();
    const [orderEditForm] = Form.useForm();
    const [companyForm] = Form.useForm();
    const [isOrderEditVisible, setIsOrderEditVisible] = useState(false);
    const [companyLoading, setCompanyLoading] = useState(false);
    const orderEditItems = Form.useWatch('items', orderEditForm) || [];

    const orderEditTotal = useMemo(() => {
        if (!Array.isArray(orderEditItems)) return 0;
        return orderEditItems.reduce((sum, i) => {
            const qty = Number(i?.quantity) || 0;
            const rate = Number(i?.unit_price) || 0;
            const disc = Number(i?.discount_amount) || 0;
            return sum + qty * rate - disc;
        }, 0);
    }, [orderEditItems]);

    const location = useLocation();
    const path = location.pathname;
    const section = path === '/admin' ? 'overview' : path.replace(/^\/admin\/?/, '') || 'overview';

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (isOrderViewVisible && selectedOrder) {
            invoiceForm.setFieldsValue({
                salesman_name: selectedOrder.salesman_name || '',
                delivery_type: selectedOrder.delivery_type || 'DIRECT',
                terms: selectedOrder.terms || 'D-CREDIT BILL',
            });
            setBillDetailsOpen(!selectedOrder.salesman_name?.trim?.());
        }
    }, [isOrderViewVisible, selectedOrder]);

    useEffect(() => {
        if (section === 'company') {
            setCompanyLoading(true);
            api.get('/invoices/company/')
                .then((res) => {
                    if (res.data && Object.keys(res.data).length > 0) {
                        companyForm.setFieldsValue(res.data);
                    } else {
                        companyForm.resetFields();
                    }
                })
                .catch(() => companyForm.resetFields())
                .finally(() => setCompanyLoading(false));
        }
    }, [section]);

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

    const purchaseItems = Form.useWatch('items', purchaseForm) || [];
    const purchaseTotalAmount = useMemo(() => {
        return (purchaseItems || []).reduce((sum, it) => {
            const qty = Number(it?.quantity || 0);
            const price = Number(it?.unit_price || 0);
            return sum + qty * price;
        }, 0);
    }, [purchaseItems]);

    const handlePurchaseSubmit = async (values) => {
        const items = values.items || [];
        const totalAmount = items.reduce((sum, it) => sum + (Number(it?.quantity || 0) * Number(it?.unit_price || 0)), 0);
        try {
            const purchaseData = {
                supplier_name: values.supplier_name,
                total_amount: totalAmount,
                notes: values.notes || undefined,
                items: items.map(item => ({
                    product: item.product,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    batch_number: item.batch_number || undefined,
                    expiry_date: item.expiry_date?.format?.('YYYY-MM-DD') ?? item.expiry_date ?? undefined
                }))
            };
            await api.post('/products/purchases/', purchaseData);
            message.success("Purchase recorded. Approve it from Purchase History to add stock.");
            setIsPurchaseModalVisible(false);
            purchaseForm.resetFields();
            fetchPurchases();
            fetchAllData();
        } catch (err) {
            message.error("Failed to record purchase");
        }
    };

    // Product CRUD
    const handleProductSubmit = async (values) => {
        try {
            const payload = { ...values };
            delete payload.image;
            if (editingProduct) {
                if (editingProduct.image_url != null) payload.image_url = editingProduct.image_url;
                await api.put(`/products/${editingProduct.id}/`, payload);
                message.success("Product updated");
            } else {
                await api.post('/products/', payload);
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
            if (selectedOrder && selectedOrder.id === id) {
                setSelectedOrder({ ...selectedOrder, status });
            }
        } catch (err) {
            message.error("Status update failed");
        }
    };

    const voidOrderItem = async (orderId, itemId) => {
        try {
            await api.post(`/orders/${orderId}/items/${itemId}/void/`);
            message.success('Line voided');
            fetchAllData();
            if (selectedOrder && selectedOrder.id === orderId) {
                const res = await api.get(`/orders/${orderId}/`);
                setSelectedOrder(res.data);
            }
        } catch (err) {
            message.error(err.response?.data?.detail || 'Void failed');
        }
    };

    const voidOrder = async () => {
        if (!selectedOrder?.id) return;
        try {
            await api.post(`/orders/${selectedOrder.id}/void/`);
            message.success('Order voided');
            setSelectedOrder(null);
            setIsOrderViewVisible(false);
            fetchAllData();
        } catch (err) {
            message.error(err.response?.data?.detail || 'Void failed');
        }
    };

    const openOrderEdit = () => {
        const nonVoidItems = (selectedOrder?.items || []).filter((i) => !i.is_void);
        orderEditForm.setFieldsValue({
            items: nonVoidItems.length > 0
                ? nonVoidItems.map((i) => {
                    const up = parseFloat(i.unit_price);
                    const product = inventory.find((p) => p.id === i.product);
                    const rate = !Number.isFinite(up) && product ? parseFloat(product.selling_price) : up;
                    return {
                        product: i.product,
                        quantity: i.quantity,
                        unit_price: Number.isFinite(rate) ? rate : '',
                        discount_amount: parseFloat(i.discount_amount || 0),
                    };
                })
                : [{ product: undefined, quantity: 1, unit_price: '', discount_amount: 0 }],
        });
        setIsOrderEditVisible(true);
    };

    const handleOrderEditSubmit = async (values) => {
        if (!selectedOrder?.id) return;
        const items = (values.items || []).filter((i) => i?.product != null && (i?.quantity || 0) > 0);
        if (items.length === 0) {
            message.warning('Add at least one line.');
            return;
        }
        try {
            await api.put(`/orders/${selectedOrder.id}/`, {
                items: items.map((i) => {
                    const product = inventory.find((p) => p.id === i.product);
                    const rate = i.unit_price != null && i.unit_price !== '' ? Number(i.unit_price) : (product ? parseFloat(product.selling_price) : undefined);
                    return {
                        product: i.product,
                        quantity: i.quantity,
                        free_qty: 0,
                        discount_amount: i.discount_amount || 0,
                        unit_price: rate,
                    };
                }),
            });
            message.success('Order updated');
            setIsOrderEditVisible(false);
            const res = await api.get(`/orders/${selectedOrder.id}/`);
            setSelectedOrder(res.data);
            fetchAllData();
        } catch (err) {
            const msg = err.response?.data?.items?.[0] || err.response?.data?.detail || 'Update failed';
            message.error(Array.isArray(msg) ? msg.join(', ') : msg);
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

    const generateInvoice = async (values, billType = 'overall') => {
        if (!selectedOrder?.id) return;
        try {
            await api.put(`/orders/${selectedOrder.id}/`, values);
            const res = await api.get(`/invoices/`, { params: { order: selectedOrder.id } });
            const invoices = res.data.results || res.data;
            if (invoices.length > 0) {
                const pdfRes = await api.get(`/invoices/${invoices[0].id}/download/`, {
                    params: { bill_type: billType },
                    responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
                const link = document.createElement('a');
                link.href = url;
                const suffix = billType === 'dispatch' ? '_dispatch' : '_overall';
                link.setAttribute('download', `invoice_${selectedOrder.order_number}${suffix}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
                const ordRes = await api.get(`/orders/${selectedOrder.id}/`);
                setSelectedOrder(ordRes.data);
                message.success(`Invoice saved. ${billType === 'dispatch' ? 'Dispatch-wise' : 'Overall'} invoice downloaded.`);
            } else {
                message.warning('No invoice found for this order.');
            }
        } catch (err) {
            message.error(err.response?.data?.detail || 'Failed to generate bill');
        }
    };

    const filteredOrders = useMemo(() => {
        let list = orders || [];
        if (orderFilterDateRange?.[0] && orderFilterDateRange?.[1]) {
            const start = orderFilterDateRange[0].startOf('day');
            const end = orderFilterDateRange[1].endOf('day');
            list = list.filter((o) => {
                const d = o.created_at ? dayjs(o.created_at) : null;
                return d && d.isAfter(start) && d.isBefore(end);
            });
        }
        if (orderFilterStatus != null && orderFilterStatus !== '') {
            list = list.filter((o) => o.status === orderFilterStatus);
        }
        if (orderFilterOrderId?.trim()) {
            const q = orderFilterOrderId.trim().toLowerCase();
            list = list.filter((o) => (o.order_number || '').toLowerCase().includes(q));
        }
        if (orderFilterPharmacy != null && orderFilterPharmacy !== '') {
            list = list.filter((o) => o.pharmacy === orderFilterPharmacy || o.pharmacy_name === orderFilterPharmacy);
        }
        return list;
    }, [orders, orderFilterDateRange, orderFilterStatus, orderFilterOrderId, orderFilterPharmacy]);

    const orderPharmaciesOptions = useMemo(() => {
        const seen = new Set();
        const list = [];
        (orders || []).forEach((o) => {
            const id = o.pharmacy;
            const name = o.pharmacy_name;
            if (id != null && name != null && !seen.has(id)) {
                seen.add(id);
                list.push({ value: id, label: name });
            }
        });
        list.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
        return list;
    }, [orders]);

    const renderStatCard = (title, value, icon, color) => (
        <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="stat-label">{title}</div>
            <div className="stat-value">{value}</div>
            <span style={{ fontSize: 20, color, marginTop: 8, opacity: 0.9 }}>{icon}</span>
        </div>
    );

    const orderColumns = [
        { title: 'Order #', dataIndex: 'order_number', render: (t) => <Text strong>{t}</Text> },
        { title: 'Pharmacy', dataIndex: 'pharmacy_name' },
        { title: 'Amount', dataIndex: 'total_amount', render: (v) => <Text strong>₹{v}</Text> },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 150,
            render: (s, record) => {
                if (record.is_void) return <Tag color="default">VOIDED</Tag>;
                return (
                    <span onClick={(e) => e.stopPropagation()}>
                        <Select
                            value={s}
                            size="small"
                            onChange={(val) => updateOrderStatus(record.id, val)}
                            style={{ width: '100%', minWidth: 120, borderRadius: 8 }}
                            options={ORDER_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                        />
                    </span>
                );
            }
        },
        {
            title: 'Dispatch',
            key: 'dispatch_status',
            width: 120,
            render: (_, record) => {
                if (record.is_void || record.status === 'pending' || record.status === 'rejected') return <Text type="secondary">—</Text>;
                const status = getOrderDispatchStatus(record);
                if (status == null) return <Text type="secondary">—</Text>;
                const label = status === 'dispatched' ? 'Dispatched' : status === 'partial' ? 'Partial' : 'Pending';
                const pillClass = status === 'dispatched' ? 'status-pill--success' : status === 'partial' ? 'status-pill--warning' : 'status-pill--pending';
                return <span className={`status-pill ${pillClass}`}>{label}</span>;
            }
        },
        {
            title: 'Payment',
            dataIndex: 'payment_status',
            render: (s, record) => (
                <Space direction="vertical" size={0}>
                    <span className={`status-pill status-pill--${s}`}>{s?.toUpperCase()}</span>
                    {s !== 'paid' && <Text type="secondary" style={{ fontSize: 11 }}>Bal: ₹{record.balance_amount}</Text>}
                </Space>
            )
        },
        {
            title: 'Actions',
            align: 'right',
            width: 270,
            render: (_, record) => {
                const btnStyle = { borderRadius: 8, fontWeight: 500, minWidth: 88 };
                if (record.is_void) {
                    return (
                        <Space size={8} wrap onClick={(e) => e.stopPropagation()}>
                            <Button type="default" size="middle" onClick={() => { setSelectedOrder(record); setIsOrderViewVisible(true); }} style={btnStyle}>View</Button>
                        </Space>
                    );
                }
                const showDispatch = record.status !== 'pending' && record.status !== 'rejected' && hasRemainingToDispatch(record);
                return (
                    <Space size={8} wrap onClick={(e) => e.stopPropagation()}>
                        {showDispatch && (
                            <Button
                                type="default"
                                size="middle"
                                icon={<SendOutlined />}
                                onClick={() => navigate(`/admin/orders/${record.id}/dispatch`)}
                                style={btnStyle}
                            >
                                Dispatch
                            </Button>
                        )}
                        {record.status === 'pending' ? (
                            <Button
                                type="primary"
                                size="middle"
                                onClick={() => approveOrder(record.id)}
                                style={{ ...btnStyle, minWidth: 96 }}
                            >
                                Approve
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                size="middle"
                                icon={<FilePdfOutlined />}
                                onClick={() => { setSelectedOrder(record); setIsOrderViewVisible(true); }}
                                style={btnStyle}
                            >
                                Invoice
                            </Button>
                        )}
                    </Space>
                );
            }
        }
    ];

    const inventoryColumns = [
        {
            title: 'Product',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.name}</Text>
                    {record.description && <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: record.description }}>{record.description}</Text>}
                </Space>
            )
        },
        { title: 'Category', dataIndex: 'category_name', width: 120 },
        {
            title: 'Status',
            dataIndex: 'is_active',
            width: 100,
            render: (active, record) => (
                <Popconfirm
                    title={active ? 'Mark as inactive?' : 'Mark as active?'}
                    description={active ? 'This product will no longer be available for ordering.' : 'This product will be available for ordering.'}
                    onConfirm={async () => {
                        try {
                            await api.patch(`/products/${record.id}/`, { is_active: !active });
                            message.success(active ? 'Deactivated' : 'Activated');
                            fetchAllData();
                        } catch (err) {
                            message.error('Update failed');
                        }
                    }}
                    okText="Yes"
                    cancelText="Cancel"
                >
                    <span
                        className={`status-pill ${active ? 'status-pill--success' : 'status-pill--warning'}`}
                        style={{ cursor: 'pointer' }}
                    >
                        {active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </Popconfirm>
            )
        },
        {
            title: 'Product stock',
            dataIndex: 'stock_quantity',
            width: 160,
            render: (v) => {
                const health = stockHealth(v ?? 0);
                const max = Math.max((v ?? 0) + 20, 100);
                const pct = Math.min(100, ((v ?? 0) / max) * 100);
                return (
                    <Space direction="vertical" size={4} style={{ width: 140 }}>
                        <Space>
                            <span className={`status-pill status-pill--${health === 'ok' ? 'success' : health === 'low' ? 'warning' : 'error'}`}>
                                {health === 'ok' ? 'In stock' : health === 'low' ? 'Low' : 'Out'}
                            </span>
                            <Text strong>{v ?? 0} units</Text>
                        </Space>
                        <div className="stock-bar">
                            <div className={`stock-bar-fill stock-bar-fill--${health}`} style={{ width: `${pct}%` }} />
                        </div>
                    </Space>
                );
            }
        },
        { title: 'MRP', dataIndex: 'mrp', width: 90, render: (v) => v != null ? `₹${Number(v).toFixed(2)}` : '—' },
        { title: 'Price', dataIndex: 'selling_price', width: 90, render: (v) => `₹${v}` },
        { title: 'Pack / Unit', key: 'pack_unit', width: 100, render: (_, r) => (r.pack_size > 1 ? `Pack ${r.pack_size}` : '1') + (r.unit ? ` • ${r.unit}` : '') },
        { title: 'Discount %', dataIndex: 'default_discount_percent', width: 90, render: (v) => (v != null && Number(v) > 0) ? `${v}%` : '—' },
        {
            title: '',
            align: 'right',
            width: 140,
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" icon={<InboxOutlined />} onClick={() => setProductForBatches(record)}>
                        Batches
                    </Button>
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

    const writeOffBatch = async (batchId) => {
        try {
            await api.post(`/products/batches/${batchId}/write-off/`);
            message.success('Batch written off. Stock updated.');
            fetchAllData();
        } catch (e) {
            message.error(e.response?.data?.detail || 'Write-off failed');
        }
    };

    const handleCompanySave = async (values) => {
        try {
            await api.put('/invoices/company/', values);
            message.success('Company profile saved. Bills and reports will use these details.');
        } catch (err) {
            message.error(err.response?.data?.detail || 'Failed to save');
        }
    };

    const downloadOrderBill = async (orderId, billType = 'overall', options = {}) => {
        const { dispatchId = null, dispatchDate = null } = typeof options === 'object' ? options : { dispatchDate: options };
        try {
            const invRes = await api.get('/invoices/', { params: { order: orderId } });
            const invoices = invRes.data.results || invRes.data;
            if (!invoices?.length) {
                message.warning('No invoice found for this order. Use Invoice from orders to generate first.');
                return;
            }
            const params = { bill_type: billType };
            if (billType === 'dispatch' && dispatchId != null) params.dispatch_id = dispatchId;
            else if (billType === 'dispatch' && dispatchDate) params.dispatch_date = dispatchDate;
            const pdfRes = await api.get(`/invoices/${invoices[0].id}/download/`, { params, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
            const link = document.createElement('a');
            link.href = url;
            const suffix = billType === 'dispatch' && dispatchId != null ? `_dispatch_${dispatchId}` : billType === 'dispatch' && dispatchDate ? `_dispatch_${dispatchDate}` : billType === 'dispatch' ? '_dispatch' : '_overall';
            link.setAttribute('download', `invoice_${selectedOrder?.order_number}${suffix}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            message.success('Invoice downloaded');
        } catch (err) {
            message.error(err.response?.data?.detail || 'Download failed');
        }
    };

    const orderDispatchRows = useMemo(() => {
        if (!selectedOrder) return [];
        const dispatches = selectedOrder.dispatches || [];
        const dispatchRows = dispatches.map((d) => ({
            key: `dispatch-${d.id}`,
            label: `Dispatch #${d.id} — ${dayjs(d.dispatched_at).format('DD MMM YYYY HH:mm')}`,
            value: parseFloat(d.total_value || 0),
            dispatchId: d.id,
            dispatchDate: null,
            isOverall: false,
        }));
        const legacyByDate = {};
        (selectedOrder.items || []).forEach((item) => {
            (item.allocations || []).forEach((a) => {
                if (a.dispatch != null) return;
                const dateStr = a.created_at ? dayjs(a.created_at).format('YYYY-MM-DD') : null;
                if (!dateStr) return;
                const val = (a.quantity || 0) * parseFloat(item.unit_price || 0);
                legacyByDate[dateStr] = (legacyByDate[dateStr] || 0) + val;
            });
        });
        const legacyRows = Object.entries(legacyByDate)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, total_value]) => ({
                key: `legacy-${date}`,
                label: `Dispatched on ${dayjs(date).format('DD MMM YYYY')} (legacy)`,
                value: total_value,
                dispatchId: null,
                dispatchDate: date,
                isOverall: false,
            }));
        const totalValue = dispatchRows.reduce((s, r) => s + r.value, 0) + Object.values(legacyByDate).reduce((s, v) => s + v, 0);
        const overallRow = {
            key: 'overall',
            label: dispatches.length > 0 || legacyRows.length > 0 ? 'Invoice (all dispatches)' : 'Overall invoice',
            value: dispatches.length > 0 || legacyRows.length > 0 ? totalValue : parseFloat(selectedOrder?.total_amount || 0),
            dispatchId: null,
            dispatchDate: null,
            isOverall: true,
        };
        return [...dispatchRows, ...legacyRows, overallRow];
    }, [selectedOrder]);

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

    const sectionLabels = {
        'overview': 'Overview',
        'orders': 'Orders',
        'inventory': 'Inventory',
        'batches': 'Batches',
        'partners': 'Partners',
        'categories': 'Categories',
        'stock-requirements': 'Replenishment',
        'purchase-history': 'Purchases',
        'company': 'Company profile',
    };

    const allBatches = useMemo(() => {
        const list = [];
        inventory.forEach((p) => {
            (p.batches || []).forEach((b) => {
                list.push({
                    ...b,
                    product_id: p.id,
                    product_name: p.name,
                    _status: batchExpiryStatus(b.expiry_date),
                });
            });
        });
        return list.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
    }, [inventory]);

    const filteredBatches = useMemo(() => {
        if (batchFilter === 'expired') return allBatches.filter((b) => b._status === 'expired');
        if (batchFilter === 'expiring_soon') return allBatches.filter((b) => b._status === 'expiring_soon');
        return allBatches;
    }, [allBatches, batchFilter]);

    return (
        <>
            <PageHeader
                breadcrumbItems={[
                    { title: 'Admin', link: '/admin' },
                    ...(section !== 'overview' ? [{ title: sectionLabels[section] ?? section, link: null }] : []),
                ]}
                title={section === 'overview' ? 'Command Center' : (sectionLabels[section] ?? section)}
                subtitle={section === 'overview' ? 'Centralized oversight for medical distribution and inventory' : undefined}
            />

            {section === 'overview' && (
                <>
                    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                        <Col xs={24} sm={12} lg={6}>{renderStatCard('Total Sales', `₹${stats.revenue.toFixed(0)}`, <ArrowUpOutlined />, '#3b82f6')}</Col>
                        <Col xs={24} sm={12} lg={6}>{renderStatCard('Collections', `₹${stats.receivables.toFixed(0)}`, <CheckCircleOutlined />, '#10b981')}</Col>
                        <Col xs={24} sm={12} lg={6}>{renderStatCard('Outstanding', `₹${stats.balance.toFixed(0)}`, <AlertOutlined />, '#ef4444')}</Col>
                        <Col xs={24} sm={12} lg={6}>{renderStatCard('Active Orders', stats.activeOrders, <OrderedListOutlined />, '#8b5cf6')}</Col>
                    </Row>

                    {stats.lowStock > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <Card size="small" style={{ borderRadius: 12, borderColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.06)' }}>
                                <Space>
                                    <WarningOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                                    <Text>{stats.lowStock} product{stats.lowStock !== 1 ? 's' : ''} low on stock</Text>
                                    <Button type="link" size="small" onClick={() => navigate('/admin/inventory')} style={{ padding: 0 }}>View inventory</Button>
                                </Space>
                            </Card>
                        </div>
                    )}

                    <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                        <Space wrap size="middle" style={{ width: '100%', marginBottom: 16 }}>
                            <Button type="default" onClick={() => navigate('/admin/orders')} style={{ borderRadius: 8 }} icon={<OrderedListOutlined />}>Orders</Button>
                            <Button type="default" onClick={() => navigate('/payments')} style={{ borderRadius: 8 }} icon={<DollarOutlined />}>Payments</Button>
                            <Button type="default" onClick={() => navigate('/reports')} style={{ borderRadius: 8 }} icon={<LineChartOutlined />}>Reports</Button>
                            <Button type="default" onClick={() => navigate('/admin/inventory')} style={{ borderRadius: 8 }} icon={<MedicineBoxOutlined />}>Inventory</Button>
                        </Space>
                    </Row>

                    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                        <Col xs={24} lg={14}>
                            <Card
                                title={
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <span>Recent orders</span>
                                        <Button type="link" size="small" onClick={() => navigate('/admin/orders')} style={{ padding: 0 }}>View all</Button>
                                    </Space>
                                }
                                size="small"
                                style={{ borderRadius: 12 }}
                            >
                                <Table
                                    dataSource={orders.filter((o) => !o.is_void).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8)}
                                    loading={loading}
                                    rowKey="id"
                                    size="small"
                                    pagination={false}
                                    onRow={(record) => ({ onClick: () => { setSelectedOrder(record); setIsOrderViewVisible(true); }, style: { cursor: 'pointer' } })}
                                    columns={[
                                        { title: 'Order #', dataIndex: 'order_number', width: 120, render: (t) => <Text strong>{t}</Text> },
                                        { title: 'Pharmacy', dataIndex: 'pharmacy_name', ellipsis: true },
                                        { title: 'Amount', dataIndex: 'total_amount', width: 100, render: (v) => `₹${Number(v).toFixed(0)}` },
                                        { title: 'Status', dataIndex: 'status', width: 100, render: (s) => <span className={`status-pill status-pill--${s}`}>{s}</span> },
                                    ]}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} lg={10}>
                            <Card title="Revenue trend (30 days)" size="small" style={{ borderRadius: 12, marginBottom: 24 }}>
                                {(reportData?.trend && reportData.trend.length > 0) ? (
                                    <div style={{ height: 220 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={reportData.trend.map((t) => ({ ...t, date: t.date ? dayjs(t.date).format('DD MMM') : '' }))}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                                                <RechartsTooltip formatter={(v, name) => [`₹${Number(v).toFixed(0)}`, name]} labelFormatter={(l) => l} />
                                                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Sales" />
                                                <Area type="monotone" dataKey="collections" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Collections" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <Text type="secondary">No trend data for the last 30 days.</Text>
                                )}
                            </Card>
                            <Card title="Top partners" size="small" style={{ borderRadius: 12 }}>
                                {(reportData?.top_pharmacies && reportData.top_pharmacies.length > 0) ? (
                                    <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
                                        {(reportData.top_pharmacies.slice(0, 5)).map((p, i) => (
                                            <li key={p.pharmacy || i} style={{ marginBottom: 8 }}>
                                                <Text strong>{p.pharmacy__pharmacy_name || '—'}</Text>
                                                <Text type="secondary"> — ₹{Number(p.total || 0).toLocaleString()} ({p.order_count || 0} orders)</Text>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <Text type="secondary">No partner data yet.</Text>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </>
            )}

            <div className="app-card" style={{ padding: section === 'overview' ? 0 : '16px 0 24px', ...(section !== 'overview' ? { position: 'sticky', top: 72, zIndex: 10 } : {}), marginBottom: 24 }}>
                {section === 'orders' && (
                    <div style={{ padding: '0 24px' }}>
                        <Space wrap size="middle" style={{ marginBottom: 16, alignItems: 'center' }}>
                            <DatePicker.RangePicker
                                value={orderFilterDateRange}
                                onChange={setOrderFilterDateRange}
                                allowClear
                                placeholder={['From', 'To']}
                                style={{ borderRadius: 8 }}
                            />
                            <Select
                                placeholder="Status"
                                allowClear
                                value={orderFilterStatus}
                                onChange={setOrderFilterStatus}
                                style={{ width: 140, borderRadius: 8 }}
                                options={ORDER_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                            />
                            <Input
                                placeholder="Order ID"
                                allowClear
                                value={orderFilterOrderId}
                                onChange={(e) => setOrderFilterOrderId(e.target.value)}
                                style={{ width: 180, borderRadius: 8 }}
                            />
                            <Select
                                placeholder="Pharmacy"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                value={orderFilterPharmacy}
                                onChange={setOrderFilterPharmacy}
                                style={{ width: 200, borderRadius: 8 }}
                                options={orderPharmaciesOptions}
                            />
                            {(orderFilterDateRange || orderFilterStatus != null || orderFilterOrderId?.trim() || orderFilterPharmacy != null) && (
                                <Button type="text" size="small" onClick={() => { setOrderFilterDateRange(null); setOrderFilterStatus(undefined); setOrderFilterOrderId(''); setOrderFilterPharmacy(undefined); }} style={{ borderRadius: 8 }}>
                                    Clear filters
                                </Button>
                            )}
                        </Space>
                        <Table
                            columns={orderColumns}
                            dataSource={filteredOrders}
                            loading={loading}
                            rowKey="id"
                            pagination={{
                                defaultPageSize: 10,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50'],
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
                            }}
                            scroll={{ x: 'max-content' }}
                            onRow={(record) => ({ onClick: () => { setSelectedOrder(record); setIsOrderViewVisible(true); }, style: { cursor: 'pointer' } })}
                        />
                    </div>
                )}
                {section === 'inventory' && (
                    <div style={{ padding: '0 24px', marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                            <Button
                                icon={<PlusOutlined />}
                                onClick={() => { setEditingProduct(null); productForm.resetFields(); setIsProductModalVisible(true); }}
                                className="add-product-btn-white"
                                style={{ borderRadius: 8, background: '#fff', border: 'none', color: '#0f172a', boxShadow: 'none' }}
                            >
                                Add Product
                            </Button>
                            <Button type="default" icon={<CloudUploadOutlined />} style={{ marginLeft: 8, borderRadius: 8 }}>Bulk Import</Button>
                        </div>
                        <Table
                            columns={inventoryColumns}
                            dataSource={inventory}
                            rowKey="id"
                            pagination={{
                                defaultPageSize: 10,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50'],
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                hideOnSinglePage: false,
                            }}
                            scroll={{ x: 'max-content' }}
                            loading={loading}
                        />
                    </div>
                )}
                {section === 'batches' && (
                    <div style={{ padding: '0 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                            <Text type="secondary">Show:</Text>
                            <Select value={batchFilter} onChange={setBatchFilter} style={{ width: 160 }} options={[
                                { value: 'all', label: 'All batches' },
                                { value: 'expired', label: 'Expired only' },
                                { value: 'expiring_soon', label: 'Expiring within 30 days' },
                            ]} />
                        </div>
                        {filteredBatches.length === 0 ? (
                            <EmptyState icon={<MedicineBoxOutlined />} title="No batches" description={batchFilter !== 'all' ? 'No batches match this filter.' : 'Batch details appear when you add stock via Purchase approval.'} />
                        ) : (
                            <Table
                                dataSource={filteredBatches}
                                rowKey="id"
                                loading={loading}
                                pagination={{
                                    defaultPageSize: 15,
                                    showSizeChanger: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} batches`,
                                }}
                                scroll={{ x: 'max-content' }}
                                columns={[
                                    { title: 'Product', dataIndex: 'product_name', key: 'product_name', width: 180, ellipsis: true, render: (t) => <Text strong>{t}</Text> },
                                    { title: 'Batch #', dataIndex: 'batch_number', key: 'batch_number', width: 140 },
                                    { title: 'Expiry', dataIndex: 'expiry_date', key: 'expiry_date', width: 120, render: (d) => dayjs(d).format('DD MMM YYYY') },
                                    { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 90 },
                                    {
                                        title: 'Status',
                                        key: 'status',
                                        width: 130,
                                        render: (_, row) => {
                                            const label = row._status === 'expired' ? 'Expired' : row._status === 'expiring_soon' ? 'Expiring soon' : 'OK';
                                            const pillClass = row._status === 'expired' ? 'status-pill--error' : row._status === 'expiring_soon' ? 'status-pill--warning' : 'status-pill--success';
                                            return <span className={`status-pill ${pillClass}`}>{label}</span>;
                                        }
                                    },
                                    {
                                        title: '',
                                        key: 'action',
                                        width: 100,
                                        render: (_, row) => {
                                            if (row._status === 'expired' && row.quantity > 0) {
                                                return (
                                                    <Popconfirm title="Write off this expired batch? Stock will be reduced." onConfirm={() => writeOffBatch(row.id)}>
                                                        <Button type="link" danger size="small">Write off</Button>
                                                    </Popconfirm>
                                                );
                                            }
                                            return null;
                                        }
                                    }
                                ]}
                            />
                        )}
                    </div>
                )}
                {section === 'partners' && (
                    <div style={{ padding: '0 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                            <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setIsPharmacyModalVisible(true)} style={{ borderRadius: 8 }}>Onboard Partner</Button>
                        </div>
                        <Table
                        columns={pharmacyColumns}
                        dataSource={pharmacies}
                        loading={loading}
                        rowKey="id"
                        pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} partners` }}
                        scroll={{ x: 'max-content' }}
                    />
                    </div>
                )}
                {section === 'categories' && (
                    <div style={{ padding: '0 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                            <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setIsCategoryModalVisible(true)} style={{ borderRadius: 8 }}>New Category</Button>
                        </div>
                        <Table scroll={{ x: 'max-content' }} columns={[{ title: 'Name', dataIndex: 'name' }, { title: '', align: 'right', render: (_, r) => (
                            <Popconfirm title="Delete category?" onConfirm={() => deleteCategory(r.id)}>
                                <Button type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        ) }]} dataSource={categories}
                        loading={loading}
                        rowKey="id"
                        pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories` }}
                    />
                    </div>
                )}
                {section === 'stock-requirements' && (
                    <div style={{ padding: '0 24px' }}>
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>Based on active orders</Text>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsPurchaseModalVisible(true)} style={{ borderRadius: 8 }}>Record Purchase</Button>
                        </div>
                        {requirements.length === 0 ? (
                            <EmptyState icon={<WarningOutlined />} title="No stock requirements" description="Requirements appear when you have active orders." />
                        ) : (
                            <Table
                                columns={[
                                    { title: 'Product', dataIndex: 'name', render: (t) => <Text strong>{t}</Text> },
                                    { title: 'In hand', dataIndex: 'in_hand', render: (v) => <span className={`status-pill ${v < 0 ? 'status-pill--error' : v < 10 ? 'status-pill--warning' : 'status-pill--success'}`}>{v} Units</span> },
                                    { title: 'Required', dataIndex: 'required', render: (v) => <Text>{v} Units</Text> },
                                    { title: 'Shortfall', dataIndex: 'shortfall', render: (v) => v > 0 ? <span className="status-pill status-pill--error">{v} Units</span> : <span className="status-pill status-pill--success">Sufficient</span> },
                                    { title: 'To purchase', dataIndex: 'to_purchase', render: (v) => v > 0 ? <Text strong style={{ color: 'var(--color-error)' }}>{v}</Text> : <Text type="secondary">—</Text> }
                                ]}
                                dataSource={requirements}
                                rowKey="id"
                                pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items` }}
                                scroll={{ x: 'max-content' }}
                            />
                        )}
                    </div>
                )}
                {section === 'purchase-history' && (
                    <div style={{ padding: '0 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                            <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setIsPurchaseModalVisible(true)} style={{ borderRadius: 8 }}>New Purchase Entry</Button>
                        </div>
                        <Table
                            columns={[
                                { title: 'Date', dataIndex: 'purchase_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
                                { title: 'Supplier', dataIndex: 'supplier_name', render: (t) => <Text strong>{t}</Text> },
                                { title: 'Amount', dataIndex: 'total_amount', render: (v) => `₹${parseFloat(v).toFixed(2)}` },
                                { title: 'Status', dataIndex: 'status', render: (s) => <span className={`status-pill ${s === 'approved' ? 'status-pill--success' : 'status-pill--pending'}`}>{s === 'approved' ? 'APPROVED' : 'PENDING'}</span> },
                                { title: 'Payment', dataIndex: 'is_paid', render: (paid) => <span className={`status-pill ${paid ? 'status-pill--paid' : 'status-pill--unpaid'}`}>{paid ? 'PAID' : 'PENDING'}</span> },
                                { title: 'Notes', dataIndex: 'notes', render: (t) => <Text type="secondary">{t || '—'}</Text> },
                                {
                                    title: '',
                                    align: 'right',
                                    render: (_, record) =>
                                        record.status === 'pending' ? (
                                            <Popconfirm
                                                title="Approve this purchase?"
                                                description="Stock will be added to inventory. You cannot undo this."
                                                onConfirm={async () => {
                                                    try {
                                                        await api.post(`/products/purchases/${record.id}/approve/`);
                                                        message.success('Purchase approved. Stock added to inventory.');
                                                        fetchPurchases();
                                                        fetchAllData();
                                                    } catch (e) {
                                                        message.error(e.response?.data?.detail || 'Approval failed');
                                                    }
                                                }}
                                                okText="Approve"
                                                cancelText="Cancel"
                                            >
                                                <Button type="primary" size="small" icon={<CheckCircleOutlined />} style={{ borderRadius: 8 }}>
                                                    Approve
                                                </Button>
                                            </Popconfirm>
                                        ) : null,
                                }
                            ]}
                            dataSource={purchases}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                defaultPageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} purchases`,
                            }}
                            scroll={{ x: 'max-content' }}
                        />
                    </div>
                )}
                {section === 'company' && (
                    <div style={{ padding: 24 }}>
                        <Card title="Company profile (for bills & reports)" loading={companyLoading} style={{ maxWidth: 560 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>These details appear on tax invoices and can be used in reports.</Text>
                            <Form form={companyForm} layout="vertical" onFinish={handleCompanySave}>
                                <Form.Item name="company_name" label="Company name" rules={[{ required: true }]}><Input placeholder="e.g. Your Company Pvt Ltd" /></Form.Item>
                                <Form.Item name="address" label="Address"><Input.TextArea rows={2} placeholder="Full address" /></Form.Item>
                                <Form.Item name="gst_number" label="GST number"><Input placeholder="e.g. 33XXXXX1234X1Z5" /></Form.Item>
                                <Form.Item name="license_number" label="License / DL number"><Input placeholder="Drug license number" /></Form.Item>
                                <Form.Item name="phone" label="Phone"><Input placeholder="e.g. +91 9876543210" /></Form.Item>
                                <Form.Item name="email" label="Email"><Input type="email" placeholder="billing@company.com" /></Form.Item>
                                <Form.Item><Button type="primary" htmlType="submit" style={{ borderRadius: 8 }}>Save company profile</Button></Form.Item>
                            </Form>
                        </Card>
                    </div>
                )}
                {section !== 'overview' && !['orders', 'inventory', 'batches', 'partners', 'categories', 'stock-requirements', 'purchase-history', 'company'].includes(section) && (
                    <div style={{ padding: 24 }}><EmptyState title="Page not found" description="Use the sidebar to navigate." /></div>
                )}
            </div>

            {/* Order View – Side Drawer */}
            <Drawer
                title={`Order #${selectedOrder?.order_number}`}
                open={isOrderViewVisible}
                onClose={() => { setIsOrderViewVisible(false); setSelectedOrder(null); }}
                width={960}
                styles={{ body: { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
                footer={null}
            >
                {selectedOrder && (
                    <div style={{ padding: 24, flex: 1, overflow: 'auto', minHeight: 0 }}>
                        {selectedOrder.is_void && (
                            <div style={{ marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 8, textAlign: 'center' }}>
                                <Text strong style={{ color: '#b91c1c' }}>This order has been voided.</Text>
                            </div>
                        )}

                        {!selectedOrder.is_void && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <Button type="default" onClick={() => { setIsOrderViewVisible(false); setSelectedOrder(null); }} style={{ borderRadius: 8, borderColor: '#d9d9d9' }}>Close</Button>
                                {!(selectedOrder?.items || []).some((i) => (i.dispatched_quantity || 0) > 0) && (
                                    <Button type="default" icon={<EditOutlined />} onClick={openOrderEdit} style={{ borderRadius: 8 }}>Edit order</Button>
                                )}
                                {selectedOrder?.status !== 'pending' && selectedOrder?.status !== 'rejected' && (
                                    <Button type="primary" icon={<SendOutlined />} onClick={() => { setIsOrderViewVisible(false); setSelectedOrder(null); navigate(`/admin/orders/${selectedOrder.id}/dispatch`); }} style={{ borderRadius: 8, background: '#1890ff', borderColor: '#1890ff' }}>Dispatch</Button>
                                )}
                                {selectedOrder?.status === 'pending' && (
                                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={async (e) => { e.stopPropagation(); const id = selectedOrder?.id; if (!id) return; try { await approveOrder(id); setSelectedOrder(null); setIsOrderViewVisible(false); } catch (_) {} }} style={{ borderRadius: 8, background: '#52c41a', borderColor: '#52c41a' }}>Approve</Button>
                                )}
                                <Popconfirm title="Void entire order?" description="This will mark the order and all its lines as voided. This cannot be undone." onConfirm={voidOrder} okText="Void order" okButtonProps={{ danger: true }}>
                                    <Button danger type="default" style={{ borderRadius: 8, borderColor: '#ff4d4f', color: '#ff4d4f' }}>Void order</Button>
                                </Popconfirm>
                            </div>
                        )}

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
                                {!selectedOrder.is_void && (
                                    <>
                                        <Text type="secondary" style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Current Flow</Text>
                                        <Select
                                            value={selectedOrder.status}
                                            style={{ width: 160, marginTop: '4px', borderRadius: 8 }}
                                            onChange={(val) => updateOrderStatus(selectedOrder.id, val)}
                                            options={ORDER_STATUS_OPTIONS}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                            <Col span={6}>
                                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Order total</Text>
                                    <Text style={{ fontSize: '18px', fontWeight: 800 }}>₹{selectedOrder.total_amount}</Text>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.06)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Dispatched value</Text>
                                    <Text style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-blue)' }}>₹{selectedOrder.dispatched_amount != null ? Number(selectedOrder.dispatched_amount).toFixed(2) : (selectedOrder.items || []).reduce((s, i) => s + (i.dispatched_quantity ?? 0) * parseFloat(i.unit_price || 0), 0).toFixed(2)}</Text>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Collections</Text>
                                    <Text style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{selectedOrder.paid_amount}</Text>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Outstanding</Text>
                                    <Text style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444' }}>₹{selectedOrder.outstanding_amount != null ? Number(selectedOrder.outstanding_amount).toFixed(2) : (selectedOrder.balance_amount != null ? Number(selectedOrder.balance_amount).toFixed(2) : '0.00')}</Text>
                                </div>
                            </Col>
                        </Row>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>Payment is collected on dispatched value only. Outstanding = dispatched − paid.</Text>

                        {(() => {
                            const hasBillDetails = !!(selectedOrder?.salesman_name?.trim?.());
                            return (
                                <>
                                    {/* Invoice details — collapsible */}
                                    <div style={{ marginTop: 24, marginBottom: 8 }}>
                                        <div
                                            onClick={() => setBillDetailsOpen((v) => !v)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 14px', background: billDetailsOpen ? '#f0f4ff' : '#f8fafc', borderRadius: 10, border: '1px solid', borderColor: billDetailsOpen ? '#c7d7f9' : '#e8ecf0', userSelect: 'none' }}
                                        >
                                            <Space size={8}>
                                                <FilePdfOutlined style={{ color: '#6366f1' }} />
                                                <Text strong style={{ fontSize: 13 }}>Invoice details</Text>
                                                {hasBillDetails && !billDetailsOpen && (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {selectedOrder.salesman_name} · {selectedOrder.delivery_type} · {selectedOrder.terms}
                                                    </Text>
                                                )}
                                                {!hasBillDetails && (
                                                    <Tag color="warning" style={{ fontSize: 11 }}>Required for downloads</Tag>
                                                )}
                                            </Space>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{billDetailsOpen ? '▲ Collapse' : '▼ Edit'}</Text>
                                        </div>

                                        {billDetailsOpen && (
                                            <Card size="small" style={{ marginTop: 8, marginBottom: 0, borderRadius: '0 0 12px 12px', border: '1px solid #c7d7f9', borderTop: 'none' }}>
                                                <Form form={invoiceForm} layout="vertical" onFinish={async (values) => {
                                                    if (!selectedOrder?.id) return;
                                                    try {
                                                        await api.put(`/orders/${selectedOrder.id}/`, { salesman_name: values.salesman_name, delivery_type: values.delivery_type, terms: values.terms });
                                                        const res = await api.get(`/orders/${selectedOrder.id}/`);
                                                        setSelectedOrder(res.data);
                                                        setBillDetailsOpen(false);
                                                        message.success('Invoice details saved.');
                                                    } catch (err) {
                                                        message.error(err.response?.data?.detail || 'Failed to save');
                                                    }
                                                }}>
                                                    <Form.Item name="salesman_name" label="Assigned Salesperson" rules={[{ required: true }]}><Input placeholder="Salesperson name" /></Form.Item>
                                                    <Form.Item name="delivery_type" label="Logistics Method">
                                                        <Select style={{ width: '100%' }}>
                                                            <Option value="DIRECT">DIRECT</Option>
                                                            <Option value="COURIER">COURIER</Option>
                                                            <Option value="PICKUP">PICKUP</Option>
                                                        </Select>
                                                    </Form.Item>
                                                    <Form.Item name="terms" label="Terms"><Input placeholder="e.g. D-CREDIT BILL" /></Form.Item>
                                                    <Space>
                                                        <Button type="primary" htmlType="submit" style={{ borderRadius: 8 }}>Save</Button>
                                                        <Button type="default" onClick={() => setBillDetailsOpen(false)} style={{ borderRadius: 8 }}>Cancel</Button>
                                                    </Space>
                                                </Form>
                                            </Card>
                                        )}
                                    </div>

                                    {/* Dispatch details & downloads */}
                                    <Title level={5} style={{ fontSize: '14px', marginBottom: 8, marginTop: 20 }}>Dispatch details</Title>
                                    {!hasBillDetails && (
                                        <Alert type="warning" showIcon message="Save invoice details first to enable downloads" style={{ marginBottom: 10, borderRadius: 8 }} />
                                    )}
                                    <Card size="small" style={{ marginBottom: 24, borderRadius: 12 }}>
                                        <Table
                                            dataSource={orderDispatchRows}
                                            pagination={false}
                                            showHeader
                                            columns={[
                                                { title: 'Details', dataIndex: 'label', render: (t) => <Text strong>{t}</Text> },
                                                { title: 'Value', dataIndex: 'value', align: 'right', width: 120, render: (v) => `₹${Number(v).toFixed(2)}` },
                                                {
                                                    title: '',
                                                    key: 'download',
                                                    width: 180,
                                                    render: (_, r) => (
                                                        <Tooltip title={!hasBillDetails ? 'Save invoice details first' : ''}>
                                                            <Button type="primary" size="small" icon={<FilePdfOutlined />} disabled={!hasBillDetails} onClick={() => downloadOrderBill(selectedOrder.id, r.isOverall ? 'overall' : 'dispatch', r.isOverall ? {} : { dispatchId: r.dispatchId, dispatchDate: r.dispatchDate })} style={{ borderRadius: 6 }}>
                                                                {r.isOverall ? 'Overall invoice' : 'Download invoice'}
                                                            </Button>
                                                        </Tooltip>
                                                    )
                                                }
                                            ]}
                                        />
                                    </Card>
                                </>
                            );
                        })()}

                        <Title level={5} style={{ fontSize: '14px', marginBottom: '12px' }}>Order Lines & Dispatch</Title>
                        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                            <Table
                                dataSource={selectedOrder.items}
                                pagination={false}
                                rowKey="id"
                                size="small"
                                className="glass-table"
                                scroll={{ x: 780 }}
                                rowClassName={(record) => record.is_void ? 'voided-row' : ''}
                                columns={[
                                    { title: 'Product', dataIndex: ['product_details', 'name'], width: 140, ellipsis: true, render: (v, r) => r.is_void ? <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{v}</span> : v },
                                    { title: 'Rate', dataIndex: 'unit_price', render: (v) => `₹${v}`, width: 90 },
                                    { title: 'Ordered', dataIndex: 'quantity', width: 80 },
                                    { title: 'Dispatched', dataIndex: 'dispatched_quantity', render: (v) => v ?? 0, width: 90 },
                                    { title: 'Remaining', dataIndex: 'remaining_quantity', render: (v) => v ?? 0, width: 90 },
                                    { title: 'Total', dataIndex: 'total_price', render: (v, r) => r.is_void ? <Text type="secondary" delete>₹{v}</Text> : <Text strong>₹{v}</Text>, width: 90 },
                                    ...(!selectedOrder.is_void ? [{
                                        title: '',
                                        key: 'void',
                                        width: 80,
                                        render: (_, record) => record.is_void
                                            ? <Tag color="default">Voided</Tag>
                                            : (
                                                <Popconfirm title="Void this line?" onConfirm={() => voidOrderItem(selectedOrder.id, record.id)} okText="Void" okButtonProps={{ danger: true }}>
                                                    <Button type="link" danger size="small" style={{ padding: 0 }}>Void</Button>
                                                </Popconfirm>
                                            )
                                    }] : [{ title: '', key: 'void', width: 80, render: (_, r) => r.is_void ? <Tag color="default">Voided</Tag> : null }])
                                ]}
                                expandable={{
                                    expandRowByClick: false,
                                    expandedRowRender: (record) => record.allocations?.length > 0 ? (
                                        <div style={{ padding: '8px 0' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>Dispatched batches: </Text>
                                            {(record.allocations || []).map(a => (
                                                <Tag key={a.id} style={{ marginTop: 4 }}>Batch {a.batch_number} (exp: {a.expiry_date}) × {a.quantity}</Tag>
                                            ))}
                                        </div>
                                    ) : null
                                }}
                            />
                        </div>
                    </div>
                )}
            </Drawer>

            {/* Store Detail Modal */}
            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Partner: {selectedStore?.pharmacy?.pharmacy_name || selectedStore?.username}</Title>}
                open={isStoreViewVisible}
                onCancel={() => setIsStoreViewVisible(false)}
                footer={[<Button key="close" shape="round" onClick={() => setIsStoreViewVisible(false)}>Close</Button>]}
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
                title={editingProduct ? "Edit product" : "New product"}
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
                        <Col span={12}>
                            <Form.Item name="mrp" label="MRP (₹)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="selling_price" label="Selling price (₹, incl. GST)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="gst_rate" label="GST (%)" initialValue={12}><InputNumber style={{ width: '100%' }} min={0} max={28} placeholder="12" addonAfter="%" /></Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="pack_size" label="Pack size" initialValue={1}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="unit" label="Unit"><Input placeholder="e.g. Strip, Box" /></Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="default_discount_percent" label="Discount (%)" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="0" addonAfter="%" /></Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Notes / Description">
                        <Input.TextArea placeholder="Surgical grade specifications..." rows={2} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Onboard Pharmacy Modal */}
            <Modal
                title="Add partner"
                open={isPharmacyModalVisible}
                onCancel={() => setIsPharmacyModalVisible(false)}
                onOk={() => pharmacyForm.submit()}
                centered
                width={560}
            >
                <Form form={pharmacyForm} layout="vertical" onFinish={handlePharmacySubmit}>
                    <Divider orientation="left" plain>Login (username-based)</Divider>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="Partner login username" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="password" label="Temporary Password" rules={[{ required: true, message: 'Required' }]}>
                                <Input.Password placeholder="Set initial password" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider orientation="left" plain>Store Details</Divider>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="pharmacy_name" label="Pharmacy Name" rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="Store name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="license_number" label="License / DL Number" rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="e.g. DL/123/2024" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="gst_number" label="GST Number" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="e.g. 07AAAAA0000A1Z5" />
                    </Form.Item>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="contact_person" label="Contact Person" rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="Name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="e.g. 9876543210" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Required' }]}>
                        <Input.TextArea rows={2} placeholder="Full address" />
                    </Form.Item>
                    <Form.Item name="email" label="Email (optional, for pharmacy contact)">
                        <Input type="email" placeholder="store@example.com" />
                    </Form.Item>
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

            {/* Edit Order Modal */}
            <Modal
                title={`Edit order #${selectedOrder?.order_number}`}
                open={isOrderEditVisible}
                onCancel={() => setIsOrderEditVisible(false)}
                onOk={() => orderEditForm.submit()}
                width={720}
                centered
                okText="Save order"
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Change lines, quantities, or unit prices. Cannot edit once dispatch has started.</Text>
                <Form form={orderEditForm} layout="vertical" onFinish={handleOrderEditSubmit}>
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                        <Form.Item {...restField} name={[name, 'product']} label="Product" rules={[{ required: true }]} style={{ flex: '1 1 180px', minWidth: 160 }}>
                                            <Select
                                                showSearch
                                                optionFilterProp="label"
                                                placeholder="Select product"
                                                options={inventory.filter((p) => p.is_active !== false).map((p) => ({ value: p.id, label: p.name }))}
                                                onChange={(productId) => {
                                                    const product = inventory.find((p) => p.id === productId);
                                                    if (product != null && Number.isFinite(parseFloat(product.selling_price))) {
                                                        orderEditForm.setFieldValue(['items', name, 'unit_price'], parseFloat(product.selling_price));
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'quantity']} label="Qty" rules={[{ required: true }]} style={{ width: 80 }}>
                                            <InputNumber min={1} style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'unit_price']} label="Rate (₹)" rules={[{ required: true, message: 'Select product or enter rate' }]} style={{ width: 100 }}>
                                            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Auto from product" />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'discount_amount']} label="Discount (₹)" initialValue={0} style={{ width: 90 }}>
                                            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item label="Line total" style={{ width: 100, marginBottom: 0 }}>
                                            <div style={{ lineHeight: '32px', minHeight: 32 }}>
                                                <Text strong>₹{((Number(orderEditItems[name]?.quantity) || 0) * (Number(orderEditItems[name]?.unit_price) || 0) - (Number(orderEditItems[name]?.discount_amount) || 0)).toFixed(2)}</Text>
                                            </div>
                                        </Form.Item>
                                        <Form.Item label=" " colon={false} style={{ width: 32, marginBottom: 0 }}>
                                            <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} style={{ padding: 0 }} />
                                        </Form.Item>
                                    </div>
                                ))}
                                <div style={{ marginTop: 16, marginBottom: 8, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Text strong>Overall total</Text>
                                        <Text strong style={{ fontSize: 18 }}>₹{orderEditTotal.toFixed(2)}</Text>
                                    </Space>
                                </div>
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add({ product: undefined, quantity: 1, unit_price: '', discount_amount: 0 })} block icon={<PlusOutlined />}>Add line</Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* Purchase Entry – full-screen Drawer for adding many items */}
            <Drawer
                title={<><DollarOutlined /> New purchase</>}
                open={isPurchaseModalVisible}
                onClose={() => {
                    setIsPurchaseModalVisible(false);
                    purchaseForm.resetFields();
                }}
                width={Math.min(960, typeof window !== 'undefined' ? window.innerWidth * 0.95 : 960)}
                styles={{ body: { paddingBottom: 100, display: 'flex', flexDirection: 'column' } }}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <Text type="secondary">Total amount </Text>
                            <Text strong style={{ fontSize: 18, marginLeft: 8 }}>₹{purchaseTotalAmount.toFixed(2)}</Text>
                        </div>
                        <Space>
                            <Button onClick={() => { setIsPurchaseModalVisible(false); purchaseForm.resetFields(); }}>Cancel</Button>
                            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => purchaseForm.submit()}>
                                Save purchase
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Form form={purchaseForm} layout="vertical" onFinish={handlePurchaseSubmit}>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="supplier_name" label="Supplier name" rules={[{ required: true, message: 'Enter supplier name' }]}>
                                <Input placeholder="e.g. MedSupply Co." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="notes" label="Notes / Reference">
                                <Input.TextArea rows={2} placeholder="Invoice number, PO reference, etc." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Items</Divider>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Total amount is calculated from line items below.</Text>
                    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                        <Form.List name="items" initialValue={[{}]}>
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <PurchaseItemRow
                                            key={key}
                                            name={name}
                                            restField={restField}
                                            inventory={inventory}
                                            purchaseForm={purchaseForm}
                                            fieldsLength={fields.length}
                                            onRemove={() => remove(name)}
                                        />
                                    ))}
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                        style={{ marginTop: 8 }}
                                    >
                                        Add another item
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </div>
                </Form>
            </Drawer>

            {/* Batch inventory – right-side drawer (same pattern as Record Purchase Entry) */}
            <Drawer
                title={<><InboxOutlined /> Batch inventory — {productForBatches?.name ?? 'Product'}</>}
                open={productForBatches != null}
                onClose={() => setProductForBatches(null)}
                placement="right"
                width={Math.min(520, typeof window !== 'undefined' ? window.innerWidth * 0.9 : 520)}
                styles={{ body: { paddingTop: 16 } }}
            >
                {productForBatches && (
                    <BatchListExpanded
                        record={inventory.find((p) => p.id === productForBatches.id) || productForBatches}
                        onWriteOff={writeOffBatch}
                    />
                )}
            </Drawer>
        </>
    );
};

export default AdminDashboard;
