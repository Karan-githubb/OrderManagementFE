import React, { useState, useEffect } from 'react';
import { Input, Empty, Typography, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../api';
import PageHeader from '../components/PageHeader';
import { TableSkeleton } from '../components/Skeleton';

const { Text } = Typography;

const CAT_COLORS = [
    '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

const PublicProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => { fetchCategories(); }, []);

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => { fetchProducts(); }, [search, selectedCategory]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories/');
            const data = res.data.results || res.data;
            setCategories(['All', ...(data || []).map((c) => c.name)]);
        } catch (_) {}
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/products/?search=${search}`);
            let data = res.data.results || res.data || [];
            if (selectedCategory !== 'All') data = data.filter((p) => p.category_name === selectedCategory);
            setProducts(Array.isArray(data) ? data : []);
        } catch (_) { setProducts([]); }
        finally { setLoading(false); }
    };

    const catColor = (name) => {
        const i = categories.indexOf(name);
        return CAT_COLORS[((i - 1) % CAT_COLORS.length + CAT_COLORS.length) % CAT_COLORS.length];
    };

    const discount = (r) => {
        const m = Number(r.mrp || 0), p = Number(r.selling_price || 0);
        if (!m || !p || p >= m) return 0;
        return Math.round(((m - p) / m) * 100);
    };

    const initials = (name = '') =>
        name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';

    return (
        <>
            <PageHeader
                breadcrumbItems={[{ title: 'Browse', link: '/products' }]}
                title="Product catalog"
                subtitle="Browse our range of medical and surgical supplies."
            />

            {/* Search + category filters */}
            <div className="app-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        placeholder="Search products..."
                        allowClear
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ width: 280, borderRadius: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                        {categories.map((cat) => {
                            const active = cat === selectedCategory;
                            const color = cat === 'All' ? '#6366f1' : catColor(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '5px 16px', borderRadius: 999,
                                        border: active ? 'none' : '1.5px solid #e2e8f0',
                                        background: active ? color : '#fff',
                                        color: active ? '#fff' : '#475569',
                                        fontWeight: active ? 700 : 500,
                                        fontSize: 13, cursor: 'pointer',
                                        transition: 'all .15s', outline: 'none',
                                        boxShadow: active ? `0 2px 8px ${color}44` : 'none',
                                    }}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                    {!loading && (
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                            {products.length} product{products.length !== 1 ? 's' : ''}
                        </Text>
                    )}
                </div>
            </div>

            {/* Product grid */}
            {loading ? (
                <TableSkeleton rows={6} />
            ) : products.length === 0 ? (
                <div className="app-card" style={{ padding: 60, textAlign: 'center' }}>
                    <Empty description={<Text type="secondary">No products found{search ? ` for "${search}"` : ''}</Text>} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
                    {products.map((p) => {
                        const color = catColor(p.category_name);
                        const disc = discount(p);
                        return (
                            <div
                                key={p.id}
                                className="app-card"
                                style={{
                                    padding: 0, overflow: 'hidden', cursor: 'default',
                                    transition: 'box-shadow .2s, transform .2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '';
                                    e.currentTarget.style.transform = 'none';
                                }}
                            >
                                {/* Colour top bar */}
                                <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

                                <div style={{ padding: '18px 20px 20px' }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                                            background: `${color}18`, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontWeight: 800, fontSize: 13, color,
                                        }}>
                                            {initials(p.name)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block', lineHeight: 1.3 }}>
                                                {p.name}
                                            </Text>
                                            <span style={{
                                                display: 'inline-block', marginTop: 5,
                                                padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                                background: `${color}15`, color,
                                            }}>
                                                {p.category_name || 'General'}
                                            </span>
                                        </div>
                                        {disc > 0 && (
                                            <span style={{
                                                flexShrink: 0, background: '#f0fdf4', color: '#16a34a',
                                                border: '1px solid #bbf7d0', borderRadius: 999,
                                                padding: '3px 9px', fontSize: 11, fontWeight: 700,
                                            }}>
                                                {disc}% off
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {p.description && (
                                        <Text style={{
                                            fontSize: 12, color: '#64748b', lineHeight: 1.6,
                                            display: '-webkit-box', WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                            marginBottom: 12,
                                        }}>
                                            {p.description}
                                        </Text>
                                    )}

                                    {/* Meta chips */}
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                        {(p.pack_size > 1 || p.unit) && (
                                            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 9px', fontSize: 11, color: '#475569' }}>
                                                Pack {p.pack_size > 1 ? p.pack_size : '1'}{p.unit ? ` · ${p.unit}` : ''}
                                            </span>
                                        )}
                                        {p.gst_rate != null && (
                                            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 9px', fontSize: 11, color: '#475569' }}>
                                                GST {p.gst_rate}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                                        <Text style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                                            ₹{Number(p.selling_price || 0).toFixed(2)}
                                        </Text>
                                        {Number(p.mrp) > Number(p.selling_price) && (
                                            <Text style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>
                                                ₹{Number(p.mrp).toFixed(2)}
                                            </Text>
                                        )}
                                        <Text style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>incl. GST</Text>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default PublicProducts;
