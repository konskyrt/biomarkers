import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

// Colors per Gewerk
const gewerkeColors = { 
  KO: '#9E9E9E', // Konstruktion
  SN: '#2196F3', // Sanitär
  EL: '#FF9800', // Elektro
  SPR: '#E91E63', // Sprinkler
  HZ: '#F44336', // Heizung
  KT: '#00BCD4', // Kälte
  LF: '#4CAF50', // Lüftung
  Alle: '#757575' // Alle
};

const gewerkNameToCode = {
  'Sanitär': 'SN',
  'Elektro': 'EL',
  'Heizung': 'HZ',
  'Lüftung': 'LF'
};

// Import bauteilPrices from MaterialAuszug
const bauteilPrices = {
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
  'LF.13': { unit: 'm²',    price: 20 }
};

const AusfuehrungsCosts = ({ projectBudget = {}, costDetails = [], filtered = [], gew = 'Alle', gewerkeMap = {} }) => {
  // Calculate total budget excluding Honorar
  const totalBudget = Object.entries(projectBudget)
    .filter(([key]) => key !== 'Honorar')
    .reduce((sum, [, val]) => sum + val, 0);

  // Check if we have any cost details data
  const hasCostDetails = costDetails && costDetails.length > 0;

  // Prepare data for pie chart
  const pieData = {
    labels: Object.entries(projectBudget)
      .filter(([key]) => key !== 'Honorar')
      .map(([gewerk]) => gewerk),
    datasets: [{
      data: Object.entries(projectBudget)
        .filter(([key]) => key !== 'Honorar')
        .map(([_, budget]) => (budget / totalBudget) * 100),
      backgroundColor: Object.entries(projectBudget)
        .filter(([key]) => key !== 'Honorar')
        .map(([gewerk]) => gewerkeColors[gewerkNameToCode[gewerk]] || '#757575'),
      borderWidth: 1,
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 10,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return `${context.label}: ${value.toFixed(1)}%`;
          }
        }
      }
    },
    cutout: '30%',
    radius: '90%',
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  // Process cost details for the overview table
  const processedDetails = hasCostDetails ? costDetails.filter(d => !d.isTotal).map(d => {
    const budget = projectBudget[d.label];
    if (!budget) return null;
    
    const istValue = d.value ? parseFloat(d.value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) : null;
    const deviation = istValue !== null ? ((istValue - budget) / budget) * 100 : null;

    return {
      ...d,
      budget: `${budget.toLocaleString('de-DE')} CHF`,
      value: istValue !== null ? d.value : '-',
      deviation: deviation !== null ? deviation.toFixed(1) : null
    };
  }).filter(Boolean) : [];

  // Get total row data
  const getTotalRowData = () => {
    if (!hasCostDetails) {
      return {
        value: '-',
        deviation: '-'
      };
    }

    const totalRowData = costDetails.find(d => d.isTotal);
    if (!totalRowData || !totalRowData.value) {
      return {
        value: '-',
        deviation: '-'
      };
    }

    const totalIst = parseFloat(totalRowData.value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
    const totalDeviation = ((totalIst - totalBudget) / totalBudget) * 100;

    return {
      value: totalRowData.value,
      deviation: totalDeviation.toFixed(1)
    };
  };

  const totalRowData = getTotalRowData();

  // Process bauteile data for detailed view
  const bauteileGroups = filtered ? filtered.reduce((acc, item) => {
    const type = item['label name'];
    const code = item['label code'];
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        length: 0,
        area: 0,
        volume: 0,
        code: code,
        unit: bauteilPrices[code]?.unit || 'Stück'
      };
    }
    acc[type].count++;
    acc[type].length += Number(item.Length || 0);
    acc[type].area += Number(item['Area (m²)'] || 0);
    acc[type].volume += Number(item['Volume (m³)'] || 0);
    return acc;
  }, {}) : {};

  // Calculate total costs for detailed view
  const totalCost = Object.entries(bauteileGroups).reduce((sum, [type, data]) => {
    const unitPrice = bauteilPrices[data.code]?.price || 0;
    const quantity = data.unit === 'm' ? data.length / 1000 : 
                    data.unit === 'm²' ? data.area : 
                    data.count;
    return sum + (unitPrice * quantity);
  }, 0);

  return (
    <div style={{ height: '100%', display: 'flex', gap: '2px' }}>
      <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '4px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)', 
          padding: '10px',
          height: '100%',
          overflow: 'auto'
        }}>
          {/* Project Details Section */}
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: '#333',
              borderBottom: '2px solid #eee',
              paddingBottom: '8px'
            }}>
              Projekt Details
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px', fontWeight: '500' }}>Projektbezeichnung</td>
                  <td style={{ padding: '4px' }}>11565.01 - Salathe Arlesheim</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', fontWeight: '500' }}>Planungsart</td>
                  <td style={{ padding: '4px' }}>GTD</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', fontWeight: '500' }}>Nutzung</td>
                  <td style={{ padding: '4px' }}>Mehrfamilienhäuser</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px', fontWeight: '500' }}>Budget</td>
                  <td style={{ padding: '4px' }}>{totalBudget.toLocaleString('de-DE')} CHF</td>
                </tr>
              </tbody>
            </table>
          </div>

          {gew === 'Alle' ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#333',
                  borderBottom: '2px solid #eee',
                  paddingBottom: '8px'
                }}>
                  Kostenübersicht
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8em' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '3px', borderBottom: '2px solid #ddd' }}>Gewerk</th>
                      <th style={{ textAlign: 'right', padding: '3px', borderBottom: '2px solid #ddd' }}>Budget</th>
                      <th style={{ textAlign: 'right', padding: '3px', borderBottom: '2px solid #ddd' }}>Kosten Ist</th>
                      <th style={{ textAlign: 'right', padding: '3px', borderBottom: '2px solid #ddd' }}>Abw.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedDetails.map((d, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '3px' }}>{d.label}</td>
                        <td style={{ textAlign: 'right', padding: '3px' }}>{d.budget}</td>
                        <td style={{ textAlign: 'right', padding: '3px' }}>{d.value}</td>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '3px',
                          color: d.deviation ? (parseFloat(d.deviation) > 0 ? '#d32f2f' : parseFloat(d.deviation) < 0 ? '#388e3c' : 'inherit') : 'inherit',
                          fontWeight: '500'
                        }}>
                          {d.deviation ? (parseFloat(d.deviation) > 0 ? '+' : '') + d.deviation + '%' : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ddd' }}>
                      <td style={{ padding: '3px' }}>Total</td>
                      <td style={{ textAlign: 'right', padding: '3px' }}>
                        {totalBudget.toLocaleString('de-DE')} CHF
                      </td>
                      <td style={{ textAlign: 'right', padding: '3px' }}>
                        {costDetails && costDetails.length > 0 ? (costDetails.find(d => d.isTotal)?.value || '-') : '-'}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '3px',
                        color: 'inherit'
                      }}>
                        -
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#333',
                borderBottom: '2px solid #eee',
                paddingBottom: '10px'
              }}>
                {gewerkeMap[gew] || gew} - Bauteile Übersicht
              </h3>
              
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.9em'
              }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd' }}>Bauteil</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Menge</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Einheit</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Preis/Einheit</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Kosten</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bauteileGroups).map(([type, data]) => {
                    const unitPrice = bauteilPrices[data.code]?.price || 0;
                    const quantity = data.unit === 'm' ? data.length / 1000 : 
                                   data.unit === 'm²' ? data.area : 
                                   data.count;
                    const cost = unitPrice * quantity;

                    return (
                      <tr key={type} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>{type}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>
                          {quantity.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>{data.unit}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>
                          {unitPrice.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>
                          {cost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ 
                    borderTop: '2px solid #ddd',
                    fontWeight: 'bold',
                    backgroundColor: '#f8f8f8'
                  }}>
                    <td colSpan="4" style={{ padding: '8px', textAlign: 'right' }}>Gesamtkosten:</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>
                      {totalCost.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} CHF
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
      <div style={{ flex: '0 0 70%', display: 'flex', gap: '2px' }}>
        <div style={{ 
          flex: '0 0 70%', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          backgroundColor: 'white', 
          borderRadius: '4px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)', 
          padding: '10px'
        }}>
          <div style={{ width: '70%', height: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '20px' }}>
            <div style={{ width: '100%', height: '85%' }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
        </div>
        <div style={{ 
          flex: '0 0 30%',
          backgroundColor: 'white', 
          borderRadius: '4px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)', 
          padding: '10px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1 }}>
            {/* Content will go here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AusfuehrungsCosts; 