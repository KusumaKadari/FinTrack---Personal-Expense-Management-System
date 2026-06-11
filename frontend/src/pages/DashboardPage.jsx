import React from 'react';
import { PiggyBank, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenseData } from '../context/ExpenseDataContext';
import UploadCard from '../components/UploadCard';
import { formatDateInfo } from '../utils/dateUtils';
import { formatCurrency, getMonthExpenses, getMonthKey, normalizeExpenseAmount } from '../utils/expenseAnalytics';

export default function DashboardPage() {
  const { user } = useAuth();
  const { expenses, error } = useExpenseData();
  const annualIncome = Number(user?.annual_income || 0);
  const currentSavings = Number(user?.current_savings || 0);
  const monthlyIncome = annualIncome / 12;
  const currentMonthExpenses = getMonthExpenses(expenses, getMonthKey(new Date()));
  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + normalizeExpenseAmount(expense), 0);
  const currentBalance = monthlyIncome - currentMonthTotal;
  const recentTransactions = expenses.slice(0, 5);
  const heroStats = [
    { label: 'Annual Income', value: formatCurrency(annualIncome), icon: Wallet, tone: 'bg-emerald-400/20 text-emerald-50' },
    { label: 'Current Savings', value: formatCurrency(currentSavings), icon: PiggyBank, tone: 'bg-white/15 text-white' },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-6 text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-100">This Month Summary</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Welcome back, {user?.first_name || user?.username || 'User'} 👋</h1>
            <p className="mt-3 text-sm text-blue-50 sm:text-base">Here's a quick snapshot of your finances.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
            {heroStats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                <div className={`inline-flex rounded-2xl p-2 ${tone}`}><Icon size={19} /></div>
                <p className="mt-3 text-sm text-blue-50">{label}</p>
                <p className={`mt-1 text-xl font-semibold ${label === 'Balance' && currentBalance < 0 ? 'text-red-100' : 'text-white'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Monthly Income', formatCurrency(monthlyIncome), 'Annual income ÷ 12'],
          ['Current Month Expenses', formatCurrency(currentMonthTotal), 'Recorded this month'],
          ['Current Balance', formatCurrency(currentBalance), 'Monthly income − expenses'],
          ['Total Transactions', expenses.length, 'All-time recorded transactions'],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-4 text-3xl font-semibold ${label === 'Current Balance' && currentBalance < 0 ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
            <p className="mt-2 text-xs text-slate-400">{note}</p>
          </div>
        ))}
      </section>

      {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <UploadCard />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Latest Activity</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Recent Transactions</h2>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b text-left text-slate-500"><th className="py-3">Vendor Name</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {recentTransactions.length ? recentTransactions.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="py-4 font-medium text-slate-900">{expense.vendor}</td>
                    <td><span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">{expense.category}</span></td>
                    <td className="font-semibold text-slate-900">{formatCurrency(normalizeExpenseAmount(expense))}</td>
                    <td className="text-slate-500">{formatDateInfo(expense.date).formatted}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="py-12 text-center text-slate-400"><div className="mx-auto max-w-sm rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">No expenses recorded yet. Add your first expense to see recent activity here.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
