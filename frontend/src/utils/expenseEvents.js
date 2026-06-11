import { EXPENSES_CHANGED_EVENT } from './expenseAnalytics';

export const notifyExpensesChanged = (action, expense = null) => {
  window.dispatchEvent(new CustomEvent(EXPENSES_CHANGED_EVENT, {
    detail: { action, expense },
  }));
};
