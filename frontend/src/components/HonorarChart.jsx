import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Colors per Gewerk
const gewerkeColors = { 
  SN: '#2196F3', // Sanitär
  EL: '#FF9800', // Elektro
  HZ: '#F44336', // Heizung
  LF: '#4CAF50', // Lüftung
};

const gewerkNameToCode = {
  'Sanitär': 'SN',
  'Elektro': 'EL',
  'Heizung': 'HZ',
  'Lüftung': 'LF'
};

const HonorarChart = ({ projectBudget }) => {
  // Calculate total budget excluding Honorar and Kälte
  const totalBudget = Object.entries(projectBudget)
    .filter(([key]) => key !== 'Honorar' && key !== 'Kälte')
    .reduce((sum, [, val]) => sum + val, 0);

  // Calculate honorar amount for each gewerk
  const honorarAmount = projectBudget.Honorar;
  const gewerkeData = Object.entries(projectBudget)
    .filter(([key]) => key !== 'Honorar' && key !== 'Kälte')
    .map(([gewerk, budget]) => {
      const percentage = (budget / totalBudget) * 100;
      const honorarForGewerk = (percentage / 100) * honorarAmount;
      return {
        gewerk,
        percentage,
        honorarAmount: honorarForGewerk
      };
    });

  const data = {
    labels: gewerkeData.map(d => d.gewerk),
    datasets: [{
      label: 'Honorar',
      data: gewerkeData.map(d => d.honorarAmount),
      backgroundColor: gewerkeData.map(d => gewerkeColors[gewerkNameToCode[d.gewerk]] || '#757575'),
      borderColor: gewerkeData.map(d => gewerkeColors[gewerkNameToCode[d.gewerk]] || '#757575'),
      borderWidth: 1,
      borderRadius: 4,
      barThickness: 60,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          display: false
        }
      }
    },
    animation: {
      onComplete: function(animation) {
        const chart = animation.chart;
        const ctx = chart.ctx;
        ctx.save();
        
        // Draw values
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#000';

        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((bar, index) => {
            const value = dataset.data[index];
            const gewerk = gewerkeData[index];
            const formattedValue = value.toLocaleString('de-DE', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            });
            
            // Draw CHF value
            ctx.fillText(
              `${formattedValue} CHF`,
              bar.x,
              bar.y - 5
            );
            
            // Draw percentage
            ctx.fillText(
              `${gewerk.percentage.toFixed(1)}%`,
              bar.x,
              bar.y - 25
            );
          });
        });
        ctx.restore();
      }
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      width: '100%',
      padding: '60px 10px 20px 10px',
      position: 'relative'
    }}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: '20px'
      }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default HonorarChart; 