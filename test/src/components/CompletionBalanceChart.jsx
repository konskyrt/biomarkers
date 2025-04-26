import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CompletionBalanceChart = () => {
  // Progress chart data
  const labels = ['Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024'];
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Actual',
        data: [20, 36, 48, null],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 2,
        fill: false
      },
      {
        label: 'Planned',
        data: [25, 45, 65, 85],
        borderColor: '#9e9e9e',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 2,
        fill: false
      },
      {
        label: 'Forecast at Average Pace',
        data: [null, null, 48, 75],
        borderColor: '#9c27b0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 2,
        fill: '-1'
      },
      {
        label: 'Delay',
        data: [null, null, 65, 85],
        borderColor: '#ff5252',
        borderDash: [5, 5],
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        fill: {
          target: '-1',
          above: 'rgba(255, 82, 82, 0.1)'
        }
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: true
        }
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Installation Over Time (%)'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false
      },
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          generateLabels: function(chart) {
            const originalLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            return originalLabels.map(label => {
              if (label.text.startsWith('X:')) {
                label.text = label.text.substring(2).trim();
              }
              return label;
            });
          }
        }
      },
      annotation: {
        annotations: {
          today: {
            type: 'line',
            xMin: 'Jun 2024',
            xMax: 'Jun 2024',
            borderColor: '#9e9e9e',
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
              content: 'Today',
              enabled: true,
              position: 'top'
            }
          }
        }
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Piping Installation Process</h3>
      
      {/* Progress chart */}
      <div className="h-64 relative">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default CompletionBalanceChart;
