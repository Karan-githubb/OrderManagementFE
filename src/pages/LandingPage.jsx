import React, { useState } from 'react';
import { Typography, Button, Row, Col, Card, Space, Layout, Divider, Statistic, Tag } from 'antd';
import {
    ArrowRightOutlined,
    MedicineBoxOutlined,
    RocketOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    ShopOutlined,
    MailOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';

const { Title, Paragraph, Text } = Typography;

const TiltCard = ({ children, style, delay = '0s' }) => {
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (centerY - y) / 10;
        const rotateY = (x - centerX) / 10;

        setRotate({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotate({ x: 0, y: 0 });
    };

    return (
        <div
            className="glass-card glass-appear"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                transition: rotate.x === 0 ? 'all 0.5s ease' : 'none',
                animationDelay: delay,
                transformStyle: 'preserve-3d'
            }}
        >
            <div style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
                {children}
            </div>
        </div>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ background: '#fff', margin: '-24px' }}>
            {/* Premium Hero Section */}
            <div style={{
                position: 'relative',
                padding: '160px 40px',
                minHeight: '750px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                background: '#0f172a'
            }}>
                <img
                    src="/medical_supplies_hero_1771057146600.png"
                    alt="Hero Background"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                        filter: 'brightness(0.4) saturate(1.2)'
                    }}
                />

                {/* Advanced Gradient Overlay for Readability */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.2) 100%)',
                    zIndex: 1
                }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2, color: '#fff' }}>
                    <Row gutter={48} align="middle">
                        <Col xs={24} lg={16}>
                            <div className="glass-appear float-3d">
                                <Tag color="#1677ff" style={{
                                    marginBottom: '24px',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    padding: '4px 12px',
                                    fontWeight: 700,
                                    border: 'none',
                                    background: 'rgba(22, 119, 255, 0.2)',
                                    color: '#60a5fa'
                                }}>
                                    #1 Surgical Distribution Network
                                </Tag>
                                <Title level={1} style={{
                                    color: '#fff',
                                    fontSize: 'clamp(40px, 5vw, 72px)',
                                    fontWeight: 900,
                                    lineHeight: 1.05,
                                    marginBottom: '32px',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                                }}>
                                    Precision Supplies <br />
                                    <span style={{
                                        background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>Seamlessly Delivered.</span>
                                </Title>
                                <Paragraph style={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontSize: '22px',
                                    marginBottom: '48px',
                                    maxWidth: '650px',
                                    lineHeight: 1.6,
                                    fontWeight: 400
                                }}>
                                    The most trusted wholesale platform for hospitals and pharmacies.
                                    High-quality instruments, certified disposables, and real-time inventory at your fingertips.
                                </Paragraph>
                                <Space size="large">
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => navigate('/products')}
                                        style={{
                                            height: '64px',
                                            padding: '0 48px',
                                            fontSize: '18px',
                                            borderRadius: '16px',
                                            fontWeight: 700,
                                            boxShadow: '0 10px 20px rgba(22, 119, 255, 0.3)'
                                        }}
                                    >
                                        Explore Catalog <ArrowRightOutlined />
                                    </Button>
                                    <Button
                                        size="large"
                                        ghost
                                        onClick={() => message.info("Professional onboarding is by invitation. Contact our sales team at onboarding@surgicaldistro.com")}
                                        style={{
                                            height: '64px',
                                            padding: '0 40px',
                                            fontSize: '18px',
                                            borderRadius: '16px',
                                            borderWidth: '2px',
                                            fontWeight: 600,
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        Become a Partner
                                    </Button>
                                </Space>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Modern Stats Section */}
            <div style={{ padding: '0 40px', marginTop: '-60px', position: 'relative', zIndex: 2 }}>
                <Row gutter={[24, 24]} style={{ maxWidth: 1200, margin: '0 auto' }}>
                    {[
                        { title: 'Registered Store', value: '500+', icon: <ShopOutlined /> },
                        { title: 'Products', value: '2500+', icon: <MedicineBoxOutlined /> },
                        { title: 'ISO Certificates', value: '100%', icon: <SafetyCertificateOutlined /> },
                        { title: 'Support', value: '24/7', icon: <TeamOutlined /> }
                    ].map((stat, idx) => (
                        <Col xs={12} md={6} key={idx}>
                            <TiltCard
                                delay={`${idx * 0.1}s`}
                                style={{
                                    padding: '32px 24px',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ color: 'var(--accent-blue)', fontSize: '32px', marginBottom: '12px' }}>{stat.icon}</div>
                                <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>{stat.value}</Title>
                                <Text strong style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>{stat.title}</Text>
                            </TiltCard>
                        </Col>
                    ))}
                </Row>
            </div>


            {/* Refined Features Section */}
            <div style={{ padding: '100px 40px', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <Text strong style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px' }}>SURGICAL DISTRO PROTOCOL</Text>
                    <Title level={2} style={{ fontSize: '40px', marginTop: '12px', fontWeight: 800, letterSpacing: '-1px' }}>High-Precision Distribution</Title>
                    <div style={{ width: '60px', height: '4px', background: 'var(--accent-blue)', margin: '20px auto', borderRadius: '2px' }} />
                </div>

                <Row gutter={[48, 48]}>
                    <Col xs={24} md={8}>
                        <TiltCard style={{ padding: '20px' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                <ThunderboltOutlined style={{ fontSize: '32px', color: 'var(--accent-blue)' }} />
                            </div>
                            <Title level={3} style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>JIT Inventory</Title>
                            <Paragraph style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Our Just-in-Time procurement ensures you get the freshest batches right when you need them, reducing your holding costs.</Paragraph>
                        </TiltCard>
                    </Col>
                    <Col xs={24} md={8}>
                        <TiltCard style={{ padding: '20px' }} delay="0.1s">
                            <div style={{ width: '64px', height: '64px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                <SafetyCertificateOutlined style={{ fontSize: '32px', color: 'var(--accent-purple)' }} />
                            </div>
                            <Title level={3} style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>Premium Logistics</Title>
                            <Paragraph style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Temperature-controlled transport and sterilized packaging to maintain clinical integrity from warehouse to clinic.</Paragraph>
                        </TiltCard>
                    </Col>
                    <Col xs={24} md={8}>
                        <TiltCard style={{ padding: '20px' }} delay="0.2s">
                            <div style={{ width: '64px', height: '64px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                <RocketOutlined style={{ fontSize: '32px', color: 'var(--accent-pink)' }} />
                            </div>
                            <Title level={3} style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>Smart Invoicing</Title>
                            <Paragraph style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Digital GST-compliant billing with automated salesman records and organized delivery tracking.</Paragraph>
                        </TiltCard>
                    </Col>
                </Row>
            </div>



            {/* Professional Portfolio Section */}
            <div style={{ background: '#f5f7fa', padding: '100px 40px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <Row align="middle" gutter={64}>
                        <Col xs={24} lg={12}>
                            <Title level={2} style={{ fontSize: '40px', fontWeight: 800 }}>Comprehensive <br /> Surgical Solutions</Title>
                            <Paragraph style={{ fontSize: '18px', marginTop: '20px' }}>
                                We partner with leading global brands to bring you a catalog of over 20,000+ SKUs
                                across every medical specialty.
                            </Paragraph>
                            <div style={{ marginTop: '32px' }}>
                                {[
                                    'Customized surgical kits for hospitals',
                                    'ISO-certified disposable protective gear',
                                    'State-of-the-art diagnostic monitoring solutions',
                                    'Advanced wound management technologies'
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ width: '8px', height: '8px', background: '#1677ff', borderRadius: '50%' }} />
                                        <Text strong style={{ fontSize: '16px' }}>{item}</Text>
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => navigate('/products')}
                                style={{ marginTop: '40px', height: '50px', padding: '0 40px', borderRadius: '10px' }}
                            >
                                Browse Entire Catalog
                            </Button>
                        </Col>
                        <Col xs={24} lg={12}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100%', height: '100%', border: '2px solid #1677ff', borderRadius: '24px', zIndex: 0 }} />
                                <img
                                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
                                    alt="Medical Care"
                                    style={{ width: '100%', borderRadius: '24px', position: 'relative', zIndex: 1, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                                />
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Modern CTA */}
            <div style={{ padding: '100px 40px' }}>
                <Card style={{
                    background: '#001529',
                    borderRadius: '40px',
                    padding: '80px 40px',
                    textAlign: 'center',
                    maxWidth: 1100,
                    margin: '0 auto',
                    position: 'relative',
                    overflow: 'hidden'
                }} variant="borderless">
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <Title level={2} style={{ color: '#fff', fontSize: '36px', marginBottom: '24px' }}>Ready to optimize your procurement?</Title>
                        <Paragraph style={{ color: 'rgba(255,255,255,0.7)', fontSize: '20px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                            Join the digital transformation of medical supply distribution.
                            Start your order in less than 2 minutes.
                        </Paragraph>
                        <Space size="large">
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => message.info("Start your partnership today. Email us at onboarding@surgicaldistro.com")}
                                style={{ height: '56px', padding: '0 60px', fontSize: '18px', fontWeight: 600, borderRadius: '12px' }}
                                icon={<MailOutlined />}
                            >
                                Contact for Access
                            </Button>
                            <Button ghost size="large" onClick={() => navigate('/products')} style={{ height: '56px', padding: '0 40px', fontSize: '18px', borderRadius: '12px' }}>
                                View Catalog
                            </Button>
                        </Space>
                    </div>
                    {/* Background decoration */}
                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(22, 119, 255, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
                </Card>
            </div>
        </div>
    );
};

export default LandingPage;
