import React from 'react';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const labels = ['Jul 10', 'Jul 17', 'Jul 24', 'Jul 31', 'Aug 7', 'Aug 14'];
const completed = [5, 12, 16, 21, 28, 27];
const goal = labels.map((_, i) => (i + 1) * 5);

const data = {
  labels,
  datasets: [
    {
      label: 'Completion Rate',
      data: completed,
      borderColor: '#F59E0B',
      fill: true,
      tension: 0.4,
      pointStyle: 'circle',
      pointRadius: 5,
    },
    {
      label: 'Projected Completion Rate',
      data: goal,
      borderDash: [5, 5],
      borderColor: '#6B7280',
      tension: 0,
    },
  ],
};

const options = {
  scales: {
    y: { beginAtZero: true, max: 40 },
  },
  plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'nearest', intersect: true } },
};

const ApartmentsOverTimeChart = () => (
  <div className="bg-surface p-4 rounded shadow">
    <h3 className="font-medium mb-2">Completion Rate Chart</h3>
    <Line data={data} options={options} />
  </div>
);

export default ApartmentsOverTimeChart;
