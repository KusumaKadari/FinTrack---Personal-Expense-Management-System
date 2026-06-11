import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenseData } from '../context/ExpenseDataContext';
import { getMonthExpenses, getMonthKey, normalizeExpenseAmount } from '../utils/expenseAnalytics';

const professions = ['Student', 'Working Professional', 'Freelancer', 'Business Owner', 'Content Creator', 'Other'];

const memberSince = (createdAt) => createdAt
  ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  : 'N/A';

const formatProfileCurrency = (amount) => {
  const value = Math.round(Number(amount || 0));
  return `\u20b9${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { expenses } = useExpenseData();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    profession: 'Student',
    annual_income: 0,
    current_savings: 0,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      profession: user?.profession || 'Student',
      annual_income: user?.annual_income || 0,
      current_savings: user?.current_savings || 0,
    });
  }, [user]);

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const monthlyIncome = Number(form.annual_income || 0) / 12;
  const currentMonthTotal = getMonthExpenses(expenses, getMonthKey(new Date()))
    .reduce((sum, expense) => sum + normalizeExpenseAmount(expense), 0);
  const currentBalance = monthlyIncome - currentMonthTotal;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setMessage('');
    setError('');
    if (!form.first_name.trim() || !form.last_name.trim()) return setError('First and last name are required.');
    if (Number(form.annual_income) <= 0) return setError('Annual Income must be greater than 0.');
    if (Number(form.current_savings) < 0) return setError('Current Savings cannot be negative.');
    try {
      setSaving(true);
      const response = await updateProfile(form);
      if (response.success) setMessage('Profile Updated Successfully');
    } catch (err) {
      setError(err.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm uppercase tracking-[.3em] text-blue-600">Income Management</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Financial Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your FinTrack profile, income, and current savings.</p>

        {message && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form className="mt-7 grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Username
              <input
                value={user?.username || ''}
                disabled
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                value={user?.email || ''}
                disabled
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500"
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              First Name
              <input
                value={form.first_name}
                onChange={updateField('first_name')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Last Name
              <input
                value={form.last_name}
                onChange={updateField('last_name')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Profession
              <select
                value={form.profession}
                onChange={updateField('profession')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {professions.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Member Since
              <input
                value={memberSince(user?.created_at)}
                disabled
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500"
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Annual Income (₹)
              <input
                type="number"
                min="0"
                step="1"
                value={form.annual_income}
                onChange={updateField('annual_income')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Current Savings (₹)
              <input
                type="number"
                min="0"
                value={form.current_savings}
                onChange={updateField('current_savings')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {saving && <Loader2 size={17} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          <div className="border-t border-slate-200 pt-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Overview</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Financial Summary</h2>
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Calculated Monthly Income</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{formatProfileCurrency(monthlyIncome)}</p>
                <p className="mt-2 text-xs text-slate-400">Annual income divided by 12</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Current Balance</p>
                <p className={`mt-4 text-3xl font-semibold ${currentBalance < 0 ? 'text-red-600' : 'text-slate-900'}`}>{formatProfileCurrency(currentBalance)}</p>
                <p className="mt-2 text-xs text-slate-400">Monthly income minus current month expenses</p>
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
