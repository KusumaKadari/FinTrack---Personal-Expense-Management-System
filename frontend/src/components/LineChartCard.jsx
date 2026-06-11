import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useExpenseData } from '../context/ExpenseDataContext';
import TrendLineChart from './TrendLineChart';
import { buildYearlyMonthTrend, formatCurrency } from '../utils/expenseAnalytics';

export default function LineChartCard() {
  const { expenses, loading, error, refreshExpenses } = useExpenseData();
  const currentYear = new Date().getFullYear();

  const data = useMemo(() => buildYearlyMonthTrend(expenses, currentYear), [expenses, currentYear]);
  const activeMonths = useMemo(() => data.filter((entry) => entry.amount > 0), [data]);

  return (
    <motion.div 
      className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Analytics</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Monthly Spending Trend</h2>
          <p className="mt-1 text-xs text-slate-500">Historical spending trend from January to December</p>
        </div>
        <button onClick={refreshExpenses} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Refresh</button>
      </div>
      
      {loading ? (
        <div className="grid h-40 place-items-center text-sm text-slate-500">
          Loading trend...
        </div>
      ) : error ? (
        <div className="grid h-40 place-items-center text-center text-sm text-red-600">
          <div>
            <p>{error}</p>
            <button onClick={refreshExpenses} className="mt-3 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Retry</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <TrendLineChart
            data={data.map((entry) => ({ label: entry.label, amount: entry.amount }))}
            emptyMessage="Expense trends will appear after recording expenses."
          />
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {activeMonths.length === 0 ? (
              <div className="text-slate-400">No monthly data available yet.</div>
            ) : (
              activeMonths.map((entry) => (
                <div key={entry.label} className="rounded-2xl bg-slate-50 px-3 py-2 flex items-center justify-between">
                  <span>{entry.label}</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(entry.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
