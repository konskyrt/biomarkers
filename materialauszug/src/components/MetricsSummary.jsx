import React from 'react';

const MetricsSummary = ({ filteredData }) => {
  const calculateMetrics = () => {
    const objects = filteredData.length;
    const volume = filteredData.reduce((sum, row) => {
      const v = parseFloat(row['Volume (m3)'] || row['sv/ConvexHullVolume'] || 0);
      return sum + v;
    }, 0);
    const categories = new Set(filteredData.map((r) => r['EBKP'])).size;
    const tasks = new Set(filteredData.map((r) => r['Associated_Task'] || r['associated_task'] || '')).size;
    const sourceUris = new Set(filteredData.map((r) => r['sourceUri'])).size;
    return { objects, volume, categories, tasks, sourceUris };
  };

  const metrics = calculateMetrics();

  const box = (label, value) => (
    <div className="flex-1 p-2 border rounded text-center bg-white shadow">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <h3 className="text-lg font-semibold">{value}</h3>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-4 my-4 justify-center max-w-full">
      {box('Objekte', metrics.objects)}
      {box('Volumen (m³)', metrics.volume.toFixed(2))}
      {box('Kategorien', metrics.categories)}
      {box('Aufgaben', metrics.tasks)}
      {box('Modelle', metrics.sourceUris)}
    </div>
  );
};

export default MetricsSummary; 