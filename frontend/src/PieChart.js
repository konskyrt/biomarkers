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

const PieChart = ({ filteredData, selectedMetric }) => {
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

  const data = generatePieChartData();

  return (
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
        Kategorieverteilung (Volumen)
      </h3>
      <div style={{ height: '200px' }}>
        <Pie
          data={data}
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
          {data.labels.map((label, index) => (
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
                    data.datasets[0].backgroundColor[index],
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
  );
};

export default PieChart;
