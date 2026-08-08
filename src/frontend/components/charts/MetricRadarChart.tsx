import React from 'react';

interface RadarData {
  metric: string;
  score: number; // 0-100
}

interface MetricRadarChartProps {
  data: RadarData[];
  size?: number;
}

export const MetricRadarChart: React.FC<MetricRadarChartProps> = ({ data, size = 300 }) => {
  const center = size / 2;
  const radius = (size / 2) - 40;
  const totalAxes = data.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Generate radar web circles
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * valueRatio * Math.cos(angle);
    const y = center + radius * valueRatio * Math.sin(angle);
    return { x, y };
  };

  const points = data.map((d, i) => {
    const ratio = Math.min(100, Math.max(0, d.score)) / 100;
    const { x, y } = getCoordinates(i, ratio);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* Concentric grid webs */}
        {levels.map((level, idx) => {
          const webPoints = data.map((_, i) => {
            const { x, y } = getCoordinates(i, level);
            return `${x},${y}`;
          }).join(' ');
          return (
            <polygon
              key={idx}
              points={webPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={level === 1 ? 'none' : '3 3'}
            />
          );
        })}

        {/* Axes lines */}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Radar polygon fill */}
        <polygon
          points={points}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="#4f46e5"
          strokeWidth="2.5"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const ratio = d.score / 100;
          const { x, y } = getCoordinates(i, ratio);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4.5"
              className="fill-indigo-600 stroke-white stroke-2 hover:r-6 transition-all"
            />
          );
        })}

        {/* Axis labels */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(i, 1.18);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[11px] font-medium fill-slate-700"
            >
              {d.metric} ({d.score})
            </text>
          );
        })}
      </svg>
    </div>
  );
};
