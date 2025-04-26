import React from 'react';

const levels = Array.from({ length: 10 }, (_, i) => `Level ${i + 1}`);
const tasks = ['Outer Walls', 'Windows', 'Party Walls', 'Floor Insulation', 'Boxings'];

// Partial-completion data
const data = {
  'Level 3': { Boxings: 0.21 },
  'Level 10': { 'Floor Insulation': 0.45, Boxings: 0.45 },
};

const ProgressMatrix = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm table-auto border-separate border-spacing-0">
      <thead>
        <tr className="bg-surface">
          <th className="text-left pl-4 py-2">&nbsp;</th>
          {tasks.map((task) => (
            <th key={task} className="px-4 py-2 text-left">
              {task}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {levels.map((level) => (
          <tr key={level} className="even:bg-bg">
            <td className="pl-4 py-2 font-medium">{level}</td>
            {tasks.map((task) => {
              const pct = data[level]?.[task] ?? 1;
              if (pct === 1) {
                return (
                  <td key={task} className="px-4 py-2">
                    <div className="bg-accent text-white rounded flex items-center justify-center h-8">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </td>
                );
              } else {
                return (
                  <td key={task} className="px-4 py-2">
                    <div className="bg-warn-100 text-warn rounded flex items-center justify-center h-8">
                      {`${Math.round(pct * 100)}%`}
                    </div>
                  </td>
                );
              }
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ProgressMatrix;
