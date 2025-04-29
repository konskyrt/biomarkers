import React from 'react';
import clsx from 'clsx';

const tabs = [
  { key: 'page3', label: 'Materialauszug' },
  { key: 'bim', label: 'BIM-Dashboard' },
  { key: 'overview', label: 'Fortschrittsübersicht' }
];

const PageTabs = ({ page, onChange }) => (
  <div className="flex border-b border-gray-200 mb-6">
    {tabs.map(tab => (
      <button
        key={tab.key}
        className={clsx(
          'px-4 py-2 font-medium text-sm border-b-2 -mb-px',
          page === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        )}
        onClick={() => onChange(tab.key)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default PageTabs; 