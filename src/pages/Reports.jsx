import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Row, Col, Typography, Space, DatePicker, Table, Button, Select, message, Statistic,
  Card, Divider, Input,
} from 'antd';
import {
  LineChartOutlined, BarChartOutlined, ArrowUpOutlined, DownloadOutlined,
  FileSearchOutlined, CheckCircleOutlined, FileExcelOutlined, FilePdfOutlined,
  DashboardOutlined, DollarOutlined, InboxOutlined, ShoppingOutlined,
  OrderedListOutlined, FileTextOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip,
} from 'recharts';
import api from '../api';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import { StatCardSkeleton } from '../components/Skeleton';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const reportParams = (dateRange) => ({
  start_date: dateRange?.[0]?.format?.('YYYY-MM-DD'),
  end_date: dateRange?.[1]?.format?.('YYYY-MM-DD'),
});

// Export table data to CSV (Excel-compatible); uses raw field values, not render()
function exportToCSV(columns, dataSource, filename) {
  const headers = columns.map((c) => (typeof c.title === 'string' ? c.title : (Array.isArray(c.dataIndex) ? c.dataIndex.join('_') : c.dataIndex) || '')).filter(Boolean);
  const rows = dataSource.map((record) =>
    columns.map((col) => {
      const key = col?.dataIndex;
      let val = Array.isArray(key) ? key.reduce((o, k) => o?.[k], record) : record?.[key];
      if (val != null && typeof val === 'object' && typeof val !== 'number') return '';
      return val != null ? String(val).replace(/"/g, '""') : '';
    })
  );
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename || 'report'}_${dayjs().format('YYYY-MM-DD')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

const REPORTS_MENU = [
  { key: 'overview', category: 'Overview', label: 'Dashboard', icon: <DashboardOutlined />, description: 'Revenue, collections, trend and top partners' },
  { key: 'sales-by-product', category: 'Sales', label: 'Sales by product', icon: <BarChartOutlined />, description: 'Quantity and value sold per product (dispatched)' },
  { key: 'outstanding', category: 'Payment', label: 'Outstanding by store', icon: <DollarOutlined />, description: 'Receivables per pharmacy' },
  { key: 'collections', category: 'Payment', label: 'Collections summary', icon: <DollarOutlined />, description: 'Total collections in period' },
  { key: 'stock-expiry', category: 'Stock', label: 'Stock expiry', icon: <InboxOutlined />, description: 'Batches expiring within N days' },
  { key: 'low-stock', category: 'Stock', label: 'Low stock', icon: <InboxOutlined />, description: 'Products below threshold' },
  { key: 'stock-summary', category: 'Stock', label: 'Stock summary', icon: <InboxOutlined />, description: 'Current stock by product' },
  { key: 'stock-valuation', category: 'Stock', label: 'Stock valuation', icon: <InboxOutlined />, description: 'Inventory value at selling price' },
  { key: 'stock-requirements', category: 'Stock', label: 'Stock requirements', icon: <InboxOutlined />, description: 'Shortfall vs active orders' },
  { key: 'purchase-history', category: 'Purchase', label: 'Purchase history', icon: <ShoppingOutlined />, description: 'Purchases with supplier and status' },
  { key: 'purchase-by-product', category: 'Purchase', label: 'Purchase by product', icon: <ShoppingOutlined />, description: 'What was bought per product' },
  { key: 'order-status', category: 'Order', label: 'Order status summary', icon: <OrderedListOutlined />, description: 'Order counts by status' },
  { key: 'fulfillment', category: 'Order', label: 'Fulfillment', icon: <OrderedListOutlined />, description: 'Ordered vs dispatched' },
  { key: 'void-report', category: 'Order', label: 'Void report', icon: <FileTextOutlined />, description: 'Voided orders and voided line items' },
  { key: 'invoice-list', category: 'Invoice', label: 'Invoice list', icon: <FileTextOutlined />, description: 'Generated invoices' },
  { key: 'invoices-generated', category: 'Invoice', label: 'Invoices generated', icon: <FileTextOutlined />, description: 'Invoice count in period' },
];

const CATEGORIES = ['Overview', 'Sales', 'Payment', 'Stock', 'Purchase', 'Order', 'Invoice'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [activeReport, setActiveReport] = useState('overview');
  const [salesByProduct, setSalesByProduct] = useState([]);
  const [outstandingByStore, setOutstandingByStore] = useState([]);
  const [collectionsSummary, setCollectionsSummary] = useState(null);
  const [stockExpiry, setStockExpiry] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [stockValuation, setStockValuation] = useState(null);
  const [stockRequirements, setStockRequirements] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseByProduct, setPurchaseByProduct] = useState([]);
  const [orderStatusSummary, setOrderStatusSummary] = useState([]);
  const [fulfillment, setFulfillment] = useState([]);
  const [invoiceList, setInvoiceList] = useState([]);
  const [invoicesGenerated, setInvoicesGenerated] = useState(null);
  const [voidReport, setVoidReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [expiryDays, setExpiryDays] = useState(90);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [fulfillmentGroup, setFulfillmentGroup] = useState('order');
  const [trendGroup, setTrendGroup] = useState('day');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('');
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState('');
  const reportContentRef = useRef(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/summary/', {
        params: { ...reportParams(dateRange), group: trendGroup },
      });
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, trendGroup]);

  useEffect(() => {
    if (activeReport === 'overview') fetchOverview();
  }, [activeReport, fetchOverview]);

  const fetchReport = useCallback(async (key) => {
    setReportLoading(true);
    const params = reportParams(dateRange);
    try {
      switch (key) {
        case 'sales-by-product':
          setSalesByProduct((await api.get('/reports/sales-by-product/', { params })).data || []);
          break;
        case 'outstanding':
          setOutstandingByStore((await api.get('/reports/outstanding-by-store/')).data || []);
          break;
        case 'collections':
          setCollectionsSummary((await api.get('/reports/collections-summary/', { params })).data);
          break;
        case 'stock-expiry':
          setStockExpiry((await api.get('/reports/stock-expiry/', { params: { days: expiryDays } })).data || []);
          break;
        case 'low-stock':
          setLowStock((await api.get('/reports/low-stock/', { params: { threshold: lowStockThreshold } })).data || []);
          break;
        case 'stock-summary':
          setStockSummary((await api.get('/reports/stock-summary/')).data);
          break;
        case 'stock-valuation':
          setStockValuation((await api.get('/reports/stock-valuation/')).data);
          break;
        case 'stock-requirements':
          setStockRequirements((await api.get('/reports/stock-requirements/')).data || []);
          break;
        case 'purchase-history':
          setPurchaseHistory((await api.get('/reports/purchase-history/', {
            params: { ...params, status: purchaseStatusFilter || undefined, supplier: purchaseSupplierFilter || undefined },
          })).data || []);
          break;
        case 'purchase-by-product':
          setPurchaseByProduct((await api.get('/reports/purchase-by-product/', { params })).data || []);
          break;
        case 'order-status':
          setOrderStatusSummary((await api.get('/reports/order-status-summary/')).data || []);
          break;
        case 'fulfillment':
          setFulfillment((await api.get('/reports/fulfillment/', { params: { group_by: fulfillmentGroup } })).data || []);
          break;
        case 'invoice-list':
          setInvoiceList((await api.get('/reports/invoice-list/', { params })).data || []);
          break;
        case 'invoices-generated':
          setInvoicesGenerated((await api.get('/reports/invoices-generated/', { params })).data);
          break;
        case 'void-report':
          setVoidReport((await api.get('/reports/void/', { params })).data);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Failed to fetch report', key, err);
      message.error('Failed to load report');
    } finally {
      setReportLoading(false);
    }
  }, [dateRange, expiryDays, lowStockThreshold, fulfillmentGroup, purchaseStatusFilter, purchaseSupplierFilter]);

  useEffect(() => {
    if (activeReport && activeReport !== 'overview') fetchReport(activeReport);
  }, [activeReport, fetchReport]);

  const handleExportPDF = () => {
    window.print();
  };

  const currentReportConfig = REPORTS_MENU.find((r) => r.key === activeReport);

  if (loading && activeReport === 'overview' && !reportData) {
    return (
      <>
        <PageHeader title="Reports" subtitle="Financial and distribution reports" />
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}><StatCardSkeleton /></Col>
          ))}
        </Row>
      </>
    );
  }

  const sales = reportData?.metrics?.total_sales ?? 0;
  const collections = reportData?.metrics?.total_collections ?? 0;
  const orderCount = reportData?.metrics?.order_count ?? 0;

  const FilterBar = ({ children }) => (
    <Card size="small" style={{ marginBottom: 24, borderRadius: 12 }}>
      <Space wrap size="middle" align="center">
        <Text strong style={{ marginRight: 8 }}>Filters</Text>
        {children}
      </Space>
    </Card>
  );

  const ExportBar = ({ tableRef, columns, dataSource, filename }) => (
    <Space style={{ marginTop: 16 }} wrap>
      <Button type="primary" icon={<FilePdfOutlined />} onClick={handleExportPDF} style={{ borderRadius: 8 }}>
        Export PDF
      </Button>
      {columns && dataSource != null && (
        <Button
          icon={<FileExcelOutlined />}
          onClick={() => {
            exportToCSV(columns, dataSource, filename || activeReport);
            message.success('Excel (CSV) downloaded');
          }}
          style={{ borderRadius: 8 }}
        >
          Export Excel
        </Button>
      )}
    </Space>
  );

  const renderReportContent = () => {
    if (activeReport === 'overview') {
      return (
        <div ref={reportContentRef}>
          <FilterBar>
            <Space>
              <Text type="secondary">Date range</Text>
              <RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 8 }} />
            </Space>
            <Space>
              <Text type="secondary">Trend</Text>
              <Select value={trendGroup} onChange={setTrendGroup} style={{ width: 120 }} options={[{ value: 'day', label: 'Daily' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }]} />
            </Space>
          </FilterBar>
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" style={{ borderRadius: 12 }}>
                <Statistic title="Net Revenue" value={sales} prefix="₹" valueStyle={{ fontSize: 20 }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" style={{ borderRadius: 12 }}>
                <Statistic title="Cash Collections" value={collections} prefix="₹" valueStyle={{ fontSize: 20, color: '#10b981' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" style={{ borderRadius: 12 }}>
                <Statistic title="Outstanding" value={sales - collections} prefix="₹" valueStyle={{ fontSize: 20, color: '#ef4444' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" style={{ borderRadius: 12 }}>
                <Statistic title="Orders" value={orderCount} valueStyle={{ fontSize: 20 }} />
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="Revenue trend" size="small" style={{ borderRadius: 12 }}>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData?.trend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('DD/MM')} />
                      <YAxis />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="collections" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Top pharmacies" size="small" style={{ borderRadius: 12 }}>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData?.top_pharmacies || []} layout="vertical" margin={{ left: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="pharmacy__pharmacy_name" type="category" width={120} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="total" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
          <Card title="Top partners" size="small" style={{ marginTop: 24, borderRadius: 12 }}>
            <Table
              dataSource={reportData?.top_pharmacies || []}
              rowKey="pharmacy"
              size="small"
              pagination={false}
              columns={[
                { title: 'Partner', dataIndex: 'pharmacy__pharmacy_name', render: (t) => <Text strong>{t}</Text> },
                { title: 'Volume (₹)', dataIndex: 'total', render: (v) => Number(v).toLocaleString() },
                { title: 'Collections (₹)', dataIndex: 'paid', render: (v) => Number(v || 0).toLocaleString() },
                { title: 'Orders', dataIndex: 'order_count' },
                { title: 'Share %', render: (_, r) => (reportData?.metrics?.total_sales ? ((r.total / reportData.metrics.total_sales) * 100).toFixed(1) : 0) + '%' },
              ]}
            />
          </Card>
          <ExportBar
            columns={[
              { title: 'Partner', dataIndex: 'pharmacy__pharmacy_name' },
              { title: 'Volume (₹)', dataIndex: 'total' },
              { title: 'Collections (₹)', dataIndex: 'paid' },
              { title: 'Orders', dataIndex: 'order_count' },
            ]}
            dataSource={reportData?.top_pharmacies || []}
            filename="overview-top-partners"
          />
        </div>
      );
    }

    const tableColumns = {
      'sales-by-product': [
        { title: 'Product', dataIndex: 'product_name' },
        { title: 'Quantity', dataIndex: 'quantity', align: 'right' },
        { title: 'Value (₹)', dataIndex: 'value', align: 'right', render: (v) => Number(v).toFixed(2) },
      ],
      outstanding: [
        { title: 'Store', dataIndex: 'pharmacy_name' },
        { title: 'Dispatched (₹)', dataIndex: 'dispatched_amount', align: 'right', render: (v) => Number(v).toFixed(2) },
        { title: 'Paid (₹)', dataIndex: 'paid_amount', align: 'right', render: (v) => Number(v).toFixed(2) },
        { title: 'Outstanding (₹)', dataIndex: 'outstanding', align: 'right', render: (v) => Number(v).toFixed(2) },
      ],
      'stock-expiry': [
        { title: 'Product', dataIndex: 'product_name' },
        { title: 'Batch', dataIndex: 'batch_number' },
        { title: 'Expiry', dataIndex: 'expiry_date' },
        { title: 'Days left', dataIndex: 'days_until_expiry', align: 'right' },
        { title: 'Qty', dataIndex: 'quantity', align: 'right' },
      ],
      'low-stock': [
        { title: 'Product', dataIndex: 'product_name' },
        { title: 'Category', dataIndex: 'category' },
        { title: 'Stock', dataIndex: 'stock_quantity', align: 'right' },
      ],
      'stock-summary': [
        { title: 'Product', dataIndex: 'product_name' },
        { title: 'Category', dataIndex: 'category' },
        { title: 'Quantity', dataIndex: 'stock_quantity', align: 'right' },
      ],
      'stock-valuation': [
        { title: 'Product', dataIndex: 'product_name' },
        { title: 'Qty', dataIndex: 'stock_quantity', align: 'right' },
        { title: 'Unit price (₹)', dataIndex: 'unit_price', align: 'right', render: (v) => Number(v).toFixed(2) },
        { title: 'Value (₹)', dataIndex: 'value', align: 'right', render: (v) => Number(v).toFixed(2) },
      ],
      'stock-requirements': [
        { title: 'Product', dataIndex: 'product_name' },
        { title: 'In hand', dataIndex: 'in_hand', align: 'right' },
        { title: 'Required', dataIndex: 'required', align: 'right' },
        { title: 'Shortfall', dataIndex: 'shortfall', align: 'right' },
      ],
      'purchase-history': [
        { title: 'Supplier', dataIndex: 'supplier_name' },
        { title: 'Date', dataIndex: 'purchase_date' },
        { title: 'Amount (₹)', dataIndex: 'total_amount', align: 'right', render: (v) => Number(v).toFixed(2) },
        { title: 'Status', dataIndex: 'status' },
      ],
      'purchase-by-product': [
        { title: 'Product', dataIndex: 'product_name' },
        { title: 'Quantity', dataIndex: 'quantity', align: 'right' },
        { title: 'Value (₹)', dataIndex: 'value', align: 'right', render: (v) => Number(v).toFixed(2) },
      ],
      'order-status': [
        { title: 'Status', dataIndex: 'status' },
        { title: 'Count', dataIndex: 'count', align: 'right' },
      ],
      fulfillment: fulfillmentGroup === 'order'
        ? [
            { title: 'Order', dataIndex: 'order_number' },
            { title: 'Store', dataIndex: 'pharmacy_name' },
            { title: 'Ordered', dataIndex: 'ordered', align: 'right' },
            { title: 'Dispatched', dataIndex: 'dispatched', align: 'right' },
            { title: 'Remaining', dataIndex: 'remaining', align: 'right' },
          ]
        : [
            { title: 'Product', dataIndex: 'product_name' },
            { title: 'Ordered', dataIndex: 'ordered', align: 'right' },
            { title: 'Dispatched', dataIndex: 'dispatched', align: 'right' },
            { title: 'Remaining', dataIndex: 'remaining', align: 'right' },
          ],
      'invoice-list': [
        { title: 'Invoice #', dataIndex: 'invoice_number' },
        { title: 'Order #', dataIndex: 'order_number' },
        { title: 'Created', dataIndex: 'created_at', render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '—' },
      ],
    };

    const tableData = {
      'sales-by-product': salesByProduct,
      outstanding: outstandingByStore,
      'stock-expiry': stockExpiry,
      'low-stock': lowStock,
      'stock-summary': stockSummary?.items || [],
      'stock-valuation': stockValuation?.items || [],
      'stock-requirements': stockRequirements,
      'purchase-history': purchaseHistory,
      'purchase-by-product': purchaseByProduct,
      'order-status': orderStatusSummary,
      fulfillment,
      'invoice-list': invoiceList,
    };

    const filtersByReport = {
      'sales-by-product': (
        <FilterBar>
          <Space><Text type="secondary">Date range</Text><RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 8 }} /></Space>
        </FilterBar>
      ),
      outstanding: null,
      collections: (
        <FilterBar>
          <Space><Text type="secondary">Date range</Text><RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 8 }} /></Space>
        </FilterBar>
      ),
      'stock-expiry': (
        <FilterBar>
          <Space><Text type="secondary">Expiring within</Text><Select value={expiryDays} onChange={setExpiryDays} style={{ width: 100 }} options={[30, 60, 90, 180].map((d) => ({ value: d, label: `${d} days` }))} /></Space>
        </FilterBar>
      ),
      'low-stock': (
        <FilterBar>
          <Space><Text type="secondary">Threshold</Text><Select value={lowStockThreshold} onChange={setLowStockThreshold} style={{ width: 80 }} options={[5, 10, 20, 50].map((n) => ({ value: n, label: n }))} /></Space>
        </FilterBar>
      ),
      'stock-summary': null,
      'stock-valuation': null,
      'stock-requirements': null,
      'purchase-history': (
        <FilterBar>
          <Space><Text type="secondary">Date range</Text><RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 8 }} /></Space>
          <Space><Text type="secondary">Status</Text><Select value={purchaseStatusFilter} onChange={setPurchaseStatusFilter} style={{ width: 120 }} placeholder="All" options={[{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }]} /></Space>
          <Space><Text type="secondary">Supplier</Text><Input placeholder="Search supplier" value={purchaseSupplierFilter} onChange={(e) => setPurchaseSupplierFilter(e.target.value)} style={{ width: 160 }} allowClear /></Space>
          <Button type="primary" onClick={() => fetchReport('purchase-history')} style={{ borderRadius: 8 }}>Apply</Button>
        </FilterBar>
      ),
      'purchase-by-product': (
        <FilterBar>
          <Space><Text type="secondary">Date range</Text><RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 8 }} /></Space>
        </FilterBar>
      ),
      'order-status': null,
      fulfillment: (
        <FilterBar>
          <Space><Text type="secondary">Group by</Text><Select value={fulfillmentGroup} onChange={setFulfillmentGroup} style={{ width: 120 }} options={[{ value: 'order', label: 'By order' }, { value: 'product', label: 'By product' }]} /></Space>
        </FilterBar>
      ),
      'invoice-list': (
        <FilterBar>
          <Space><Text type="secondary">Date range</Text><RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 8 }} /></Space>
        </FilterBar>
      ),
      'invoices-generated': (
        <FilterBar>
          <Space><Text type="secondary">Date range</Text><RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 8 }} /></Space>
        </FilterBar>
      ),
      'void-report': (
        <FilterBar>
          <Space><Text type="secondary">Date range</Text><RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 8 }} /></Space>
        </FilterBar>
      ),
    };

    if (activeReport === 'collections') {
      return (
        <div ref={reportContentRef}>
          {filtersByReport.collections}
          <Card size="small" style={{ borderRadius: 12 }}>
            <Space size="large">
              <Statistic title="Total collections (₹)" value={collectionsSummary?.total_collections} />
              <Statistic title="Orders" value={collectionsSummary?.order_count} />
            </Space>
          </Card>
          <ExportBar columns={[{ title: 'Total collections', dataIndex: 'total_collections' }, { title: 'Order count', dataIndex: 'order_count' }]} dataSource={collectionsSummary ? [collectionsSummary] : []} />
        </div>
      );
    }

    if (activeReport === 'invoices-generated') {
      return (
        <div ref={reportContentRef}>
          {filtersByReport['invoices-generated']}
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Invoices generated (period)" value={invoicesGenerated?.count} />
          </Card>
          <ExportBar columns={[{ title: 'Count', dataIndex: 'count' }]} dataSource={invoicesGenerated ? [invoicesGenerated] : []} />
        </div>
      );
    }

    if (activeReport === 'void-report') {
      const orders = voidReport?.voided_orders || [];
      const items = voidReport?.voided_items || [];
      const voidOrderCols = [
        { title: 'Order #', dataIndex: 'order_number' },
        { title: 'Pharmacy', dataIndex: 'pharmacy_name' },
        { title: 'Status', dataIndex: 'status' },
        { title: 'Amount (₹)', dataIndex: 'total_amount', align: 'right', render: (v) => Number(v).toFixed(2) },
        { title: 'Voided at', dataIndex: 'voided_at', render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '—' },
      ];
      const voidItemCols = [
        { title: 'Order #', dataIndex: 'order_number' },
        { title: 'Pharmacy', dataIndex: 'pharmacy_name' },
        { title: 'Product', dataIndex: 'product_name' },
        { title: 'Qty', dataIndex: 'quantity', align: 'right' },
        { title: 'Total (₹)', dataIndex: 'total_price', align: 'right', render: (v) => Number(v).toFixed(2) },
      ];
      return (
        <div ref={reportContentRef}>
          {filtersByReport['void-report']}
          <Card size="small" style={{ borderRadius: 12 }} loading={reportLoading}>
            <Title level={5} style={{ marginBottom: 16 }}>Voided orders (whole order)</Title>
            <Table dataSource={orders} columns={voidOrderCols} rowKey="order_id" size="small" pagination={{ pageSize: 15 }} />
            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Voided line items</Title>
            <Table dataSource={items} columns={voidItemCols} rowKey="order_item_id" size="small" pagination={{ pageSize: 15 }} />
          </Card>
          <ExportBar columns={voidOrderCols} dataSource={orders} filename="voided-orders" />
        </div>
      );
    }

    const columns = tableColumns[activeReport];
    const dataSource = tableData[activeReport] || [];

    return (
      <div ref={reportContentRef}>
        {filtersByReport[activeReport]}
        <Card size="small" style={{ borderRadius: 12 }} loading={reportLoading}>
          {activeReport === 'stock-valuation' && stockValuation != null && (
            <Text strong style={{ display: 'block', marginBottom: 16 }}>Total valuation: ₹{Number(stockValuation.total_valuation || 0).toFixed(2)}</Text>
          )}
          {activeReport === 'stock-summary' && stockSummary != null && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Total quantity: {stockSummary.total_quantity}</Text>
          )}
          <Table
            dataSource={dataSource}
            columns={columns}
            rowKey={activeReport === 'fulfillment' ? (fulfillmentGroup === 'order' ? 'order_id' : 'product_id') : (columns?.[0]?.dataIndex || 'id')}
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t, r) => `${r[0]}-${r[1]} of ${t}` }}
          />
        </Card>
        <ExportBar columns={columns} dataSource={dataSource} filename={activeReport} />
      </div>
    );
  };

  return (
    <>
      <PageHeader
        breadcrumbItems={[{ title: 'Admin', link: '/admin' }, { title: 'Reports' }]}
        title="Reports"
        subtitle="View and export sales, stock, payment, and order reports"
      />
      <Row gutter={24} style={{ marginTop: 24 }} className="reports-layout">
        <Col xs={24} lg={6} className="reports-sidebar-print-hide">
          <Card title="Reports" size="small" style={{ borderRadius: 12 }} bodyStyle={{ padding: '12px 0' }}>
            {CATEGORIES.map((cat) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', padding: '0 16px 8px' }}>{cat}</Text>
                {REPORTS_MENU.filter((r) => r.category === cat).map((r) => (
                  <div
                    key={r.key}
                    onClick={() => setActiveReport(r.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveReport(r.key)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderLeft: '3px solid transparent',
                      background: activeReport === r.key ? 'var(--color-primary-light)' : 'transparent',
                      borderLeftColor: activeReport === r.key ? 'var(--color-primary)' : 'transparent',
                    }}
                  >
                    <Space size={8}>
                      <span style={{ color: activeReport === r.key ? 'var(--color-primary)' : undefined }}>{r.icon}</span>
                      <div>
                        <Text strong={activeReport === r.key} style={{ fontSize: 13 }}>{r.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{r.description}</Text>
                      </div>
                    </Space>
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={18} className="reports-detail">
          <Card
            title={
              <Space>
                {currentReportConfig?.icon}
                <span>{currentReportConfig?.label || 'Report'}</span>
              </Space>
            }
            extra={
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setActiveReport('overview')} style={{ display: activeReport === 'overview' ? 'none' : 'inline-flex' }}>
                Back to dashboard
              </Button>
            }
            size="small"
            style={{ borderRadius: 12, minHeight: 400 }}
          >
            {currentReportConfig?.description && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{currentReportConfig.description}</Text>
            )}
            <Divider style={{ margin: '12px 0 20px' }} />
            {renderReportContent()}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Reports;
