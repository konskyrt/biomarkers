import React from 'react';

const AggregatedTable = ({ filteredData, aggregationType, setAggregationType }) => {
  const aggregateData = () => {
    const aggregation = {};
    filteredData.forEach((row) => {
      const ebkpValue = row['EBKP'];
      if (!ebkpValue) return;
      const key = ebkpValue.split(' ').slice(1).join(' ');
      const value = aggregationType === 'Object Count' ? 1 : parseFloat(row[aggregationType] || 0);
      aggregation[key] = (aggregation[key] || 0) + value;
    });

    return Object.entries(aggregation)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  const aggregatedData = aggregateData();

  return (
    <div className="mt-4 border p-2 rounded bg-white shadow">
      <div className="flex items-center mb-2">
        <label className="text-sm mr-2">Aggregation:</label>
        <select value={aggregationType} onChange={(e)=>setAggregationType(e.target.value)} className="text-sm border rounded px-1 py-0.5">
          <option value="Object Count">Anzahl der Objekte</option>
          <option value="sv/ConvexHullVolume">Volumen</option>
          <option value="sv/ConvexHullSurfaceArea">Fläche</option>
        </select>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-1">Kategorie</th>
            <th className="text-right p-1">Wert</th>
          </tr>
        </thead>
        <tbody>
          {aggregatedData.map((row)=>(
            <tr key={row.label} className="border-t">
              <td className="p-1">{row.label}</td>
              <td className="p-1 text-right">{row.value.toFixed ? row.value.toFixed(2) : row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AggregatedTable; 