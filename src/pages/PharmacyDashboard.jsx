import React, { useState, useEffect } from 'react';
import {
    Table, Tag, Button, Typography, Card, message, Row, Col,
    Space, Modal, InputNumber, Descriptions,
    Avatar, Divider, Badge
} from 'antd';
import {
    FilePdfOutlined,
    ShoppingCartOutlined,
    WalletOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ShopOutlined,
    AlertOutlined
} from '@ant-design/icons';
import api from '../api';

const { Title, Text } = Typography;

const PharmacyDashboard = ({ user }) => {
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
            setOrders(res.data.results || res.data);
        } catch (err) {
            message.error("Fetch failed");
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
                message.info("Bill pending approval");
            }
        } catch (err) {
            message.error("Download failed");
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
                width: '100px',
                height: '100px',
                background: `${color}10`,
                filter: 'blur(40px)',
                borderRadius: '50%'
            }} />
            <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${color}15`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                marginBottom: '20px',
                border: `1px solid ${color}30`
            }}>
                {icon}
            </div>
            <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>{title}</Text>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
            </div>
        </div>
    );

    const statsData = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        deliveredOrders: orders.filter(o => o.status === 'delivered').length,
        totalSpent: orders.filter(o => o.status !== 'rejected').reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0).toFixed(0),
        totalBalance: orders.filter(o => o.status !== 'rejected').reduce((acc, curr) => acc + parseFloat(curr.balance_amount), 0).toFixed(0)
    };

    const columns = [
        { title: 'REFERENCE', dataIndex: 'order_number', render: (t) => <Text strong style={{ color: '#3b82f6' }}>{t}</Text> },
        { title: 'DATE', dataIndex: 'created_at', render: (val) => new Date(val).toLocaleDateString() },
        { title: 'AMOUNT', dataIndex: 'total_amount', render: (val) => <Text strong>₹{val}</Text> },
        { title: 'STATUS', dataIndex: 'status', render: (v) => <Tag color={v === 'pending' ? 'orange' : 'green'} style={{ borderRadius: '6px' }}>{v.toUpperCase()}</Tag> },
        {
            title: 'PAYMENT',
            dataIndex: 'payment_status',
            render: (s, record) => (
                <Tag color={s === 'paid' ? 'success' : s === 'partial' ? 'warning' : 'error'}>
                    {s === 'paid' ? 'PAID' : s === 'partial' ? `BAL: ₹${record.balance_amount}` : 'UNPAID'}
                </Tag>
            )
        },
        {
            title: 'ACTIONS',
            key: 'actions',
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setIsViewModalVisible(true); }}>Details</Button>
                    <Button type="primary" ghost size="small" icon={<FilePdfOutlined />} disabled={record.status === 'pending'} onClick={() => downloadInvoice(record.id)}>Bill</Button>
                </Space>
            )
        },
    ];

    return (
        <div className="glass-appear">
            <div className="glass-card" style={{
                padding: '24px 32px',
                marginBottom: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
            }}>
                <Space size="large" align="center" style={{ flexWrap: 'wrap' }}>
                    <Avatar size={60} icon={<ShopOutlined />} style={{ background: '#3b82f6', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)' }} />
                    <div>
                        <Title level={3} style={{ margin: 0, fontWeight: 800 }}>{user.pharmacy?.pharmacy_name || user.username}</Title>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Partner ID: {user.pharmacy?.license_number || 'ST-9922'}</Text>
                    </div>
                </Space>
                <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => window.location.href = '/products'}
                    style={{ height: '50px', borderRadius: '12px', fontWeight: 600 }}
                    block={window.innerWidth < 576}
                >
                    New Purchase
                </Button>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Procurement', `₹${statsData.totalSpent}`, <WalletOutlined />, '#8b5cf6')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Total Balance', `₹${statsData.totalBalance}`, <AlertOutlined />, '#ef4444')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Pending', statsData.pendingOrders, <ClockCircleOutlined />, '#f59e0b')}</Col>
                <Col xs={24} sm={12} lg={6}>{renderStatCard('Completed', statsData.deliveredOrders, <CheckCircleOutlined />, '#10b981')}</Col>
            </Row>

            <div className="glass-card" style={{ padding: '24px' }}>
                <Title level={4} style={{ marginBottom: '24px', fontWeight: 700 }}>Order Repository</Title>
                <Table
                    className="glass-table"
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 7 }}
                    scroll={{ x: 'max-content' }}
                />
            </div>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Digital Order Record</Title>}
                open={isViewModalVisible}
                onCancel={() => setIsViewModalVisible(false)}
                footer={null}
                width={700}
                centered
                bodyStyle={{ padding: '0' }}
                className="glass-modal"
            >
                {selectedOrder && (
                    <div style={{ padding: '24px' }}>
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.05)',
                            padding: '20px',
                            borderRadius: '20px',
                            marginBottom: '24px',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Identifier</Text>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-blue)' }}>{selectedOrder.order_number}</div>
                            </div>
                            <Tag color={selectedOrder.status === 'pending' ? 'orange' : selectedOrder.status === 'rejected' ? 'red' : 'green'} style={{
                                borderRadius: '8px',
                                padding: '4px 12px',
                                border: 'none',
                                fontWeight: 700
                            }}>
                                {selectedOrder.status.toUpperCase()}
                            </Tag>
                        </div>

                        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                            {[
                                { label: 'Total Amount', value: `₹${selectedOrder.total_amount}`, color: '#0f172a' },
                                { label: 'Paid Amount', value: `₹${selectedOrder.paid_amount}`, color: 'var(--accent-emerald)' },
                                { label: 'Outstanding Balance', value: `₹${selectedOrder.balance_amount}`, color: '#ef4444', bold: true },
                                { label: 'Payment Status', value: selectedOrder.payment_status.toUpperCase(), color: '#3b82f6' }
                            ].map((info, idx) => (
                                <Col span={12} key={idx}>
                                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>{info.label}</Text>
                                        <Text style={{ fontSize: '16px', fontWeight: info.bold ? 800 : 700, color: info.color }}>{info.value}</Text>
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '4px', height: '16px', background: 'var(--accent-blue)', borderRadius: '2px' }} />
                            <Title level={5} style={{ margin: 0, fontSize: '14px' }}>Procurement Details</Title>
                        </div>
                        <Table
                            size="small"
                            dataSource={selectedOrder.items}
                            pagination={false}
                            rowKey="id"
                            className="glass-table"
                            columns={[
                                { title: 'PRODUCT', dataIndex: ['product_details', 'name'], render: t => <Text strong>{t}</Text> },
                                { title: 'QTY', dataIndex: 'quantity', align: 'center' },
                                { title: 'TOTAL', dataIndex: 'total_price', align: 'right', render: v => <Text strong>₹{v}</Text> }
                            ]}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PharmacyDashboard;
