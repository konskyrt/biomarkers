// src/Sidebar.js

import React from 'react';
import { FiHash, FiBarChart2, FiBox, FiMessageSquare } from 'react-icons/fi';

const menu = [
  { key: 'Classifier',     icon: FiHash },
  { key: 'BIM2LOG',        icon: FiBarChart2 },
  { key: 'Materialauszug', icon: FiBox },
  { key: 'BIM Chat',        icon: FiMessageSquare },
];

export default function Sidebar({ currentPage, setCurrentPage, logo }) {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="Amberg Loglay" className="logo" />
      </div>
      <ul>
        {menu.map(item => {
          const Icon = item.icon;
          const active = currentPage === item.key;
          return (
            <li
              key={item.key}
              className={active ? 'active' : ''}
              onClick={() => setCurrentPage(item.key)}
            >
              <Icon className="sidebar-icon" size={20} />
              <span className="sidebar-label">{item.key}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
