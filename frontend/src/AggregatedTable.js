import React from 'react';

const AggregatedTable = ({ filteredData, aggregationType, setAggregationType }) => {
  const generateAggregatedTableData = (aggregateBy = 'sv/ConvexHullVolume') => {
    const uniqueFloors = [
      ...new Set(filteredData.map((row) => row['FloorName']).filter(Boolean)),
    ];

    const uniqueEBKPs = [
      ...new Set(
        filteredData
          .map((row) => {
            const ebkpValue = row['EBKP'];
            if (ebkpValue) {
              return ebkpValue.split(' ').slice(1).join(' '); // Extract descriptive part
            }
            return null;
          })
          .filter(Boolean)
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
          aggregateBy === 'sv/ConvexHullVolume' // Aggregate volume
            ? floorData.reduce(
                (sum, item) =>
                  sum + parseFloat(item['sv/ConvexHullVolume'] || 0),
                0
              )
            : floorData.length; // Aggregate number of objects (row count)
      });

      return row;
    });

    return { uniqueFloors, aggregatedData };
  };

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
          <option value="sv/ConvexHullVolume">Volume</option>
          <option value="Objects">Number of Objects</option>
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

export default AggregatedTable;
