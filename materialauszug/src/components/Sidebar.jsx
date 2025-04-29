import React from 'react';
import { HashtagIcon, CubeIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import logo from './logo.png';

const navItems = [
  {
    id: 'classifier',
    icon: HashtagIcon,
    label: 'Classifier',
  },
  {
    id: 'bim2log',
    icon: ChartBarIcon,
    label: 'BIM2LOG',
  },
  {
    id: 'page3', // materialauszug
    icon: CubeIcon,
    label: 'Materialauszug',
  },
];

const Sidebar = ({ activePage, onNavigate }) => {
  return (
    <aside className="group flex flex-col bg-gray-900 text-white sticky top-0 h-screen transition-all duration-300 w-16 hover:w-60 overflow-hidden">
      {/* Logo – only visible when expanded */}
      <div className="flex items-center justify-center px-2 mt-4 mb-8 transition-all duration-300">
        <img src={logo} alt="Logo" className="h-6 w-auto object-contain hidden group-hover:block" />
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-2 px-2 flex-1 items-center group-hover:items-start">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = id === activePage || (id === 'page3' && ['page3', 'bim', 'overview'].includes(activePage));
          return (
            <button
              key={id}
              onClick={() => onNavigate && onNavigate(id)}
              className={`flex items-center gap-3 w-full py-2 px-2 rounded-lg transition-colors ${isActive ? 'bg-primary bg-opacity-10' : 'hover:bg-gray-800'}`}
              title={label}
            >
              <Icon className={`h-6 w-6 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium tracking-wide hidden group-hover:block ${isActive ? 'text-primary' : 'text-gray-300'}`}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings at bottom */}
      <button
        className="mt-auto mb-4 flex items-center gap-3 px-2 py-2 w-full hover:bg-gray-800 rounded-lg"
        title="Einstellungen"
      >
        <Cog6ToothIcon className="h-6 w-6 text-gray-400 group-hover:text-primary" />
        <span className="text-sm hidden group-hover:block">Einstellungen</span>
      </button>
    </aside>
  );
};

Sidebar.defaultProps = {
  activePage: 'bim',
  onNavigate: () => {},
};

export default Sidebar;
