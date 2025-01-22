import React, { useState, useEffect } from 'react';
import './App.css';
import * as XLSX from 'xlsx';
import logo from './ambergloglay.jpg'; // Adjust the path accordingly
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const App = () => {
  const [bimData, setBimData] = useState([]);
  const [uploadedExcelData, setUploadedExcelData] = useState([]);
  const [currentSheet, setCurrentSheet] = useState(null);
  const [currentPage, setCurrentPage] = useState('Landing Page');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('sv/ConvexHullVolume');

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

  const generateObjectCountData = () => {
    const labels = [...new Set(filteredData.map((row) => row['EBKP']))];
    const data = labels.map(
      (label) =>
        filteredData.filter((row) => row['EBKP'] === label).length // Count the number of objects
    );
  
    return {
      labels,
      datasets: [
        {
          label: 'Number of Objects per EBKP',
          data,
          backgroundColor: labels.map((_, i) => `hsl(${(i * 40 + 180) % 360}, 70%, 50%)`),
        },
      ],
    };
  };
  
  const renderEbkpHierarchy = () => {
    // Group EBKP data into hierarchical levels
    const hierarchy = {};
    filteredData.forEach((row) => {
      const ebkpValue = row['EBKP']; // Safely access EBKP
      if (!ebkpValue) return; // Skip rows with no EBKP value
  
      const ebkpParts = ebkpValue.split('.'); // Split EBKP into parts
      if (!hierarchy[ebkpParts[0]]) {
        hierarchy[ebkpParts[0]] = {};
      }
      if (ebkpParts[1]) {
        if (!hierarchy[ebkpParts[0]][ebkpParts[1]]) {
          hierarchy[ebkpParts[0]][ebkpParts[1]] = {};
        }
        if (ebkpParts[2]) {
          if (!hierarchy[ebkpParts[0]][ebkpParts[1]][ebkpParts[2]]) {
            hierarchy[ebkpParts[0]][ebkpParts[1]][ebkpParts[2]] = [];
          }
          hierarchy[ebkpParts[0]][ebkpParts[1]][ebkpParts[2]].push(row);
        }
      }
    });
  
    const renderLevel = (levelData, level) => {
      return Object.keys(levelData).map((key, index) => {
        const hasChildren = typeof levelData[key] === 'object' && !Array.isArray(levelData[key]);
  
        return (
          <div key={index} style={{ marginLeft: `${level * 20}px`, marginBottom: '10px' }}>
            <div
              style={{
                cursor: hasChildren ? 'pointer' : 'default',
                fontWeight: hasChildren ? 'bold' : 'normal',
                border: '1px solid #ccc',
                padding: '5px',
                borderRadius: '5px',
                backgroundColor: hasChildren ? '#f7f7f7' : '#ffffff',
              }}
              onClick={(e) => {
                if (hasChildren) {
                  const element = e.currentTarget.nextSibling;
                  if (element.style.display === 'none') {
                    element.style.display = 'block';
                  } else {
                    element.style.display = 'none';
                  }
                }
              }}
            >
              {key}
            </div>
            {hasChildren && (
              <div style={{ display: 'none' }}>
                {renderLevel(levelData[key], level + 1)}
              </div>
            )}
            {!hasChildren &&
              levelData[key].map((item, subIndex) => (
                <div key={subIndex} style={{ marginLeft: '20px', padding: '5px' }}>
                  <strong>
                    {item['EBKP'].replace(/^[A-Za-z0-9.]+\s*/, '') /* Extract descriptive part */}
                  </strong>
                </div>
              ))}
          </div>
        );
      });
    };
  
    return <div>{renderLevel(hierarchy, 0)}</div>;
  };
  

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

  const handleFilterChange = (e) => {
    const filter = e.target.value;
    if (filter === 'All') {
      setFilteredData(bimData);
    } else {
      const filtered = bimData.filter((row) => row['FloorName'] === filter);
      setFilteredData(filtered);
    }
  };

  const generateBarChartData = () => {
    const labels = [...new Set(filteredData.map((row) => row['EBKP']))];
    const data = labels.map((label) =>
      filteredData
        .filter((row) => row['EBKP'] === label)
        .reduce((sum, row) => sum + parseFloat(row[selectedMetric] || 0), 0)
    );

    return {
      labels,
      datasets: [
        {
          label: `Bar Chart: ${selectedMetric}`,
          data,
          backgroundColor: labels.map((_, i) => `hsl(${(i * 40) % 360}, 70%, 50%)`),
        },
      ],
    };
  };

  const generatePieChartData = () => {
    const labels = [...new Set(filteredData.map((row) => row['EBKP']))];
    const data = labels.map((label) =>
      filteredData
        .filter((row) => row['EBKP'] === label)
        .reduce((sum, row) => sum + parseFloat(row[selectedMetric] || 0), 0)
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, i) => `hsl(${(i * 40) % 360}, 70%, 50%)`),
        },
      ],
    };
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'BIM Data Analysis':
        return (
          <div className="bim-data-analysis">
            <h2>BIM Data Analysis</h2>
            <div style={{ marginBottom: '20px' }}>
              <label>Upload BIM Data (Excel):</label>
              <input type="file" accept=".xlsx" onChange={handleExcelUpload} />
            </div>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <div>
                <label>Filter by Floor:</label>
                <select onChange={(e) => handleFilterChange(e, 'FloorName')}>
                  <option value="All">All</option>
                  {[...new Set(bimData.map((row) => row['FloorName']))].map((floor, index) => (
                    <option key={index} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Filter by Name:</label>
                <select onChange={(e) => handleFilterChange(e, 'name')}>
                  <option value="All">All</option>
                  {[...new Set(bimData.map((row) => row['name']))].map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Filter by Building:</label>
                <select onChange={(e) => handleFilterChange(e, 'Building')}>
                  <option value="All">All</option>
                  {[...new Set(bimData.map((row) => row['Building']))].map((building, index) => (
                    <option key={index} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Metric:</label>
              <select onChange={(e) => setSelectedMetric(e.target.value)}>
                <option value="sv/ConvexHullVolume">Volume</option>
                <option value="sv/ConvexHullSurfaceArea">Surface Area</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <aside style={{ width: '25%', borderRight: '1px solid #ccc' }}>
                <h3>Hierarchy</h3>
                {renderEbkpHierarchy()}
              </aside>
              <div style={{ width: '70%' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3>Bar Chart: {selectedMetric}</h3>
                  <Bar data={generateBarChartData()} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <h3>Number of Objects per EBKP</h3>
                  <Bar data={generateObjectCountData()} />
                </div>
                <div>
                  <h3>Pie Chart</h3>
                  <Pie data={generatePieChartData()} />
              </div>
              </div>
            </div>
          </div>
        );

        case 'Construction Feature Predictor':
          return (
            <div className="construction-feature-predictor">
              <h2>Construction Feature Predictor</h2>
              <p>Predict construction features using advanced analytics.</p>
              <form>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Phase of Project to Predict Volumes:
                  </label>
                  <input type="text" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Disciplines Included:
                  </label>
                  <input type="text" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Number of Buildings:
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Type of Buildings:
                  </label>
                  <input type="text" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Type of Construction:
                  </label>
                  <input type="text" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Number of Floors:
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Building Area (m²):
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Site Area (m²):
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Occupied Area (m²):
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Area per Floor (m²):
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Volume per Floor (m³):
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Total Floor Area (m²):
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Foundation Type:
                  </label>
                  <input type="text" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Construction Start:
                  </label>
                  <input type="date" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Construction End:
                  </label>
                  <input type="date" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Consolidation Center:
                  </label>
                  <input type="text" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Number of Workers:
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Number of Building Entrances:
                  </label>
                  <input type="number" style={{ fontSize: '1rem', width: '100%' }} />
                </div>
                <button type="submit" style={{ fontSize: '1rem', padding: '10px 20px' }}>Predict</button>
              </form>
            </div>
        );        
        case 'Schedule Generator':
          return (
            <div className="schedule-generation">
              <h2>Generate Schedule</h2>
              <p>Below is a sample Gantt chart to visualize your schedule:</p>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <img
                  src="/gantt.jpg"
                  alt="Gantt Chart"
                  style={{ width: '80%', height: 'auto', border: '1px solid #dee2e6', borderRadius: '8px' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'fallback-image.jpg'; }}
                />
              </div>
            </div>
        );
      default:
        
        return (
          <div className="landing-page">
            <h1>Welcome to the Project Management Tool</h1>
            <p>Manage BIM data, generate schedules, and analyze construction tasks efficiently.</p>
          </div>
        );
    }
  };
  
  return (
    <div className="app">
      {currentPage === 'Landing Page' ? (
        <div className="landing-page">
          <header className="header">
            <img src={logo} alt="Amberg Loglay" className="header-logo" />
            <h1>Welcome to the new age of Construction Workflow integration</h1>
            <button onClick={() => setCurrentPage('BIM Data Analysis')}>Get Started</button>
          </header>
        </div>
      ) : (
        <>
          <aside className="sidebar">
            <div className="logo-container">
              <img src={logo} alt="Amberg Loglay" className="logo" />
            </div>
            <ul>
              <li onClick={() => setCurrentPage('BIM Data Analysis')}>BIM Data Analysis</li>
              <li onClick={() => setCurrentPage('Construction Feature Predictor')}>Construction Feature Predictor</li>
              <li onClick={() => setCurrentPage('Schedule Generator')}>Schedule Generator</li>
              <li onClick={() => setCurrentPage('BIMChat')}>BIMChat</li>
            </ul>
          </aside>
          <main className="main-content">{renderContent()}</main>
        </>
      )}
    </div>
  );
};

export default App;