import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DashboardItem from './DashboardItem';
import './MaterialAuszug.css';

// Three.js imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// IFC parser must load before fragments
import 'web-ifc';
// Fragments loader and IFC importer
import { FragmentsModels, IfcImporter } from '@thatopen/fragments';
// Import Chart.js and necessary components for the pie chart
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

// React-Grid-Layout helper
const ReactGridLayout = WidthProvider(RGL);

// Map prefixes to display names
const gewerkeMap = { SN: 'Sanitär', EL: 'Elektro', SPR: 'Sprinkler', HZ: 'Heizung', KT: 'Kälte', LF: 'Lüftung' };
// Colors per Gewerk
const gewerkeColors = { SN: '#2196F3', EL: '#FF9800', SPR: '#E91E63', HZ: '#F44336', KT: '#00BCD4', LF: '#4CAF50', Alle: '#757575' };

const serializer = new IfcImporter();
// const serializer = new FragmentSerializer();
serializer.wasm = { absolute: true, path: "https://unpkg.com/web-ifc@0.0.68/" };
// A convenient variable to hold the ArrayBuffer data loaded into memory
let fragmentBytes = null;
let onConversionFinish = () => {
  console.log("onConversionFinish");
};

// Add this CSS to MaterialAuszug.css or inject it as a styled component
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .custom-file-input {
    display: flex;
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 5px;
    width: 100%;
  }
  
  .file-button {
    background-color: #e0e0e0;
    padding: 5px 10px;
    cursor: pointer;
    display: inline-block;
    flex-shrink: 0;
    font-size: 12px;
  }
  
  .file-text {
    padding: 5px 10px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-grow: 1;
    font-size: 12px;
  }
  
  .file-upload {
    margin-bottom: 10px;
    cursor: pointer;
    display: block;
    font-weight: 500;
  }
  
  .dropdown-overlay {
    position: absolute;
    z-index: 1000;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    max-height: 400px;
    overflow-y: auto;
    min-width: 200px;
  }
  
  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    background-color: #f8f8f8;
    position: sticky;
    top: 0;
  }
  
  .dropdown-content {
    padding: 8px;
  }
  
  .dropdown-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .dropdown-list li {
    padding: 6px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f5f5f5;
  }
  
  .dropdown-list li:hover {
    background-color: #f8f8f8;
  }
  
  .dropdown-list li.selected {
    background-color: #e8f4ff;
  }
  
  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #555;
    font-size: 0.9rem;
  }
