import React from 'react';

const FloorplanNavigator = () => {
  return (
    <div className="absolute top-4 right-4 bg-white p-4 shadow-lg rounded-lg z-10 w-64 max-h-[calc(100%-32px)] overflow-auto">
      <h4 className="font-medium text-gray-900 mb-3">Floor Plans</h4>
      <p className="text-sm text-gray-500 mb-3">
        This is a placeholder for the floor plan navigation feature.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((floor) => (
          <button
            key={floor}
            className="p-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex flex-col items-center"
          >
            <span className="font-medium">Floor {floor}</span>
            <span className="text-xs text-gray-500">+{floor * 3}m</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FloorplanNavigator; 