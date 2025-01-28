import React from 'react';
import { Bar } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LogarithmicScale,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, LogarithmicScale, zoomPlugin, Tooltip, Legend);

const BarChart = ({ filteredData, selectedMetric, title, generateData }) => {
  const generateBarChartData = () => {
    const labels = [
      ...new Set(
        filteredData.map((row) => {
          const ebkpValue = row['EBKP'];
          if (ebkpValue) {
            return ebkpValue.split(' ').slice(1).join(' '); // Remove initials
          }
          return null;
        }).filter(Boolean)
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

    // Pair labels and data, then sort them in descending order by data
    const sortedData = labels
      .map((label, index) => ({ label, value: data[index] }))
      .sort((a, b) => b.value - a.value);

    // Extract sorted labels and data
    const sortedLabels = sortedData.map((item) => item.label);
    const sortedValues = sortedData.map((item) => item.value);

    const colors = sortedLabels.map(
      (_, i) => `hsl(${(i * 137.5) % 360}, 70%, 50%)` // Golden angle color distribution
    );

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: `${selectedMetric}`,
          data: sortedValues,
          backgroundColor: colors,
        },
      ],
    };
  };

  const barChartOptions = {
    plugins: {
      legend: {
        display: false, // Disable the legend
      },
    },
  };

  const data = generateData ? generateData() : generateBarChartData();

  return (
    <div
      style={{
        flex: '1',
        minWidth: '800px', // Increased width
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
        {title}
      </h3>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            zoom: {
              zoom: {
                wheel: {
                  enabled: true, // Enable zooming with the mouse wheel
                },
                pinch: {
                  enabled: true, // Enable zooming with touch gestures
                },
                mode: 'x', // Zoom in the x-axis
              },
              pan: {
                enabled: true,
                mode: 'x', // Pan along the x-axis
              },
            },
          },
          scales: {
            x: {
              barPercentage: 0.6, // Adjust bar width
              categoryPercentage: 0.8, // Adjust spacing between bars
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
};

export default BarChart;
