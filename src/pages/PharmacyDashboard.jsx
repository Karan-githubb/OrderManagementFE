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
    ShopOutlined
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
        <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
            <div style={{
                width: '50px', height: '50px', borderRadius: '15px',
                background: `${color}20`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                marginBottom: '16px'
            }}>
                {icon}
            </div>
            <Text type="secondary" strong style={{ fontSize: '13px', textTransform: 'uppercase' }}>{title}</Text>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>{value}</div>
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
                padding: '40px',
                marginBottom: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
            }}>
                <Space size="large">
                    <Avatar size={70} icon={<ShopOutlined />} style={{ background: '#3b82f6', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)' }} />
                    <div>
                        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{user.pharmacy?.pharmacy_name || user.username}</Title>
                        <Text type="secondary">Partner ID: {user.pharmacy?.license_number || 'ST-9922'}</Text>
                    </div>
                </Space>
                <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={() => window.location.href = '/products'} style={{ height: '54px', padding: '0 32px' }}>
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
                <Table className="glass-table" columns={columns} dataSource={orders} loading={loading} rowKey="id" pagination={{ pageSize: 7 }} />
            </div>

            <Modal title="Digital Order Record" open={isViewModalVisible} onCancel={() => setIsViewModalVisible(false)} footer={null} width={800} centered>
                {selectedOrder && (
                    <div style={{ padding: '16px' }}>
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Ref">{selectedOrder.order_number}</Descriptions.Item>
                            <Descriptions.Item label="Status"><Tag color="blue">{selectedOrder.status.toUpperCase()}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Total Amount">₹{selectedOrder.total_amount}</Descriptions.Item>
                            <Descriptions.Item label="Paid Amount"><Text type="success">₹{selectedOrder.paid_amount}</Text></Descriptions.Item>
                            <Descriptions.Item label="Balance" span={2}><Text type="danger" strong>₹{selectedOrder.balance_amount}</Text></Descriptions.Item>
                        </Descriptions>
                        <Divider />
                        <Title level={5} style={{ fontSize: '14px', marginBottom: '12px' }}>Items Summary</Title>
                        <Table size="small" dataSource={selectedOrder.items} pagination={false} rowKey="id" columns={[{ title: 'Item', dataIndex: ['product_details', 'name'] }, { title: 'Qty', dataIndex: 'quantity' }, { title: 'Total', dataIndex: 'total_price', render: v => `₹${v}` }]} />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PharmacyDashboard;
