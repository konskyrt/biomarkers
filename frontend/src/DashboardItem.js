import React from 'react';

export default function DashboardItem({ title, children }) {
  return (
    <div className="dashboard-item">
      <div className="dashboard-item-header"><h3>{title}</h3></div>
      <div className="dashboard-item-content">{children}</div>
    </div>
  );
}