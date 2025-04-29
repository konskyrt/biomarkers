import React, { useState } from 'react';
import CategoryPieChart from './CategoryPieChart';
import ObjectFamilyBarChart from './ObjectFamilyBarChart';
import ObjectTable from './ObjectTable';
import IfcFileUpload from './IfcFileUpload';
import IfcViewerNoFrag from './IfcViewerNoFrag';
import IfcViewer from './IfcViewer';
import TypeFilterPanel from './TypeFilterPanel';

const BimDashboard = () => {
  const [ifcFile, setIfcFile] = useState(null);
  const [types, setTypes] = useState([]);
  const [hidden, setHidden] = useState([]);

  const handleFileSelected = (file) => {
    setIfcFile(file);
  };

  const toggleType = (t) => {
    setHidden((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div className="p-6 bg-bg">
      <TypeFilterPanel types={types} hidden={hidden} toggle={toggleType} className="mb-6" />

      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Left column with stacked components */}
        <div className="col-span-5 grid grid-cols-1 gap-6">
          {/* File upload component */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">IFC-Datei importieren</h3>
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
          <div className="flex-1 flex flex-col space-y-4">
            <IfcViewer ifcFile={ifcFile} hiddenCategories={hidden} onTypesDetected={setTypes} />
            {/* <IfcViewerNoFrag ifcFile={ifcFile} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BimDashboard; 