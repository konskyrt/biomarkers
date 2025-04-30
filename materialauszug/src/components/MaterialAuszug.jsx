import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './MaterialAuszug.css';

// Chart.js
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

const ReactGridLayout = WidthProvider(RGL);

// Map prefixes to display names
const gewerkeMap = { SN: 'Sanitär', EL: 'Elektro', SPR: 'Sprinkler', HZ: 'Heizung', KT: 'Kälte', LF: 'Lüftung' };
// Colors per Gewerk
const gewerkeColors = { SN: '#2196F3', EL: '#FF9800', SPR: '#E91E63', HZ: '#F44336', KT: '#00BCD4', LF: '#4CAF50', Alle: '#757575' };

// Define unit costs for different components by Gewerk
const unitCostMap = {
  SN: {
    Rohr: 75,
    'T-Stück': 35,
    Bögen: 25,
    Ventil: 120,
    default: 50,
  },
  EL: {
    Rohr: 45,
    Kabeltrasse: 85,
    'T-Stück': 30,
    Bögen: 25,
    default: 60,
  },
  SPR: {
    Rohr: 90,
    'T-Stück': 45,
    Bögen: 35,
    default: 80,
  },
  HZ: {
    Rohr: 80,
    'T-Stück': 40,
    Bögen: 30,
    Ventil: 100,
    Pumpe: 350,
    default: 70,
  },
  KT: {
    Rohr: 110,
    'T-Stück': 55,
    Bögen: 45,
    Ventil: 130,
    Pumpe: 450,
    default: 90,
  },
  LF: {
    Rohr: 95,
    'T-Stück': 60,
    Bögen: 50,
    default: 100,
  },
  default: {
    Rohr: 70,
    'T-Stück': 40,
    Bögen: 30,
    Ventil: 110,
    Kabeltrasse: 80,
    Pumpe: 400,
    default: 65,
  },
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

  // state and helper for nicer German file input card
  const [classesFile, setClassesFile] = useState(null);

  // Reusable custom file input (rounded, German text)
  const FileInput = ({ label, file, onChange }) => (
    <label className="block text-sm font-medium mb-4">
      {label}
      <input type="file" accept=".xlsx" className="hidden" onChange={onChange} />
      <div className="mt-2 flex items-center gap-2 border rounded px-2 py-1 cursor-pointer bg-gray-50 hover:bg-gray-100">
        <span className="bg-gray-900 text-white px-3 py-1 rounded">Durchsuchen</span>
        <span className="truncate text-sm">{file ? file.name : 'Keine Datei ausgewählt'}</span>
      </div>
    </label>
  );

  // Refs for positioning dropdowns
  const kategorienRef = useRef(null);
  const bauteileRef = useRef(null);
  const legendRef = useRef(null);
  const barchartsRef = useRef(null);

  // Handle file upload (XLSX only in this viewer-less version)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let buffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (err) {
      console.error('Read error:', err);
      alert('Error reading file');
      return;
    }

    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();

    if (ext === 'xlsx') {
      try {
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const arr = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setData(arr);
        setGew('Alle');
        setMdl('');
        setFlr('');
        setKat('');
        setBtl('');
      } catch (err) {
        console.error('Excel parse error:', err);
        alert('Excel parse failed');
      }
    } else {
      alert('Bitte eine XLSX-Datei hochladen.');
    }
  };

  // Filter spreadsheet data
  useEffect(() => {
    let d = data;
    if (gew !== 'Alle') d = d.filter((r) => (r['label code'] || '').split('.')[0] === gew);
    if (mdl) d = d.filter((r) => r['File Name'] === mdl);
    if (flr) d = d.filter((r) => r.Floor === flr);
    if (kat) d = d.filter((r) => r.type === kat);
    if (btl) d = d.filter((r) => r['label name'] === btl);
    setFiltered(d);
  }, [data, gew, mdl, flr, kat, btl]);

  // Memoized lists for selects
  const gewerkeList = useMemo(() => ['Alle', ...new Set(filtered.map((r) => (r['label code'] || '').split('.')[0]).filter((x) => x))], [filtered]);
  const modelList = useMemo(() => [...new Set(filtered.map((r) => r['File Name']).filter((x) => x))].sort(), [filtered]);
  const floorList = useMemo(() => [...new Set(filtered.map((r) => r.Floor).filter((x) => x))].sort(), [filtered]);
  const kategorien = useMemo(() => [...new Set(filtered.map((r) => r.type).filter((x) => x))].sort(), [filtered]);

  const bauteile = useMemo(() => {
    const allBauteile = [...new Set(filtered.map((r) => r['label name']).filter((x) => x))];
    const gewerkeNames = Object.values(gewerkeMap);
    return allBauteile
      .filter((name) => !gewerkeNames.some((gewerkName) => name.includes(gewerkName) || name.includes('general')))
      .sort();
  }, [filtered]);

  // Compute details
  const details = useMemo(() => {
    if (btl) {
      const rows = filtered.filter((r) => r['label name'] === btl);
      if (/rohr/i.test(btl)) {
        const len = rows.reduce((s, r) => s + (Number(r.Length) || 0), 0);
        const vol = rows.reduce((s, r) => s + (Number(r['Volume (m³)']) || 0), 0);
        return [
          { label: 'Anzahl', value: rows.length },
          { label: 'Gesamtlänge', value: `${(len / 1000).toFixed(2)} m` },
          { label: 'Volumen', value: `${vol.toFixed(2)} m³` },
        ];
      }
      if (/T-Stück|bogen|T-Stück|bend/i.test(btl)) {
        const vol = rows.reduce((s, r) => s + (Number(r['Volume (m³)']) || 0), 0);
        return [
          { label: 'Anzahl', value: rows.length },
          { label: 'Volumen', value: `${vol.toFixed(2)} m³` },
        ];
      }
      const vol = rows.reduce((s, r) => s + (Number(r['Volume (m³)']) || 0), 0);
      return [
        { label: 'Anzahl', value: rows.length },
        { label: 'Volumen', value: `${vol.toFixed(2)} m³` },
      ];
    } else if (gew !== 'Alle') {
      const summary = [];
      const gewerkPrefix = gew;
      const componentTypes = {
        Rohr: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /rohr|pipe|leitung|wasserrohr/i.test(r['label name']);
        }),
        'T-Stück': filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /T-Stück|T-piece/i.test(r['label name']);
        }),
        Bögen: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /bogen|bend|bögen|curve|elbow/i.test(r['label name']);
        }),
        Ventil: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Ventil|valve/i.test(r['label name']);
        }),
        Kabeltrasse: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Kabeltrasse|cable tray/i.test(r['label name']);
        }),
        Pumpe: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Pumpe|pump/i.test(r['label name']);
        }),
      };

      Object.entries(componentTypes).forEach(([type, items]) => {
        if (items.length > 0) {
          if (type === 'Rohr') {
            const len = items.reduce((s, r) => s + (Number(r.Length) || 0), 0);
            summary.push({ label: type, value: `${items.length} Stück, ${(len / 1000).toFixed(2)} m` });
          } else {
            summary.push({ label: type, value: `${items.length} Stück` });
          }
        }
      });

      summary.push({ label: 'Gesamt', value: `${filtered.length} Komponenten` });
      return summary.length > 0 ? summary : [{ label: 'Übersicht', value: 'Keine Komponenten gefunden' }];
    }
    return null;
  }, [filtered, btl, gew]);

  // Cost details
  const costDetails = useMemo(() => {
    if (gew === 'Alle') {
      const gewerkCosts = {};
      const relevantGewerke = ['SN', 'EL', 'SPR', 'HZ', 'KT', 'LF'];
      relevantGewerke.forEach((code) => {
        gewerkCosts[code] = 0;
      });
      filtered.forEach((item) => {
        const gewerkCode = (item['label code'] || '').split('.')[0];
        if (!gewerkCode || !relevantGewerke.includes(gewerkCode)) return;
        let itemType = 'default';
        if (/rohr|pipe|leitung|wasserrohr/i.test(item['label name'])) {
          itemType = 'Rohr';
        } else if (/T-Stück|T-piece/i.test(item['label name'])) {
          itemType = 'T-Stück';
        } else if (/bogen|bend|bögen|curve|elbow/i.test(item['label name'])) {
          itemType = 'Bögen';
        } else if (/Ventil|valve/i.test(item['label name'])) {
          itemType = 'Ventil';
        } else if (/Kabeltrasse|cable tray/i.test(item['label name'])) {
          itemType = 'Kabeltrasse';
        } else if (/Pumpe|pump/i.test(item['label name'])) {
          itemType = 'Pumpe';
        }
        const gewerkCostMap = unitCostMap[gewerkCode] || unitCostMap.default;
        const unitCost = gewerkCostMap[itemType] || gewerkCostMap.default;
        let itemCost = unitCost;
        if (itemType === 'Rohr' && item.Length) {
          itemCost = unitCost * (Number(item.Length) / 1000);
        }
        gewerkCosts[gewerkCode] += itemCost;
      });
      const results = Object.entries(gewerkCosts)
        .filter(([_, cost]) => cost > 0)
        .map(([code, cost]) => ({
          label: gewerkeMap[code] || code,
          value: `${cost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF`,
        }));
      const totalCost = Object.values(gewerkCosts).reduce((sum, cost) => sum + cost, 0);
      results.push({
        label: 'Gesamtkosten',
        value: `${totalCost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF`,
        isTotal: true,
      });
      return results;
    } else {
      const summary = [];
      const gewerkPrefix = gew;
      const gewerkCostMap = unitCostMap[gewerkPrefix] || unitCostMap.default;
      const componentTypes = {
        Rohr: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /rohr|pipe|leitung|wasserrohr/i.test(r['label name']);
        }),
        'T-Stück': filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /T-Stück|T-piece/i.test(r['label name']);
        }),
        Bögen: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /bogen|bend|bögen|curve|elbow/i.test(r['label name']);
        }),
        Ventil: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Ventil|valve/i.test(r['label name']);
        }),
        Kabeltrasse: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Kabeltrasse|cable tray/i.test(r['label name']);
        }),
        Pumpe: filtered.filter((r) => {
          const labelCode = (r['label code'] || '').split('.')[0];
          return labelCode === gewerkPrefix && /Pumpe|pump/i.test(r['label name']);
        }),
      };
      Object.entries(componentTypes).forEach(([type, items]) => {
        if (items.length > 0) {
          const unitCost = gewerkCostMap[type] || gewerkCostMap.default;
          if (type === 'Rohr') {
            const len = items.reduce((s, r) => s + (Number(r.Length) || 0), 0) / 1000;
            const totalCost = unitCost * len;
            summary.push({
              label: type,
              value: `${items.length} Stück, ${len.toFixed(1)} m`,
              unitCost: `${unitCost.toFixed(1)} CHF/m`,
              totalCost: `${totalCost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF`,
            });
          } else {
            const totalCost = unitCost * items.length;
            summary.push({
              label: type,
              value: `${items.length} Stück`,
              unitCost: `${unitCost.toFixed(1)} CHF/Stück`,
              totalCost: `${totalCost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF`,
            });
          }
        }
      });
      let totalCost = summary.reduce((sum, item) => {
        const cost = parseFloat(item.totalCost.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);
      summary.push({
        label: 'Gesamtkosten',
        value: '',
        unitCost: '',
        totalCost: `${totalCost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF`,
        isTotal: true,
      });
      return summary.length > 0
        ? summary
        : [
            {
              label: 'Übersicht',
              value: 'Keine Komponenten gefunden',
              unitCost: '',
              totalCost: '0.0 CHF',
            },
          ];
    }
  }, [filtered, gew]);

  // Charts data
  const chartData = useMemo(() => {
    if (filtered.length === 0) return null;
    const gewerkGroups = {};
    const relevantGewerke = ['SN', 'EL', 'SPR', 'HZ', 'KT', 'LF'];
    filtered.forEach((item) => {
      const gewerkCode = (item['label code'] || '').split('.')[0];
      if (!gewerkCode || !relevantGewerke.includes(gewerkCode)) return;
      if (!gewerkGroups[gewerkCode]) {
        gewerkGroups[gewerkCode] = { count: 0, bauteile: {}, types: {} };
      }
      gewerkGroups[gewerkCode].count++;
      const bauteil = item['label name'] || 'Unbekannt';
      if (!gewerkGroups[gewerkCode].bauteile[bauteil]) {
        gewerkGroups[gewerkCode].bauteile[bauteil] = 0;
      }
      gewerkGroups[gewerkCode].bauteile[bauteil]++;
      const type = item['type'] || 'Unbekannt';
      if (!gewerkGroups[gewerkCode].types[type]) {
        gewerkGroups[gewerkCode].types[type] = 0;
      }
      gewerkGroups[gewerkCode].types[type]++;
    });

    const generatePieChartData = () => {
      const allBauteile = new Set();
      filtered.forEach((item) => {
        if (item['label name']) {
          allBauteile.add(item['label name']);
        }
      });
      const gewerkeNames = Object.values(gewerkeMap);
      const filteredBauteile = [...allBauteile]
        .filter((name) => !gewerkeNames.some((gewerkName) => name.includes(gewerkName) || name.includes('general')))
        .sort();
      const bauteilCounts = filteredBauteile.map((bauteil) => filtered.filter((item) => item['label name'] === bauteil).length);
      const bauteilColors = filteredBauteile.map((_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)`);
      return {
        labels: filteredBauteile,
        datasets: [
          {
            data: bauteilCounts,
            backgroundColor: bauteilColors,
          },
        ],
      };
    };

    const barCharts = {};
    if (gew === 'ExpandAll') {
      Object.entries(gewerkGroups).forEach(([code, data]) => {
        const sortedBauteile = Object.entries(data.bauteile)
          .filter(([name]) => !Object.values(gewerkeMap).some((g) => name.includes(g) || name.includes('general')))
          .sort((a, b) => b[1] - a[1]);
        barCharts[code] = {
          labels: sortedBauteile.map(([name]) => name),
          counts: sortedBauteile.map(([_, count]) => count),
          isExpanded: true,
        };
      });
    } else {
      Object.entries(gewerkGroups).forEach(([code, data]) => {
        if (gew === 'Alle' || code === gew) {
          const sortedBauteile = Object.entries(data.bauteile)
            .filter(([name]) => !Object.values(gewerkeMap).some((g) => name.includes(g) || name.includes('general')))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          barCharts[code] = {
            labels: sortedBauteile.map(([name]) => name),
            counts: sortedBauteile.map(([_, count]) => count),
            isExpanded: false,
          };
        }
      });
    }
    return { gewerkGroups, pieChartData: generatePieChartData(), barCharts, isExpandedMode: gew === 'ExpandAll' };
  }, [filtered, gew]);

  // Click outside handler for dropdowns
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedKategorien, expandedBauteile, expandedLegend, expandedBarcharts]);

  // Layout grid (viewer removed)
  const layout = [
    { i: 'controls', x: 0, y: 0, w: 2.5, h: 8, static: true },
    { i: 'charts', x: 2.5, y: 0, w: 9.5, h: 8, static: true },
    { i: 'lists', x: 0, y: 8, w: 6, h: 6, static: true },
    { i: 'details', x: 6, y: 8, w: 6, h: 6, static: true },
    { i: 'kpi-combined', x: 0, y: 14, w: 6, h: 6, static: true },
    { i: 'kpi-xy', x: 6, y: 14, w: 6, h: 6, static: true },
  ];

  return (
    <div className="material-auszug-dashboard">
      <ReactGridLayout layout={layout} cols={12} rowHeight={60} width={1200}>
        <div key="controls">
          {/* Controls */}
          <div className="bg-white p-4 rounded-lg shadow" style={{ height: '100%', overflowY: 'auto' }}>
            <h2 className="text-lg font-semibold mb-2">Daten importieren</h2>
            <FileInput
              label="Komponenten-Klassen"
              file={classesFile}
              onChange={(e)=>{ setClassesFile(e.target.files[0]); handleFileUpload(e);} }
            />

            <h2 className="text-lg font-semibold mb-2 mt-4">Filter</h2>
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-2">Gewerke</h3>
              <div className="flex flex-wrap gap-2">
                {gewerkeList.map((code) => (
                  <button
                    key={code}
                    onClick={() => setGew(code)}
                    style={{ backgroundColor: gewerkeColors[code], opacity: code === gew ? 1 : 0.6 }}
                    className="px-2 py-1 rounded text-white text-xs"
                  >
                    {gewerkeMap[code] || code}
                  </button>
                ))}
                <button
                  onClick={() => setGew((prev) => (prev === 'ExpandAll' ? 'Alle' : 'ExpandAll'))}
                  className="px-2 py-1 rounded bg-gray-800 text-white text-xs"
                  style={{ opacity: gew === 'ExpandAll' ? 1 : 0.7 }}
                >
                  {gew === 'ExpandAll' ? 'Collapse' : 'Expand All'}
                </button>
              </div>
            </div>
            <div className="border-t pt-4 mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block">Modelle</label>
                <select value={mdl} onChange={(e) => setMdl(e.target.value)} className="mt-1 w-full border rounded px-2 py-1">
                  <option value="">Alle Modelle</option>
                  {modelList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block">Geschosse</label>
                <select value={flr} onChange={(e) => setFlr(e.target.value)} className="mt-1 w-full border rounded px-2 py-1">
                  <option value="">Alle Geschosse</option>
                  {floorList.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div key="charts">
          {/* Charts Section */}
          <div className="bg-white p-4 rounded-lg shadow h-full overflow-hidden flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Bauteileverteilung</h2>
            {chartData ? (
              <div className="flex-1 overflow-auto">
                {/* Pie Chart */}
                <div className="h-60">
                  <Pie data={chartData.pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>

                {/* Horizontal Bars per Gewerk */}
                <div className="mt-6 space-y-4" ref={barchartsRef}>
                  {Object.entries(chartData.barCharts).map(([code, data]) => {
                    const maxCount = Math.max(...data.counts);
                    return (
                      <div key={code}>
                        <h4 className="text-sm font-semibold mb-1" style={{ color: gewerkeColors[code] }}>{gewerkeMap[code] || code}</h4>
                        {data.labels.map((label, idx) => {
                          const percentage = maxCount > 0 ? (data.counts[idx] / maxCount) * 100 : 0;
                          return (
                            <div key={label} className="flex items-center mb-1 gap-2">
                              <span className="w-48 truncate text-xs">{label}</span>
                              <div className="flex-1 bg-gray-100 h-2 rounded relative">
                                <div
                                  className="h-2 rounded"
                                  style={{ width: `${percentage}%`, backgroundColor: gewerkeColors[code] }}
                                ></div>
                              </div>
                              <span className="text-xs w-6 text-right">{data.counts[idx]}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">Laden Sie Daten, um Diagramme anzuzeigen</div>
            )}
          </div>
        </div>

        <div key="lists">
          {/* Kategorien & Bauteile Lists */}
          <div className="bg-white p-4 rounded-lg shadow h-full grid grid-cols-2 gap-4" ref={kategorienRef}>
            {/* Kategorien */}
            <div>
              <h3 className="font-medium mb-2">Kategorien</h3>
              <ul className="text-sm space-y-1 max-h-48 overflow-auto">
                {kategorien.map((k) => (
                  <li
                    key={k}
                    className={`cursor-pointer truncate ${k === kat ? 'font-semibold text-primary' : ''}`}
                    onClick={() => setKat((prev) => (prev === k ? '' : k))}
                  >
                    {k}
                  </li>
                ))}
              </ul>
            </div>
            {/* Bauteile */}
            <div ref={bauteileRef}>
              <h3 className="font-medium mb-2">Bauteile</h3>
              <ul className="text-sm space-y-1 max-h-48 overflow-auto">
                {bauteile.map((b) => (
                  <li
                    key={b}
                    className={`cursor-pointer truncate ${b === btl ? 'font-semibold text-primary' : ''}`}
                    onClick={() => setBtl((prev) => (prev === b ? '' : b))}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div key="details">
          {/* Details table */}
          <div className="bg-white p-4 rounded-lg shadow h-full overflow-auto">
            <h3 className="font-medium mb-2">Details</h3>
            {!btl && gew === 'Alle' ? (
              <p className="text-sm text-gray-500">Bitte einen Bauteil oder Gewerk auswählen</p>
            ) : (
              <table className="text-sm w-full">
                <tbody>
                  {details &&
                    details.map((d) => (
                      <tr key={d.label} className="border-t">
                        <td className="py-1 pr-2 font-medium w-1/2">{d.label}</td>
                        <td className="py-1">{d.value}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div key="kpi-combined">
          {/* KPI – Planungskosten */}
          <div className="bg-white p-4 rounded-lg shadow h-full overflow-auto">
            <h3 className="font-medium mb-4">KPI – Planungskosten</h3>
            {!costDetails ? (
              <p className="text-sm text-gray-500">Bitte einen Gewerk auswählen</p>
            ) : (
              <table className="text-sm w-full">
                <thead>
                  {gew !== 'Alle' ? (
                    <tr className="border-b bg-gray-50">
                      <th className="py-1 text-left">Komponente</th>
                      <th className="py-1 text-left">Menge</th>
                      <th className="py-1 text-left">Stückpreis</th>
                      <th className="py-1 text-right">Kosten</th>
                    </tr>
                  ) : (
                    <tr className="border-b bg-gray-50">
                      <th className="py-1 text-left">Gewerk</th>
                      <th className="py-1 text-right">Kosten</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {costDetails.map((row) => (
                    <tr key={row.label} className={row.isTotal ? 'font-semibold border-t' : ''}>
                      <td className="py-1 pr-2">{row.label}</td>
                      {gew !== 'Alle' ? (
                        <>
                          <td className="py-1">{row.value}</td>
                          <td className="py-1">{row.unitCost}</td>
                          <td className="py-1 text-right">{row.totalCost}</td>
                        </>
                      ) : (
                        <td className="py-1 text-right">{row.value}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div key="kpi-xy">
          <div className="bg-white p-4 rounded-lg shadow h-full flex items-center justify-center text-sm text-gray-500">
            Weitere KPI Daten werden hier angezeigt.
          </div>
        </div>
      </ReactGridLayout>
    </div>
  );
} 