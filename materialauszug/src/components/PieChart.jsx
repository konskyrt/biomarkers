import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const PieChart = ({ filteredData, selectedMetric }) => {
  const generateData = () => {
    const labels = [...new Set(filteredData.map(r=>{
      const e = r['EBKP'];
      return e ? e.split(' ').slice(1).join(' ') : null;
    }).filter(Boolean))];
    const data = labels.map(label => filteredData.filter(r=>{
      const e=r['EBKP'];
      return e && e.split(' ').slice(1).join(' ')===label;
    }).reduce((s,r)=>s+parseFloat(r[selectedMetric]||0),0));
    const colors = labels.map((_,i)=>`hsl(${(i*137.5)%360},70%,50%)`);
    return {labels,datasets:[{data,backgroundColor:colors}]};
  };
  const data = generateData();
  return (
    <div className="flex-1 max-w-[300px] h-[300px] border p-2 rounded bg-white shadow overflow-hidden">
      <h3 className="text-center text-sm mb-2">Kategorieverteilung</h3>
      <div className="h-[200px]">
        <Pie data={data} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>{const total=data.datasets[0].data.reduce((s,v)=>s+v,0);const v=data.datasets[0].data[ctx.dataIndex];const pct=((v/total)*100).toFixed(2);return `${ctx.label}: ${pct}%`;}}}},cutout:'70%'}} />
      </div>
    </div>
  );
};

export default PieChart; 