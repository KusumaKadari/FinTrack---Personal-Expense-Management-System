import React, { useState } from 'react';
import { CheckCircle, Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifyExpensesChanged } from '../utils/expenseEvents';
import { EXPENSE_CATEGORIES } from '../utils/expenseAnalytics';
import { getCurrentLocalDate } from '../utils/dateUtils';

const emptyForm = () => ({
  vendor: '',
  amount: '',
  category: '',
  date: getCurrentLocalDate(),
  description: '',
});

export default function UploadCard() {
  const { authFetch } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setMessage('');
    setError('');

    if (!form.vendor.trim()) return setError('Vendor name cannot be empty.');
    if (!form.category) return setError('Category must be selected.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Amount must be greater than 0.');
    if (form.date > getCurrentLocalDate()) return setError('Date cannot be in the future.');

    try {
      setLoading(true);
      const response = await authFetch('/api/expenses', {
        method: 'POST',
        body: { ...form, amount: Number(form.amount), currency: 'INR' },
      });
      setMessage('Expense Added Successfully');
      setForm(emptyForm());
      notifyExpensesChanged('created', response.expense);
    } catch (err) {
      setError(err.data?.message || 'Unable to add expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><PlusCircle size={22} /></div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Expense Management</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Add a new expense</h2>
        </div>
      </div>

      {message && <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle size={17} />{message}</div>}
      {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Vendor Name</span>
          <input value={form.vendor} onChange={updateField('vendor')} placeholder="e.g. Swiggy" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Amount (₹)</span>
          <input value={form.amount} onChange={updateField('amount')} type="number" min="0.01" step="0.01" placeholder="0.00" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select value={form.category} onChange={updateField('category')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input value={form.date} onChange={updateField('date')} type="date" max={getCurrentLocalDate()} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Description (optional)</span>
          <textarea value={form.description} onChange={updateField('description')} rows="3" placeholder="Add a short note" className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 md:col-span-2">
          {loading && <Loader2 size={17} className="animate-spin" />}
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </section>
  );
}
