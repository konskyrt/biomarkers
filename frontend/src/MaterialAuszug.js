import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DashboardItem from './DashboardItem';
import BauteileDashboard from './components/BauteileDashboard';
import ChartSection from './components/ChartSection';
import CompletionBalanceChart from './components/CompletionBalanceChart';
import ApartmentsOverTimeChart from './components/ApartmentsOverTimeChart';
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
const gewerkeMap = { KO: 'Konstruktion', SN: 'Sanitär', EL: 'Elektro', SPR: 'Sprinkler', HZ: 'Heizung', KT: 'Kälte', LF: 'Lüftung' };
// Colors per Gewerk
const gewerkeColors = { KO: '#9E9E9E', SN: '#2196F3', EL: '#FF9800', SPR: '#E91E63', HZ: '#F44336', KT: '#00BCD4', LF: '#4CAF50', Alle: '#757575' };

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

// Define unit costs for different components by Gewerk
const unitCostMap = {
  SN: { // Sanitär
    'Rohr': 75, // CHF/m
    'T-Stück': 35,
    'Bögen': 25,
    'Ventil': 120,
    'default': 50
  },
  EL: { // Elektro
    'Rohr': 45, // CHF/m
    'Kabeltrasse': 85,
    'T-Stück': 30,
    'Bögen': 25,
    'default': 60
  },
  SPR: { // Sprinkler
    'Rohr': 90, // CHF/m
    'T-Stück': 45,
    'Bögen': 35,
    'default': 80
  },
  HZ: { // Heizung
    'Rohr': 80, // CHF/m
    'T-Stück': 40,
    'Bögen': 30,
    'Ventil': 100,
    'Pumpe': 350,
    'default': 70
  },
  KT: { // Kälte
    'Rohr': 110, // CHF/m
    'T-Stück': 55,
    'Bögen': 45,
    'Ventil': 130,
    'Pumpe': 450,
    'default': 90
  },
  LF: { // Lüftung
    'Rohr': 95, // CHF/m
    'T-Stück': 60,
    'Bögen': 50,
    'default': 100
  },
  default: {
    'Rohr': 70, // CHF/m
    'T-Stück': 40,
    'Bögen': 30,
    'Ventil': 110,
    'Kabeltrasse': 80,
    'Pumpe': 400,
    'default': 65
  }
};

