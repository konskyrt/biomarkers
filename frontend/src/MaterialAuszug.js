// src/MaterialAuszug.js

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DashboardItem from './DashboardItem';
import './MaterialAuszug.css';

const ReactGridLayout = WidthProvider(RGL);

// Map prefixes to display names
const gewerkeMap = {
  SN: 'Sanitär',
  EL: 'Elektro',
  SPR: 'Sprinkler',
  HZ: 'Heizung',
  KT: 'Kälte',
  LF: 'Lüftung'
};

// Colors per Gewerk
const gewerkeColors = {
  SN: '#2196F3',
  EL: '#FF9800',
  SPR: '#E91E63',
  HZ: '#F44336',
  KT: '#00BCD4',
  LF: '#4CAF50',
  Alle: '#757575'
};

export default function MaterialAuszug() {
  const [data, setData] = useState([]);       // all rows
  const [filtered, setFiltered] = useState([]); // rows after applying filters

  // filter states
  const [gew, setGew] = useState('Alle');
  const [mdl, setMdl] = useState('');
  const [flr, setFlr] = useState('');
  const [kat, setKat] = useState('');
  const [btl, setBtl] = useState('');

  // whenever data or any filter changes, recompute filtered rows
  useEffect(() => {
    let d = data;

    // parse code prefix: use .split('.')[0] on the “label code” column
    if (gew !== 'Alle') {
      d = d.filter(r => {
        const prefix = (r['label code'] || '').split('.')[0];
        return prefix === gew;
      });
    }

    if (mdl) d = d.filter(r => r['File Name'] === mdl);
    if (flr) d = d.filter(r => r.Floor === flr);
    if (kat) d = d.filter(r => r.type === kat);
    if (btl) d = d.filter(r => r['label name'] === btl);

    setFiltered(d);
  }, [data, gew, mdl, flr, kat, btl]);

  // file‐upload handler reads first sheet into JSON rows
  const handleFileUpload = async e => {
    const f = e.target.files[0];
    if (!f) return;
    const ab = await f.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    setData(json);
    // reset all filters
    setGew('Alle');
    setMdl('');
    setFlr('');
    setKat('');
    setBtl('');
  };

  // Derive all option lists FROM THE *FILTERED* rows, so they update interactively:
  const gewerkeList = useMemo(() => {
    const prefixes = new Set(
      filtered.map(r => (r['label code'] || '').split('.')[0]).filter(x => x)
    );
    return ['Alle', ...Array.from(prefixes).sort()];
  }, [filtered]);

  const modelList = useMemo(() => {
    return Array.from(new Set(filtered.map(r => r['File Name']).filter(x => x))).sort();
  }, [filtered]);

  const floorList = useMemo(() => {
    return Array.from(new Set(filtered.map(r => r.Floor).filter(x => x))).sort();
  }, [filtered]);

  const kategorienList = useMemo(() => {
    return Array.from(new Set(filtered.map(r => r.type).filter(x => x))).sort();
  }, [filtered]);

  const bauteileList = useMemo(() => {
    return Array.from(new Set(filtered.map(r => r['label name']).filter(x => x))).sort();
  }, [filtered]);

  // Compute “Details” for selected Bauteil
  const details = useMemo(() => {
    if (!btl) return null;
    const rows = filtered.filter(r => r['label name'] === btl);

    // Rohre → sum Length & Volume
    if (btl.toLowerCase().includes('rohr')) {
      const totalLength = rows.reduce((s, r) => s + (Number(r.Length) || 0), 0);
      const totalVolume = rows.reduce((s, r) => s + (Number(r['Volume (m³)']) || 0), 0);
      return [
        { label: 'Gesamtlänge', value: `${totalLength.toFixed(2)} m` },
        { label: 'Volumen', value: `${totalVolume.toFixed(2)} m³` }
      ];
    }

    // T‑Stück or Bogen → count & volume
    if (btl.includes('T‑Stück') || btl.includes('Bogen')) {
      const totalVolume = rows.reduce((s, r) => s + (Number(r['Volume (m³)']) || 0), 0);
      return [
        { label: 'Anzahl', value: rows.length },
        { label: 'Volumen', value: `${totalVolume.toFixed(2)} m³` }
      ];
    }

    // others → just volume
    const totalVolume = rows.reduce((s, r) => s + (Number(r['Volume (m³)']) || 0), 0);
    return [{ label: 'Volumen', value: `${totalVolume.toFixed(2)} m³` }];
  }, [filtered, btl]);

  // bump everything down by 2 rows (y + 2)
  const layout = [
    { i: 'title',    x: 0,  y: 0, w: 12, h: 0, static: true },
    { i: 'upload',   x: 10,  y: 0, w: 4, h: 2, static: true },
    { i: 'gewerk',   x: 6,  y: 2, w: 2, h: 6, static: true },
    { i: 'model',    x: 8,  y: 2, w: 2, h: 6, static: true },
    { i: 'floor',    x: 10, y: 2, w: 2, h: 6, static: true },
    { i: 'viewer',   x: 0,  y: 2, w: 6, h: 6, static: true },
    { i: 'kategorien', x: 0, y: 8, w: 3, h: 5, static: true },
    { i: 'bauteile',   x: 3, y: 8, w: 3, h: 5, static: true },
    { i: 'details',    x: 6, y: 8, w: 6, h: 5, static: true }
  ];

  return (
    <div className="material-auszug-dashboard">
      <ReactGridLayout layout={layout} cols={12} rowHeight={60} width={1200}>
        {/* Page Title */}
        <div key="title">
          <h2 className="page-title">Materialauszug Dashboard</h2>
        </div>

        {/* File Upload */}
        <div key="upload">
          <DashboardItem title="IFC‑Datei laden">
            <input type="file" accept=".xlsx" onChange={handleFileUpload} />
          </DashboardItem>
        </div>

        {/* Gewerke */}
        <div key="gewerk">
          <DashboardItem title="Gewerk">
            <div className="filter-buttons">
              {gewerkeList.map(code => (
                <button
                  key={code}
                  onClick={() => setGew(code)}
                  style={{
                    backgroundColor: gewerkeColors[code] || '#999',
                    color: '#fff',
                    padding: '6px 12px',
                    margin: '4px',
                    border: 'none',
                    borderRadius: '4px',
                    opacity: code === gew ? 1 : 0.6,
                    cursor: 'pointer'
                  }}
                >
                  {gewerkeMap[code] || code}
                </button>
              ))}
            </div>
          </DashboardItem>
        </div>

        {/* Model */}
        <div key="model">
          <DashboardItem title="Modell">
            <select value={mdl} onChange={e => setMdl(e.target.value)}>
              <option value="">Alle Modelle</option>
              {modelList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </DashboardItem>
        </div>

        {/* Floor */}
        <div key="floor">
          <DashboardItem title="Geschoss">
            <select value={flr} onChange={e => setFlr(e.target.value)}>
              <option value="">Alle Geschosse</option>
              {floorList.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </DashboardItem>
        </div>

        {/* 3D Viewer Placeholder */}
        <div key="viewer">
          <DashboardItem title="3D Viewer">
            <div className="empty-viewer">Platzhalter für Viewer</div>
          </DashboardItem>
        </div>

        {/* Kategorien */}
        <div key="kategorien">
          <DashboardItem title="Kategorien">
            <ul className="list">
              {kategorienList.map(k => (
                <li
                  key={k}
                  className={k === kat ? 'selected' : ''}
                  onClick={() => setKat(prev => prev === k ? '' : k)}
                >{k}</li>
              ))}
            </ul>
          </DashboardItem>
        </div>

        {/* Bauteile */}
        <div key="bauteile">
          <DashboardItem title="Bauteile">
            <ul className="list">
              {bauteileList.map(b => (
                <li
                  key={b}
                  className={b === btl ? 'selected' : ''}
                  onClick={() => setBtl(prev => prev === b ? '' : b)}
                >{b}</li>
              ))}
            </ul>
          </DashboardItem>
        </div>

        {/* Details */}
        <div key="details">
          <DashboardItem title="Details">
            {!btl
              ? <p>Bitte einen Bauteil auswählen</p>
              : <table className="details-table">
                  <tbody>
                    {details.map(d => (
                      <tr key={d.label}>
                        <td>{d.label}</td>
                        <td>{d.value}</td>
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
