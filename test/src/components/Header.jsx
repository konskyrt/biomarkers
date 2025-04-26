import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/solid';

const Header = () => {
  return (
    <header className="flex items-center justify-between bg-surface px-6 py-4 shadow">
      <div className="flex items-center space-x-2 text-text">
        <BuildingOfficeIcon className="h-5 w-5 text-primary" />
        <span className="font-medium text-lg">Construction Management</span>
      </div>
      <div className="h-8 w-8 bg-primary text-white flex items-center justify-center font-bold rounded">
        B+
      </div>
    </header>
  );
};

export default Header;