// ---------------------------------------------------------------------------
// Detailed catalogue prices (complete)
// ---------------------------------------------------------------------------
const bauteilPrices = {
  // Konstruktion

  // Sanitär (SN)
  'SN.01': { unit: 'm',     price: 75 },
  'SN.02': { unit: 'Stück', price: 35 },
  'SN.03': { unit: 'Stück', price: 25 },
  'SN.04': { unit: 'Stück', price: 25 },
  'SN.05': { unit: 'Stück', price: 120 },
  'SN.06': { unit: 'Stück', price: 3500 },
  'SN.07': { unit: 'Stück', price: 2200 },
  'SN.08': { unit: 'Stück', price: 6800 },
  'SN.09': { unit: 'Stück', price: 250 },
  'SN.10': { unit: 'Stück', price: 300 },
  'SN.11': { unit: 'Stück', price: 260 },
  'SN.12': { unit: 'Stück', price: 150 },

  // Elektro (EL)
  'EL.01': { unit: 'm',     price: 45 },
  'EL.02': { unit: 'Stück', price: 30 },
  'EL.03': { unit: 'm',     price: 12 },
  'EL.04': { unit: 'm',     price: 85 },
  'EL.05': { unit: 'Stück', price: 40 },
  'EL.06': { unit: 'Stück', price: 40 },
  'EL.07': { unit: 'Stück', price: 150 },
  'EL.08': { unit: 'Stück', price: 25 },
  'EL.09': { unit: 'Stück', price: 30 },
  'EL.10': { unit: 'Stück', price: 600 },

  // Sprinkler (SPR)
  'SPR.01': { unit: 'Stück', price: 18 },
  'SPR.02': { unit: 'm',     price: 90 },
  'SPR.03': { unit: 'Stück', price: 35 },
  'SPR.04': { unit: 'Stück', price: 40 },
  'SPR.05': { unit: 'Stück', price: 450 },
  'SPR.06': { unit: 'Stück', price: 3500 },
  'SPR.07': { unit: 'Stück', price: 1200 },
  'SPR.08': { unit: 'Stück', price: 550 },
  'SPR.09': { unit: 'Stück', price: 220 },

  // Heizung (HZ)
  'HZ.01': { unit: 'Stück', price: 15000 },
  'HZ.02': { unit: 'Stück', price: 6500 },
  'HZ.03': { unit: 'Stück', price: 1800 },
  'HZ.04': { unit: 'm',     price: 80 },
  'HZ.05': { unit: 'Stück', price: 40 },
  'HZ.06': { unit: 'Stück', price: 30 },
  'HZ.07': { unit: 'Stück', price: 32 },
  'HZ.08': { unit: 'Stück', price: 70 },
  'HZ.09': { unit: 'Stück', price: 600 },
  'HZ.10': { unit: 'Stück', price: 450 },
  'HZ.11': { unit: 'Stück', price: 1200 },

  // Kälte (KT)
  'KT.01': { unit: 'Stück', price: 20000 },
  'KT.02': { unit: 'Stück', price: 18000 },
  'KT.03': { unit: 'Stück', price: 3000 },
  'KT.04': { unit: 'm',     price: 110 },
  'KT.05': { unit: 'Stück', price: 55 },
  'KT.06': { unit: 'Stück', price: 45 },
  'KT.07': { unit: 'Stück', price: 45 },
  'KT.08': { unit: 'Stück', price: 90 },
  'KT.09': { unit: 'Stück', price: 600 },
  'KT.10': { unit: 'Stück', price: 1500 },

  // Lüftung (LF)
  'LF.01': { unit: 'Stück', price: 28000 },
  'LF.02': { unit: 'Stück', price: 3500 },
  'LF.03': { unit: 'm',     price: 95 },
  'LF.04': { unit: 'Stück', price: 50 },
  'LF.05': { unit: 'Stück', price: 55 },
  'LF.06': { unit: 'Stück', price: 45 },
  'LF.07': { unit: 'Stück', price: 120 },
  'LF.08': { unit: 'Stück', price: 28 },
  'LF.09': { unit: 'Stück', price: 32 },
  'LF.10': { unit: 'Stück', price: 900 },
  'LF.11': { unit: 'Stück', price: 4500 },
  'LF.12': { unit: 'Stück', price: 180 },
  'LF.13': { unit: 'm²',    price: 20 },

  // Catch-all
};

