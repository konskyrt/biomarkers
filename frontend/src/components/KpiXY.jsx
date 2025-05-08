import React from 'react';

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

const KpiXY = () => {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '4px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)', 
        padding: '15px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ 
          margin: 0, 
          color: '#666',
          fontSize: '1.1em',
          textAlign: 'center'
        }}>
          KPI - XY Content
        </p>
      </div>
    </div>
  );
};

export default KpiXY; 