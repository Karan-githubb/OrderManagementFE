import React from 'react';
import { Button, Typography } from 'antd';

const { Text } = Typography;

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '48px 24px',
      background: 'var(--color-accent-slate-bg)',
      borderRadius: 'var(--radius-md)',
      border: '1px dashed var(--color-accent-slate-border)',
    }}
  >
    {Icon && (
      <div style={{ fontSize: 48, color: 'var(--color-accent-slate)', marginBottom: 16 }}>
        {Icon}
      </div>
    )}
    <div style={{ marginBottom: 8 }}>
      <Text strong style={{ fontSize: 16 }}>{title}</Text>
    </div>
    {description && (
      <Text type="secondary" style={{ display: 'block', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
        {description}
      </Text>
    )}
    {actionLabel && onAction && (
      <Button type="primary" size="large" onClick={onAction} style={{ borderRadius: 8 }}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
