import React from 'react';
import ExpenseTable from '../components/ExpenseTable';

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[.3em] text-blue-600">History</p>
          <h1 className="text-3xl font-semibold text-slate-900">Expense history</h1>
          <p className="text-sm text-slate-500">Review your expense records with search, filters, and date controls.</p>
        </div>
      </div>
      <ExpenseTable />
    </div>
  );
}
