import React, { useState, useEffect, useMemo } from 'react';
import {
    Card, Table, Button, Typography, Space, Select, DatePicker, InputNumber,
    message, Checkbox,
} from 'antd';
import { DollarOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const hasDispatched = (order) => {
    const items = order.items || [];
    return items.some((i) => (i.dispatched_quantity || 0) > 0);
};

/** Amount still to collect: only on dispatched value. Payment is collected on what was dispatched, not full order. */
const getOutstanding = (order) => {
    const outstanding = order.outstanding_amount != null
        ? parseFloat(order.outstanding_amount)
        : (parseFloat(order.dispatched_amount || 0) - parseFloat(order.paid_amount || 0));
    return Math.max(0, outstanding);
};

const getDispatchedAmount = (order) => parseFloat(order.dispatched_amount ?? 0);

const Payments = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storeFilter, setStoreFilter] = useState(null); // pharmacy id
    const [dateRange, setDateRange] = useState(null);     // [dayjs, dayjs]
    const [dispatchedOnly, setDispatchedOnly] = useState(true);
    const [balanceOnly, setBalanceOnly] = useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [amountByOrderId, setAmountByOrderId] = useState({}); // orderId -> amount to record
    const [saving, setSaving] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/');
            const list = Array.isArray(res.data) ? res.data : (res.data?.results || res.data || []);
            setOrders(list);
        } catch (e) {
            message.error('Failed to load orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const storeOptions = useMemo(() => {
        const seen = new Set();
        const list = [];
        orders.forEach((o) => {
            if (o.pharmacy && o.pharmacy_name && !seen.has(o.pharmacy)) {
                seen.add(o.pharmacy);
                list.push({ value: o.pharmacy, label: o.pharmacy_name });
            }
        });
        list.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
        return [{ value: null, label: 'All stores' }, ...list];
    }, [orders]);

    const filteredOrders = useMemo(() => {
        let list = orders;
        if (storeFilter != null) {
            list = list.filter((o) => o.pharmacy === storeFilter);
        }
        if (dateRange && dateRange[0] && dateRange[1]) {
            const start = dateRange[0].startOf('day');
            const end = dateRange[1].endOf('day');
            list = list.filter((o) => {
                const d = o.created_at ? dayjs(o.created_at) : null;
                return d && d.isAfter(start) && d.isBefore(end);
            });
        }
        if (dispatchedOnly) {
            list = list.filter(hasDispatched);
        }
        if (balanceOnly) {
            list = list.filter((o) => getOutstanding(o) > 0);
        }
        return list.sort((a, b) => {
            const da = a.created_at ? new Date(a.created_at) : 0;
            const db = b.created_at ? new Date(b.created_at) : 0;
            return db - da;
        });
    }, [orders, storeFilter, dateRange, dispatchedOnly, balanceOnly]);

    const initAmountForOrder = (order) => {
        const id = order.id;
        if (amountByOrderId[id] !== undefined) return amountByOrderId[id];
        return getOutstanding(order);
    };

    const setAmountForOrder = (orderId, value) => {
        setAmountByOrderId((prev) => ({ ...prev, [orderId]: value }));
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
    };

    const totalSelectedAmount = useMemo(() => {
        return selectedRowKeys.reduce((sum, id) => {
            const order = filteredOrders.find((o) => o.id === id);
            if (!order) return sum;
            const amt = amountByOrderId[id] !== undefined ? amountByOrderId[id] : getOutstanding(order);
            return sum + (Number(amt) || 0);
        }, 0);
    }, [selectedRowKeys, amountByOrderId, filteredOrders]);

    const handleSavePayments = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Select at least one order');
            return;
        }
        setSaving(true);
        let ok = 0;
        try {
            for (const orderId of selectedRowKeys) {
                const order = filteredOrders.find((o) => o.id === orderId);
                if (!order) continue;
                const amt = amountByOrderId[orderId] !== undefined ? amountByOrderId[orderId] : getOutstanding(order);
                const num = Number(amt);
                if (num <= 0) continue;
                await api.put(`/orders/${orderId}/record_payment/`, { amount: num });
                ok += 1;
            }
            message.success(`Payment recorded for ${ok} order(s).`);
            setSelectedRowKeys([]);
            setAmountByOrderId({});
            await fetchOrders();
        } catch (e) {
            message.error(e.response?.data?.detail || e.response?.data?.error || 'Failed to record payment');
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            title: 'Order #',
            dataIndex: 'order_number',
            key: 'order_number',
            width: 140,
            render: (t) => <Text strong>{t}</Text>,
        },
        {
            title: 'Store',
            dataIndex: 'pharmacy_name',
            key: 'pharmacy_name',
            width: 180,
            ellipsis: true,
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'date',
            width: 110,
            render: (v) => (v ? dayjs(v).format('DD MMM YYYY') : '—'),
        },
        {
            title: 'Order total',
            dataIndex: 'total_amount',
            key: 'total',
            width: 110,
            align: 'right',
            render: (v) => `₹${parseFloat(v || 0).toFixed(2)}`,
        },
        {
            title: 'Dispatched value',
            key: 'dispatched',
            width: 120,
            align: 'right',
            render: (_, record) => `₹${getDispatchedAmount(record).toFixed(2)}`,
        },
        {
            title: 'Paid',
            dataIndex: 'paid_amount',
            key: 'paid',
            width: 100,
            align: 'right',
            render: (v) => `₹${parseFloat(v || 0).toFixed(2)}`,
        },
        {
            title: 'Outstanding',
            key: 'outstanding',
            width: 110,
            align: 'right',
            render: (_, record) => `₹${getOutstanding(record).toFixed(2)}`,
        },
        {
            title: 'Amount to collect',
            key: 'amount',
            width: 150,
            render: (_, record) => {
                const outstanding = getOutstanding(record);
                if (outstanding <= 0) return <Text type="secondary">—</Text>;
                const value = initAmountForOrder(record);
                return (
                    <InputNumber
                        min={0}
                        max={outstanding}
                        value={value}
                        onChange={(v) => setAmountForOrder(record.id, v)}
                        formatter={(v) => (v != null ? `₹ ${v}` : '')}
                        parser={(v) => (v ? parseFloat(String(v).replace(/₹\s?/, '')) || 0 : 0)}
                        style={{ width: '100%' }}
                        placeholder={`Max ₹${outstanding.toFixed(2)}`}
                    />
                );
            },
        },
    ];

    return (
        <>
            <PageHeader
                breadcrumbItems={[{ title: 'Admin', link: '/admin' }, { title: 'Payments' }]}
                title="Payments"
                subtitle="Record payments against dispatched orders. Filter by store and date, select multiple orders, then save."
            />

            <Card className="app-card" style={{ marginBottom: 24 }}>
                <Space wrap size="middle" style={{ marginBottom: 16 }}>
                    <Space>
                        <Text type="secondary">Store:</Text>
                        <Select
                            value={storeFilter}
                            onChange={setStoreFilter}
                            options={storeOptions}
                            style={{ width: 200 }}
                            placeholder="All stores"
                        />
                    </Space>
                    <Space>
                        <Text type="secondary">Date range:</Text>
                        <RangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            allowClear
                        />
                    </Space>
                    <Checkbox checked={dispatchedOnly} onChange={(e) => setDispatchedOnly(e.target.checked)}>
                        Dispatched only
                    </Checkbox>
                    <Checkbox checked={balanceOnly} onChange={(e) => setBalanceOnly(e.target.checked)}>
                        With balance only
                    </Checkbox>
                </Space>

                {selectedRowKeys.length > 0 && (
                    <Space style={{ marginBottom: 16 }}>
                        <Text strong>Selected: {selectedRowKeys.length} order(s)</Text>
                        <Text>Total amount: ₹{totalSelectedAmount.toFixed(2)}</Text>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSavePayments}
                            loading={saving}
                            style={{ borderRadius: 8 }}
                        >
                            Save payment for selected
                        </Button>
                    </Space>
                )}

                {filteredOrders.length === 0 ? (
                    <EmptyState
                        icon={<DollarOutlined />}
                        title={loading ? 'Loading...' : 'No orders match filters'}
                        description={loading ? '' : 'Adjust store, date range, or uncheck "Dispatched only" / "With balance only".'}
                    />
                ) : (
                    <Table
                        rowSelection={rowSelection}
                        columns={columns}
                        dataSource={filteredOrders}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                        defaultPageSize: 20,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
                    }}
                    scroll={{ x: 'max-content' }}
                    />
                )}
            </Card>
        </>
    );
};

export default Payments;
