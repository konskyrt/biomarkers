import React from 'react';
import logo from './logo.png';

const LandingPage = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bg text-text text-center px-4">
      <h1 className="text-3xl font-bold mb-4">BIM &amp; Terminplan&nbsp;Analytics</h1>
      <p className="text-gray-600 mb-8 max-w-md">Verwalten Sie BIM-Daten, analysieren Sie Terminpläne und gewinnen Sie Erkenntnisse – alles an einem Ort.</p>
      <button onClick={onStart} className="px-6 py-2 bg-gray-900 text-white rounded shadow hover:bg-gray-800 transition">Get Started</button>
    </div>
  );
};

export default LandingPage; 