import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const response = await requestPasswordReset({ email });
      if (response.success) {
        setMessage(response.message || 'If the email exists, a reset link has been sent.');
      } else {
        setError(response.message || 'Unable to process request.');
      }
    } catch (err) {
      setError(err.data?.message || 'Unable to process request right now.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-6">
          <p className="text-sm uppercase tracking-[.3em] text-blue-600">Forgot Password</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Recover your account</h1>
          <p className="mt-2 text-sm text-slate-500">Enter the email linked to your FinTrack account.</p>
        </div>

        {message && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Registered Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Send reset link
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Remembered your password? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Log in</Link>
        </div>
      </div>
    </div>
  );
}
