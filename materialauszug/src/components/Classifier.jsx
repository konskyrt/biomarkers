import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import MetricsSummary from './MetricsSummary';
import PieChart from './PieChart';
import BarChart from './BarChart';
import AggregatedTable from './AggregatedTable';

const Classifier = () => {
  const [bimData, setBimData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('sv/ConvexHullVolume');
  const [aggregationType, setAggregationType] = useState('sv/ConvexHullVolume');
  const [modelFile, setModelFile] = useState(null);

  // --- Upload handler ---
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      setBimData(rows);
      setFilteredData(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  // --- Distinct value helpers ---
  const distinct = (key) => [...new Set(bimData.map((r) => r[key]).filter(Boolean))];

  // --- Filter handlers ---
  const applyFilter = (key, value) => {
    if (value === 'All') { setFilteredData(bimData); return; }
    const newData = bimData.filter((r) => r[key] === value);
    setFilteredData(newData);
  };

  // generate object count data for second bar chart
  const generateObjectCountData = () => {
    const labels = [...new Set(filteredData.map((row)=>{
      const v = row['EBKP'];
      return v ? v.split(' ').slice(1).join(' ') : null;
    }).filter(Boolean))];
    const counts = labels.map(label => filteredData.filter(r=>{
      const v=r['EBKP'];
      return v && v.split(' ').slice(1).join(' ')===label;
    }).length);
    const colors = labels.map((_,i)=>`hsl(${(i*137.5)%360},70%,50%)`);
    return { labels, datasets:[{ data:counts, backgroundColor:colors }] };
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-2">Classifier</h2>
      {/* Upload */}
      <div className="bg-white p-4 rounded-lg shadow max-w-md">
        <h3 className="text-lg font-semibold mb-4">Daten importieren</h3>
        <label className="block text-sm font-medium">
          BIM-Modell
          <input type="file" accept=".xlsx" className="hidden" onChange={(e)=>{ setModelFile(e.target.files[0]); handleExcelUpload(e);} } />
          <div className="mt-2 flex items-center gap-2 border rounded px-2 py-1 cursor-pointer bg-gray-50 hover:bg-gray-100">
            <span className="bg-gray-900 text-white px-3 py-1 rounded">Durchsuchen</span>
            <span className="truncate text-sm">{modelFile ? modelFile.name : 'Keine Datei ausgewählt'}</span>
          </div>
        </label>
      </div>

      {bimData.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center border p-2 rounded bg-white shadow">
            <select className="text-xs border rounded px-1" defaultValue="All" onChange={(e)=>applyFilter('FloorName', e.target.value)}>
              <option value="All">Geschoss</option>
              {distinct('FloorName').map((f)=>(<option key={f} value={f}>{f}</option>))}
            </select>
            <select className="text-xs border rounded px-1" defaultValue="All" onChange={(e)=>applyFilter('name', e.target.value)}>
              <option value="All">Object Name</option>
              {distinct('name').map((n)=>(<option key={n} value={n}>{n}</option>))}
            </select>
            <select className="text-xs border rounded px-1" defaultValue="All" onChange={(e)=>applyFilter('Building', e.target.value)}>
              <option value="All">Gebäude</option>
              {distinct('Building').map((b)=>(<option key={b} value={b}>{b}</option>))}
            </select>
            <select className="text-xs border rounded px-1" defaultValue="All" onChange={(e)=>applyFilter('associated_task', e.target.value)}>
              <option value="All">Task</option>
              {distinct('associated_task').map((t)=>(<option key={t} value={t}>{t}</option>))}
            </select>
            <select className="text-xs border rounded px-1" defaultValue="All" onChange={(e)=>applyFilter('ifc/Type', e.target.value)}>
              <option value="All">IFC Type</option>
              {distinct('ifc/Type').map((t)=>(<option key={t} value={t}>{t}</option>))}
            </select>
            <select className="text-xs border rounded px-1" defaultValue="All" onChange={(e)=>applyFilter('3DModel', e.target.value)}>
              <option value="All">3D Model</option>
              {distinct('3DModel').map((m)=>(<option key={m} value={m}>{m}</option>))}
            </select>
            {/* metric dropdown */}
            <div className="ml-auto flex items-center gap-1 text-xs">
              <label>Metrik:</label>
              <select className="border rounded px-1" value={selectedMetric} onChange={(e)=>setSelectedMetric(e.target.value)}>
                <option value="sv/ConvexHullVolume">Volume</option>
                <option value="sv/ConvexHullSurfaceArea">Surface Area</option>
              </select>
            </div>
          </div>

          {/* Metrics summary */}
          <MetricsSummary filteredData={filteredData} />

          {/* Charts */}
          <div className="flex gap-4 overflow-x-auto flex-nowrap">
            <PieChart filteredData={filteredData} selectedMetric={selectedMetric} />
            <BarChart filteredData={filteredData} selectedMetric={selectedMetric} title={selectedMetric} />
            <BarChart filteredData={filteredData} selectedMetric="Object Count" title="Anzahl der Objekte" generateData={generateObjectCountData} />
          </div>

          {/* Aggregated table */}
          <AggregatedTable filteredData={filteredData} aggregationType={aggregationType} setAggregationType={setAggregationType} />
        </>
      )}
    </div>
  );
};

export default Classifier; 