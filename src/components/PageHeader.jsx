import React from 'react';
import { Breadcrumb, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const PageHeader = ({ breadcrumbItems = [], title, subtitle, extra }) => (
  <div className="page-title-section" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
    <div>
      {breadcrumbItems.length > 0 && (
        <Breadcrumb
          items={breadcrumbItems.map((item, i) => ({
            title: item.link ? <Link to={item.link}>{item.title}</Link> : item.title,
          }))}
          style={{ marginBottom: 8 }}
        />
      )}
      <Title level={2} className="page-title" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
        {title}
      </Title>
      {subtitle && <Text type="secondary" className="page-subtitle" style={{ display: 'block', marginTop: 4 }}>{subtitle}</Text>}
    </div>
    {extra && <Space wrap>{extra}</Space>}
  </div>
);

export default PageHeader;
