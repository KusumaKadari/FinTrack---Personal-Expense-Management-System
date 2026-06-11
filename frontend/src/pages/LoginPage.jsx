import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, AtSign, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await login({ identifier, password, remember });
      if (response.success) {
        setSuccess('Login successful! Redirecting to your dashboard...');
        setTimeout(() => navigate('/dashboard'), 600);
      } else {
        setError(response.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError(err.data?.message || "Unable to login right now. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-semibold">Welcome back to FinTrack</h1>
          <p className="mt-2 text-sm text-slate-500">Log in to manage your budget and track expenses.</p>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Username or Email</span>
            <div className="mt-2 relative rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 bg-transparent outline-none text-sm text-slate-900"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or email"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <div className="mt-2 relative rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                className="w-full pl-9 bg-transparent outline-none text-sm text-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </label>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">Forgot Password?</Link>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Log In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don't have an account? <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">Create account</Link>
        </div>
      </div>
    </div>
  );
}
