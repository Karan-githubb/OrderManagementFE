import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const { Title } = Typography;

const Register = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await api.post('/accounts/register/', values);
            message.success("Registration successful! Please login.");
            navigate('/login');
        } catch (err) {
            message.error(err.response?.data?.message || "Registration failed. Check your details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Card title={<Title level={3}>Register Your Pharmacy</Title>} style={{ width: '100%', maxWidth: 800 }}>
                <Form layout="vertical" onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                                <Input.Password />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="pharmacy_name" label="Pharmacy Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="license_number" label="License Number" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="gst_number" label="GST Number" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="contact_person" label="Contact Person" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="address" label="Address" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                            Register
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Register;
