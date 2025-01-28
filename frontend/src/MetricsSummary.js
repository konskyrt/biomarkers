import React from 'react';

const MetricsSummary = ({ filteredData }) => {
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

  return (
    <div style={{ display: 'flex', gap: '20px', margin: '20px 0', justifyContent: 'center' }}>
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

export default MetricsSummary;
