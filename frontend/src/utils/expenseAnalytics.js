const INR_CONVERSION_RATE = 80;

export const EXPENSES_CHANGED_EVENT = 'smartspend:expenses-changed';
export const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Others'];

export const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  })}`;
};

export const normalizeExpenseAmount = (expense) => {
  const amount = Number(expense?.amount || 0);
  return expense?.currency === 'USD' ? amount * INR_CONVERSION_RATE : amount;
};

export const normalizeCategory = (category = '') => {
  const value = category.toLowerCase();
  if (value.includes('food') || value.includes('grocer')) return 'Food';
  if (value.includes('travel') || value.includes('transport') || value.includes('fuel')) return 'Travel';
  if (value.includes('shop')) return 'Shopping';
  if (value.includes('bill') || value.includes('utilit')) return 'Bills';
  if (value.includes('entertain')) return 'Entertainment';
  return 'Others';
};

export const parseExpenseDate = (dateString) => {
  if (!dateString) return null;
  const cleanDate = String(dateString).split(' ')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return null;
  const [year, month, day] = cleanDate.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getPeriodRange = (period, referenceDate = new Date()) => {
  const end = new Date(referenceDate);
  const start = new Date(referenceDate);

  if (period === 'weekly') {
    const day = start.getDay();
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);
  } else if (period === 'monthly') {
    start.setDate(1);
  } else if (period === 'yearly') {
    start.setMonth(0, 1);
  }

  return { start, end };
};

export const getMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const getShortMonthLabel = (monthIndex) => {
  const date = new Date(2026, monthIndex, 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
};

export const buildExpenseAnalytics = (expenses = []) => {
  const categoryTotals = new Map();
  const monthlyTotals = new Map();
  let totalExpenses = 0;

  expenses.forEach((expense) => {
    const normalizedAmount = normalizeExpenseAmount(expense);
    const date = parseExpenseDate(expense.date) || new Date();
    const monthKey = getMonthKey(date);
    const category = normalizeCategory(expense.category);

    totalExpenses += normalizedAmount;
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + normalizedAmount);
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + normalizedAmount);
  });

  const categoryData = EXPENSE_CATEGORIES
    .map((name) => ({ name, value: Number((categoryTotals.get(name) || 0).toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  const monthlyData = Array.from(monthlyTotals.entries())
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, amount]) => ({ month, label: getMonthLabel(month), amount: Number(amount.toFixed(2)) }));

  return {
    categoryData,
    monthlyData,
    totalExpenses: Number(totalExpenses.toFixed(2)),
    averageExpense: expenses.length ? Number((totalExpenses / expenses.length).toFixed(2)) : 0,
    expenseCount: expenses.length,
  };
};

export const filterExpensesByPeriod = (expenses = [], period, referenceDate = new Date()) => {
  const { start, end } = getPeriodRange(period, referenceDate);
  return expenses.filter((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    if (!parsedDate) return false;
    return parsedDate >= start && parsedDate <= end;
  });
};

export const buildWeeklyBreakdown = (expenses = []) => {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  expenses.forEach((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    if (!parsedDate) return;
    const dayIndex = parsedDate.getDay() === 0 ? 6 : parsedDate.getDay() - 1;
    totals[dayIndex] += normalizeExpenseAmount(expense);
  });

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
    label: day,
    amount: Number(totals[index].toFixed(2)),
  }));
};

export const buildMonthlyWeekBreakdown = (expenses = []) => {
  const buckets = new Map();

  expenses.forEach((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    if (!parsedDate) return;
    const weekIndex = Math.floor((parsedDate.getDate() - 1) / 7) + 1;
    const label = `Week ${weekIndex}`;
    buckets.set(label, (buckets.get(label) || 0) + normalizeExpenseAmount(expense));
  });

  return Array.from(buckets.entries())
    .sort(([labelA], [labelB]) => Number(labelA.split(' ')[1]) - Number(labelB.split(' ')[1]))
    .map(([label, amount]) => ({ label, amount: Number(amount.toFixed(2)) }));
};

export const buildYearlyMonthTrend = (expenses = [], year = new Date().getFullYear()) => {
  const totals = Array.from({ length: 12 }, () => 0);

  expenses.forEach((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    if (!parsedDate || parsedDate.getFullYear() !== year) return;
    totals[parsedDate.getMonth()] += normalizeExpenseAmount(expense);
  });

  return totals.map((amount, index) => ({
    label: getShortMonthLabel(index),
    monthIndex: index,
    amount: Number(amount.toFixed(2)),
  }));
};

export const buildSpendingRankings = (expenses = []) => {
  const categoryTotals = new Map();
  const dayTotals = new Map();
  const monthTotals = new Map();

  expenses.forEach((expense) => {
    const amount = normalizeExpenseAmount(expense);
    const parsedDate = parseExpenseDate(expense.date);
    if (!parsedDate) return;

    const category = normalizeCategory(expense.category);
    const dayLabel = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const monthLabel = parsedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
    dayTotals.set(dayLabel, (dayTotals.get(dayLabel) || 0) + amount);
    monthTotals.set(monthLabel, (monthTotals.get(monthLabel) || 0) + amount);
  });

  const topCategory = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0] || null;
  const highestDay = Array.from(dayTotals.entries()).sort((a, b) => b[1] - a[1])[0] || null;
  const highestMonth = Array.from(monthTotals.entries()).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    topCategory,
    highestDay,
    highestMonth,
  };
};

export const getAvailableMonths = (expenses = [], year = new Date().getFullYear()) => {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`);
};

export const getAvailableYears = (expenses = [], accountCreatedAt) => {
  const currentYear = new Date().getFullYear();
  const expenseYears = [];
  expenses.forEach((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    if (parsedDate) expenseYears.push(parsedDate.getFullYear());
  });

  const createdYear = accountCreatedAt ? new Date(accountCreatedAt).getFullYear() : currentYear;
  const firstYear = Math.min(createdYear || currentYear, ...expenseYears, currentYear);
  return Array.from({ length: currentYear - firstYear + 1 }, (_, index) => currentYear - index);
};

export const getMonthName = (monthKey) => {
  if (!monthKey) return 'All Months';
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const buildDailyTrendForMonth = (expenses = [], monthKey) => {
  if (!monthKey) return [];
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const totals = Array.from({ length: daysInMonth }, () => 0);

  expenses.forEach((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    if (!parsedDate) return;
    if (getMonthKey(parsedDate) !== monthKey) return;
    totals[parsedDate.getDate() - 1] += normalizeExpenseAmount(expense);
  });

  return totals.map((amount, index) => ({
    label: String(index + 1),
    amount: Number(amount.toFixed(2)),
  }));
};

export const getMonthExpenses = (expenses = [], monthKey) => {
  if (!monthKey) return expenses;
  return expenses.filter((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    return parsedDate && getMonthKey(parsedDate) === monthKey;
  });
};

export const getYearExpenses = (expenses = [], year) => {
  if (!year) return expenses;
  return expenses.filter((expense) => {
    const parsedDate = parseExpenseDate(expense.date);
    return parsedDate && parsedDate.getFullYear() === Number(year);
  });
};
