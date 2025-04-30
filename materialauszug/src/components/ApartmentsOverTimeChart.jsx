import React, { useState } from 'react';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const labels = ['Jul 10', 'Jul 17', 'Jul 24', 'Jul 31', 'Aug 7', 'Aug 14'];
const completed = [5, 12, 16, 21, 28, 27];
const goal = labels.map((_, i) => (i + 1) * 5);

// base dataset configs (non reactive)
const baseActual = {
  label: 'Fertigstellungsgrad',
  borderColor: '#F59E0B',
  backgroundColor: 'rgba(0,0,0,0)',
  tension: 0.4,
  pointStyle: 'circle',
  pointRadius: 5,
};

const baseProjection = {
  label: 'Prognostizierter Fertigstellungsgrad',
  borderDash: [5, 5],
  borderColor: '#6B7280',
  tension: 0,
};

// static parts of scales & tooltip
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, max: 40 },
  },
  plugins: {
    tooltip: { mode: 'nearest', intersect: true },
  },
};

const ApartmentsOverTimeChart = () => {
  const [showAbove, setShowAbove] = useState(true);
  const [showBelow, setShowBelow] = useState(true);

  const handleLegendClick = (e, legendItem, legend) => {
    if (legendItem.fillType === 'below') {
      setShowBelow((prev) => !prev);
      return;
    }
    if (legendItem.fillType === 'above') {
      setShowAbove((prev) => !prev);
      return;
    }

    // default toggle for datasets
    const ci = legend.chart;
    const index = legendItem.datasetIndex;
    if (index !== undefined && index !== null) {
      const meta = ci.getDatasetMeta(index);
      meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
      ci.update();
    }
  };

  const chartData = React.useMemo(() => ({
    labels,
    datasets: [
      {
        ...baseActual,
        data: completed,
        fill: {
          target: 1,
          above: showAbove ? 'rgba(34,197,94,0.25)' : 'rgba(0,0,0,0)',
          below: showBelow ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0)'
        }
      },
      { ...baseProjection, data: goal },
    ],
  }), [showAbove, showBelow]);

  const chartOptions = React.useMemo(() => ({
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        position: 'bottom',
        onClick: handleLegendClick,
        labels: {
          generateLabels: (chart) => {
            const defaultLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            return [
              ...defaultLabels,
              {
                text: 'Unter Prognose',
                fillStyle: 'rgba(239,68,68,0.5)',
                strokeStyle: 'rgba(239,68,68,0.5)',
                lineWidth: 2,
                hidden: !showBelow,
                datasetIndex: undefined,
                fillType: 'below'
              },
              {
                text: 'Über Prognose',
                fillStyle: 'rgba(34,197,94,0.5)',
                strokeStyle: 'rgba(34,197,94,0.5)',
                lineWidth: 2,
                hidden: !showAbove,
                datasetIndex: undefined,
                fillType: 'above'
              }
            ];
          }
        }
      }
    }
  }), [showAbove, showBelow]);

  return (
    <div className="bg-white shadow rounded-lg p-4 h-full flex flex-col">
      <h3 className="text-lg font-medium mb-4">Gesamt Fertigstellungsgrad</h3>
      <div className="flex-1 relative w-full">
        <Line data={chartData} options={chartOptions} redraw />
      </div>
    </div>
  );
};

export default ApartmentsOverTimeChart;
