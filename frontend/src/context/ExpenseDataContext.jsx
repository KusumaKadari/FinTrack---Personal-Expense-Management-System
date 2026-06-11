import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';
import { buildExpenseAnalytics, EXPENSES_CHANGED_EVENT } from '../utils/expenseAnalytics';
import { useAuth } from './AuthContext';

const ExpenseDataContext = createContext(null);

export function ExpenseDataProvider({ children }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshExpenses = async () => {
    if (!user) {
      setExpenses([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/expenses', { method: 'GET' });
      if (response.success) {
        setExpenses(response.expenses || []);
      } else {
        setError(response.message || 'Unable to load expenses.');
      }
    } catch (err) {
      setError('Unable to connect to the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshExpenses();
  }, [user]);

  useEffect(() => {
    const handleExpenseChange = () => {
      refreshExpenses();
    };

    window.addEventListener(EXPENSES_CHANGED_EVENT, handleExpenseChange);
    return () => window.removeEventListener(EXPENSES_CHANGED_EVENT, handleExpenseChange);
  }, [user]);

  const analytics = useMemo(() => buildExpenseAnalytics(expenses), [expenses]);

  return (
    <ExpenseDataContext.Provider value={{ expenses, analytics, loading, error, refreshExpenses }}>
      {children}
    </ExpenseDataContext.Provider>
  );
}

export function useExpenseData() {
  return useContext(ExpenseDataContext);
}
