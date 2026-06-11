import React from 'react';
import { LogOut, BellRing, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between h-16 px-6 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-600 p-2 text-white shadow-sm">
          <UserCircle size={22} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Good to see you back,</p>
          <p className="font-semibold text-slate-900">{user?.first_name || 'FinTrack User'}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </nav>
  );
}