`;
document.head.appendChild(styleSheet);

export default function MaterialAuszug() {
  // Spreadsheet state & filters
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [gew, setGew] = useState('Alle');
  const [mdl, setMdl] = useState('');
  const [flr, setFlr] = useState('');
  const [kat, setKat] = useState('');
  const [btl, setBtl] = useState('');
  
  // Expanded state tracking
  const [expandedKategorien, setExpandedKategorien] = useState(false);
  const [expandedBauteile, setExpandedBauteile] = useState(false);
  const [expandedLegend, setExpandedLegend] = useState(false);
  const [expandedBarcharts, setExpandedBarcharts] = useState(false);
  
  // Refs for positioning dropdowns
  const kategorienRef = useRef(null);
  const bauteileRef = useRef(null);
  const legendRef = useRef(null);
  const barchartsRef = useRef(null);

  // Refs for viewer & loader
  const viewerRef = useRef(null);
  const rawBufferRef = useRef(null);
  const loaderRef = useRef(null);
  const listenerRef = useRef(null);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const fragmentsRef = useRef(null);

  // Initialize 3D scene
  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 5, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    scene.add(new THREE.AxesHelper(5));
    scene.add(new THREE.GridHelper(20, 20));
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 10, 10);
    scene.add(dir);

    const resize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', resize);

      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (loaderRef.current && listenerRef.current) {
        // Check if onItemSet is a Map (has delete method) or another type of event system
        if (loaderRef.current.models.list.onItemSet && 
            typeof loaderRef.current.models.list.onItemSet.delete === 'function') {
        loaderRef.current.models.list.onItemSet.delete(listenerRef.current);
        } else if (loaderRef.current.models.list.onItemSet && 
                  typeof loaderRef.current.models.list.onItemSet.remove === 'function') {
          // Some event systems use 'remove' instead of 'delete'
          loaderRef.current.models.list.onItemSet.remove(listenerRef.current);
        }
      }
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  // Initialize fragments library
  useEffect(() => {
    (async () => {
      try {
        // Create a worker file for fragments
        const workerUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
        const fetchedWorker = await fetch(workerUrl);
        const workerText = await fetchedWorker.text();
        const workerFile = new File([new Blob([workerText])], "worker.mjs", {
          type: "text/javascript",
        });
        const url = URL.createObjectURL(workerFile);
        
        // Initialize fragments models
        const fragments = new FragmentsModels(url);
        fragmentsRef.current = fragments;
        
        // Set up model loading listener
        const onModel = ({ value: model }) => {
          if (model && cameraRef.current && sceneRef.current) {
            model.useCamera(cameraRef.current);
            sceneRef.current.add(model.object);
            fragments.update(true);
          }
        };
        
        // Check if onItemSet.add is a function before using it
        if (fragments.models.list.onItemSet && typeof fragments.models.list.onItemSet.add === 'function') {
          fragments.models.list.onItemSet.add(onModel);
          listenerRef.current = onModel;
        } else if (fragments.models.list.onItemSet && typeof fragments.models.list.onItemSet.on === 'function') {
          // Some event systems use 'on' instead of 'add'
          fragments.models.list.onItemSet.on(onModel);
          listenerRef.current = onModel;
        } else {
          console.warn("Could not attach model loading listener: onItemSet.add is not a function");
        }
        loaderRef.current = fragments;
        
        console.log("Fragments library initialized successfully");
      } catch (error) {
        console.error("Error initializing fragments library:", error);
      }
    })();
  }, []);

  const loadIFC = async (ifcBuffer) => {
    try {
      console.log("Loading IFC file...");
      
      // Initialize IFC importer
      const importer = new IfcImporter();
      importer.wasm = { 
        absolute: true, 
        path: "https://unpkg.com/web-ifc@0.0.68/" 
      };
      
      // Process IFC buffer to fragments format
      const ifcBytes = new Uint8Array(ifcBuffer);
      console.log("Converting IFC to fragments format...");
      const fragmentsData = await importer.process({ bytes: ifcBytes });
      
      if (!fragmentsData) {
        console.error("Failed to convert IFC to fragments format");
        return;
      }
      
      console.log("IFC converted successfully, loading model...");
      
      // Load the model with fragments
      if (fragmentsRef.current) {
        const model = await fragmentsRef.current.load(fragmentsData, { modelId: "imported-model" });
        
        if (model && cameraRef.current && sceneRef.current) {
          model.useCamera(cameraRef.current);
          sceneRef.current.add(model.object);
          await fragmentsRef.current.update(true);
          console.log("Model loaded successfully");
        }
      } else {
        console.error("Fragments loader not initialized");
      }
    } catch (error) {
      console.error("Error loading IFC:", error);
    }
  };

  // Filter spreadsheet data
  useEffect(() => {
    let d = data;
    if (gew !== 'Alle') d = d.filter(r => (r['label code']||'').split('.')[0] === gew);
    if (mdl)       d = d.filter(r => r['File Name'] === mdl);
    if (flr)       d = d.filter(r => r.Floor === flr);
    if (kat)       d = d.filter(r => r.type === kat);
    if (btl)       d = d.filter(r => r['label name'] === btl);
    setFiltered(d);
  }, [data, gew, mdl, flr, kat, btl]);

  // Handle file upload
  const handleFileUpload = async e => {
    const file = e.target.files[0]; 
    if (!file) return;
    
    let buffer;
    try {
      buffer = await file.arrayBuffer();
      rawBufferRef.current = buffer;
    } catch (err) {
      console.error('Read error:', err);
      alert('Error reading file');
      return;
    }

    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();

    if (ext === 'ifc') {
      console.log("Processing IFC file:", name);
      loadIFC(buffer);
    } else if (ext === 'xlsx') {
      console.log("Processing XLSX file:", name);
      try {
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const arr = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setData(arr);
        setGew('Alle'); setMdl(''); setFlr(''); setKat(''); setBtl('');
      } catch (err) {
        console.error('Excel parse error:', err);
        alert('Excel parse failed');
      }
    }
  };

  // Filter option lists
  const gewerkeList = useMemo(() => ['Alle', ...new Set(filtered.map(r => (r['label code']||'').split('.')[0]).filter(x => x))], [filtered]);
  const modelList   = useMemo(() => [...new Set(filtered.map(r => r['File Name']).filter(x => x))].sort(), [filtered]);
  const floorList   = useMemo(() => [...new Set(filtered.map(r => r.Floor).filter(x => x))].sort(), [filtered]);
  const kategorien  = useMemo(() => [...new Set(filtered.map(r => r.type).filter(x => x))].sort(), [filtered]);
  
  // Filter out parent/general categories from bauteile list
  const bauteile = useMemo(() => {
    // Get unique component names
    const allBauteile = [...new Set(filtered.map(r => r['label name']).filter(x => x))];
    
    // Filter out items that match gewerk names from the general categories
    const gewerkeNames = Object.values(gewerkeMap);
    return allBauteile
      .filter(name => !gewerkeNames.some(gewerkName => 
        name.includes(gewerkName) || name.includes('general')))
      .sort();
  }, [filtered]);

  // Compute component details
  const details = useMemo(() => {
    // If a specific component is selected, show its details
    if (btl) {
    const rows = filtered.filter(r => r['label name'] === btl);
    if (/rohr/i.test(btl)) {
      const len = rows.reduce((s,r)=>s+(Number(r.Length)||0),0);
      const vol = rows.reduce((s,r)=>s+(Number(r['Volume (m³)'])||0),0);
      return [
          { label: 'Anzahl', value: rows.length },
          { label: 'Gesamtlänge', value: `${(len/1000).toFixed(2)} m` },
        { label: 'Volumen',      value: `${vol.toFixed(2)} m³` },
        { label: 'Kosten', value: '-' }
      ];
    }
    if (/T‑Stück|bogen|T-Stück|bend/i.test(btl)) {
      const vol = rows.reduce((s,r)=>s+(Number(r['Volume (m³)'])||0),0);
      return [
        { label: 'Anzahl', value: rows.length },
        { label: 'Volumen', value: `${vol.toFixed(2)} m³` },
        { label: 'Kosten', value: '-' }
      ];
    }
    const vol = rows.reduce((s,r)=>s+(Number(r['Volume (m³)'])||0),0);
      return [
        { label: 'Anzahl', value: rows.length },
        { label: 'Volumen', value: `${vol.toFixed(2)} m³` },
        { label: 'Kosten', value: '-' }
      ];
    } 
    // If a Gewerk is selected, show an overview of component types
    else if (gew !== 'Alle') {
      // Create a summary of component types for the selected Gewerk
      const summary = [];
      
      // Count components by type and add to summary
      const componentTypes = {
        'Rohr': filtered.filter(r => /rohr|pipe/i.test(r['label name'])),
        'T-Stück': filtered.filter(r => /T-Stück|T-piece/i.test(r['label name'])),
        'Bogen': filtered.filter(r => /bogen|bend/i.test(r['label name'])),
        'Ventil': filtered.filter(r => /Ventil|valve/i.test(r['label name'])),
        'Kabeltrasse': filtered.filter(r => /Kabeltrasse|cable tray/i.test(r['label name'])),
        'Pumpe': filtered.filter(r => /Pumpe|pump/i.test(r['label name'])),
      };
      
      // Build summary list
      Object.entries(componentTypes).forEach(([type, items]) => {
        if (items.length > 0) {
          if (type === 'Rohr') {
            const len = items.reduce((s,r)=>s+(Number(r.Length)||0),0);
            summary.push({ label: type, value: `${items.length} Stück, ${(len/1000).toFixed(2)} m` });
          } else {
            summary.push({ label: type, value: `${items.length} Stück` });
          }
        }
      });
      
      // Add total count
      summary.push({ label: 'Gesamt', value: `${filtered.length} Komponenten` });
      
      // Add costs as the last entry
      summary.push({ label: 'Kosten', value: '-' });
      
      return summary.length > 0 ? summary : [{ label: 'Übersicht', value: 'Keine Komponenten gefunden' }, { label: 'Kosten', value: '-' }];
    }
    
    return null;
  }, [filtered, btl, gew]);

  // Generate chart data from filtered components
  const chartData = useMemo(() => {
    // Skip if no data
    if (filtered.length === 0) return null;
    
    // Group data by Gewerk
    const gewerkGroups = {};
    const relevantGewerke = ['SN', 'EL', 'SPR', 'HZ', 'KT', 'LF'];
    
    filtered.forEach(item => {
      const gewerkCode = (item['label code'] || '').split('.')[0];
      if (!gewerkCode || !relevantGewerke.includes(gewerkCode)) return;
      
      if (!gewerkGroups[gewerkCode]) {
        gewerkGroups[gewerkCode] = {
          count: 0,
          bauteile: {},
          types: {}
        };
      }
      
      gewerkGroups[gewerkCode].count++;
      
      // Group by component name
      const bauteil = item['label name'] || 'Unbekannt';
      if (!gewerkGroups[gewerkCode].bauteile[bauteil]) {
        gewerkGroups[gewerkCode].bauteile[bauteil] = 0;
      }
      gewerkGroups[gewerkCode].bauteile[bauteil]++;
      
      // Also group by component type
      const type = item['type'] || 'Unbekannt';
      if (!gewerkGroups[gewerkCode].types[type]) {
        gewerkGroups[gewerkCode].types[type] = 0;
      }
      gewerkGroups[gewerkCode].types[type]++;
    });
    
    // Generate pie chart data for category distribution
    const generatePieChartData = () => {
      // Get all unique bauteile (component names) with the same filtering as the bauteile list
      const allBauteile = new Set();
      
      // Collect all bauteile names
      filtered.forEach(item => {
        if (item['label name']) {
          allBauteile.add(item['label name']);
        }
      });
      
      // Filter out general items with the same logic as the bauteile list
      const gewerkeNames = Object.values(gewerkeMap);
      const filteredBauteile = [...allBauteile]
        .filter(name => !gewerkeNames.some(gewerkName => 
          name.includes(gewerkName) || name.includes('general')))
        .sort();
      
      // Calculate counts for each bauteil
      const bauteilCounts = filteredBauteile.map(bauteil => {
        return filtered.filter(item => item['label name'] === bauteil).length;
      });
      
      // Generate colors for each bauteil
      const bauteilColors = filteredBauteile.map(
        (_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)`
      );
      
      return {
        labels: filteredBauteile,
        datasets: [{
          data: bauteilCounts,
          backgroundColor: bauteilColors
        }]
      };
    };
    
    // Prepare bar chart data for each Gewerk or for all in expanded mode
    const barCharts = {};
    
    if (gew === 'ExpandAll') {
      // For ExpandAll mode, include all Gewerke even if not the selected filter
      Object.entries(gewerkGroups).forEach(([code, data]) => {
        const sortedBauteile = Object.entries(data.bauteile)
          .filter(([name]) => !Object.values(gewerkeMap).some(g => name.includes(g) || name.includes('general')))
          .sort((a, b) => b[1] - a[1]);
        
        barCharts[code] = {
          labels: sortedBauteile.map(([name]) => name),
          counts: sortedBauteile.map(([_, count]) => count),
          isExpanded: true
        };
      });
    } else {
      // Regular mode - only show the selected Gewerk's bar chart
      Object.entries(gewerkGroups).forEach(([code, data]) => {
        // Only include if it matches the filter or if filter is 'Alle'
        if (gew === 'Alle' || code === gew) {
          const sortedBauteile = Object.entries(data.bauteile)
            .filter(([name]) => !Object.values(gewerkeMap).some(g => name.includes(g) || name.includes('general')))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Only take top 5 for non-expanded mode
          
          barCharts[code] = {
            labels: sortedBauteile.map(([name]) => name),
            counts: sortedBauteile.map(([_, count]) => count),
            isExpanded: false
          };
        }
      });
    }
    
    return {
      gewerkGroups,
      pieChartData: generatePieChartData(),
      barCharts,
      isExpandedMode: gew === 'ExpandAll'
    };
    
  }, [filtered, gew]);

  // Add window event listener to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expandedKategorien && kategorienRef.current && !kategorienRef.current.contains(event.target)) {
        setExpandedKategorien(false);
      }
      if (expandedBauteile && bauteileRef.current && !bauteileRef.current.contains(event.target)) {
        setExpandedBauteile(false);
      }
      if (expandedLegend && legendRef.current && !legendRef.current.contains(event.target)) {
        setExpandedLegend(false);
      }
      if (expandedBarcharts && barchartsRef.current && !barchartsRef.current.contains(event.target)) {
        setExpandedBarcharts(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedKategorien, expandedBauteile, expandedLegend, expandedBarcharts]);

  // New 4-card layout
  const layout = [
    { i: 'viewer',   x: 0, y: 0, w: 3.5, h: 8, static: true },
    { i: 'controls', x: 3.5, y: 0, w: 2.5, h: 8, static: true },
    { i: 'charts',   x: 6, y: 0, w: 6, h: 8, static: true },
    { i: 'lists',    x: 0, y: 8, w: 6, h: 6, static: true },
    { i: 'details',  x: 6, y: 8, w: 6, h: 6, static: true }
  ];

  return (
    <div className="material-auszug-dashboard">
      <ReactGridLayout
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
      >
        <div key="viewer">
          <DashboardItem title="3D Viewer">
            <div ref={viewerRef} className="empty-viewer" style={{ width: '100%', height: '100%' }} />
          </DashboardItem>
        </div>

        <div key="controls">
          <DashboardItem title="Steuerung">
            <div className="controls">
              <label className="file-upload">
                IFC Modell laden
                <input type="file" accept=".ifc" onChange={handleFileUpload} style={{ display: 'none' }} />
                <div className="custom-file-input">
                  <span className="file-button">Durchsuchen</span>
                  <span className="file-text">{rawBufferRef.current ? 
                    (typeof rawBufferRef.current.name === 'string' ? rawBufferRef.current.name : 'Datei geladen') : 
                    'Keine Datei ausgewählt'}</span>
                </div>
              </label>

              <label className="file-upload">
                Klassen laden
                <input type="file" accept=".xlsx" onChange={handleFileUpload} style={{ display: 'none' }} />
                <div className="custom-file-input">
                  <span className="file-button">Durchsuchen</span>
                  <span className="file-text">{data.length > 0 ? 
                    `${data.length} Einträge geladen` : 
                    'Keine Datei ausgewählt'}</span>
                </div>
              </label>

              <div className="control-section">
                <h3>Gewerke</h3>
                <div className="filter-buttons">
                  {gewerkeList.map(code => (
                    <button
                      key={code}
                      onClick={() => setGew(code)}
                      style={{ backgroundColor: gewerkeColors[code], opacity: code === gew ? 1 : 0.6 }}
                    >{gewerkeMap[code] || code}</button>
                  ))}
                  <button
                    onClick={() => {
                      // Toggle between 'Alle' (normal view) and 'ExpandAll' (expanded view)
                      setGew(prev => prev === 'ExpandAll' ? 'Alle' : 'ExpandAll');
                    }}
                    style={{ 
                      backgroundColor: '#333',
                      color: '#fff', 
                      opacity: gew === 'ExpandAll' ? 1 : 0.7,
                      marginLeft: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {gew === 'ExpandAll' ? 
                      <>
                        <span style={{ fontSize: '14px' }}>&#x2212;</span> Collapse
                      </> : 
                      <>
                        <span style={{ fontSize: '14px' }}>&#x2b;</span> Expand All
                      </>
                    }
                  </button>
                </div>
              </div>

              <div className="control-section">
                <h3>Filter</h3>
              <div className="select-row">
                  <div className="select-group">
                    <label>Modelle</label>
                <select value={mdl} onChange={e => setMdl(e.target.value)}>
                  <option value="">Alle Modelle</option>
                  {modelList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                  </div>
                  
                  <div className="select-group">
                    <label>Geschosse</label>
                <select value={flr} onChange={e => setFlr(e.target.value)}>
                  <option value="">Alle Geschosse</option>
                  {floorList.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
                </div>
              </div>
            </div>
          </DashboardItem>
        </div>

        <div key="charts">
          <DashboardItem title="Bauteileverteilung">
            <div className="charts-container">
              {chartData ? (
                <>
                  <div className="circle-charts">
                    <div style={{ 
                      width: '100%',
                      margin: '0 auto', 
                      height: '200px',
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: '15px',
                      marginBottom: '10px'
                    }}>
                      {/* Pie chart */}
                      <div style={{ 
                        flex: '0 0 220px',
                        height: '200px', 
                        position: 'relative'
                      }}>
                        <Pie
                          data={chartData.pieChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: (tooltipItem) => {
                                    const dataset = tooltipItem.dataset;
                                    const total = dataset.data.reduce((sum, value) => sum + value, 0);
                                    const currentValue = dataset.data[tooltipItem.dataIndex];
                                    const percentage = ((currentValue / total) * 100).toFixed(2);
                                    return `${tooltipItem.label}: ${percentage}% (${currentValue})`;
                                  }
                                }
                              }
                            },
                            cutout: '70%'
                          }}
                        />
                      </div>
                      
                      {/* Legend - moved to the right */}
                      <div style={{
                        flex: '1',
                        maxWidth: '300px',
                        padding: '10px',
                        overflowY: 'auto',
                        height: '200px',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        position: 'relative'
                      }}
                      ref={legendRef}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '5px',
                            paddingBottom: '5px',
                            borderBottom: '1px solid #eee'
                          }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Legende</span>
                            <button 
                              onClick={() => setExpandedLegend(true)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#555',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <span style={{ fontSize: '14px' }}>&#x2b;</span> Expand
                            </button>
                          </div>
                          {chartData.pieChartData.labels.slice(0, 8).map((label, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.85rem'
                            }}>
                              <span style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: chartData.pieChartData.datasets[0].backgroundColor[index],
                                display: 'inline-block',
                                marginRight: '8px',
                                borderRadius: '2px'
                              }}></span>
                              <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {label}
                              </span>
                            </div>
                          ))}
                          {chartData.pieChartData.labels.length > 8 && (
                            <div style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center' }}>
                              {chartData.pieChartData.labels.length - 8} weitere...
                            </div>
                          )}
                        </div>
                        
                        {/* Legend dropdown */}
                        {expandedLegend && (
                          <div className="dropdown-overlay" style={{
                            top: '50px',
                            left: '0',
                            width: '300px'
                          }}>
                            <div className="dropdown-header">
                              <span style={{ fontWeight: 'bold' }}>Bauteile Legende</span>
                              <button className="close-button" onClick={() => setExpandedLegend(false)}>×</button>
                            </div>
                            <div className="dropdown-content">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {chartData.pieChartData.labels.map((label, index) => (
                                  <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.85rem',
                                    padding: '4px 0'
                                  }}>
                                    <span style={{
                                      width: '14px',
                                      height: '14px',
                                      backgroundColor: chartData.pieChartData.datasets[0].backgroundColor[index],
                                      display: 'inline-block',
                                      marginRight: '8px',
                                      borderRadius: '2px'
                                    }}></span>
                                    <span>{label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bar-charts-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: chartData?.isExpandedMode ? 'none' : '450px',
                    overflowY: 'auto',
                    marginTop: '0',
                    position: 'relative'
                  }}
                  ref={barchartsRef}>
                    <div style={{
                      margin: '0 0 10px 0',
                      padding: '0',
                      fontSize: '1rem',
                      borderBottom: '1px solid #eee',
                      paddingBottom: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Gewerke Komponenten</span>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {chartData?.isExpandedMode && (
                          <span style={{ fontSize: '0.8rem', color: '#777' }}>Erweiterte Ansicht</span>
                        )}
                        {!chartData?.isExpandedMode && (
                          <button 
                            onClick={() => setExpandedBarcharts(true)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#555',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>&#x2b;</span> Expand
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Show more Gewerke in normal view */}
                    {!expandedBarcharts && !chartData?.isExpandedMode && 
                      Object.entries(chartData.barCharts).slice(0, 5).map(([code, data]) => (
                        <div key={code} className="bar-chart-wrapper" style={{
                          marginBottom: '8px',
                          border: chartData?.isExpandedMode ? '1px solid #eee' : 'none',
                          borderRadius: '4px',
                          padding: chartData?.isExpandedMode ? '10px' : '0',
                          backgroundColor: chartData?.isExpandedMode ? `${gewerkeColors[code]}10` : 'transparent'
                        }}>
                          <h5 style={{
                            margin: '0 0 5px 0',
                            fontSize: '0.9rem',
                            color: gewerkeColors[code],
                            borderBottom: chartData?.isExpandedMode ? `1px solid ${gewerkeColors[code]}30` : 'none',
                            paddingBottom: chartData?.isExpandedMode ? '5px' : '0'
                          }}>{gewerkeMap[code] || code}</h5>
                          <div className="horizontal-bars" style={{
                            height: 'auto'
                          }}>
                            {data.labels.slice(0, 4).map((label, index) => {
                              const maxCount = Math.max(...data.counts);
                              const percentage = (data.counts[index] / maxCount) * 100;
                              
                              return (
                                <div key={label} className="bar-item" style={{
                                  marginBottom: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  <div className="bar-label" style={{
                                    fontWeight: 'normal',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '280px',
                                    flex: '0 0 280px',
                                    fontSize: '0.85rem',
                                    paddingRight: '10px'
                                  }}>{label}</div>
                                  <div className="bar-wrapper" style={{
                                    flex: '1',
                                    height: '16px',
                                    position: 'relative',
                                    backgroundColor: '#f0f0f0',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                  }}>
                                    <div 
                                      className="bar-fill" 
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: gewerkeColors[code],
                                        height: '16px'
                                      }}
                                    ></div>
                                    <span className="bar-value" style={{
                                      position: 'absolute',
                                      right: '5px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      fontSize: '0.8rem',
                                      color: '#333',
                                      zIndex: 2
                                    }}>{data.counts[index]}</span>
                                  </div>
                                </div>
                              );
                            })}
                            {data.labels.length > 4 && (
                              <div style={{ fontSize: '0.8rem', color: '#777', textAlign: 'right', marginTop: '2px' }}>
                                ...und {data.labels.length - 4} weitere
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    }
                    
                    {/* Bar charts dropdown */}
                    {expandedBarcharts && !chartData?.isExpandedMode && (
                      <div className="dropdown-overlay" style={{
                        top: '40px',
                        left: '0',
                        width: '100%',
                        maxHeight: '500px'
                      }}>
                        <div className="dropdown-header">
                          <span style={{ fontWeight: 'bold' }}>Alle Gewerke Komponenten</span>
                          <button className="close-button" onClick={() => setExpandedBarcharts(false)}>×</button>
                        </div>
                        <div className="dropdown-content">
                          {Object.entries(chartData.barCharts).map(([code, data]) => (
                            <div key={code} className="bar-chart-wrapper" style={{
                              marginBottom: '15px',
                              border: '1px solid #eee',
                              borderRadius: '4px',
                              padding: '10px',
                              backgroundColor: `${gewerkeColors[code]}10`
                            }}>
                              <h5 style={{
                                margin: '0 0 10px 0',
                                fontSize: '0.9rem',
                                color: gewerkeColors[code],
                                borderBottom: `1px solid ${gewerkeColors[code]}30`,
                                paddingBottom: '5px'
                              }}>{gewerkeMap[code] || code}</h5>
                              <div className="horizontal-bars" style={{
                                height: 'auto'
                              }}>
                                {data.labels.map((label, index) => {
                                  const maxCount = Math.max(...data.counts);
                                  const percentage = (data.counts[index] / maxCount) * 100;
                                  
                                  return (
                                    <div key={label} className="bar-item" style={{
                                      marginBottom: '6px',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      <div className="bar-label" style={{
                                        fontWeight: 'normal',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '280px',
                                        flex: '0 0 280px',
                                        fontSize: '0.85rem',
                                        paddingRight: '10px'
                                      }}>{label}</div>
                                      <div className="bar-wrapper" style={{
                                        flex: '1',
                                        height: '16px',
                                        position: 'relative',
                                        backgroundColor: '#f0f0f0',
                                        borderRadius: '2px',
                                        overflow: 'hidden'
                                      }}>
                                        <div 
                                          className="bar-fill" 
                                          style={{
                                            width: `${percentage}%`,
                                            backgroundColor: gewerkeColors[code],
                                            height: '16px'
                                          }}
                                        ></div>
                                        <span className="bar-value" style={{
                                          position: 'absolute',
                                          right: '5px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          fontSize: '0.8rem',
                                          color: '#333',
                                          zIndex: 2
                                        }}>{data.counts[index]}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Full expanded view (not dropdown) */}
                    {chartData?.isExpandedMode && 
                      Object.entries(chartData.barCharts).map(([code, data]) => (
                        <div key={code} className="bar-chart-wrapper" style={{
                          marginBottom: '10px',
                          border: chartData?.isExpandedMode ? '1px solid #eee' : 'none',
                          borderRadius: '4px',
                          padding: chartData?.isExpandedMode ? '10px' : '0',
                          backgroundColor: chartData?.isExpandedMode ? `${gewerkeColors[code]}10` : 'transparent'
                        }}>
                          <h5 style={{
                            margin: '0 0 10px 0',
                            fontSize: '0.9rem',
                            color: gewerkeColors[code],
                            borderBottom: chartData?.isExpandedMode ? `1px solid ${gewerkeColors[code]}30` : 'none',
                            paddingBottom: chartData?.isExpandedMode ? '5px' : '0'
                          }}>{gewerkeMap[code] || code}</h5>
                          <div className="horizontal-bars" style={{
                            height: 'auto'
                          }}>
                            {data.labels.map((label, index) => {
                              const maxCount = Math.max(...data.counts);
                              const percentage = (data.counts[index] / maxCount) * 100;
                              
                              return (
                                <div key={label} className="bar-item" style={{
                                  marginBottom: '6px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  <div className="bar-label" style={{
                                    fontWeight: 'normal',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '280px',
                                    flex: '0 0 280px',
                                    fontSize: '0.85rem',
                                    paddingRight: '10px'
                                  }}>{label}</div>
                                  <div className="bar-wrapper" style={{
                                    flex: '1',
                                    height: '16px',
                                    position: 'relative',
                                    backgroundColor: '#f0f0f0',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                  }}>
                                    <div 
                                      className="bar-fill" 
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: gewerkeColors[code],
                                        height: '16px'
                                      }}
                                    ></div>
                                    <span className="bar-value" style={{
                                      position: 'absolute',
                                      right: '5px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      fontSize: '0.8rem',
                                      color: '#333',
                                      zIndex: 2
                                    }}>{data.counts[index]}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </>
              ) : (
                <div className="no-data-message">
                  <p>Laden Sie Daten, um Diagramme anzuzeigen</p>
                </div>
              )}
            </div>
          </DashboardItem>
        </div>

        <div key="lists">
          <DashboardItem title="">
            <div className="two-columns">
              <div className="column" ref={kategorienRef} style={{ position: 'relative' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h3 style={{ margin: 0 }}>Kategorien</h3>
                  <button 
                    onClick={() => setExpandedKategorien(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#555',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>&#x2b;</span> Expand
                  </button>
                </div>
                <ul className="list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {kategorien.slice(0, 10).map(k => (
                    <li
                      key={k}
                      className={k === kat ? 'selected' : ''}
                      onClick={() => setKat(prev => prev === k ? '' : k)}
                    >{k}</li>
                  ))}
                  {kategorien.length > 10 && (
                    <li style={{ color: '#777', fontSize: '0.8rem', textAlign: 'center' }}>
                      ...und {kategorien.length - 10} weitere
                    </li>
                  )}
                </ul>
                
                {/* Kategorien dropdown */}
                {expandedKategorien && (
                  <div className="dropdown-overlay" style={{
                    top: '40px',
                    left: '0',
                    width: '100%'
                  }}>
                    <div className="dropdown-header">
                      <span style={{ fontWeight: 'bold' }}>Alle Kategorien</span>
                      <button className="close-button" onClick={() => setExpandedKategorien(false)}>×</button>
                    </div>
                    <div className="dropdown-content">
                      <ul className="dropdown-list">
                        {kategorien.map(k => (
                          <li
                            key={k}
                            className={k === kat ? 'selected' : ''}
                            onClick={() => {
                              setKat(prev => prev === k ? '' : k);
                              setExpandedKategorien(false);
                            }}
                          >{k}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="column" ref={bauteileRef} style={{ position: 'relative' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h3 style={{ margin: 0 }}>Bauteile</h3>
                  <button 
                    onClick={() => setExpandedBauteile(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#555',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>&#x2b;</span> Expand
                  </button>
                </div>
                <ul className="list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {bauteile.slice(0, 10).map(b => (
                    <li
                      key={b}
                      className={b === btl ? 'selected' : ''}
                      onClick={() => setBtl(prev => prev === b ? '' : b)}
                    >{b}</li>
                  ))}
                  {bauteile.length > 10 && (
                    <li style={{ color: '#777', fontSize: '0.8rem', textAlign: 'center' }}>
                      ...und {bauteile.length - 10} weitere
                    </li>
                  )}
                </ul>
                
                {/* Bauteile dropdown */}
                {expandedBauteile && (
                  <div className="dropdown-overlay" style={{
                    top: '40px',
                    left: '0',
                    width: '100%'
                  }}>
                    <div className="dropdown-header">
                      <span style={{ fontWeight: 'bold' }}>Alle Bauteile</span>
                      <button className="close-button" onClick={() => setExpandedBauteile(false)}>×</button>
                    </div>
                    <div className="dropdown-content">
                      <ul className="dropdown-list">
                        {bauteile.map(b => (
                          <li
                            key={b}
                            className={b === btl ? 'selected' : ''}
                            onClick={() => {
                              setBtl(prev => prev === b ? '' : b);
                              setExpandedBauteile(false);
                            }}
                          >{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DashboardItem>
        </div>

        <div key="details">
          <DashboardItem title="Details">
            {!btl && gew === 'Alle'
              ? <p>Bitte einen Bauteil oder Gewerk auswählen</p>
              : <table className="details-table">
                  <tbody>
                    {details && details.map(d => (
                      <tr key={d.label}>
                        <td>{d.label}</td><td>{d.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </DashboardItem>
        </div>
      </ReactGridLayout>
    </div>
  );
}
