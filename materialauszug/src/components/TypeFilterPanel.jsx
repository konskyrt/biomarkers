import React from 'react';

const TypeFilterPanel = ({ types = [], hidden = [], toggle }) => {
  const hasTypes = types.length > 0;
  return (
    <div className="bg-white p-4 rounded-lg shadow max-h-64 overflow-y-auto">
      <h3 className="text-lg font-medium mb-2">IFC Type Filter</h3>
      {hasTypes ? (
        <div className="space-y-1">
          {types.map((t) => (
            <label key={t} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={!hidden.includes(t)}
                onChange={() => toggle(t)}
              />
              <span>{t}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No types detected yet.</p>
      )}
    </div>
  );
};

export default TypeFilterPanel; 