import React from 'react';

const Sidebar = ({ currentPage, setCurrentPage, logo }) => {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="Amberg Loglay" className="logo" />
      </div>
      <ul>
        <li onClick={() => setCurrentPage('BIM Data Analysis')}>BIM Data Analysis</li>
        <li onClick={() => setCurrentPage('BIM2LOG')}>BIM2LOG</li> 
        <li onClick={() => setCurrentPage('BIMChat')}>BIMChat</li>
      </ul>
    </aside>
  );
};

export default Sidebar;
