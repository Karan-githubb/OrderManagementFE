import React, { useState, useEffect } from 'react';
import {
    Row, Col, Card, Input, Empty, Skeleton, Button, message,
    Tag, Typography, Divider, Space, Segmented, Badge, Tooltip
} from 'antd';
import {
    ShoppingCartOutlined,
    SearchOutlined,
    FilterOutlined,
    AppstoreOutlined,
    InfoCircleOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import api from '../api';

const { Meta } = Card;
const { Search } = Input;
const { Title, Text, Paragraph } = Typography;

const getImageUrl = (product) => {
    const path = product.image_url || product.image;
    if (!path) return `https://images.unsplash.com/photo-1583912267550-d44d7a12517a?auto=format&fit=crop&q=80&w=400`;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/media/')) return path;
    return path.startsWith('/') ? `/media${path}` : `/media/${path}`;
};

const PublicProducts = ({ setCartCount }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchProducts();
    }, [search, selectedCategory]);
    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories/');
            const data = res.data.results || res.data;
            setCategories(['All', ...data.map(cat => cat.name)]);
        } catch (err) {
            console.error("Failed to fetch categories");
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let url = `/products/?search=${search}`;
            const res = await api.get(url);
            let data = res.data.results || res.data;

            if (selectedCategory !== 'All') {
                data = data.filter(p => p.category_name === selectedCategory);
            }

            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            message.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
        message.success(`${product.name} added to cart`);
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Modern Hero Section */}
            <div className="product-hero" style={{
                position: 'relative',
                height: '350px',
                borderRadius: '24px',
                overflow: 'hidden',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
                <img
                    src="/medical_supplies_hero_1771057146600.png"
                    alt="Hero"
                    style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
                />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', padding: '0 20px' }}>
                    <Title level={1} className="product-hero-title" style={{ color: '#fff', fontSize: '48px', marginBottom: '16px', fontWeight: 800 }}>
                        Professional Medical Supplies
                    </Title>
                    <Paragraph className="product-hero-desc" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', maxWidth: '700px', margin: '0 auto 30px' }}>
                        Trusted by over 500+ pharmacies. Discover high-grade surgical instruments,
                        consumables, and diagnostics at wholesale prices.
                    </Paragraph>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Search
                            placeholder="What are you looking for today?"
                            allowClear
                            enterButton={<Button type="primary" size="large" icon={<SearchOutlined />}>Search</Button>}
                            size="large"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onSearch={value => setSearchInput(value)}
                            style={{ maxWidth: '600px', width: '100%' }}
                            className="product-search"
                        />
                    </div>
                </div>
            </div>

            {/* Category Filter & Sorting */}
            <div style={{
                background: '#fff',
                padding: '20px 30px',
                borderRadius: '16px',
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }} className="filter-container">
                <Space size="large" className="filter-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AppstoreOutlined style={{ color: '#1677ff', fontSize: '18px' }} />
                        <Text strong>Categories:</Text>
                    </div>
                    <div className="segmented-wrapper" style={{ overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
                        <Segmented
                            options={categories}
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            size="large"
                            style={{ background: '#f5f5f5', minWidth: 'max-content' }}
                        />
                    </div>
                </Space>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }} className="stats-group">
                    <Text type="secondary">{products.length} Products Found</Text>
                    <Tooltip title="ISO Certified Quality Supplies">
                        <CheckCircleFilled style={{ color: '#52c41a', fontSize: '20px' }} />
                    </Tooltip>
                </div>
            </div>

            {/* Product Grid */}
            {loading ? (
                <Row gutter={[24, 24]}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Col xs={24} sm={12} md={8} lg={6} key={i}>
                            <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <Skeleton.Image active style={{ width: '100%', height: '200px', marginBottom: '16px' }} />
                                <Skeleton active paragraph={{ rows: 3 }} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : products.length === 0 ? (
                <div style={{ padding: '100px 0', textAlign: 'center' }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary" style={{ fontSize: '16px' }}>No products found in this category</Text>}
                    >
                        <Button type="primary" onClick={() => { setSearch(''); setSelectedCategory('All'); }}>Reset All Filters</Button>
                    </Empty>
                </div>
            ) : (
                <Row gutter={[24, 32]}>
                    {products.map(product => (
                        <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                            <Card
                                hoverable
                                className="product-card glass-card"
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: 'none'
                                }}
                                styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' } }}
                                cover={
                                    <div style={{ position: 'relative', overflow: 'hidden', height: '260px', borderRadius: '28px 28px 0 0' }}>
                                        <img
                                            alt={product.name}
                                            src={getImageUrl(product)}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1583912267550-d44d7a12517a?auto=format&fit=crop&q=80&w=400';
                                            }}
                                            style={{
                                                height: '100%',
                                                width: '100%',
                                                objectFit: 'cover'
                                            }}
                                            className="product-image"
                                        />
                                        <div style={{ position: 'absolute', top: 16, left: 16 }}>
                                            <div style={{
                                                background: 'rgba(255,255,255,0.9)',
                                                backdropFilter: 'blur(8px)',
                                                padding: '4px 12px',
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: 'var(--accent-blue)',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                            }}>
                                                {product.category_name}
                                            </div>
                                        </div>
                                        {/* Removed EXHAUSTED overlay - allow ordering even with 0 stock */}
                                    </div>
                                }
                            >
                                <div style={{ flex: 1 }}>
                                    <Title level={4} style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }} ellipsis={{ rows: 2 }}>
                                        {product.name}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: '13px', lineHeight: '1.5' }} ellipsis={{ rows: 2 }}>
                                        Professional grade {product.name.toLowerCase()} sourced for high-precision surgical utility.
                                    </Text>

                                    <div style={{ margin: '20px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <Text style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-blue)' }}>₹{product.selling_price}</Text>
                                        <Text delete type="secondary" style={{ fontSize: '14px' }}>₹{product.mrp}</Text>
                                    </div>
                                </div>

                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ShoppingCartOutlined />}
                                    onClick={() => addToCart(product)}
                                    block
                                    style={{
                                        borderRadius: '16px',
                                        height: '52px',
                                        fontSize: '15px',
                                        boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
                                    }}
                                >
                                    {product.stock_quantity === 0 ? 'Pre-Order Now' : 'Add to Cart'}
                                </Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <style>{`
                .product-card:hover .product-image {
                    transform: scale(1.1);
                }
                .product-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.12) !important;
                }
            `}</style>
        </div>
    );
};

export default PublicProducts;
