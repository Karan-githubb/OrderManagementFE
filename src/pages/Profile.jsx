import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../api';
import PageHeader from '../components/PageHeader';

const Profile = ({ user, fetchUser }) => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role === 'admin' ? 'Admin' : 'Pharmacy',
      });
    }
  }, [user, profileForm]);

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      await api.patch('/accounts/me/update/', {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email || '',
      });
      message.success('Profile updated.');
      fetchUser();
    } catch (err) {
      message.error(err.response?.data?.detail || err.response?.data?.username?.[0] || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/accounts/me/change-password/', {
        current_password: values.current_password,
        new_password: values.new_password,
      });
      message.success('Password updated. Please sign in again.');
      passwordForm.resetFields();
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      const msg = err.response?.data?.current_password?.[0] || err.response?.data?.new_password?.[0] || err.response?.data?.detail || 'Failed to update password';
      message.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const breadcrumbBase = user?.role === 'admin' ? { title: 'Admin', link: '/admin' } : { title: 'Dashboard', link: '/dashboard' };

  return (
    <>
      <PageHeader
        breadcrumbItems={[breadcrumbBase, { title: 'My Profile', link: null }]}
        title="My Profile"
        subtitle={user?.pharmacy?.pharmacy_name ? `${user.pharmacy.pharmacy_name}` : 'Update your account details'}
      />

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Card
            title={<span><UserOutlined style={{ marginRight: 8 }} />Account details</span>}
            className="app-card"
            style={{ marginBottom: 24, borderRadius: 12 }}
          >
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileUpdate}
            >
              <Form.Item name="username" label="Username">
                <Input disabled prefix={<UserOutlined />} style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="role" label="Role">
                <Input disabled value={user?.role === 'admin' ? 'Admin' : 'Pharmacy'} style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="first_name" label="First name">
                <Input placeholder="First name" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="last_name" label="Last name">
                <Input placeholder="Last name" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input type="email" placeholder="Email (optional)" style={{ borderRadius: 8 }} />
              </Form.Item>
              {user?.pharmacy && (
                <Form.Item label="Pharmacy">
                  <Input
                    disabled
                    value={user.pharmacy.pharmacy_name || '—'}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              )}
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} style={{ borderRadius: 8 }}>
                  Save profile
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span><LockOutlined style={{ marginRight: 8 }} />Change password</span>}
            className="app-card"
            style={{ marginBottom: 24, borderRadius: 12 }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="current_password"
                label="Current password"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Current password" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item
                name="new_password"
                label="New password"
                rules={[
                  { required: true, message: 'Required' },
                  { min: 8, message: 'At least 8 characters' },
                ]}
              >
                <Input.Password placeholder="New password (min 8 characters)" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label="Confirm new password"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Confirm new password" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={passwordLoading} style={{ borderRadius: 8 }}>
                  Update password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Profile;
