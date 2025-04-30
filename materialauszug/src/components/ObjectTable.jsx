import React, { useState, useMemo } from 'react';

// Static data per Gewerk (trade)
const dataPerGewerk = {
  Lüftung: [
    { color: '#1E3A8A', symbol: 'Armaturen', count: 8 },
    { color: '#EC4899', symbol: 'Zulauf', count: 2924 },
    { color: '#22C55E', symbol: 'Standard 2', count: 35 },
    { color: '#60A5FA', symbol: 'Rücklauf', count: 55 }
  ],
  Heizung: [
    { color: '#F97316', symbol: 'Vorlauf', count: 180 },
    { color: '#EF4444', symbol: 'Rücklauf', count: 185 },
    { color: '#3B82F6', symbol: 'Armaturen', count: 25 },
    { color: '#10B981', symbol: 'Ventile', count: 15 }
  ],
  Sanitär: [
    { color: '#0EA5E9', symbol: 'Kaltwasser', count: 250 },
    { color: '#6366F1', symbol: 'Warmwasser', count: 200 },
    { color: '#F59E0B', symbol: 'Armaturen', count: 40 },
    { color: '#EF4444', symbol: 'Ventile', count: 22 }
  ],
  Elektro: [
    { color: '#FBBF24', symbol: 'Kabeltrassen', count: 300 },
    { color: '#EF4444', symbol: 'Schalter', count: 120 },
    { color: '#3B82F6', symbol: 'Steckdosen', count: 220 },
    { color: '#10B981', symbol: 'Leuchten', count: 95 }
  ]
};

const gewerke = Object.keys(dataPerGewerk);

const ObjectTable = () => {
  const [selectedGewerk, setSelectedGewerk] = useState('Lüftung');

  const rows = useMemo(() => dataPerGewerk[selectedGewerk] || [], [selectedGewerk]);
  const total = useMemo(() => rows.reduce((sum, r) => sum + r.count, 0), [rows]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Auswahlübersicht</h3>
        <select
          value={selectedGewerk}
          onChange={(e) => setSelectedGewerk(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {gewerke.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left text-sm font-medium text-gray-500">Symbol</th>
            <th className="py-2 text-right text-sm font-medium text-gray-500">Anzahl</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol} className="border-b">
              <td className="py-3 flex items-center">
                <span
                  className="w-3 h-3 mr-2 rounded-sm"
                  style={{ backgroundColor: row.color }}
                ></span>
                {row.symbol}
              </td>
              <td className="py-3 text-right font-medium">{row.count.toLocaleString()}</td>
            </tr>
          ))}
          <tr>
            <td className="py-3 font-medium">Gesamt</td>
            <td className="py-3 text-right font-medium">{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ObjectTable; 