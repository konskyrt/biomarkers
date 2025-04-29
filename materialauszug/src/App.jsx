import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PageTabs from './components/PageTabs';
import ProgressOverview from './components/ProgressOverview';
import BimDashboard from './components/BimDashboard';
import MaterialAuszug from './components/MaterialAuszug';
import Classifier from './components/Classifier';
import BIM2LOG from './components/BIM2LOG';
import LandingPage from './components/LandingPage';

const App = () => {
  const [page, setPage] = useState('landing');
  
  let content;
  if (page === 'overview') {
    content = <ProgressOverview />;
  } else if (page === 'bim') {
    content = <BimDashboard />;
  } else if (page === 'page3') {
    content = <MaterialAuszug />;
  } else if (page === 'classifier') {
    content = <Classifier />;
  } else if (page === 'bim2log') {
    content = <BIM2LOG />;
  } else if (page === 'landing') {
    content = <LandingPage onStart={()=>setPage('classifier')} />;
  } else {
    content = <div className="p-6 text-center text-xl text-gray-500">Page under construction.</div>;
  }

  return (
    <div className="grid h-screen bg-bg"
         style={{ gridTemplateRows: '40px 1fr', gridTemplateColumns: 'auto 1fr' }}>
      {/* Sidebar (occupies first column, both rows) */}
      <div className="row-start-1 col-start-1 row-span-2">
        <Sidebar activePage={page} onNavigate={setPage} />
      </div>

      {/* Header (right of sidebar) */}
      <div className="row-start-1 col-start-2">
        <Header />
      </div>

      {/* Main content area */}
      <div className="row-start-2 col-start-2 flex flex-col overflow-hidden">
        {/* Page tabs (when applicable) */}
        <div className="pt-6 shrink-0 px-4">
          {['page3','bim','overview'].includes(page) && (
            <PageTabs page={page} onChange={setPage} />
          )}
        </div>
        <main className="flex-1 overflow-y-auto px-4 pb-6">
          {content}
        </main>
      </div>
    </div>
  );
};

export default App;
