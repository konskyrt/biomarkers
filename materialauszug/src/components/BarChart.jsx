import React from 'react';
import { Bar } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, LogarithmicScale } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, LogarithmicScale, zoomPlugin, Tooltip, Legend);

const BarChart = ({ filteredData, selectedMetric, title, generateData }) => {
  const generateBarChartData = () => {
    const labels = [...new Set(filteredData.map(row => {
      const ebkp = row['EBKP'];
      return ebkp ? ebkp.split(' ').slice(1).join(' ') : null;
    }).filter(Boolean))];

    const data = labels.map(label => filteredData.filter(r => {
      const ebkp = r['EBKP'];
      return ebkp && ebkp.split(' ').slice(1).join(' ') === label;
    }).reduce((sum, r) => sum + parseFloat(r[selectedMetric] || 0), 0));

    const sorted = labels.map((l,i)=>({label:l,value:data[i]})).sort((a,b)=>b.value-a.value);
    const sortedLabels = sorted.map(s=>s.label);
    const sortedValues = sorted.map(s=>s.value);
    const colors = sortedLabels.map((_,i)=>`hsl(${(i*137.5)%360},70%,50%)`);
    return { labels: sortedLabels, datasets:[{label:selectedMetric,data:sortedValues,backgroundColor:colors}] };
  };

  const data = generateData ? generateData() : generateBarChartData();

  return (
    <div className="flex-1 min-w-[600px] h-[400px] border p-2 rounded bg-white shadow overflow-hidden">
      <h3 className="text-center text-sm mb-2">{title}</h3>
      <Bar data={data} options={{ responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},zoom:{zoom:{wheel:{enabled:true},pinch:{enabled:true},mode:'x'},pan:{enabled:true,mode:'x'}}},scales:{x:{ticks:{autoSkip:false,maxRotation:45,minRotation:0}},y:{beginAtZero:true}}}} />
    </div>
  );
};

export default BarChart; 