import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const passwordFields = [
  ['current_password', 'Current Password'],
  ['new_password', 'New Password'],
  ['confirm_password', 'Confirm New Password'],
];

export default function SecurityPage() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [visible, setVisible] = useState({ current_password: false, new_password: false, confirm_password: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setError(null);
    setMessage(null);

    try {
      setSaving(true);
      const response = await changePassword(form);
      if (response.success) {
        setMessage('Your password has been updated successfully.');
        setForm({ current_password: '', new_password: '', confirm_password: '' });
        setVisible({ current_password: false, new_password: false, confirm_password: false });
      } else {
        setError(response.message || 'Unable to change password.');
      }
    } catch (err) {
      setError(err.data?.message || 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[.3em] text-blue-600">Security</p>
          <h1 className="text-3xl font-semibold text-slate-900">Manage account security</h1>
          <p className="text-sm text-slate-500">Update your login credentials and keep your FinTrack account secure.</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm transition duration-300 hover:shadow-md">
        {message && <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form className="grid gap-6" onSubmit={handleSubmit}>
          {passwordFields.map(([field, label]) => {
            const isVisible = visible[field];
            const Icon = isVisible ? EyeOff : Eye;
            return (
              <label key={field} className="block">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <div className="relative mt-2">
                  <input
                    type={isVisible ? 'text' : 'password'}
                    value={form[field]}
                    onChange={handleChange(field)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((current) => ({ ...current, [field]: !current[field] }))}
                    className="absolute right-2 top-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
                  >
                    <Icon size={18} />
                  </button>
                </div>
              </label>
            );
          })}

          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
            {saving && <Loader2 size={17} className="animate-spin" />}
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
