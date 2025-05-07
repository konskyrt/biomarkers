import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';

// expects props: filtered (array), gew (current gew filter), gewerkeMap, gewerkeColors
export default function BauteileDashboard({ filtered, gew, gewerkeMap, gewerkeColors }) {
  // Helper: get base color, lighten for sub items
  const lightenColor = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;
    r = r < 255 ? (r < 0 ? 0 : r) : 255;
    g = g < 255 ? (g < 0 ? 0 : g) : 255;
    b = b < 255 ? (b < 0 ? 0 : b) : 255;
    const hexNum = (r << 16) | (g << 8) | b;
    return `#${hexNum.toString(16).padStart(6, '0')}`;
  };

  // Prepare counts by bauteil and gewerk
  const chartData = useMemo(() => {
    if (!filtered || filtered.length === 0) return null;

    // Group by bauteil name
    const countsByBauteil = {};
    const bauteilToGewerk = {};
    filtered.forEach(row => {
      const name = row['label name'] || 'Unbekannt';
      const code = (row['label code'] || '').split('.')[0];
      if (!countsByBauteil[name]) countsByBauteil[name] = 0;
      countsByBauteil[name]++;
      if (!bauteilToGewerk[name]) bauteilToGewerk[name] = code;
    });

    // order labels so same gewerk items are consecutive
    const labelsByGewerk = {};
    Object.keys(countsByBauteil).forEach(lbl => {
      const code = bauteilToGewerk[lbl];
      if (!labelsByGewerk[code]) labelsByGewerk[code] = [];
      labelsByGewerk[code].push(lbl);
    });

    const gewerkOrder = Object.keys(gewerkeMap); // preserves user-defined order
    const pieLabels = [];
    gewerkOrder.forEach(code => {
      if (labelsByGewerk[code]) {
        // optionally sort within gewerk by count desc
        labelsByGewerk[code].sort((a,b)=>countsByBauteil[b]-countsByBauteil[a]);
        pieLabels.push(...labelsByGewerk[code]);
      }
    });
    // add any remaining gewerke not in map
    Object.keys(labelsByGewerk).forEach(code => {
      if (!gewerkOrder.includes(code)) pieLabels.push(...labelsByGewerk[code]);
    });

    const pieCounts = pieLabels.map(l => countsByBauteil[l]);
    // assign deterministic shade per gewerk
    const gewerkShadeIndex = {};
    const pieColors = pieLabels.map(label => {
      const code = bauteilToGewerk[label];
      const base = gewerkeColors[code] || '#888';
      if (!gewerkShadeIndex[code]) gewerkShadeIndex[code] = 0;
      const shade = gewerkShadeIndex[code]++;
      return lightenColor(base, shade * 30);
    });

    // Bar charts per gewerk
    const gewerkGroups = {};
    filtered.forEach(row => {
      const code = (row['label code'] || '').split('.')[0];
      const name = row['label name'] || 'Unbekannt';
      if (!gewerkGroups[code]) gewerkGroups[code] = {};
      if (!gewerkGroups[code][name]) gewerkGroups[code][name] = 0;
      gewerkGroups[code][name]++;
    });

    // Convert to arrays, add diverse counts
    const barCharts = {};
    Object.entries(gewerkGroups).forEach(([code, items]) => {
      const entries = Object.entries(items);
      let diverseCount = 0;
      const filteredEntries = entries.filter(([name]) => {
        const disp = gewerkeMap[code];
        if (name === disp) { diverseCount += items[name]; return false; }
        return true;
      });
      filteredEntries.sort((a,b)=>b[1]-a[1]);
      if (diverseCount>0) filteredEntries.push(['Diverse', diverseCount]);
      barCharts[code] = {
        labels: filteredEntries.map(e=>e[0]),
        counts: filteredEntries.map(e=>e[1])
      };
    });

    return { pieLabels, pieCounts, pieColors, barCharts };
  }, [filtered, gew]);

  if (!chartData) return <p>Laden Sie Daten, um Diagramme anzuzeigen</p>;

  // Decide which gewerke to show bars for
  const gewerkeToShow = gew === 'Alle' || gew === 'ExpandAll' ? Object.keys(chartData.barCharts) : [gew];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Top area: pie + legend */}
      <div style={{ display: 'flex', flex: '0 0 25%', maxHeight: '25%', gap: '1rem' }}>
        <div style={{ flex: '0 0 200px', position: 'relative' }}>
          <Doughnut
            data={{ labels: chartData.pieLabels, datasets:[{data: chartData.pieCounts, backgroundColor: chartData.pieColors, borderWidth:0, hoverOffset:12}] }}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (context) => context.label
                  }
                },
                datalabels: {
                  display: false
                }
              },
              maintainAspectRatio: false,
              cutout: '70%'
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chartData.pieLabels.map((label, idx)=>(
            <div key={label} style={{ display:'flex', alignItems:'center', fontSize:'0.8rem', marginBottom:4 }}>
              <span style={{ width:12, height:12, backgroundColor: chartData.pieColors[idx], display:'inline-block', marginRight:6 }}></span>
              {label} ({chartData.pieCounts[idx]})
            </div>
          ))}
        </div>
      </div>
      {/* Bottom bars */}
      <div style={{ flex: '1', overflowY: 'auto', marginTop: '0.5rem' }}>
        {gewerkeToShow.map(code => {
          const data = chartData.barCharts[code];
          if (!data) return null;
          const max = Math.max(...data.counts);
          return (
            <div key={code} style={{ marginBottom: '0.8rem' }}>
              <h5 style={{ margin: '0 0 4px 0', color: gewerkeColors[code], fontSize: '0.85rem' }}>{gewerkeMap[code] || code}</h5>
              {data.labels.map((label, i) => {
                const pct = max > 0 ? (data.counts[i] / max) * 100 : 0;
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ width: '150px', textAlign: 'left', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                    <div style={{ flex: 1, position: 'relative', height: '12px', background: '#eee', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: gewerkeColors[code] }} />
                      <span style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#333' }}>{data.counts[i]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
} 