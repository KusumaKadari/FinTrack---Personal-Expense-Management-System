import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenseData } from '../context/ExpenseDataContext';
import TrendLineChart from '../components/TrendLineChart';
import { formatDateInfo } from '../utils/dateUtils';
import {
  buildDailyTrendForMonth,
  buildMonthlyWeekBreakdown,
  buildSpendingRankings,
  buildWeeklyBreakdown,
  buildYearlyMonthTrend,
  getAvailableMonths,
  getAvailableYears,
  getMonthExpenses,
  getMonthName,
  getYearExpenses,
  filterExpensesByPeriod,
  formatCurrency,
  parseExpenseDate,
} from '../utils/expenseAnalytics';

const getDisplayName = (period) => {
  switch (period) {
    case 'weekly':
      return 'Weekly Record';
    case 'monthly':
      return 'Monthly Record';
    case 'yearly':
      return 'Yearly Record';
    default:
      return 'Records';
  }
};

const getMaxAmount = (entries = []) => Math.max(...entries.map((entry) => Number(entry.amount || 0)), 1);

export default function RecordPage() {
  const { period } = useParams();
  const { user } = useAuth();
  const normalizedPeriod = ['weekly', 'monthly', 'yearly'].includes(period) ? period : 'weekly';
  const { expenses, loading, error } = useExpenseData();
  const availableMonths = useMemo(() => getAvailableMonths(expenses), [expenses]);
  const availableYears = useMemo(() => getAvailableYears(expenses, user?.created_at), [expenses, user?.created_at]);
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [selectedYear, setSelectedYear] = useState(String(availableYears[0] || new Date().getFullYear()));

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.map(String).includes(selectedYear)) {
      setSelectedYear(String(availableYears[0]));
    }
  }, [availableYears, selectedYear]);

  const periodExpenses = useMemo(() => filterExpensesByPeriod(expenses, normalizedPeriod), [expenses, normalizedPeriod]);
  const rankings = useMemo(() => buildSpendingRankings(periodExpenses), [periodExpenses]);

  const recordData = useMemo(() => {
    if (normalizedPeriod === 'weekly') {
      return {
        total: periodExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
        transactionCount: periodExpenses.length,
        topCategory: rankings.topCategory,
        highestDay: rankings.highestDay,
        breakdown: buildWeeklyBreakdown(periodExpenses),
        recentExpenses: periodExpenses.slice(0, 5),
      };
    }

    if (normalizedPeriod === 'monthly') {
      const monthExpenses = getMonthExpenses(expenses, selectedMonth);
      return {
        selectedMonth,
        total: monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
        transactionCount: monthExpenses.length,
        topCategory: buildSpendingRankings(monthExpenses).topCategory,
        breakdown: buildMonthlyWeekBreakdown(monthExpenses),
        chartData: buildDailyTrendForMonth(expenses, selectedMonth),
        recentExpenses: monthExpenses.slice(0, 5),
      };
    }

    const yearExpenses = getYearExpenses(expenses, selectedYear);
    const yearlyTrend = buildYearlyMonthTrend(yearExpenses, Number(selectedYear));
    const total = yearExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const activeMonths = yearlyTrend.filter((entry) => entry.amount > 0).length;
    const yearRankings = buildSpendingRankings(yearExpenses);

    return {
      selectedYear,
      total,
      transactionCount: yearExpenses.length,
      topCategory: yearRankings.topCategory,
      highestMonth: yearRankings.highestMonth,
      yearlyTrend,
      annualSummary: [
        { label: 'Months With Expenses', value: `${activeMonths} ${activeMonths === 1 ? 'Month' : 'Months'}` },
        { label: 'Average Monthly Expense', value: activeMonths ? total / activeMonths : 0 },
        { label: 'Most Spent Category', value: yearRankings.topCategory ? yearRankings.topCategory[0] : 'None' },
      ],
      recentExpenses: yearExpenses.slice(0, 5),
    };
  }, [normalizedPeriod, expenses, periodExpenses, rankings, selectedMonth, selectedYear]);

  const summaryCards = useMemo(() => {
    if (normalizedPeriod === 'weekly') {
      return [
        { label: 'Total Spending This Week', value: formatCurrency(recordData.total) },
        { label: 'Highest Spending Day', value: `${recordData.highestDay?.[0] || 'None'} · ${formatCurrency(recordData.highestDay?.[1] || 0)}` },
        { label: 'Number of Transactions', value: recordData.transactionCount },
        { label: 'Top Category', value: recordData.topCategory?.[0] || 'None' },
      ];
    }

    if (normalizedPeriod === 'monthly') {
      const averageExpense = recordData.transactionCount ? recordData.total / recordData.transactionCount : 0;
      return [
        { label: `Total Spending This Month`, value: formatCurrency(recordData.total) },
        { label: 'Number of Transactions', value: recordData.transactionCount },
        { label: 'Top Category', value: recordData.topCategory?.[0] || 'None' },
        { label: 'Average Expense', value: formatCurrency(averageExpense) },
      ];
    }

    return [
      { label: 'Total Spending This Year', value: formatCurrency(recordData.total) },
      { label: 'Highest Spending Month', value: `${recordData.highestMonth?.[0] || 'None'} · ${formatCurrency(recordData.highestMonth?.[1] || 0)}` },
      { label: 'Total Transactions', value: recordData.transactionCount },
      { label: 'Top Category', value: recordData.topCategory?.[0] || 'None' },
    ];
  }, [normalizedPeriod, recordData]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[.3em] text-blue-600">Records</p>
          <h1 className="text-3xl font-semibold text-slate-900">{getDisplayName(normalizedPeriod)}</h1>
          <p className="text-sm text-slate-500">
            {normalizedPeriod === 'weekly' && 'Track the current week with daily spending, top category, and recent expenses.'}
            {normalizedPeriod === 'monthly' && 'Review how each week contributed to this month’s spending.'}
            {normalizedPeriod === 'yearly' && 'Review yearly patterns, monthly trend movement, and annual summary data.'}
          </p>
          {normalizedPeriod === 'monthly' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Month</label>
              <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {availableMonths.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>{getMonthName(monthKey)}</option>
                ))}
              </select>
            </div>
          )}
          {normalizedPeriod === 'yearly' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Year</label>
              <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {availableYears.length === 0 ? (
                  <option value={selectedYear}>{selectedYear}</option>
                ) : (
                  availableYears.map((yearValue) => (
                    <option key={yearValue} value={yearValue}>{yearValue}</option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm text-sm text-slate-500">Loading record data...</div>
      ) : (
        <>
          {normalizedPeriod === 'weekly' && recordData.transactionCount === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center text-slate-500 shadow-sm border border-slate-200">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-lg font-medium text-slate-900">No expenses recorded this week</p>
              <p className="text-sm text-slate-500 mt-1">Add transactions to start tracking your weekly spending.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                  <div key={card.label} className="rounded-3xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <p className="mt-4 text-2xl font-semibold text-slate-900">{card.value}</p>
                  </div>
                ))}
              </div>

              {normalizedPeriod === 'weekly' && (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Weekly spending breakdown</h2>
                    <div className="mt-6 space-y-4">
                      {recordData.breakdown.length === 0 ? (
                        <p className="text-sm text-slate-500">No expenses recorded this week.</p>
                      ) : (
                        recordData.breakdown.map((entry) => (
                          <div key={entry.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-700">{entry.label}</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(entry.amount)}</span>
                            </div>
                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-blue-600" style={{ width: `${(entry.amount / getMaxAmount(recordData.breakdown)) * 100}%` }} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Recent weekly expenses</h2>
                    {recordData.recentExpenses.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No expenses found for this week.</p>
                    ) : (
                      <ul className="mt-4 space-y-3">
                        {recordData.recentExpenses.map((expense) => (
                          <li key={expense.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-medium text-slate-900">{expense.vendor}</p>
                                <p className="text-sm text-slate-500">{expense.category}</p>
                              </div>
                              <p className="text-sm font-semibold text-slate-900">{formatCurrency(expense.amount)}</p>
                            </div>
                            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{formatDateInfo(expense.date).formatted}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {normalizedPeriod === 'monthly' && (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Monthly Expense Chart</h2>
                    <div className="mt-6 space-y-4">
                      {recordData.chartData.length === 0 ? (
                        <p className="text-sm text-slate-500">No expenses recorded this month.</p>
                      ) : (
                        <TrendLineChart data={recordData.chartData} emptyMessage="No expenses recorded this month." />
                      )}
                    </div>
                    <div className="mt-6 space-y-4">
                      {recordData.breakdown.length === 0 ? (
                        <p className="text-sm text-slate-500">No weekly breakdown available for this month.</p>
                      ) : (
                        recordData.breakdown.map((entry) => (
                          <div key={entry.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-700">{entry.label}</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(entry.amount)}</span>
                            </div>
                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(entry.amount / getMaxAmount(recordData.breakdown)) * 100}%` }} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Recent monthly expenses</h2>
                    {recordData.recentExpenses.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No expenses found for this month.</p>
                    ) : (
                      <ul className="mt-4 space-y-3">
                        {recordData.recentExpenses.map((expense) => (
                          <li key={expense.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-medium text-slate-900">{expense.vendor}</p>
                                <p className="text-sm text-slate-500">{expense.category}</p>
                              </div>
                              <p className="text-sm font-semibold text-slate-900">{formatCurrency(expense.amount)}</p>
                            </div>
                            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{formatDateInfo(expense.date).formatted}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {normalizedPeriod === 'yearly' && (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-semibold text-slate-900">Monthly spending trend</h2>
                      <div className="mt-6">
                        <TrendLineChart data={recordData.yearlyTrend.map((entry) => ({ label: entry.label, amount: entry.amount }))} emptyMessage="No monthly trend data available for this year." />
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-semibold text-slate-900">Annual Summary</h2>
                      <div className="mt-6 space-y-3">
                        {recordData.annualSummary.map((item) => (
                          <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">{item.label}</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Recent yearly expenses</h2>
                    {recordData.recentExpenses.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No expenses found for the current year.</p>
                    ) : (
                      <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {recordData.recentExpenses.map((expense) => (
                          <li key={expense.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="font-medium text-slate-900">{expense.vendor}</p>
                            <p className="text-sm text-slate-500">{expense.category}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(expense.amount)}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{formatDateInfo(expense.date).formatted}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
