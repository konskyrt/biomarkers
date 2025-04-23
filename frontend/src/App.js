import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './Sidebar';
import MetricsSummary from './MetricsSummary';
import AggregatedTable from './AggregatedTable';
import BarChart from './BarChart';
import PieChart from './PieChart';
import BIM2LOG from './BIM2LOG';
import MaterialAuszug from './MaterialAuszug';
import * as XLSX from 'xlsx';
import logo from './logo.png'
// import logo from './ambergloglay.jpg'; // Adjust the path accordingly

const App = () => {
  const [bimData, setBimData] = useState([]);
  const [uploadedExcelData, setUploadedExcelData] = useState([]);
  const [currentSheet, setCurrentSheet] = useState(null);
  const [currentPage, setCurrentPage] = useState('Landing Page');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('sv/ConvexHullVolume');
  const [aggregationType, setAggregationType] = useState('sv/ConvexHullVolume'); // Default to Volume

  const baseSchedulePath = "Detailed_Schedules_forBIM.xlsx";

  useEffect(() => {
    // Load the base schedule
    fetch(baseSchedulePath)
      .then((response) => response.arrayBuffer())
      .then((data) => {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheets = workbook.SheetNames;
        const baseSchedule = sheets.map((sheetName) => ({
          sheetName,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]),
        }));
        setUploadedExcelData(baseSchedule);
        setCurrentSheet(baseSchedule[0]);
      })
      .catch((error) => console.error('Error loading base schedule:', error));
  }, []);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setBimData(sheetData);
      setFilteredData(sheetData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFilterBy3DModel = (e) => {
    const filter = e.target.value;
    if (filter === 'All') {
      setFilteredData(bimData);
    } else {
      const filtered = bimData.filter((row) => row['sourceUri'] === filter);
      setFilteredData(filtered);
    }
  };

  const handleFilterChange = (e) => {
    const filter = e.target.value;
    if (filter === 'All') {
      setFilteredData(bimData);
    } else {
      const filtered = bimData.filter((row) => row['FloorName'] === filter);
      setFilteredData(filtered);
    }
  };

  const handleFilterByName = (e) => {
    const filter = e.target.value;
    if (filter === 'All') {
      setFilteredData(bimData);
    } else {
      const filtered = bimData.filter((row) => row['name'] === filter);
      setFilteredData(filtered);
    }
  };

  const handleFilterByBuilding = (e) => {
    const filter = e.target.value;
    if (filter === 'All') {
      setFilteredData(bimData);
    } else {
      const filtered = bimData.filter((row) => row['Building'] === filter);
      setFilteredData(filtered);
    }
  };

  const handleFilterByTask = (e) => {
    const filter = e.target.value;
    if (filter === 'All') {
      setFilteredData(bimData);
    } else {
      const filtered = bimData.filter((row) => row['associated_task'] === filter);
      setFilteredData(filtered);
    }
  };

  const handleFilterByType = (e) => {
    const filter = e.target.value;
    if (filter === 'All') {
      setFilteredData(bimData);
    } else {
      const filtered = bimData.filter((row) => row['ifc/Type'] === filter);
      setFilteredData(filtered);
    }
  };

  const generateObjectCountData = () => {
    const labels = [
      ...new Set(
        filteredData.map((row) => {
          const ebkpValue = row['EBKP'];
          if (ebkpValue) {
            return ebkpValue.split(' ').slice(1).join(' '); // Remove initials
          }
          return null;
        }).filter(Boolean)
      ),
    ];
  
    const data = labels.map((label) =>
      filteredData.filter((row) => {
        const ebkpValue = row['EBKP'];
        if (!ebkpValue) return false;
        return ebkpValue.split(' ').slice(1).join(' ') === label;
      }).length
    );
  
    const colors = labels.map(
      (_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)` // Golden angle color distribution
    );
  
    return {
      labels,
      datasets: [
        {
          label: 'Number of Objects',
          data,
          backgroundColor: colors,
        },
      ],
    };
  };
  

  const renderContent = () => {
    switch (currentPage) {
      case 'BIM Data Analysis':
        return (
          <div className="bim-data-analysis">
            {/* Upload BIM Model */}
            <div style={{ marginBottom: '5px' }}>
              <label style={{ fontSize: '0.8rem', marginRight: '5px' }}>
                Ihr BIM-Modell hochladen:
              </label>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleExcelUpload}
                style={{ fontSize: '0.7rem', padding: '2px', minWidth: '120px' }}
              />
            </div>
            {/* Filters */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                marginBottom: '5px',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {/* Filter by Floor */}
                <select
                  onChange={handleFilterChange}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    Geschoss
                  </option>
                  {[...new Set(bimData.map((row) => row['FloorName']))].map(
                    (floor, index) => (
                      <option key={index} value={floor}>
                        {floor}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by Name */}
                <select
                  onChange={handleFilterByName}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    Object Name
                  </option>
                  {[...new Set(bimData.map((row) => row['name']))].map(
                    (name, index) => (
                      <option key={index} value={name}>
                        {name}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by Building */}
                <select
                  onChange={handleFilterByBuilding}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    Gebäude
                  </option>
                  {[...new Set(bimData.map((row) => row['Building']))].map(
                    (building, index) => (
                      <option key={index} value={building}>
                        {building}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by Associated Task */}
                <select
                  onChange={handleFilterByTask}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    Task Name
                  </option>
                  {[...new Set(bimData.map((row) => row['associated_task']))].map(
                    (task, index) => (
                      <option key={index} value={task}>
                        {task}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by IFC/Type */}
                <select
                  onChange={handleFilterByType}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    IFC-Typ
                  </option>
                  {[...new Set(bimData.map((row) => row['ifc/Type']))].map(
                    (type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by 3D Model */}
                <select
                  onChange={(e) => handleFilterBy3DModel(e)}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    3D-Modell
                  </option>
                  {[...new Set(bimData.map((row) => row['3DModel']))].map(
                    (model, index) => (
                      <option key={index} value={model}>
                        {model}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Metric Dropdown */}
              <div style={{ marginLeft: 'auto' }}>
                <label style={{ fontSize: '0.8rem', marginRight: '5px' }}>
                  Metrik:
                </label>
                <select
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="sv/ConvexHullVolume">Volume</option>
                  <option value="sv/ConvexHullSurfaceArea">Surface Area</option>
                </select>
              </div>
            </div>
            <MetricsSummary filteredData={filteredData} />

            {/* Charts Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '20px',
                marginTop: '10px',
              }}
            >
              {/* Pie Chart with Legend */}
              <PieChart filteredData={filteredData} selectedMetric={selectedMetric} />
              {/* Bar Charts */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '20px',
                  overflowX: 'auto', // Enable horizontal scrolling
                  height: '400px', // Adjusted height
                }}
              >
                {/* Volume Chart */}
                <BarChart
                  filteredData={filteredData}
                  selectedMetric={selectedMetric}
                  title={selectedMetric}
                />

                {/* Object Count Chart */}
                <BarChart
                  filteredData={filteredData}
                  selectedMetric="Object Count"
                  title="Anzahl der Objekte pro Kategorie"
                  generateData={generateObjectCountData}
                />
              </div>
            </div>

            {/* Aggregation Table */}
            <AggregatedTable
              filteredData={filteredData}
              aggregationType={aggregationType}
              setAggregationType={setAggregationType}
            />
          </div>
        );
      
      case 'BIM2LOG':
        return <BIM2LOG />;
      case 'MaterialAuszug':
        return <MaterialAuszug />;
      case 'Classifier':
        return (
          <div className="bim-data-analysis">
            {/* Upload BIM Model */}
            <div style={{ marginBottom: '5px' }}>
              <label style={{ fontSize: '0.8rem', marginRight: '5px' }}>
                Ihr BIM-Modell hochladen:
              </label>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleExcelUpload}
                style={{ fontSize: '0.7rem', padding: '2px', minWidth: '120px' }}
              />
            </div>
            {/* Filters */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                marginBottom: '5px',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {/* Filter by Floor */}
                <select
                  onChange={handleFilterChange}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    Geschoss
                  </option>
                  {[...new Set(bimData.map((row) => row['FloorName']))].map(
                    (floor, index) => (
                      <option key={index} value={floor}>
                        {floor}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by Name */}
                <select
                  onChange={handleFilterByName}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    Object Name
                  </option>
                  {[...new Set(bimData.map((row) => row['name']))].map(
                    (name, index) => (
                      <option key={index} value={name}>
                        {name}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by Building */}
                <select
                  onChange={handleFilterByBuilding}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    Gebäude
                  </option>
                  {[...new Set(bimData.map((row) => row['Building']))].map(
                    (building, index) => (
                      <option key={index} value={building}>
                        {building}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by Associated Task */}
                <select
                  onChange={handleFilterByTask}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    Task Name
                  </option>
                  {[...new Set(bimData.map((row) => row['associated_task']))].map(
                    (task, index) => (
                      <option key={index} value={task}>
                        {task}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by IFC/Type */}
                <select
                  onChange={handleFilterByType}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    IFC-Typ
                  </option>
                  {[...new Set(bimData.map((row) => row['ifc/Type']))].map(
                    (type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    )
                  )}
                </select>

                {/* Filter by 3D Model */}
                <select
                  onChange={(e) => handleFilterBy3DModel(e)}
                  defaultValue="All"
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="All" disabled>
                    3D-Modell
                  </option>
                  {[...new Set(bimData.map((row) => row['3DModel']))].map(
                    (model, index) => (
                      <option key={index} value={model}>
                        {model}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Metric Dropdown */}
              <div style={{ marginLeft: 'auto' }}>
                <label style={{ fontSize: '0.8rem', marginRight: '5px' }}>
                  Metrik:
                </label>
                <select
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '3px', minWidth: '100px' }}
                >
                  <option value="sv/ConvexHullVolume">Volume</option>
                  <option value="sv/ConvexHullSurfaceArea">Surface Area</option>
                </select>
              </div>
            </div>
            <MetricsSummary filteredData={filteredData} />

            {/* Charts Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '20px',
                marginTop: '10px',
              }}
            >
              {/* Pie Chart with Legend */}
              <PieChart filteredData={filteredData} selectedMetric={selectedMetric} />
              {/* Bar Charts */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '20px',
                  overflowX: 'auto', // Enable horizontal scrolling
                  height: '400px', // Adjusted height
                }}
              >
                {/* Volume Chart */}
                <BarChart
                  filteredData={filteredData}
                  selectedMetric={selectedMetric}
                  title={selectedMetric}
                />

                {/* Object Count Chart */}
                <BarChart
                  filteredData={filteredData}
                  selectedMetric="Object Count"
                  title="Anzahl der Objekte pro Kategorie"
                  generateData={generateObjectCountData}
                />
              </div>
            </div>

            {/* Aggregation Table */}
            <AggregatedTable
              filteredData={filteredData}
              aggregationType={aggregationType}
              setAggregationType={setAggregationType}
            />
          </div>
        );
      case 'Landing Page':
        return (
          <div className="landing-page">
            <header className="header">
              <img src={logo} alt="Amberg Loglay" className="header-logo" />
              <h1>BIM Schedule Functionalities</h1>
              <p>Manage BIM data, Generate schedules, Intergrated.</p>
              <button onClick={() => setCurrentPage('BIM Data Analysis')}>Get Started</button>
            </header>
          </div>
        );
      default:
        return <div>Select a page from the sidebar</div>;
    }
  };

  return (
    <div className="app">
      {currentPage === 'Landing Page' ? (
        <div className="landing-page">
          <header className="header">
            <img src={logo} alt="Amberg Loglay" className="header-logo" />
            <h1>BIM Schedule Functionalities</h1>
            <p>Manage BIM data, Generate schedules, Intergrated.</p>
            <button onClick={() => setCurrentPage('BIM Data Analysis')}>Get Started</button>
          </header>
        </div>
      ) : (
        <>
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} logo={logo} />
          <main className="main-content">{renderContent()}</main>
        </>
      )}
    </div>
  );
};

export default App;

