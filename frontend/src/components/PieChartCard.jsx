import React, { useMemo, useState } from 'react';
import { useExpenseData } from '../context/ExpenseDataContext';
import { formatCurrency } from '../utils/expenseAnalytics';

const COLORS = ['#2563eb', '#0f766e', '#d97706', '#7c3aed', '#db2777', '#64748b'];

function getPieSegments(data) {
  const active = data.filter((item) => item.value > 0);
  const total = active.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  return active.map((item, index) => {
    const angle = (item.value / total) * 360;
    const segment = { ...item, startAngle, endAngle: startAngle + angle, color: COLORS[index] };
    startAngle += angle;
    return segment;
  });
}

export default function PieChartCard() {
  const { analytics, loading, error } = useExpenseData();
  const [activeSegment, setActiveSegment] = useState(null);
  const data = useMemo(() => (analytics.categoryData || []).filter((item) => Number(item.value) > 0), [analytics.categoryData]);
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const segments = useMemo(() => getPieSegments(data), [data]);
  const hovered = activeSegment ? segments.find((segment) => segment.name === activeSegment) : null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-md">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Analytics</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Expense Distribution by Category</h2>
      {loading ? <div className="grid h-56 place-items-center text-sm text-slate-500">Loading categories...</div>
        : error ? <div className="grid h-56 place-items-center text-sm text-red-600">{error}</div>
        : (
          <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(180px,240px)_1fr] lg:items-center">
            <div className="relative mx-auto aspect-square w-full max-w-[240px]">
              <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-sm">
                {segments.length ? segments.map((segment) => {
                  const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
                  const r = 50;
                  const start = [60 + r * Math.cos((Math.PI * segment.startAngle) / 180), 60 + r * Math.sin((Math.PI * segment.startAngle) / 180)];
                  const end = [60 + r * Math.cos((Math.PI * segment.endAngle) / 180), 60 + r * Math.sin((Math.PI * segment.endAngle) / 180)];
                  return (
                    <path
                      key={segment.name}
                      d={`M60,60 L${start[0]},${start[1]} A${r},${r} 0 ${largeArc},1 ${end[0]},${end[1]} Z`}
                      fill={segment.color}
                      onMouseEnter={() => setActiveSegment(segment.name)}
                      onMouseLeave={() => setActiveSegment(null)}
                      className="cursor-pointer opacity-95 outline-none transition duration-300 hover:opacity-100"
                    />
                  );
                }) : <text x="60" y="62" textAnchor="middle" fill="#94a3b8" fontSize="9">No data</text>}
              </svg>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="rounded-full bg-white/95 px-4 py-3 text-center shadow-sm">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(total)}</p>
                </div>
              </div>
              {hovered && (
                <div className="absolute left-1/2 top-3 z-10 w-44 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-xl">
                  <p className="font-semibold text-slate-900">{hovered.name}</p>
                  <p>{formatCurrency(hovered.value)}</p>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="mb-3 text-sm text-slate-500">Total spent: <span className="font-semibold text-slate-900">{formatCurrency(total)}</span></p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {segments.length ? segments.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm transition hover:bg-blue-50">
                    <span className="flex min-w-0 items-center gap-2 text-slate-700"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: item.color }} /><span className="truncate">{item.name}</span></span>
                    <span className="shrink-0 text-right font-semibold text-slate-900">{formatCurrency(item.value)}</span>
                  </li>
                )) : <li className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">Expense distribution will appear after you add expenses.</li>}
              </ul>
            </div>
          </div>
        )}
    </section>
  );
}
