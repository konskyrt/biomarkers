import React, { useState, useEffect, useMemo} from 'react';
import './App.css';
import * as XLSX from 'xlsx';
import logo from './ambergloglay.jpg'; // Adjust the path accordingly
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LogarithmicScale, // Import this
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, LogarithmicScale, zoomPlugin, Tooltip, Legend);

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

  const generateColors = (count) => {
    const colors = [];
    const step = Math.ceil(360 / count); // Distribute hues evenly across the color wheel
    for (let i = 0; i < count; i++) {
      const hue = (i * step) % 360; // Cycle through hues
      const saturation = 70; // Fixed saturation for vibrancy
      const lightness = 50; // Fixed lightness for clarity
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  };


  // Generate Object Count Data (Sorted and Colored)
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

    
  // Generate Bar Chart Data (Sorted and Colored)
  const generateBarChartData = () => {
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
      filteredData
        .filter((row) => {
          const ebkpValue = row['EBKP'];
          if (!ebkpValue) return false;
          return ebkpValue.split(' ').slice(1).join(' ') === label;
        })
        .reduce((sum, row) => sum + parseFloat(row[selectedMetric] || 0), 0)
    );
  
    const colors = labels.map(
      (_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)` // Golden angle color distribution
    );
  
    return {
      labels,
      datasets: [
        {
          label: `${selectedMetric}`,
          data,
          backgroundColor: colors,
        },
      ],
    };
  };
  
  const barChartOptions = {
    plugins: {
      legend: {
        display: false, // Disable the legend
      },
    },
  };
  
  
  const generatePieChartData = () => {
    const labels = [
      ...new Set(
        filteredData.map((row) => {
          const ebkpValue = row['EBKP'];
          if (ebkpValue) {
            // Remove initials and return descriptive part
            return ebkpValue.split(' ').slice(1).join(' ');
          }
          return null;
        }).filter(Boolean) // Remove null or undefined values
      ),
    ];
  
    const data = labels.map((label) =>
      filteredData
        .filter((row) => {
          const ebkpValue = row['EBKP'];
          if (!ebkpValue) return false;
          return ebkpValue.split(' ').slice(1).join(' ') === label;
        })
        .reduce((sum, row) => sum + parseFloat(row[selectedMetric] || 0), 0)
    );
  
    // Unified color palette
    const colors = labels.map(
      (_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)` // Golden angle color distribution
    );
  
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
        },
      ],
    };
  };
    
  const generateAggregatedTableData = (aggregateBy = 'sv/ConvexHullVolume') => {
    const uniqueFloors = [
      ...new Set(filteredData.map((row) => row['FloorName']).filter(Boolean)),
    ];
  
    const uniqueEBKPs = [
      ...new Set(
        filteredData.map((row) => {
          const ebkpValue = row['EBKP'];
          if (ebkpValue) {
            return ebkpValue.split(' ').slice(1).join(' ');
          }
          return null;
        }).filter(Boolean)
      ),
    ];
  
    const aggregatedData = uniqueEBKPs.map((ebkp) => {
      const row = { EBKP: ebkp };
  
      uniqueFloors.forEach((floor) => {
        const floorData = filteredData.filter(
          (row) =>
            row['FloorName'] === floor &&
            row['EBKP'] &&
            row['EBKP'].split(' ').slice(1).join(' ') === ebkp
        );
  
        row[floor] =
          aggregateBy === 'Volume'
            ? floorData.reduce((sum, item) => sum + parseFloat(item['Volume (m3)'] || 0), 0)
            : floorData.length; // Number of objects
      });
  
      return row;
    });
  
    return { uniqueFloors, aggregatedData };
  };
  
  const renderAggregatedTable = () => {
    const { uniqueFloors, aggregatedData } = generateAggregatedTableData(aggregationType);
  
    return (
      <div style={{ marginTop: '20px', overflowX: 'auto' }}>
        {/* Aggregation Type Selector */}
        <div style={{ marginBottom: '10px', textAlign: 'center' }}>
          <label style={{ fontSize: '0.9rem', marginRight: '10px' }}>Aggregate By:</label>
          <select
            value={aggregationType}
            onChange={(e) => setAggregationType(e.target.value)}
            style={{ fontSize: '0.9rem', padding: '5px', borderRadius: '4px' }}
          >
            <option value="Volume">Volumen</option>
            <option value="Objects">Anzahl der Objekte</option>
          </select>
        </div>
  
        {/* Aggregated Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'center',
            fontSize: '0.9rem',
          }}
        >
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '10px', backgroundColor: '#f7f7f7' }}>Objekt Kategorien</th>
              {uniqueFloors.map((floor, index) => (
                <th
                  key={index}
                  style={{ border: '1px solid #ccc', padding: '10px', backgroundColor: '#f7f7f7' }}
                >
                  {floor}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aggregatedData.map((row, rowIndex) => {
              const maxValue = Math.max(...uniqueFloors.map((floor) => row[floor] || 0));
              return (
                <tr key={rowIndex}>
                  <td style={{ border: '1px solid #ccc', padding: '10px' }}>{row.EBKP}</td>
                  {uniqueFloors.map((floor, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        border: '1px solid #ccc',
                        padding: '10px',
                        backgroundColor: `rgba(255, 140, 0, ${
                          row[floor] === maxValue ? 0.8 : row[floor] / maxValue
                        })`,
                      }}
                    >
                      {row[floor] ? row[floor].toFixed(5) : '0.00000'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
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

  const calculateMetrics = () => {
    const objects = filteredData.length; // Count the number of rows (Objects)
    const volume = filteredData.reduce((sum, row) => {
      const volumeValue = parseFloat(row['Volume (m3)'] || row['sv/ConvexHullVolume'] || 0);
      return sum + volumeValue;
    }, 0); // Sum the Volume, considering possible column name variations
  
    const categories = new Set(filteredData.map((row) => row['EBKP'])).size; // Count unique EBKP categories
  
    const tasks = new Set(
      filteredData.map((row) => row['Associated_Task'] || row['associated_task'] || '')
    ).size; // Count unique tasks, considering possible column name variations
  
    const sourceUris = new Set(filteredData.map((row) => row['sourceUri'])).size; // Count unique sourceUri values
  
    return { objects, volume, categories, tasks, sourceUris };
  };
  
  const metrics = calculateMetrics();

  const renderMetricsSummary = () => {
    const metrics = calculateMetrics();
  
    return (
      <div style={{ display: 'flex', gap: '20px', margin: '20px 0', justifyContent: 'center' }}>
        {/* Metrics Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between', // Spread out metrics evenly
            alignItems: 'center',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            gap: '203px', // Add space between metric boxes
          }}
        >
          {/* Individual Metric */}
          <div
            style={{
              textAlign: 'center',
              flex: '1',
              padding: '10px',
              border: '1px solid #eee',
              borderRadius: '5px',
              margin: '0 10px',
            }}
          >
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Objekte</p>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{metrics.objects}</h3>
          </div>
          <div
            style={{
              textAlign: 'center',
              flex: '1',
              padding: '10px',
              border: '1px solid #eee',
              borderRadius: '5px',
              margin: '0 10px',
            }}
          >
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Volumen (m³)</p>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{metrics.volume.toFixed(2)}</h3>
          </div>
          <div
            style={{
              textAlign: 'center',
              flex: '1',
              padding: '10px',
              border: '1px solid #eee',
              borderRadius: '5px',
              margin: '0 10px',
            }}
          >
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Kategorien</p>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{metrics.categories}</h3>
          </div>
          <div
            style={{
              textAlign: 'center',
              flex: '1',
              padding: '10px',
              border: '1px solid #eee',
              borderRadius: '5px',
              margin: '0 10px',
            }}
          >
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Aufgaben</p>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{metrics.tasks}</h3>
          </div>
          <div
            style={{
              textAlign: 'center',
              flex: '1',
              padding: '10px',
              border: '1px solid #eee',
              borderRadius: '5px',
              margin: '0 10px',
            }}
          >
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Modell</p>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{metrics.sourceUris}</h3>
          </div>
        </div>
      </div>
    );
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
              {renderMetricsSummary()}
    
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
                <div
                  style={{
                    flex: '1',
                    maxWidth: '300px',
                    border: '1px solid #ccc',
                    padding: '10px',
                    borderRadius: '5px',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1rem',
                      textAlign: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    Kategorieverteilung
                  </h3>
                  <div style={{ height: '200px' }}>
                    <Pie
                      data={generatePieChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          datalabels: {
                            display: true,
                            formatter: (value, context) => {
                              const dataset = context.chart.data.datasets[0];
                              const total = dataset.data.reduce(
                                (sum, val) => sum + val,
                                0
                              );
                              const percentage = (
                                (value / total) *
                                100
                              ).toFixed(1);
                              return `${percentage}%`;
                            },
                            color: '#fff',
                            font: {
                              size: 14,
                              weight: 'bold',
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: (tooltipItem) => {
                                const dataset = tooltipItem.dataset;
                                const total = dataset.data.reduce(
                                  (sum, value) => sum + value,
                                  0
                                );
                                const currentValue =
                                  dataset.data[tooltipItem.dataIndex];
                                const percentage = (
                                  (currentValue / total) *
                                  100
                                ).toFixed(2);
                                return `${tooltipItem.label}: ${percentage}%`;
                              },
                            },
                          },
                        },
                        cutout: '70%',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      maxHeight: '100px',
                      overflowY: 'auto',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      padding: '3px',
                      marginTop: '10px',
                    }}
                  >
                    <h4 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>
                      Legend
                    </h4>
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        textAlign: 'left',
                      }}
                    >
                      {generatePieChartData().labels.map((label, index) => (
                        <li
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '5px',
                          }}
                        >
                          <span
                            style={{
                              width: '15px',
                              height: '15px',
                              backgroundColor:
                                generatePieChartData().datasets[0]
                                  .backgroundColor[index],
                              display: 'inline-block',
                              marginRight: '10px',
                            }}
                          ></span>
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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
                  <div
                    style={{
                      flex: '1',
                      minWidth: '800px', // Increased width
                      border: '1px solid #ccc',
                      padding: '10px',
                      borderRadius: '5px',
                      backgroundColor: '#fff',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1rem',
                        textAlign: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      {selectedMetric}
                    </h3>
                    <Bar
                      data={generateBarChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          zoom: {
                            zoom: {
                              wheel: {
                                enabled: true, // Enable zooming with the mouse wheel
                              },
                              pinch: {
                                enabled: true, // Enable zooming with touch gestures
                              },
                              mode: 'x', // Zoom in the x-axis
                            },
                            pan: {
                              enabled: true,
                              mode: 'x', // Pan along the x-axis
                            },
                          },
                        },
                        scales: {
                          x: {
                            barPercentage: 0.6, // Adjust bar width
                            categoryPercentage: 0.8, // Adjust spacing between bars
                            ticks: {
                              autoSkip: false,
                              maxRotation: 45,
                              minRotation: 0,
                            },
                          },
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Object Count Chart */}
                  <div
                    style={{
                      flex: '1',
                      minWidth: '800px', // Increased width
                      border: '1px solid #ccc',
                      padding: '10px',
                      borderRadius: '5px',
                      backgroundColor: '#fff',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1rem',
                        textAlign: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      Anzahl der Objekte pro Kategorie
                    </h3>
                    <Bar
                      data={generateObjectCountData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          zoom: {
                            zoom: {
                              wheel: {
                                enabled: true, // Enable zooming with the mouse wheel
                              },
                              pinch: {
                                enabled: true, // Enable zooming with touch gestures
                              },
                              mode: 'x', // Zoom in the x-axis
                            },
                            pan: {
                              enabled: true,
                              mode: 'x', // Pan along the x-axis
                            },
                          },
                        },
                        scales: {
                          x: {
                            barPercentage: 0.6, // Adjust bar width
                            categoryPercentage: 0.8, // Adjust spacing between bars
                            ticks: {
                              autoSkip: false,
                              maxRotation: 45,
                              minRotation: 0,
                            },
                          },
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
    
              </div>
    
              {/* Aggregation Table */}
              {renderAggregatedTable()}
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