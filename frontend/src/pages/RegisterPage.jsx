import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const professions = ['Student', 'Working Professional', 'Freelancer', 'Business Owner', 'Content Creator', 'Other'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    profession: 'Student',
    annual_income: '',
    current_savings: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const validateForm = () => {
    const { username, first_name, last_name, email, profession, annual_income, current_savings, password, confirm_password } = form;
    if (!username.trim() || !first_name.trim() || !last_name.trim() || !email.trim() || !profession.trim() || !annual_income.toString().trim() || !current_savings.toString().trim() || !password || !confirm_password) {
      return 'All fields are required.';
    }
    if (Number(annual_income) <= 0 || isNaN(Number(annual_income))) {
      return 'Annual Income must be greater than 0.';
    }
    if (Number(current_savings) < 0 || isNaN(Number(current_savings))) {
      return 'Current Savings cannot be negative.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Password must include at least one uppercase letter, one lowercase letter, and one number.';
    }
    if (password !== confirm_password) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response = await register(form);
      if (response.success) {
        setSuccess('Account created successfully! Redirecting to your dashboard...');
        setTimeout(() => navigate('/dashboard'), 600);
      } else {
        setError(response.message || 'Unable to register.');
      }
    } catch (err) {
      setError(err.data?.message || 'Unable to register right now.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-[.3em] text-blue-600">Create your account</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Register with FinTrack</h1>
          <p className="mt-2 text-sm text-slate-500">Practical personal expense management in one place.</p>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Username</span>
              <input
                value={form.username}
                onChange={handleChange('username')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Choose a username"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email Address</span>
              <input
                value={form.email}
                onChange={handleChange('email')}
                type="email"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">First Name</span>
              <input
                value={form.first_name}
                onChange={handleChange('first_name')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="First name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Last Name</span>
              <input
                value={form.last_name}
                onChange={handleChange('last_name')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Last name"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Profession</span>
              <select
                value={form.profession}
                onChange={handleChange('profession')}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {professions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Annual Income (₹)</span>
              <input
                value={form.annual_income}
                onChange={handleChange('annual_income')}
                type="number"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. 600000"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Current Savings (₹)</span>
              <input
                value={form.current_savings}
                onChange={handleChange('current_savings')}
                type="number"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="e.g. 150000"
              />
            </label>
            <div className="grid gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  value={form.password}
                  onChange={handleChange('password')}
                  type="password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Create a password"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Confirm Password</span>
                <input
                  value={form.confirm_password}
                  onChange={handleChange('confirm_password')}
                  type="password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Repeat your password"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Create account
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
