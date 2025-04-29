import React from 'react';

const rows = [
  { color: '#1E3A8A', symbol: 'Taps', count: 8 },
  { color: '#EC4899', symbol: 'Supply', count: 2924 },
  { color: '#22C55E', symbol: 'Standard 2', count: 35 },
  { color: '#60A5FA', symbol: 'Return', count: 55 }
];

const ObjectTable = () => (
  <div className="bg-white shadow rounded-lg p-4">
    <h3 className="text-lg font-medium mb-4">Auswahlübersicht</h3>
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="py-2 text-left text-sm font-medium text-gray-500">Symbol</th>
          <th className="py-2 text-right text-sm font-medium text-gray-500">Anzahl</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
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
          <td className="py-3 text-right font-medium">
            {rows.reduce((sum, row) => sum + row.count, 0).toLocaleString()}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export default ObjectTable; 