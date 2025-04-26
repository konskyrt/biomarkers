import React from 'react';
import { HomeIcon, ChartBarIcon, CubeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ activePage, onNavigate }) => (
  <aside className="w-20 bg-surface border-r flex flex-col items-center py-6 space-y-4">
    <div className="flex flex-col items-center space-y-1">
      <img src="/logo192.png" alt="Logo" className="w-10 h-10 mb-4" />
      
      <button 
        onClick={() => onNavigate && onNavigate('bim')} 
        className={`p-2 rounded-lg ${activePage === 'bim' ? 'bg-primary bg-opacity-10' : 'hover:bg-gray-100'}`}
        title="BIM Dashboard"
      >
        <CubeIcon className={`h-6 w-6 ${activePage === 'bim' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`} />
      </button>
      
      <button 
        onClick={() => onNavigate && onNavigate('overview')} 
        className={`p-2 rounded-lg ${activePage === 'overview' ? 'bg-primary bg-opacity-10' : 'hover:bg-gray-100'}`}
        title="Progress Overview"
      >
        <HomeIcon className={`h-6 w-6 ${activePage === 'overview' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`} />
      </button>
      
      <button 
        onClick={() => onNavigate && onNavigate('page3')} 
        className={`p-2 rounded-lg ${activePage === 'page3' ? 'bg-primary bg-opacity-10' : 'hover:bg-gray-100'}`}
        title="Analytics"
      >
        <ChartBarIcon className={`h-6 w-6 ${activePage === 'page3' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`} />
      </button>
    </div>
    
    <button 
      className="p-2 rounded-lg hover:bg-gray-100 mt-auto"
      title="Settings"
    >
      <Cog6ToothIcon className="h-6 w-6 text-gray-600 hover:text-primary" />
    </button>
  </aside>
);

// Default props for backward compatibility
Sidebar.defaultProps = {
  activePage: 'bim',
  onNavigate: () => {}
};

export default Sidebar;