const bauteilNames = {
  // Sanitär
    "KO": "Konstruction, Gebäude",

    "SN": "Sanitär",
    "SN.01": "Wasserrohr (gerades Segment)",
    "SN.02": "Rohrarmaturen (Reduzierungen, Kupplungen)",
    "SN.03": "Rohrarmaturen: Bögen",
    "SN.04": "Rohrarmaturen: T-Stücke",
    "SN.05": "Ventile (Absperr-, Rückfluss-, Druckminderventile etc.)",
    "SN.06": "Boosterpumpe (Druckerhöhungspumpe)",
    "SN.07": "Wassertank (Speicher-/Ausdehnungsbehälter)",
    "SN.08": "Warmwassererzeuger (Kessel/Calorifier)",
    "SN.09": "Waschtisch (Waschbecken)",
    "SN.10": "Toilette (WC/Water Closet)",
    "SN.11": "Urinal",
    "SN.12": "Bodenablauf (Ablauföffnung)",
    
    "EL": "EL",
    "EL.01": "Leerrohr/Kabelschutzrohr",
    "EL.02": "Leerrohrzubehör (Bögen, T-Stücke)",
    "EL.03": "Elektrokabel / Draht",
    "EL.04": "Kabeltrasse",
    "EL.05": "Kabeltrassenzubehör: Bögen",
    "EL.06": "Kabeltrassenzubehör: T-Stücke",
    "EL.07": "Beleuchtungskörper (Leuchte)",
    "EL.08": "Schalter",
    "EL.09": "Steckdose (Rezeptacle/Outlet)",
    "EL.10": "Verteilerkasten (Schaltschranksystem)",
    
    "SPR": "Sprinkler (Brandschutz)",
    "SPR.01": "Sprinklerkopf",
    "SPR.02": "Sprinklerrohr",
    "SPR.03": "Sprinklerzubehör: Bögen",
    "SPR.04": "Sprinklerzubehör: T-Stücke",
    "SPR.05": "Alarm-/Steuerarmatur",
    "SPR.06": "Brandschutzpumpe",
    "SPR.07": "Jockey-Pumpe",
    "SPR.08": "Feuerwehranschluss",
    "SPR.09": "Rückflussverhinderer",
    
    "HZ": "Heizung",
    "HZ.01": "Kessel (Heizunggerät)",
    "HZ.02": "Wärmetauscher",
    "HZ.03": "Umwälzpumpe (Heizungspumpe)",
    "HZ.04": "Heizungsrohre (Vorlauf & Rücklauf)",
    "HZ.05": "Rohrarmaturen (Heizungsinstallation)",
    "HZ.06": "Heizfittings: Bögen",
    "HZ.07": "Heizfittings: T-Stück",
    "HZ.08": "Ventile (Heizsventile)",
    "HZ.09": "Ausdehnungsgefäß (Heizung)",
    "HZ.10": "Heizkörper / Konvektoren",
    "HZ.11": "FanCoil-Gerät",
    
    "KT": "Kälte",
    "KT.01": "Kühler (Wasserkühler/Chiller)",
    "KT.02": "Kühlturm",
    "KT.03": "Kaltwasserpumpe",
    "KT.04": "Kaltwasserrohre",
    "KT.05": "Rohrarmaturen (Kaltwassersystem)",
    "KT.06": "Kältefittings: Bögen",
    "KT.07": "Kältefittings: T-Stück",
    "KT.08": "Ventile (Kaltwassersystem)",
    "KT.09": "Ausdehnungsgefäß (Kaltwassersystem)",
    "KT.10": "FanCoil-Gerät (Kühlung)",
    
    "LF": "Lüftung",
    "LF.01": "Lüftungsgerät / AHU (Air Handling Unit)",
    "LF.02": "Ventilator (Lüftungsventilator)", 
    "LF.03": "Luftkanal (gerades Segment)",
    "LF.04": "Luftfittings: Bögen",
    "LF.05": "Luftfittings: T-Stücke",
    "LF.06": "Drosselklappen (Luftstromdrossler)",
    "LF.07": "Luftschalldämpfer (Akustikabsorber)",
    "LF.08": "Luftfilter",
    "LF.09": "Luftauslass (Diffusor/Grill)",
    "LF.10": "VAV-Endgerät (Variable Air Volume Box)",
    "LF.11": "Wärmerückgewinnungsgerät",
    "LF.12": "Befeuchter",
    "LF.13": "Lüftungdämmung",

    "OTH": "Other"

};

// ---------------------------------------------------------------------------

// helper to compute cost per row using catalogue or fallback
function computeItemCost(row){
  const short = (row['label code']||'').split('.').slice(0,2).join('.');
  const cat = bauteilPrices[short];
  if(cat){
    if(cat.unit==='m'){
      const len = Number(row.Length)||0; return cat.price * len/1000;
    }
    return cat.price;
  }
  // fallback: zero
  return 0;
}

