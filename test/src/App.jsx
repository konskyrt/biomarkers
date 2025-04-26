import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PageTabs from './components/PageTabs';
import ProgressOverview from './components/ProgressOverview';
import BimDashboard from './components/BimDashboard';

const App = () => {
  const [page, setPage] = useState('bim');
  
  let content;
  if (page === 'overview') {
    content = <ProgressOverview />;
  } else if (page === 'bim') {
    content = <BimDashboard />;
  } else {
    content = <div className="p-6 text-center text-xl text-gray-500">Page under construction.</div>;
  }

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="px-6 pt-6">
          <PageTabs page={page} onChange={setPage} />
        </div>
        <main className="flex-1 overflow-y-auto">
          {content}
        </main>
      </div>
    </div>
  );
};

export default App;
