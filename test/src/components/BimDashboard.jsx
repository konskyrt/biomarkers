import React, { useState } from 'react';
import CategoryPieChart from './CategoryPieChart';
import ObjectFamilyBarChart from './ObjectFamilyBarChart';
import ObjectTable from './ObjectTable';
import IfcViewer from './IfcViewer';
import IfcFileUpload from './IfcFileUpload';

const BimDashboard = () => {
  const [ifcFile, setIfcFile] = useState(null);

  const handleFileSelected = (file) => {
    setIfcFile(file);
  };

  return (
    <div className="p-6 bg-bg">
      <h2 className="text-2xl font-bold mb-6">BIM Dashboard</h2>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left column with stacked components */}
        <div className="col-span-5 grid grid-cols-1 gap-6">
          {/* File upload component */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Import IFC File</h3>
            <IfcFileUpload onFileSelected={handleFileSelected} />
          </div>
          
          {/* Object selection summary */}
          <div>
            <ObjectTable />
          </div>
          
          {/* Category pie chart */}
          <div>
            <CategoryPieChart />
          </div>
          
          {/* Object family bar chart */}
          <div>
            <ObjectFamilyBarChart />
          </div>
        </div>
        
        {/* Main IFC viewer on the right - with full height to match left column */}
        <div className="col-span-7 flex">
          <div className="flex-1 flex flex-col">
            <IfcViewer ifcFile={ifcFile} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BimDashboard; 