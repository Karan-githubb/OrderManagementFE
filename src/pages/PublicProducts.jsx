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
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchCategories();
    }, []);

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
            <div style={{
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
                    <Title level={1} style={{ color: '#fff', fontSize: '48px', marginBottom: '16px', fontWeight: 800 }}>
                        Professional Medical Supplies
                    </Title>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', maxWidth: '700px', margin: '0 auto 30px' }}>
                        Trusted by over 500+ pharmacies. Discover high-grade surgical instruments,
                        consumables, and diagnostics at wholesale prices.
                    </Paragraph>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Search
                            placeholder="What are you looking for today?"
                            allowClear
                            enterButton={<Button type="primary" size="large" icon={<SearchOutlined />}>Search</Button>}
                            size="large"
                            onSearch={value => setSearch(value)}
                            style={{ maxWidth: '600px', width: '100%' }}
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
            }}>
                <Space size="large">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AppstoreOutlined style={{ color: '#1677ff', fontSize: '18px' }} />
                        <Text strong>Categories:</Text>
                    </div>
                    <Segmented
                        options={categories}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        size="large"
                        style={{ background: '#f5f5f5' }}
                    />
                </Space>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                <Row gutter={[24, 24]}>
                    {products.map(product => (
                        <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                            <Card
                                hoverable
                                className="product-card"
                                style={{
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    border: '1px solid #f0f0f0',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    height: '100%'
                                }}
                                styles={{ body: { padding: '20px' } }}
                                cover={
                                    <div style={{ position: 'relative', overflow: 'hidden', height: '240px', background: '#f8fafc' }}>
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
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease'
                                            }}
                                            className="product-image"
                                        />
                                        <div style={{ position: 'absolute', top: 15, left: 15 }}>
                                            <Tag color="#1677ff" style={{ borderRadius: '6px', border: 'none', padding: '2px 10px', fontWeight: 600 }}>
                                                {product.category_name}
                                            </Tag>
                                        </div>
                                        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                                            <div style={{ position: 'absolute', bottom: 10, left: 15 }}>
                                                <Tag color="orange" style={{ borderRadius: '4px' }}>LOW STOCK</Tag>
                                            </div>
                                        )}
                                        {product.stock_quantity === 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                background: 'rgba(255,255,255,0.7)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Tag color="red" style={{ fontSize: '14px', padding: '5px 15px' }}>OUT OF STOCK</Tag>
                                            </div>
                                        )}
                                    </div>
                                }
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700 }} ellipsis={{ rows: 2 }}>
                                            {product.name}
                                        </Title>
                                        <Paragraph type="secondary" style={{ fontSize: '13px', marginTop: '8px' }} ellipsis={{ rows: 2 }}>
                                            High quality surgical grade {product.name.toLowerCase()} for clinical use.
                                        </Paragraph>
                                    </div>

                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                    <Text style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a' }}>₹{product.selling_price}</Text>
                                                    <Text delete type="secondary" style={{ fontSize: '14px' }}>₹{product.mrp}</Text>
                                                </div>
                                                <Text type="success" style={{ fontSize: '12px', fontWeight: 600 }}>
                                                    Save {Math.round((product.mrp - product.selling_price) / product.mrp * 100)}%
                                                </Text>
                                            </div>
                                            <Tooltip title="View Specifications">
                                                <Button type="text" shape="circle" icon={<InfoCircleOutlined style={{ color: '#bfbfbf' }} />} />
                                            </Tooltip>
                                        </div>

                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<ShoppingCartOutlined />}
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock_quantity === 0}
                                            block
                                            style={{
                                                borderRadius: '12px',
                                                height: '48px',
                                                fontWeight: 600,
                                                boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)'
                                            }}
                                        >
                                            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </Button>
                                    </div>
                                </div>
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
