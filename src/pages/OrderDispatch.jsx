import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Table, Button, Typography, Space, Select, InputNumber, message, Card, Alert,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, InboxOutlined } from '@ant-design/icons';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';

const { Text } = Typography;

const OrderDispatch = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [batchesByItemId, setBatchesByItemId] = useState({});
    const [selections, setSelections] = useState({}); // { [itemId]: { batchId, qty } }
    const [saving, setSaving] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const res = await api.get(`/orders/${orderId}/`);
            setOrder(res.data);
        } catch (e) {
            message.error('Failed to load order');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    useEffect(() => {
        if (!order?.items?.length) return;
        const remaining = order.items.filter((i) => (i.remaining_quantity ?? 0) > 0);
        if (remaining.length === 0) return;
        let cancelled = false;
        const map = {};
        Promise.all(
            remaining.map(async (item) => {
                try {
                    const res = await api.get(`/orders/${orderId}/items/${item.id}/available-batches/`);
                    if (!cancelled) map[item.id] = res.data || [];
                } catch {
                    if (!cancelled) map[item.id] = [];
                }
            })
        ).then(() => {
            if (!cancelled) setBatchesByItemId((prev) => ({ ...prev, ...map }));
        });
        return () => { cancelled = true; };
    }, [order?.id, order?.items, orderId]);

    const setSelection = (itemId, field, value) => {
        setSelections((prev) => {
            const next = { ...prev };
            if (!next[itemId]) next[itemId] = {};
            next[itemId][field] = value;
            if (field === 'batchId') next[itemId].qty = undefined;
            return next;
        });
    };

    const handleSave = async () => {
        const toDispatch = Object.entries(selections).filter(
            ([_, v]) => v?.batchId != null && v?.qty != null && v.qty >= 1
        );
        if (toDispatch.length === 0) {
            message.warning('Select at least one item with batch and quantity to dispatch');
            return;
        }
        const batches = batchesByItemId;
        for (const [itemId, { batchId, qty }] of toDispatch) {
            const item = order.items.find((i) => i.id === Number(itemId));
            if (!item || item.remaining_quantity < 1) continue;
            const batchList = batches[itemId] || [];
            const batch = batchList.find((b) => b.id === batchId);
            const maxQty = Math.min(
                item.remaining_quantity,
                batch?.quantity ?? 0
            );
            if (!batch || qty > maxQty) {
                message.warning(`Invalid batch or qty for ${item.product_details?.name}`);
                return;
            }
        }
        setSaving(true);
        try {
            const allocations = toDispatch.map(([itemId, { batchId, qty }]) => ({
                order_item: Number(itemId),
                stock_batch: batchId,
                quantity: qty,
            }));
            await api.post(`/orders/${orderId}/dispatches/`, { allocations });
            message.success(`Dispatched ${toDispatch.length} line(s). You can download a bill for this dispatch from the order detail.`);
            setSelections({});
            await fetchOrder();
        } catch (e) {
            const msg = e.response?.data?.allocations?.[0] || e.response?.data?.detail || 'Dispatch failed';
            message.error(typeof msg === 'string' ? msg : (msg.detail || 'Dispatch failed'));
        } finally {
            setSaving(false);
        }
    };

    if (loading && !order) {
        return <PageSkeleton />;
    }
    if (!order) {
        return (
            <>
                <PageHeader
                    breadcrumbItems={[{ title: 'Admin', link: '/admin' }, { title: 'Orders', link: '/admin/orders' }, { title: 'Dispatch', link: null }]}
                    title="Order not found"
                />
                <EmptyState icon={<InboxOutlined />} title="Order not found" description="The order may have been removed or you don't have access." />
            </>
        );
    }

    const items = order.items || [];
    const hasRemaining = items.some((i) => (i.remaining_quantity ?? 0) > 0);
    const canDispatch = order.status !== 'pending' && order.status !== 'rejected' && hasRemaining;
    const dispatchValue = items.reduce((sum, i) => {
        const d = i.dispatched_quantity ?? 0;
        return sum + d * parseFloat(i.unit_price || 0);
    }, 0);

    const columns = [
        { title: 'Product', dataIndex: ['product_details', 'name'], key: 'name', render: (t) => <Text strong>{t}</Text>, width: 180 },
        { title: 'Rate', dataIndex: 'unit_price', key: 'rate', render: (v) => `₹${v}`, width: 90 },
        { title: 'Ordered', dataIndex: 'quantity', key: 'qty', width: 90 },
        { title: 'Dispatched', dataIndex: 'dispatched_quantity', key: 'disp', render: (v) => v ?? 0, width: 90 },
        { title: 'Remaining', dataIndex: 'remaining_quantity', key: 'rem', render: (v) => v ?? 0, width: 90 },
        {
            title: 'Batch',
            key: 'batch',
            width: 220,
            render: (_, record) => {
                if (record.remaining_quantity < 1) return <Text type="secondary">—</Text>;
                const list = batchesByItemId[record.id] || [];
                const sel = selections[record.id];
                const selectedBatch = list.find((b) => b.id === sel?.batchId);
                return (
                    <Select
                        placeholder="Select batch"
                        style={{ width: '100%' }}
                        value={sel?.batchId}
                        onChange={(v) => setSelection(record.id, 'batchId', v)}
                        options={list.map((b) => ({
                            label: `${b.batch_number} (exp: ${b.expiry_date}) – ${b.quantity} avail`,
                            value: b.id,
                        }))}
                        allowClear
                    />
                );
            },
        },
        {
            title: 'Qty to dispatch',
            key: 'qtyDispatch',
            width: 160,
            render: (_, record) => {
                if (record.remaining_quantity < 1) return <Text type="secondary">—</Text>;
                const list = batchesByItemId[record.id] || [];
                const sel = selections[record.id];
                const selectedBatch = list.find((b) => b.id === sel?.batchId);
                const maxQty = selectedBatch
                    ? Math.min(record.remaining_quantity, selectedBatch.quantity)
                    : 0;
                const handleQtyChange = (v) => {
                    if (v == null || v === '') {
                        setSelection(record.id, 'qty', undefined);
                        return;
                    }
                    const num = Number(v);
                    if (Number.isNaN(num) || num < 1) {
                        setSelection(record.id, 'qty', 1);
                        return;
                    }
                    const clamped = Math.min(num, maxQty);
                    if (clamped !== num) {
                        message.warning(`Cannot dispatch more than ${maxQty} (remaining for this line).`);
                    }
                    setSelection(record.id, 'qty', clamped);
                };
                return (
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <InputNumber
                            min={1}
                            max={maxQty}
                            value={sel?.qty}
                            onChange={handleQtyChange}
                            placeholder={`Max ${maxQty}`}
                            style={{ width: '100%' }}
                            disabled={!sel?.batchId}
                            parser={(val) => {
                                const n = parseInt(String(val).replace(/\D/g, '') || 0, 10);
                                return Math.min(Math.max(1, n), maxQty || n);
                            }}
                        />
                        {sel?.batchId && maxQty > 0 && (
                            <Text type="secondary" style={{ fontSize: 11 }}>Max: {maxQty} (remaining)</Text>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <PageHeader
                breadcrumbItems={[
                    { title: 'Admin', link: '/admin' },
                    { title: 'Orders', link: '/admin/orders' },
                    { title: `Dispatch #${order.order_number}`, link: null },
                ]}
                title={`Dispatch — Order #${order.order_number}`}
                subtitle={order.pharmacy_name ? `Pharmacy: ${order.pharmacy_name}` : undefined}
                extra={
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/orders')} style={{ borderRadius: 8 }}>
                            Back to Orders
                        </Button>
                        {canDispatch && (
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                loading={saving}
                                style={{ borderRadius: 8 }}
                            >
                                Confirm dispatch
                            </Button>
                        )}
                    </Space>
                }
            />

            <Alert
                type="info"
                showIcon
                message="Payment is collected on dispatched amount only"
                description="Customers pay only for what has been dispatched. Any pending quantity can be dispatched later; payment is not order-wise but dispatch-based."
                style={{ marginBottom: 24, borderRadius: 8 }}
            />

            <Card className="app-card" style={{ marginBottom: 24 }}>
                <Space style={{ marginBottom: 16 }}>
                    <Text type="secondary">Order total: ₹{order.total_amount}</Text>
                    <Text>Dispatched value: ₹{dispatchValue.toFixed(2)}</Text>
                    {order.paid_amount != null && <Text type="secondary">Paid: ₹{order.paid_amount}</Text>}
                </Space>
                {!hasRemaining ? (
                    <EmptyState
                        icon={<InboxOutlined />}
                        title="Fully dispatched"
                        description="All items for this order have been dispatched."
                    />
                ) : !canDispatch ? (
                    <EmptyState
                        icon={<InboxOutlined />}
                        title="Dispatch not available"
                        description={order.status === 'pending' ? 'Approve the order first.' : order.status === 'rejected' ? 'Order is rejected.' : 'No remaining quantity to dispatch.'}
                    />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={items}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                )}
            </Card>
        </>
    );
};

export default OrderDispatch;
