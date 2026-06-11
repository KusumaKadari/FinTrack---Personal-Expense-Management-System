import React, { useMemo, useState } from 'react';

export default function TrendLineChart({ data = [], height = 260, emptyMessage = 'No data available.' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const chart = useMemo(() => {
    if (!data.length) return { points: [], path: '', width: 640, height: 260, padding: { top: 20, right: 24, bottom: 48, left: 48 } };

    const padding = { top: 20, right: 24, bottom: 48, left: 48 };
    const width = 640;
    const chartHeight = height;
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const values = data.map((entry) => Number(entry.amount || 0));
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);

    const points = data.map((entry, index) => {
      const x = data.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + (index * innerWidth) / (data.length - 1);
      const y = padding.top + innerHeight - ((Number(entry.amount || 0) - minValue) / Math.max(maxValue - minValue, 1)) * innerHeight;
      return { ...entry, x, y };
    });

    let path = '';
    if (points.length === 1) {
      path = `M ${padding.left} ${points[0].y} L ${width - padding.right} ${points[0].y}`;
    } else {
      path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    }

    return { points, path, width, height: chartHeight, padding };
  }, [data, height]);

  if (!data.length) {
    return <div className="grid h-full place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-sm text-slate-500">{emptyMessage}</div>;
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full overflow-visible" role="img" aria-label="Trend chart">
        <line x1={chart.padding.left} y1={chart.height - chart.padding.bottom} x2={chart.width - chart.padding.right} y2={chart.height - chart.padding.bottom} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={chart.padding.left} y1={chart.padding.top} x2={chart.padding.left} y2={chart.height - chart.padding.bottom} stroke="#cbd5e1" strokeWidth="1" />
        <path d={chart.path} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {chart.points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 6 : 4}
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            <text x={point.x} y={chart.height - 20} textAnchor="middle" className="fill-slate-500 text-[11px]">
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      {hoveredIndex !== null && chart.points[hoveredIndex] && (
        <div
          className="pointer-events-none absolute rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg"
          style={{
            left: `${(chart.points[hoveredIndex].x / chart.width) * 100}%`,
            top: `${Math.max((chart.points[hoveredIndex].y / chart.height) * 100 - 16, 0)}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold text-slate-900">{chart.points[hoveredIndex].label}</div>
          <div>{`₹${Number(chart.points[hoveredIndex].amount || 0).toLocaleString('en-IN')}`}</div>
        </div>
      )}
    </div>
  );
}
