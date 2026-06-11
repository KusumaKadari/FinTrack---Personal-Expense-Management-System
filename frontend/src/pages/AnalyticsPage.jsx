import React, { useMemo } from 'react';
import { useExpenseData } from '../context/ExpenseDataContext';
import { formatCurrency, normalizeExpenseAmount, normalizeCategory } from '../utils/expenseAnalytics';
import PieChartCard from '../components/PieChartCard';
import LineChartCard from '../components/LineChartCard';

export default function AnalyticsPage() {
  const { expenses, analytics, loading, error } = useExpenseData();

  const { totalExpenses, totalTransactions, mostUsedCategory, highestExpense } = useMemo(() => {
    const totalExp = analytics?.totalExpenses || 0;
    const totalTx = expenses.length;
    
    // Find most used category (by count of transactions)
    const categoryCounts = {};
    expenses.forEach((e) => {
      const cat = normalizeCategory(e.category);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    let mostUsed = 'None';
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = cat;
      }
    });

    // Find highest expense amount
    const highest = expenses.length
      ? Math.max(...expenses.map((e) => normalizeExpenseAmount(e)))
      : 0;

    return {
      totalExpenses: totalExp,
      totalTransactions: totalTx,
      mostUsedCategory: mostUsed,
      highestExpense: highest,
    };
  }, [expenses, analytics]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[.3em] text-blue-600">Analytics</p>
          <h1 className="text-3xl font-semibold text-slate-900">Expense Analytics</h1>
          <p className="text-sm text-slate-500">Simple category totals, counts, and historical monthly spending trends.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm text-sm text-slate-500">Loading analytics...</div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
              { label: 'Total Transactions', value: totalTransactions },
              { label: 'Most Used Category', value: mostUsedCategory },
              { label: 'Highest Expense', value: formatCurrency(highestExpense) },
            ].map((card) => (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PieChartCard />
            <LineChartCard />
          </div>
        </>
      )}
    </div>
  );
}
