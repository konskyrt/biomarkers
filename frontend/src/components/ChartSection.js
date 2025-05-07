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
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const mockData = {
  times: [
    'Jan 24',
    'Feb 24',
    'Mar 24',
    'Apr 24',
    'May 24',
    'Jun 24',
    'Jul 24',
    'Aug 24',
    'Sep 24',
    'Oct 24',
    'Nov 24',
    'Dec 24',
  ],
  series: {
    Heizung: [15, 25, 30, 35, 50, 60, 70, 78, 80, 85, 90, 100],
    Sanitär: [10, 20, 28, 30, 40, 55, 60, 65, 70, 75, 80, 88],
    Lüftung: [8, 15, 20, 25, 30, 40, 50, 55, 60, 70, 75, 80],
    Elektro: [12, 22, 26, 32, 42, 53, 65, 70, 75, 80, 85, 92],
  },
};

const ChartSection = () => {
  const chartData = {
    labels: mockData.times,
    datasets: [
      {
        label: 'Heizung',
        data: mockData.series.Heizung,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Sanitär',
        data: mockData.series.Sanitär,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Lüftung',
        data: mockData.series.Lüftung,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Elektro',
        data: mockData.series.Elektro,
        borderColor: '#FFEB3B',
        backgroundColor: 'rgba(255, 235, 59, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 10 }
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Zeitraum',
        },
        ticks: { font: { size: 10 } }
      },
      y: {
        title: {
          display: true,
          text: 'Menge',
        },
        ticks: { font: { size: 10 } }
      },
    },
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6 w-full" style={{ minHeight: '400px' }}>
      <h5 className="mb-3">Zeitverlauf der Materialmenge pro Gewerk</h5>
      <div style={{height:'100%', minHeight:'200px'}}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ChartSection;