import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  labels: [
    'Luftkanalformstücke', 'Luftkanäle', 'Rohre', 'Luftauslässe',
    'Rohrformstücke', 'Flexkanäle', 'Rohrzubehör'
  ],
  datasets: [{
    data: [2120, 2010, 560, 410, 120, 350, 80],
    backgroundColor: [
      '#EF4444', '#3B82F6', '#6B7280', '#14B8A6',
      '#9CA3AF', '#10B981', '#D1D5DB'
    ]
  }]
};

const options = {
  plugins: {
    legend: { position: 'right', labels: { boxWidth: 12, padding: 16 } },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const v = ctx.raw;
          const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
          const pct = ((v/total)*100).toFixed(1);
          return `${v.toLocaleString()} (${pct}%)`;
        }
      }
    }
  }
};

const CategoryPieChart = () => (
  <div className="bg-white shadow rounded-lg p-4">
    <h3 className="text-lg font-medium mb-4">Elemente nach Kategorie</h3>
    <div className="h-64">
      <Pie data={data} options={options} />
    </div>
  </div>
);

export default CategoryPieChart; 