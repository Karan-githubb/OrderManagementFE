import React, { useState, useEffect } from 'react';
import {
    Table, Button, InputNumber, Card, Typography, Space,
    message, Row, Col, Empty, Badge, Divider, Tag, Avatar, Select
} from 'antd';
import {
    DeleteOutlined,
    ShoppingCartOutlined,
    ArrowLeftOutlined,
    CheckCircleFilled,
    CreditCardOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const { Title, Text, Paragraph } = Typography;

const Cart = ({ setCartCount, user }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pharmacies, setPharmacies] = useState([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [fetchingPharmacies, setFetchingPharmacies] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const items = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(items);

        if (user?.role === 'admin') {
            fetchPharmacies();
        }
    }, [user]);

    const fetchPharmacies = async () => {
        setFetchingPharmacies(true);
        try {
            const res = await api.get('/accounts/users/');
            const data = res.data.results || res.data;
            setPharmacies(Array.isArray(data) ? data.filter(u => u.role === 'pharmacy' && u.pharmacy) : []);
        } catch (err) {
            console.error("Failed to fetch pharmacies");
        } finally {
            setFetchingPharmacies(false);
        }
    };

    const updateQuantity = (id, quantity) => {
        const updated = cartItems.map(item =>
            item.id === id ? { ...item, quantity } : item
        );
        setCartItems(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        setCartCount(updated.reduce((sum, item) => sum + item.quantity, 0));
    };

    const removeItem = (id) => {
        const updated = cartItems.filter(item => item.id !== id);
        setCartItems(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        setCartCount(updated.reduce((sum, item) => sum + item.quantity, 0));
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.selling_price || 0) * (item.quantity || 0), 0);
    const totalMRP = cartItems.reduce((sum, item) => sum + (item.mrp || 0) * (item.quantity || 0), 0);
    const totalSavings = totalMRP - totalAmount;

    const placeOrder = async () => {
        if (!user) {
            message.warning("Please login to place an order");
            navigate('/login');
            return;
        }

        if (user?.role === 'admin' && !selectedPharmacy) {
            message.warning("Please select a pharmacy for this order");
            return;
        }

        setLoading(true);
        try {
            const items = cartItems.map(item => ({
                product: item.id,
                quantity: item.quantity
            }));

            const payload = { items };
            if (user.role === 'admin') {
                payload.pharmacy = selectedPharmacy;
            }

            await api.post('/orders/', payload);
            message.success("Order placed successfully! Redirecting to dashboard...");
            localStorage.removeItem('cart');
            setCartItems([]);
            setCartCount(0);
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            message.error(err.response?.data?.error || "Failed to place order. Check stock.");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Product Details',
            key: 'product',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Avatar
                        shape="square"
                        size={80}
                        src={record.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200'}
                        style={{ borderRadius: '8px' }}
                    />
                    <div>
                        <Text strong style={{ fontSize: '16px', display: 'block' }}>{record.name}</Text>
                        <Tag color="blue" style={{ marginTop: '4px' }}>{record.category_name}</Tag>
                    </div>
                </div>
            )
        },
        {
            title: 'Unit Price',
            key: 'price',
            render: (_, record) => (
                <div>
                    <Text strong>₹{record.selling_price}</Text><br />
                    <Text delete type="secondary" style={{ fontSize: '12px' }}>₹{record.mrp}</Text>
                </div>
            )
        },
        {
            title: 'Quantity',
            key: 'quantity',
            render: (_, record) => (
                <InputNumber
                    min={1}
                    value={record.quantity}
                    onChange={(val) => updateQuantity(record.id, val)}
                    style={{ borderRadius: '6px' }}
                />
            )
        },
        {
            title: 'Subtotal',
            key: 'total',
            render: (_, record) => (
                <Text strong style={{ fontSize: '16px' }}>₹{(record.selling_price * record.quantity).toFixed(2)}</Text>
            )
        },
        {
            title: '',
            key: 'action',
            width: 50,
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(record.id)}
                />
            )
        },
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <Link to="/products" style={{ color: '#666', marginBottom: '8px', display: 'inline-block' }}>
                        <ArrowLeftOutlined /> Back to Catalog
                    </Link>
                    <Title level={2} style={{ margin: 0 }}>Review Your Order</Title>
                </div>
                <Badge count={cartItems.length} style={{ backgroundColor: '#1677ff' }}>
                    <ShoppingCartOutlined style={{ fontSize: '32px', color: '#1677ff' }} />
                </Badge>
            </div>

            {cartItems.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '100px 0', borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Title level={4} type="secondary">Your cart is feeling light...</Title>
                        }
                    >
                        <Button type="primary" size="large" onClick={() => navigate('/products')} style={{ borderRadius: '10px' }}>
                            Start Shopping
                        </Button>
                    </Empty>
                </Card>
            ) : (
                <Row gutter={32}>
                    <Col xs={24} lg={16}>
                        <Card variant="borderless" style={{ borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '24px' }} styles={{ body: { padding: 0 } }}>
                            <Table
                                dataSource={cartItems}
                                columns={columns}
                                pagination={false}
                                rowKey="id"
                                style={{ borderRadius: '24px', overflow: 'hidden' }}
                                scroll={{ x: 'max-content' }}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        {user?.role === 'admin' && (
                            <Card
                                title={<Title level={4} style={{ margin: 0 }}>Select Pharmacy</Title>}
                                variant="borderless"
                                style={{ borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '20px' }}
                            >
                                <Select
                                    showSearch
                                    style={{ width: '100%' }}
                                    placeholder="Choose a pharmacy to order for"
                                    optionFilterProp="children"
                                    onChange={(val) => setSelectedPharmacy(val)}
                                    loading={fetchingPharmacies}
                                >
                                    {pharmacies.map(p => (
                                        <Select.Option key={p.id} value={p.pharmacy?.id}>
                                            {p.pharmacy?.pharmacy_name || p.username}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Paragraph type="secondary" style={{ marginTop: '8px', fontSize: '12px' }}>
                                    As an admin, you must select the pharmacy this order belongs to.
                                </Paragraph>
                            </Card>
                        )}

                        <Card
                            title={<Title level={4} style={{ margin: 0 }}>Order Summary</Title>}
                            variant="borderless"
                            style={{ borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}
                        >
                            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Gross Value (MRP)</Text>
                                    <Text>₹{totalMRP.toFixed(2)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Product Discount</Text>
                                    <Text type="success">- ₹{totalSavings.toFixed(2)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">Tax (GST)</Text>
                                    <Text strong>Calculated at Billing</Text>
                                </div>
                                <Divider style={{ margin: '12px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <Title level={3}>Net Amount</Title>
                                    <Title level={3} style={{ color: '#1677ff' }}>₹{totalAmount.toFixed(2)}</Title>
                                </div>

                                <div style={{ background: '#f6ffed', padding: '12px', borderRadius: '12px', marginBottom: '10px', display: 'flex', gap: '10px' }}>
                                    <CheckCircleFilled style={{ color: '#52c41a', marginTop: '4px' }} />
                                    <Text type="success" strong>You are saving ₹{totalSavings.toFixed(2)} on this procurement!</Text>
                                </div>

                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    onClick={placeOrder}
                                    loading={loading}
                                    icon={<CreditCardOutlined />}
                                    style={{
                                        height: '56px',
                                        borderRadius: '12px',
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)'
                                    }}
                                >
                                    Confirm Order
                                </Button>
                                <Paragraph type="secondary" style={{ textAlign: 'center', fontSize: '12px', marginTop: '16px' }}>
                                    By clicking 'Confirm Order', you agree to our B2B procurement terms. Your salesman will be notified once processed.
                                </Paragraph>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default Cart;
