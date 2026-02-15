import React, { useState, useEffect } from 'react';
import {
    Row, Col, Card, Typography, Spin, Space, DatePicker,
    Table, Tag, Button, Statistic, Divider
} from 'antd';
import {
    LineChartOutlined, BarChartOutlined, PieChartOutlined,
    ArrowUpOutlined, ArrowDownOutlined, DownloadOutlined,
    FileSearchOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import api from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/summary/', {
                params: {
                    start_date: dateRange[0].format('YYYY-MM-DD'),
                    end_date: dateRange[1].format('YYYY-MM-DD')
                }
            });
            setReportData(res.data);
        } catch (err) {
            console.error("Failed to fetch reports", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    if (loading && !reportData) {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Loading Intelligence...</div>
            </div>
        );
    }

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>
                        Intelligence Reports
                    </Title>
                    <Text type="secondary">Financial and distribution performance diagnostics</Text>
                </div>
                <Space wrap>
                    <RangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        style={{ borderRadius: '10px' }}
                    />
                    <Button icon={<DownloadOutlined />} block={window.innerWidth < 576}>Export PDF</Button>
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass-card">
                        <Statistic
                            title="Net Revenue"
                            value={reportData?.metrics?.total_sales}
                            precision={2}
                            valueStyle={{ color: '#3f3f46', fontWeight: 800 }}
                            prefix={<ArrowUpOutlined style={{ color: '#10b981' }} />}
                            suffix="₹"
                        />
                        <div style={{ marginTop: '8px' }}>
                            <Tag color="green">+12.5% from last period</Tag>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass-card">
                        <Statistic
                            title="Cash Collections"
                            value={reportData?.metrics?.total_collections}
                            precision={2}
                            valueStyle={{ color: '#10b981', fontWeight: 800 }}
                            prefix={<CheckCircleOutlined />}
                            suffix="₹"
                        />
                        <div style={{ marginTop: '8px' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Collection Rate: {((reportData?.metrics?.total_collections / reportData?.metrics?.total_sales) * 100).toFixed(1)}%
                            </Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass-card">
                        <Statistic
                            title="Outstanding Dues"
                            value={reportData?.metrics?.total_sales - reportData?.metrics?.total_collections}
                            precision={2}
                            valueStyle={{ color: '#ef4444', fontWeight: 800 }}
                            suffix="₹"
                        />
                        <div style={{ marginTop: '8px' }}>
                            <Tag color="error">Critical Attention</Tag>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass-card">
                        <Statistic
                            title="Throughput (Orders)"
                            value={reportData?.metrics?.order_count}
                            valueStyle={{ color: '#6366f1', fontWeight: 800 }}
                            suffix="Units"
                        />
                        <div style={{ marginTop: '8px' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>Avg Ticket: ₹{(reportData?.metrics?.total_sales / (reportData?.metrics?.order_count || 1)).toFixed(0)}</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24} lg={16}>
                    <Card title={<Space><LineChartOutlined /> Revenue Velocity Trend</Space>} className="glass-card">
                        <div style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={reportData?.trend}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={d => dayjs(d).format('DD/MM')} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <RechartsTooltip />
                                    <Area type="monotone" dataKey="sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="collections" stroke="#10b981" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title={<Space><BarChartOutlined /> Top Performers (By Volume)</Space>} className="glass-card">
                        <div style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData?.top_pharmacies} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="pharmacy__pharmacy_name" type="category" width={100} axisLine={false} tickLine={false} />
                                    <RechartsTooltip />
                                    <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                    <Card title={<Space><FileSearchOutlined /> Top Hubs Data Ledger</Space>} className="glass-card">
                        <Table
                            dataSource={reportData?.top_pharmacies}
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                            columns={[
                                { title: 'Partner Name', dataIndex: 'pharmacy__pharmacy_name', key: 'name', render: t => <Text strong>{t}</Text> },
                                { title: 'Purchase Capacity', dataIndex: 'total', key: 'total', render: v => `₹${v.toLocaleString()}` },
                                {
                                    title: 'Contribution',
                                    render: (_, record) => (
                                        <Tag color="purple">
                                            {((record.total / reportData?.metrics?.total_sales) * 100).toFixed(1)}% of Net
                                        </Tag>
                                    )
                                }
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Reports;
