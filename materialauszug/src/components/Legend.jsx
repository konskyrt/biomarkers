import React from 'react';

const items = [
  { label: 'H: Heizung', color: '#F44336' },  // Red
  { label: 'S: Sanitär', color: '#2196F3' },  // Blue
  { label: 'L: Lüftung', color: '#4CAF50' },  // Green
  { label: 'E: Elektro', color: '#FFEB3B' }   // Yellow
];

export default function Legend() {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Legende</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <span 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 