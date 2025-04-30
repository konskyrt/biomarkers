import React, { useState, useRef } from 'react';
import { ClipLoader } from 'react-spinners';

const BIM2LOG = () => {
  // copied from original BIM2LOG (frontend) but API endpoints removed; placeholder behaviour
  const [timelineFile, setTimelineFile] = useState(null);
  const [elementsFile, setElementsFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessages, setProgressMessages] = useState([]);

  const handleStart = () => {
    if (!timelineFile || !elementsFile) return;
    setIsProcessing(true);
    setProgressMessages([]);
    const steps = ['Dateien hochladen', 'Validiere Daten', 'Erstelle LOG-Modell', 'Generiere Resultate', 'Fertig'];
    steps.forEach((msg, idx) => {
      setTimeout(() => {
        setProgressMessages((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
        if (idx === steps.length - 1) setIsProcessing(false);
      }, (idx + 1) * 1000);
    });
  };

  // helper to render custom file input
  const FileInput = ({ label, file, setFile }) => (
    <label className="block text-sm font-medium mb-3">
      {label}
      <input type="file" accept=".xlsx" className="hidden" onChange={(e)=>setFile(e.target.files[0])} />
      <div className="mt-2 flex items-center gap-2 border rounded px-2 py-1 cursor-pointer bg-gray-50 hover:bg-gray-100">
        <span className="bg-gray-900 text-white px-3 py-1 rounded">Durchsuchen</span>
        <span className="truncate text-sm">{file ? file.name : 'Keine Datei ausgewählt'}</span>
      </div>
    </label>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">BIM2LOG</h2>
      <div className="bg-white p-4 rounded-lg shadow max-w-md space-y-4">
        <FileInput label="Zeitplan" file={timelineFile} setFile={setTimelineFile} />
        <FileInput label="Bauteile" file={elementsFile} setFile={setElementsFile} />
        <button onClick={handleStart} disabled={isProcessing || !timelineFile || !elementsFile} className="w-full py-2 bg-gray-900 text-white rounded disabled:opacity-50">
          {isProcessing ? 'Verarbeite…' : 'Starten'}
        </button>
        {isProcessing && <div className="flex justify-center"><ClipLoader size={24} color="#fff" /></div>}
        {progressMessages.length > 0 && (
          <div className="bg-gray-100 p-3 rounded max-h-56 overflow-y-auto text-xs">
            {progressMessages.map((m,i)=><div key={i}>{m}</div>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default BIM2LOG; 