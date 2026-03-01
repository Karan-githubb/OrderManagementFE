import React from 'react';
import { Skeleton as AntSkeleton } from 'antd';

const CardSkeleton = () => (
  <div className="app-card" style={{ padding: 20 }}>
    <AntSkeleton active paragraph={{ rows: 3 }} />
  </div>
);

const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="app-card" style={{ padding: 20 }}>
    <AntSkeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
    {Array.from({ length: rows }).map((_, i) => (
      <AntSkeleton key={i} active paragraph={{ rows: 0 }} title={{ width: '100%' }} style={{ marginBottom: 12 }} />
    ))}
  </div>
);

const StatCardSkeleton = () => (
  <div className="stat-card">
    <AntSkeleton active paragraph={{ rows: 0 }} title={{ width: 80 }} />
    <AntSkeleton active paragraph={{ rows: 0 }} title={{ width: 120 }} style={{ marginTop: 8 }} />
  </div>
);

const PageSkeleton = () => (
  <>
    <div style={{ marginBottom: 32 }}>
      <AntSkeleton active paragraph={{ rows: 0 }} title={{ width: 280 }} />
      <AntSkeleton active paragraph={{ rows: 0 }} title={{ width: 160 }} style={{ marginTop: 8 }} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <TableSkeleton rows={6} cols={5} />
  </>
);

export { CardSkeleton, TableSkeleton, StatCardSkeleton, PageSkeleton };