// Reference project budget (planned costs) for comparison in CHF
const projectBudget = {
  'Heizung': 2260277,
  'Kälte': 0,          // combined under Heizung/Kälte, split unknown
  'Lüftung': 1162500,  // Lüftung/Klima
  'Sanitär': 1918500,
  'Elektro': 2656105,
  Honorar: 809558      // Overall planning fee
};

// Basic project meta-data rendered above KPI
const projectInfo = {
  'Projektbezeichnung': '11565.01 - Salathe Arlesheim',
  'Planungsart': 'GTD',
  'Nutzung': 'Mehrfamilienhäuser',
  'Honorar': 'CHF 809.558,00'
};

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
  
  // Track dropdown overlay position for legend
  const [legendOverlayPos, setLegendOverlayPos] = useState({ top: 0, left: 0 });
  
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
        // const workerUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
        const workerUrl = "./worker.mjs";
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
      
      // Process IFC buffer to fragments format using the global serializer
      const ifcBytes = new Uint8Array(ifcBuffer);
      console.log("Converting IFC to fragments format...");
      const fragmentsData = await serializer.process({ bytes: ifcBytes });
      
      if (!fragmentsData) {
        console.error("Failed to convert IFC to fragments format");
        return;
      }
      
      console.log("IFC converted successfully, loading model...");
      
      // Load the model with fragments
      if (fragmentsRef.current) {
        try {
          // Clear any existing models
          if (sceneRef.current) {
            // Remove all models from the scene
            const toRemove = [];
            sceneRef.current.traverse((object) => {
              if (object.userData && object.userData.isFragmentMesh) {
                toRemove.push(object);
              }
            });
            toRemove.forEach((object) => {
              sceneRef.current.remove(object);
            });

            // Clear any caches
            if (fragmentsRef.current.models && fragmentsRef.current.models.list) {
              fragmentsRef.current.models.list.clear();
            }
          }
          
          // Use a unique ID based on timestamp to avoid conflicts
          const modelId = `imported-model-${Date.now()}`;
          
          // Load model directly from buffer data
          const model = await fragmentsRef.current.load(fragmentsData, { modelId });
          
          if (model && cameraRef.current && sceneRef.current) {
            model.useCamera(cameraRef.current);
            sceneRef.current.add(model.object);
            
            // Center and zoom to fit the model
            if (model.boundingBox && cameraRef.current) {
              const box = model.boundingBox;
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const fov = cameraRef.current.fov * (Math.PI / 180);
              const distance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
              
              cameraRef.current.position.copy(center);
              cameraRef.current.position.z += distance * 1.5;
              cameraRef.current.lookAt(center);
            }
            
            await fragmentsRef.current.update(true);
            console.log("Model loaded successfully");
          }
        } catch (error) {
          console.error("Error loading fragments model:", error);
          
          // Fallback method if the new approach fails
          try {
            console.log("Attempting fallback loading method...");
            const model = await fragmentsRef.current.load(fragmentsData);
            
            if (model) {
              console.log("Fallback loading successful");
              if (cameraRef.current) model.useCamera(cameraRef.current);
              if (sceneRef.current) sceneRef.current.add(model.object);
              await fragmentsRef.current.update(true);
            }
          } catch (fallbackError) {
            console.error("Fallback loading also failed:", fallbackError);
          }
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
    
    // Return full list without excluding names containing Gewerk display names or 'general'
    return allBauteile.sort();
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
        { label: 'Volumen',      value: `${vol.toFixed(2)} m³` }
      ];
    }
    if (/T‑Stück|bogen|T-Stück|bend/i.test(btl)) {
      const vol = rows.reduce((s,r)=>s+(Number(r['Volume (m³)'])||0),0);
      return [
        { label: 'Anzahl', value: rows.length },
        { label: 'Volumen', value: `${vol.toFixed(2)} m³` }
      ];
    }
    const vol = rows.reduce((s,r)=>s+(Number(r['Volume (m³)'])||0),0);
      return [
        { label: 'Anzahl', value: rows.length },
        { label: 'Volumen', value: `${vol.toFixed(2)} m³` }
      ];
    } 
    // If a Gewerk is selected, show an overview of component types
    else if (gew !== 'Alle') {
      // Create a summary of component types for the selected Gewerk
      const summary = [];
      
      // Extract the Gewerk prefix to ensure we only count components from this Gewerk
      const gewerkPrefix = gew; // This is already the Gewerk code (e.g., "SN", "EL")
      
      // Count components by type and add to summary - ensuring we only count components with matching label code
      const componentTypes = {
        'Rohr': filtered.filter(r => {
          // Check if component has matching label code AND matches the pipe pattern
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /rohr|pipe|leitung|wasserrohr/i.test(r['label name']);
        }),
        'T-Stück': filtered.filter(r => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /T-Stück|T-piece/i.test(r['label name']);
        }),
        'Bögen': filtered.filter(r => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /bogen|bend|bögen|curve|elbow/i.test(r['label name']);
        }),
        'Ventil': filtered.filter(r => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Ventil|valve/i.test(r['label name']);
        }),
        'Kabeltrasse': filtered.filter(r => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Kabeltrasse|cable tray/i.test(r['label name']);
        }),
        'Pumpe': filtered.filter(r => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Pumpe|pump/i.test(r['label name']);
        }),
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
      
      return summary.length > 0 ? summary : [{ label: 'Übersicht', value: 'Keine Komponenten gefunden' }];
    }
    
    return null;
  }, [filtered, btl, gew]);

  // Calculate cost details based on current selection
  const costDetails = useMemo(() => {
    // If no gewerk is selected (Alle), show total costs by gewerk
    if (gew === 'Alle') {
      const gewerkCosts = {};
      const relevantGewerke = ['SN', 'EL', 'SPR', 'HZ', 'KT', 'LF'];
      
      // Initialize cost counters for each Gewerk
      relevantGewerke.forEach(code => {
        gewerkCosts[code] = 0;
      });
      
      // Use catalogue prices (computeItemCost) for consistency with the single-Gewerk view.
      // Any item that does not have a catalogue price (computeItemCost === 0) is ignored,
      // mirroring the behaviour in the detailed Gewerk breakdown where such items are skipped.
      filtered.forEach(item => {
        const gewerkCode = (item['label code'] || '').split('.')[0];
        if (!gewerkCode || !relevantGewerke.includes(gewerkCode)) return;

        const itemCost = computeItemCost(item);
        if (itemCost > 0) {
          gewerkCosts[gewerkCode] += itemCost;
        }
      });
      
      // Format results for display
      const results = Object.entries(gewerkCosts)
        .filter(([_, cost]) => cost > 0)
        .map(([code, cost]) => ({
          label: gewerkeMap[code] || code,
          value: `${cost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF`
        }));
        
      // Calculate total cost across all Gewerke
      const totalCost = Object.values(gewerkCosts).reduce((sum, cost) => sum + cost, 0);
      
      // Add total row
      results.push({
        label: 'Gesamtkosten',
        value: `${totalCost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF`,
        isTotal: true
      });
        
      return results;
    }
    // If a specific Gewerk is selected, show costs by component type
    else if (gew !== 'Alle') {
      const summary = [];
      const gewerkPrefix = gew;

      // Dynamic grouping by two-part code
      const groups = {};
      filtered.forEach(r => {
        const codeParts = (r['label code'] || '').split('.');
        if (codeParts[0] !== gewerkPrefix) return;
        const code2 = codeParts.slice(0,2).join('.');
        if (!groups[code2]) groups[code2] = [];
        groups[code2].push(r);
      });

      Object.entries(groups).forEach(([code2, items]) => {
        const info = bauteilPrices[code2];
        if (!info) return; // skip if no catalogue price

        const unitDisplay = `${info.price.toFixed(1)} /${info.unit}`;
        const totalCost = items.reduce((s,r)=>s+computeItemCost(r),0);

        const valueStr = info.unit==='m'
          ? `${items.length} Stück, ${(items.reduce((s,r)=>s+(Number(r.Length)||0),0)/1000).toFixed(1)} m`
          : `${items.length} Stück`;

        summary.push({
          label: bauteilNames[code2] || code2,
          value: valueStr,
          unitCost: unitDisplay,
          totalCost: `${totalCost.toLocaleString('de-DE', { minimumFractionDigits:1, maximumFractionDigits:1 })} CHF`
        });
      });
      
      // Calculate total cost for this Gewerk
      let totalCost = summary.reduce((sum, item) => {
        const cost = parseFloat(item.totalCost.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));            
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);
      
      // Add total row
      summary.push({ 
        label: 'Gesamtkosten', 
        value: '', 
        unitCost: '',
        totalCost: `${totalCost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF`,
        isTotal: true
      });
      
      return summary.length > 0 ? summary : [{ 
        label: 'Übersicht', 
        value: 'Keine Komponenten gefunden',
        unitCost: '',
        totalCost: '0.0 CHF'
      }];
    }
    
    return null;
  }, [filtered, gew, gewerkeMap]);

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
    
    const MAX_VISIBLE_BARS = 4; // show this many individual bauteile, aggregate the rest as "Diverse"
    
    if (gew === 'ExpandAll') {
      // Expanded mode: show the full list (no aggregation) for every Gewerk
      Object.entries(gewerkGroups).forEach(([code, data]) => {
        const sortedBauteile = Object.entries(data.bauteile)
          .sort((a, b) => b[1] - a[1]);
        
        barCharts[code] = {
          labels: sortedBauteile.map(([name]) => name),
          counts: sortedBauteile.map(([_, count]) => count),
          extraCount: 0,
          isExpanded: true
        };
      });
    } else {
      // Normal mode – only the currently relevant Gewerk (or all when gew === 'Alle')
      Object.entries(gewerkGroups).forEach(([code, data]) => {
        if (gew === 'Alle' || code === gew) {
          const sortedBauteile = Object.entries(data.bauteile)
            .sort((a, b) => b[1] - a[1]);

          const topBauteile = sortedBauteile.slice(0, MAX_VISIBLE_BARS);
          const otherBauteile = sortedBauteile.slice(MAX_VISIBLE_BARS);

          const otherCount = otherBauteile.reduce((sum, [, cnt]) => sum + cnt, 0);
          const labels = topBauteile.map(([name]) => name);
          const counts = topBauteile.map(([_, cnt]) => cnt);

          if (otherCount > 0) {
            labels.push('Diverse');
            counts.push(otherCount);
          }
          
          barCharts[code] = {
            labels,
            counts,
            extraCount: otherBauteile.length,
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

  // New layout with combined KPI card
  const layout = [
    { i: 'viewer',   x: 2.5, y: 0, w: 3.5, h: 8, static: true },
    { i: 'controls', x: 0, y: 0, w: 2.5, h: 8, static: true },
    { i: 'charts',   x: 6, y: 0, w: 6, h: 8, static: true },
    { i: 'lists',    x: 0, y: 8, w: 6, h: 6, static: true },
    { i: 'details',  x: 6, y: 8, w: 6, h: 6, static: true },
    { i: 'kpi-combined', x: 0, y: 14, w: 6, h: 6, static: true },
    { i: 'kpi-xy', x: 6, y: 14, w: 6, h: 6, static: true },
    { i: 'progress-material',   x: 0, y: 20, w: 12, h: 8, static: true },
    { i: 'progress-completion', x: 0, y: 28, w: 12, h: 8, static: true },
    { i: 'progress-apartments', x: 0, y: 36, w: 12, h: 8, static: true }
  ];

  return (
    <div className="material-auszug-dashboard">
      <ReactGridLayout
        layout={layout}
        cols={12}
        rowHeight={50}
        width={900}
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
                  <option value="">Alle</option>
                  {modelList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                  </div>
                  
                  <div className="select-group">
                    <label>Geschosse</label>
                <select value={flr} onChange={e => setFlr(e.target.value)}>
                  <option value="">Alle</option>
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
            <BauteileDashboard
              filtered={filtered}
              gew={gew}
              gewerkeMap={gewerkeMap}
              gewerkeColors={gewerkeColors}
            />
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

        <div key="kpi-combined">
          <DashboardItem title="">
            <div className="two-columns">
              <div className="column" style={{ position: 'relative', width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h3 style={{ margin: 0 }}>KPI - Planungskosten</h3>
                </div>
                <div className="kpi-content" style={{ height: 'calc(100% - 30px)', overflowY: 'auto' }}>
                  {/* Project meta table */}
                  <table style={{ width: '100%', marginBottom: '12px', fontSize: '0.9rem' }}>
                    <tbody>
                      {Object.entries(projectInfo).map(([key,val]) => (
                        <tr key={key}>
                          <td style={{ fontWeight: 'bold', padding: '4px 5px' }}>{key}</td>
                          <td style={{ padding: '4px 5px' }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!costDetails ? (
                    <p>Bitte einen Gewerk auswählen</p>
                  ) : (
                    <table className="details-table" style={{ width: '100%' }}>
                      <thead>
                        {gew !== 'Alle' && (
                          <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ textAlign: 'left', padding: '5px' }}>Komponente</th>
                            <th style={{ textAlign: 'left', padding: '5px' }}>Menge</th>
                            <th style={{ textAlign: 'left', padding: '5px' }}>Stückpreis in CHF</th>
                            <th style={{ textAlign: 'right', padding: '5px' }}>Kosten</th>
                          </tr>
                        )}
                        {gew === 'Alle' && (
                          <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ textAlign: 'left', padding: '5px' }}>Gewerk</th>
                            <th style={{ textAlign: 'right', padding: '5px' }}>Kosten (Ist)</th>
                            <th style={{ textAlign: 'right', padding: '5px' }}>Budget</th>
                            <th style={{ textAlign: 'right', padding: '5px' }}>Abweichung</th>
                            <th style={{ textAlign: 'right', padding: '5px' }}>Honorar %</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {costDetails.map((d, index) => {
                          // Determine the color for this row (if it's a Gewerk in 'Alle' view)
                          let rowColor = null;
                          if (gew === 'Alle' && !d.isTotal) {
                            const gewerkEntry = Object.entries(gewerkeMap).find(([code, name]) => 
                              name === d.label || code === d.label
                            );
                            if (gewerkEntry) {
                              rowColor = gewerkeColors[gewerkEntry[0]];
                            }
                          }
                          
                          // Calculate max value for 'Alle' view to determine bar width
                          let maxValue = 0;
                          let currentValue = 0;
                          
                          if (gew === 'Alle') {
                            // Find maximum cost value (excluding total row)
                            costDetails.forEach(item => {
                              if (!item.isTotal && item.value) {
                                const value = parseFloat(item.value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
                                if (!isNaN(value) && value > maxValue) {
                                  maxValue = value;
                                }
                              }
                            });
                            
                            // Get current row value
                            if (d.value) {
                              currentValue = parseFloat(d.value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
                              if (isNaN(currentValue)) currentValue = 0;
                            }
                          }
                          
                          return (
                            <tr key={d.label + index} style={{
                              ...(d.isTotal || d.label === 'Gesamtkosten' ? 
                                { fontWeight: 'bold', borderTop: '1px solid #ddd' } : {})
                            }}>
                              <td style={{ 
                                padding: '8px 5px',
                                fontWeight: gew === 'Alle' && !d.isTotal ? 'bold' : 'inherit',
                                color: 'inherit' 
                              }}>
                                {d.isTotal ? 'Gesamt:' : d.label}
                              </td>
                              {gew !== 'Alle' ? (
                                <>
                                  <td style={{ padding: '5px' }}>{d.value || ''}</td>
                                  <td style={{ padding: '5px' }}>{d.unitCost || ''}</td>
                                  <td style={{ padding: '5px', textAlign:'right', fontWeight: d.isTotal ? 'bold':'normal' }}>
                                    {d.totalCost}
                                  </td>
                                </>
                              ) : (
                                <>
                                  {/* Ist-Kosten */}
                                  <td style={{ padding: '8px 5px', textAlign: 'right', fontWeight: d.isTotal ? 'bold' : 'normal' }}>
                                    {d.value}
                                </td>
                                  {/* Budget */}
                                  <td style={{ padding: '8px 5px', textAlign: 'right' }}>
                                    {d.isTotal ? `${Object.entries(projectBudget).filter(([k])=>k!=='Honorar').reduce((s,[,v])=>s+v,0).toLocaleString('de-DE')} CHF` : (projectBudget[d.label] ? `${projectBudget[d.label].toLocaleString('de-DE')} CHF` : '-')}
                                  </td>
                                  {/* Difference */}
                                  <td style={{ padding: '8px 5px', textAlign: 'right', color: (() => {
                                      const rowBudget = d.isTotal ? Object.entries(projectBudget).filter(([k])=>k!=='Honorar').reduce((s,[,v])=>s+v,0) : projectBudget[d.label];
                                      if(!rowBudget) return 'inherit';
                                      const ist = parseFloat(d.value.replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));
                                      const diff = ist - rowBudget;
                                      return diff > 0 ? '#d32f2f' : diff < 0 ? '#388e3c' : 'inherit';
                                  })(), fontWeight: d.isTotal ? 'bold' : 'normal' }}>
                                    {(() => {
                                      const rowBudget2 = d.isTotal ? Object.entries(projectBudget).filter(([k])=>k!=='Honorar').reduce((s,[,v])=>s+v,0) : projectBudget[d.label];
                                      if(!rowBudget2) return d.isTotal ? '' : '-';
                                      const ist = parseFloat(d.value.replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));
                                      const diff = ist - rowBudget2;
                                      return `${diff>0?'+':''}${diff.toLocaleString('de-DE')} CHF`;
                                    })()}
                                  </td>
                                  {/* Honorar percentage */}
                                  <td style={{ padding: '8px 5px', textAlign: 'right' }}>
                                    {(() => {
                                      const honorar = projectBudget.Honorar || 0;
                                      if (d.isTotal) {
                                        // percentage against total budget of all gewerke
                                        const totalBudget = Object.entries(projectBudget)
                                          .filter(([key]) => key !== 'Honorar')
                                          .reduce((sum,[,val])=>sum+val,0);
                                        const pct = totalBudget ? (honorar / totalBudget * 100) : 0;
                                        return `${pct.toFixed(1)} %`;
                                      }
                                      const budget = projectBudget[d.label];
                                      if (!budget) return '-';
                                      const pct = honorar / budget * 100;
                                      return `${pct.toFixed(1)} %`;
                                    })()}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </DashboardItem>
        </div>

        <div key="kpi-xy">
          <DashboardItem title="KPI - XY">
            <div className="kpi-content" style={{ padding: '15px', height: '100%' }}>
              <p>Weitere KPI Daten werden hier angezeigt.</p>
            </div>
          </DashboardItem>
        </div>

        <div key="progress-material">
          <DashboardItem title="Material-Progression">
            <ChartSection />
          </DashboardItem>
        </div>

        <div key="progress-completion">
          <DashboardItem title="Completion-Balance">
            <CompletionBalanceChart />
          </DashboardItem>
        </div>

        <div key="progress-apartments">
          <DashboardItem title="Apartments-Over-Time">
            <ApartmentsOverTimeChart />
          </DashboardItem>
        </div>
      </ReactGridLayout>
    </div>
  );
}
