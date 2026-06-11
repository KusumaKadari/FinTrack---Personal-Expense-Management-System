import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, BarChart3, TrendingUp, FileText, PieChart, User, ShieldCheck } from 'lucide-react';

const menu = [
  { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
  {
    name: 'Records',
    children: [
      { name: 'Weekly Record', path: '/records/weekly', icon: <CalendarDays size={18} /> },
      { name: 'Monthly Record', path: '/records/monthly', icon: <BarChart3 size={18} /> },
      { name: 'Yearly Record', path: '/records/yearly', icon: <TrendingUp size={18} /> },
    ],
  },
  { name: 'History', path: '/history', icon: <FileText size={20} /> },
  { name: 'Analytics', path: '/analytics', icon: <PieChart size={20} /> },
  { name: 'Profile', path: '/profile', icon: <User size={20} /> },
  { name: 'Security', path: '/security', icon: <ShieldCheck size={20} /> },
];

export default function Sidebar() {
  return (
    <aside className="w-full bg-white shadow-lg lg:h-full lg:w-72 flex flex-col py-4 px-4 lg:py-8 lg:px-6">
      <div className="mb-4 lg:mb-10">
        <div className="inline-flex items-center gap-3 rounded-3xl bg-blue-600 px-4 py-3 text-white shadow-sm">
          <div className="h-11 w-11 rounded-2xl bg-white bg-opacity-15 flex items-center justify-center">
            <span className="text-lg font-bold">F</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em]">FinTrack</p>
            <p className="font-semibold text-lg">Expense Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-x-auto lg:overflow-y-auto lg:pr-2">
        <ul className="flex min-w-max gap-3 lg:block lg:min-w-0 lg:space-y-3">
          {menu.map((item) => (
            <li key={item.name}>
              {item.children ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.name}</p>
                  <div className="space-y-2">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 w-full rounded-3xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'}`
                        }
                      >
                        {child.icon}
                        <span>{child.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 w-full rounded-3xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'}`
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
