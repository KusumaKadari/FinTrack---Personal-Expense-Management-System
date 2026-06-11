import React, { useMemo, useState } from 'react';
import { AlertTriangle, Edit3, Loader2, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenseData } from '../context/ExpenseDataContext';
import { notifyExpensesChanged } from '../utils/expenseEvents';
import { formatDateInfo, getCurrentLocalDate } from '../utils/dateUtils';
import { EXPENSE_CATEGORIES, formatCurrency, getAvailableMonths, getAvailableYears, getMonthName, normalizeExpenseAmount, parseExpenseDate } from '../utils/expenseAnalytics';

export default function ExpenseTable() {
  const { user, authFetch } = useAuth();
  const { expenses, loading, error, refreshExpenses } = useExpenseData();
  const [filters, setFilters] = useState({ search: '', category: 'All Categories', month: '', year: '', startDate: '', endDate: '' });
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const availableMonths = useMemo(() => {
    const years = getAvailableYears(expenses, user?.created_at);
    return years.flatMap((year) => getAvailableMonths(expenses, year));
  }, [expenses, user?.created_at]);
  const availableYears = useMemo(() => getAvailableYears(expenses, user?.created_at), [expenses, user?.created_at]);
  const categories = useMemo(() => ['All Categories', ...new Set([...EXPENSE_CATEGORIES, ...expenses.map((expense) => expense.category).filter(Boolean)])], [expenses]);

  const filtered = useMemo(() => expenses.filter((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    const expenseMonth = parsedDate ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}` : '';
    const query = filters.search.toLowerCase();
    return (!query || expense.vendor?.toLowerCase().includes(query))
      && (filters.category === 'All Categories' || expense.category === filters.category)
      && (!filters.month || expenseMonth === filters.month)
      && (!filters.year || String(parsedDate?.getFullYear()) === filters.year)
      && (!filters.startDate || expense.date >= filters.startDate)
      && (!filters.endDate || expense.date <= filters.endDate);
  }), [expenses, filters]);

  const updateFilter = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }));
  const updateEdit = (field) => (event) => setEditing((current) => ({ ...current, [field]: event.target.value }));

  const openEdit = (expense) => {
    setFormError('');
    setMessage('');
    setEditing({ ...expense, amount: String(expense.amount), description: expense.description || '' });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!editing.vendor.trim()) return setFormError('Vendor name cannot be empty.');
    if (!editing.category) return setFormError('Category must be selected.');
    if (!editing.amount || Number(editing.amount) <= 0) return setFormError('Amount must be greater than 0.');
    if (editing.date > getCurrentLocalDate()) return setFormError('Date cannot be in the future.');

    try {
      setSaving(true);
      const response = await authFetch(`/api/expenses/${editing.id}`, {
        method: 'PUT',
        body: { ...editing, amount: Number(editing.amount) },
      });
      setEditing(null);
      setMessage('Expense Updated Successfully');
      notifyExpensesChanged('updated', response.expense);
    } catch (err) {
      setFormError(err.data?.message || 'Unable to update expense.');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async () => {
    if (!deleteTarget || deleting) return;
    setMessage('');
    try {
      setDeleting(true);
      await authFetch(`/api/expenses/${deleteTarget.id}`, { method: 'DELETE' });
      setMessage('Expense Deleted Successfully');
      notifyExpensesChanged('deleted', deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      setMessage(err.data?.message || 'Unable to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-md">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Expense History</h2>
          <button onClick={refreshExpenses} className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:-translate-y-0.5 hover:bg-slate-50" title="Refresh"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button>
        </div>
        <p className="mt-1 text-sm text-slate-500 font-medium">Total Expenses Found: {filtered.length}</p>
        {message && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${message.includes('Unable') ? 'bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message}</div>}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input value={filters.search} onChange={updateFilter('search')} placeholder="Search vendor" className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm" /></div>
          <select value={filters.category} onChange={updateFilter('category')} className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm">{categories.map((value) => <option key={value}>{value}</option>)}</select>
          <select value={filters.month} onChange={updateFilter('month')} className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">All Months</option>{availableMonths.map((value) => <option key={value} value={value}>{getMonthName(value)}</option>)}</select>
          <select value={filters.year} onChange={updateFilter('year')} className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">All Years</option>{availableYears.map((value) => <option key={value}>{value}</option>)}</select>
          <div className="grid grid-cols-2 gap-2 xl:col-span-2"><input type="date" value={filters.startDate} onChange={updateFilter('startDate')} max={getCurrentLocalDate()} title="Start date" className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm" /><input type="date" value={filters.endDate} onChange={updateFilter('endDate')} max={getCurrentLocalDate()} title="End date" className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm" /></div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-3">Vendor Name</th><th>Amount</th><th>Category</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="py-10 text-center text-slate-500">Loading expenses...</td></tr>
                : error ? <tr><td colSpan="5" className="py-10 text-center text-red-600">{error}</td></tr>
                : filtered.length === 0 ? <tr><td colSpan="5" className="py-12 text-center text-slate-400"><div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">No expenses match your filters. Try clearing filters or add a new expense.</div></td></tr>
                : filtered.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="py-4 font-medium text-slate-900">{expense.vendor}</td>
                    <td className="font-semibold text-slate-900">{formatCurrency(normalizeExpenseAmount(expense))}</td>
                    <td><span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">{expense.category}</span></td>
                    <td className="text-slate-500">{formatDateInfo(expense.date).formatted}</td>
                    <td><div className="flex justify-end gap-2"><button onClick={() => openEdit(expense)} className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:-translate-y-0.5 hover:bg-amber-100"><Edit3 size={14} />Edit</button><button onClick={() => setDeleteTarget(expense)} className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100"><Trash2 size={14} />Delete</button></div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">Showing {filtered.length} of {expenses.length} expenses</p>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 animate-[fadeIn_180ms_ease-out]">
          <form onSubmit={saveEdit} className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl transition duration-200 animate-[modalIn_180ms_ease-out]">
            <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.24em] text-blue-600">Update Record</p><h2 className="mt-1 text-2xl font-semibold text-slate-900">Edit Expense</h2></div><button type="button" onClick={() => setEditing(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X /></button></div>
            {formError && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Vendor Name<input value={editing.vendor} onChange={updateEdit('vendor')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-medium text-slate-700">Amount (₹)<input type="number" min="0.01" step="0.01" value={editing.amount} onChange={updateEdit('amount')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-medium text-slate-700">Category<select value={editing.category} onChange={updateEdit('category')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal">{[...new Set([...EXPENSE_CATEGORIES, editing.category])].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">Date<input type="date" max={getCurrentLocalDate()} value={editing.date} onChange={updateEdit('date')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description (optional)<textarea rows="3" value={editing.description} onChange={updateEdit('description')} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 font-normal" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditing(null)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Saving...' : 'Save Changes'}</button></div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 animate-[fadeIn_180ms_ease-out]"
          onMouseDown={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition duration-200 animate-[modalIn_180ms_ease-out]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-red-50 p-3 text-red-600"><AlertTriangle size={22} /></div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Are you sure?</h2>
                <p className="mt-2 text-sm text-slate-500">This expense will be permanently deleted.</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{deleteTarget.vendor}</p>
              <p>{formatCurrency(normalizeExpenseAmount(deleteTarget))} · {deleteTarget.category}</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={deleteExpense}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                Delete Expense
              </button>
              <button
                type="button"
                onClick={() => !deleting && setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
