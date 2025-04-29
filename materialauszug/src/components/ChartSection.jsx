import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend
);

export default function ChartSection() {
  // Mock data since we don't have the API
  const mockData = {
    times: ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', 
            '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04',
            '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10',
            '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04'],
    series: {
      Heizung: [10, 15, 20, 25, 35, 45, 50, 75, 90, 120, 145, 180, 
                220, 250, 290, 340, 380, 410, 450, 480, 500, 510, 520, 530],
      Sanitär: [200, 210, 215, 230, 240, 245, 250, 260, 270, 290, 300, 310, 
                320, 340, 350, 370, 380, 390, 400, 410, 420, 430, 440, 450],
      Lüftung: [20, 25, 30, 40, 55, 70, 90, 110, 140, 170, 200, 230, 
                260, 290, 310, 340, 360, 370, 380, 390, 400, 410, 415, 420],
      Elektro: [50, 70, 90, 110, 130, 150, 170, 190, 220, 250, 280, 300, 
                330, 350, 370, 390, 400, 410, 420, 430, 440, 450, 460, 470]
    }
  };

  const chartData = {
    labels: mockData.times,
    datasets: [
      { label: 'Heizung', data: mockData.series.Heizung, borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.1)', tension: 0.4 },
      { label: 'Sanitär', data: mockData.series.Sanitär, borderColor: '#2196F3', backgroundColor: 'rgba(33, 150, 243, 0.1)', tension: 0.4 },
      { label: 'Lüftung', data: mockData.series.Lüftung, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)', tension: 0.4 },
      { label: 'Elektro', data: mockData.series.Elektro, borderColor: '#FFEB3B', backgroundColor: 'rgba(255, 235, 59, 0.1)', tension: 0.4 }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        display: true,
        position: 'left',
        align: 'start',
        labels: {
          boxWidth: 12,
          padding: 15
        }
      }, 
      title: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Zeitraum'
        },
        grid: {
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
          // Make vertical grid lines appear only quarterly (every 3 months)
          callback: function(val, index) {
            return index % 3 === 0;
          }
        },
        ticks: {
          // Show all labels but make them smaller
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Menge'
        },
        grid: {
          display: true
        }
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Zeitverlauf der Materialmenge pro Gewerk</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
} 