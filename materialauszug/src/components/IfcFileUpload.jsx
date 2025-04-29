import React, { useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const IfcFileUpload = ({ onFileSelected }) => {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.ifc')) {
        setFileName(file.name);
        onFileSelected(file);
      } else {
        alert('Please upload an IFC file');
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.ifc')) {
        setFileName(file.name);
        onFileSelected(file);
      } else {
        alert('Please upload an IFC file');
      }
    }
  };

  return (
    <div className="mb-4">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center ${
          dragging ? 'border-primary bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ArrowUpTrayIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        {fileName ? (
          <p className="text-sm font-medium text-gray-900">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-900">
              Drop your IFC file here or
            </p>
            <label className="mt-2 inline-block">
              <span className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded text-sm cursor-pointer">
                Browse files
              </span>
              <input
                type="file"
                accept=".ifc"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
};

export default IfcFileUpload; 