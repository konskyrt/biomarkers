import React, { useState, useMemo } from 'react';
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

const gewerkOptions = {
  Heizung: {
    ist:  [15, 35, 55, 78],
    soll: [20, 40, 60, 80]
  },
  Sanitär: {
    ist:  [10, 22, 44, 70],      // Beispiel, hier überholt IST das SOLL teilweise
    soll: [15, 28, 45, 68]
  },
  Lüftung: {
    ist:  [12, 28, 42, 58],
    soll: [10, 25, 40, 55]
  },
  Elektro: {
    ist:  [14, 30, 48, 72],
    soll: [18, 35, 53, 77]
  }
};

// Helper to derive delay and prognose arrays from ist & soll
const deriveDelayFillAndForecast = (istArr, sollArr) => {
  // Verzögerung (red fill) is represented by Soll values where Ist < Soll, else NaN
  const delayFill = sollArr.map((sollVal, idx) =>
    istArr[idx] < sollVal ? sollVal : NaN
  );

  // Forecast: continue with average growth of IST after first delay point
  const growthRates = istArr.slice(1).map((v, i) => v - istArr[i]);
  const avgGrowth = growthRates.reduce((sum, v) => sum + v, 0) / growthRates.length || 0;

  const firstDelayIdx = delayFill.findIndex((d) => !Number.isNaN(d));
  const prognose = istArr.map((val, idx) => {
    if (firstDelayIdx === -1 || idx < firstDelayIdx) return null;
    const monthsSinceStart = idx - firstDelayIdx;
    return Math.min(val + avgGrowth * monthsSinceStart, 100);
  });

  return { delayFill, prognose };
};

const CompletionBalanceChart = () => {
  const [gewerk, setGewerk] = useState('Heizung');

  const labels = ['Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024'];

  const data = useMemo(() => {
    const g = gewerkOptions[gewerk];
    const { prognose } = deriveDelayFillAndForecast(g.ist, g.soll);

    return {
      labels,
      datasets: [
        // 0) Ist Linie mit roter Fläche, wenn unter Soll
        {
          label: 'Ist',
          data: g.ist,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(0,0,0,0)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 2,
          fill: {
            target: 1,               // gegen Soll
            below: 'rgba(255, 82, 82, 0.25)', // Verzögerung
            above: 'rgba(0,0,0,0)',
          },
          order: 1,
        },
        // 1) Soll Linie (Referenz für Fills)
        {
          label: 'Soll',
          data: g.soll,
          borderColor: '#9e9e9e',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 2,
          fill: false,
          order: 2,
        },
        // 2) Prognose Linie + violette Fläche oberhalb Soll
        {
          label: 'Prognose',
          data: prognose,
          borderColor: '#9c27b0',
          borderDash: [4, 4],
          backgroundColor: 'rgba(156, 39, 176, 0.15)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 2,
          fill: {
            target: 1,
            above: 'rgba(156, 39, 176, 0.15)',
            below: 'rgba(0,0,0,0)',
          },
          order: 3,
        },
        // 3) Dummy dataset to show Verzögerung in Legende
        {
          label: 'Verzögerung',
          data: new Array(labels.length).fill(null), // no points
          borderColor: '#ff5252',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          order: 4,
        },
      ],
    };
  }, [gewerk]);

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
          text: 'Installation über die Zeit (%)'
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
              content: 'Heute',
              enabled: true,
              position: 'top'
            }
          }
        }
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 h-full flex flex-col">
      <h3 className="text-lg font-medium mb-4">Installationsprozess</h3>
      
      {/* Gewerk selector */}
      <div className="mb-3">
        <label className="mr-2 font-medium text-sm">Gewerk:</label>
        <select
          value={gewerk}
          onChange={(e) => setGewerk(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {Object.keys(gewerkOptions).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      
      {/* Progress chart */}
      <div className="flex-1 relative w-full" style={{ minHeight: '350px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default CompletionBalanceChart;
