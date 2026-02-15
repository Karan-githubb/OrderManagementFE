import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const { Title, Text, Paragraph } = Typography;

const Login = ({ fetchUser }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        let loginSuccess = false;
        try {
            const res = await api.post('/accounts/login/', values);
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            loginSuccess = true;
            message.success("Credentials verified. Welcome back!");
            await fetchUser();
            navigate('/');
        } catch (err) {
            if (!loginSuccess) {
                message.error("Access denied. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            margin: '-32px',
            minHeight: '100vh',
            display: 'flex',
            background: '#fff'
        }}>
            {/* Left side: Premium Branding Panel */}
            <div style={{
                flex: '1',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
                color: '#fff',
                overflow: 'hidden'
            }} className="login-panel">
                {/* Background Image with Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'url("/login_bg.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                }} />
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(99, 102, 241, 0.8) 100%)',
                    zIndex: 1
                }} />

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center' }}>
                        <MedicineBoxOutlined style={{ fontSize: '40px', color: '#fff', marginRight: '16px' }} />
                        <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>SurgicalDistro</Title>
                    </div>

                    <Title level={1} style={{ color: '#fff', fontSize: '48px', fontWeight: 800, lineHeight: 1.2, marginBottom: '24px' }}>
                        Empowering Healthcare <br />
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Distribution Through Data.</span>
                    </Title>

                    <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', maxWidth: '450px', marginBottom: '40px' }}>
                        Access the most comprehensive B2B medical supply network in the region.
                        Manage inventory, track orders, and generate compliant billing in real-time.
                    </Paragraph>

                    <div style={{ display: 'flex', gap: '40px' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 800 }}>500+</div>
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Partner Stores</Text>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 800 }}>25k+</div>
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Monthly Orders</Text>
                        </div>
                    </div>
                </div>

                {/* Animated Background Decoration */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-10%',
                    width: '400px',
                    height: '400px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    filter: 'blur(60px)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '-5%',
                    width: '200px',
                    height: '200px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '50%',
                    filter: 'blur(30px)'
                }} />
            </div>

            {/* Right side: Modern Login Form */}
            <div style={{
                width: '550px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px',
                background: '#f8fafc'
            }}>
                <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Sign In</Title>
                        <Text type="secondary" style={{ fontSize: '16px' }}>Enter your partner credentials to manage your store.</Text>
                    </div>

                    <Form
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                    >
                        <Form.Item
                            label={<Text strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>Email Address</Text>}
                            name="email"
                            rules={[
                                { required: true, message: 'Email required to proceed' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                            style={{ marginBottom: '24px' }}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="name@pharmacy.com"
                                size="large"
                                style={{ borderRadius: '12px', padding: '12px' }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Text strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>Password</Text>
                                    <Link to="/forgot-password" style={{ fontSize: '12px', fontWeight: 600 }}>Forgot Access?</Link>
                                </div>
                            }
                            name="password"
                            rules={[{ required: true, message: 'Secure key required' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="••••••••"
                                size="large"
                                style={{ borderRadius: '12px', padding: '12px' }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginTop: '40px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                size="large"
                                loading={loading}
                                icon={<ArrowRightOutlined />}
                                style={{ height: '56px', borderRadius: '14px', fontSize: '16px', fontWeight: 600 }}
                            >
                                Authorize & Login
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider plain style={{ margin: '40px 0' }}><Text type="secondary" style={{ fontSize: '12px' }}>NEW PARTNER?</Text></Divider>

                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Interested in joining our network?</Text>
                        <br />
                        <Button
                            type="link"
                            style={{ fontWeight: 700, fontSize: '16px', marginTop: '12px', padding: 0 }}
                            onClick={() => message.info("Please contact our sales team at onboarding@surgicaldistro.com to request access.")}
                        >
                            Contact for Professional Onboarding <ArrowRightOutlined style={{ fontSize: '12px' }} />
                        </Button>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 992px) {
                    .login-panel { display: none !important; }
                    div[style*="width: 550px"] { width: 100% !important; padding: 40px !important; }
                }
            `}</style>
        </div>
    );
};

export default Login;

