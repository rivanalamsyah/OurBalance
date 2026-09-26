import { useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { getCurrentMonth, percentageOf } from '../../../utils/format';
import { calculateAccountBalances } from '../../../utils/financial';
import type { Transaction, Account, Budget, Goal, Category, UserProfile } from '../../../types';

export function useDashboardData(
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[],
  goals: Goal[],
  categories: Category[],
  userProfile: UserProfile | null,
  _partnerProfile: UserProfile | null
) {
  const currentMonth = getCurrentMonth();

  const computedAccounts = useMemo(
    () => calculateAccountBalances(accounts, transactions),
    [accounts, transactions]
  );

  // Compute spending per category from actual transactions — same logic as BudgetPage
  // so Dashboard budget.spent is always consistent with the Anggaran page.
  const spendingByCat = useMemo(() => {
    const [year, m] = currentMonth.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);
    const map: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type !== 'expense' && tx.type !== 'shared_expense') return;
      const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
      if (date < start || date > end) return;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
    });
    return map;
  }, [transactions, currentMonth]);

  // Budgets enriched with actual spent from transactions (not the stale Firestore spent field)
  const budgetsWithActualSpent = useMemo(() =>
    budgets.map((b) => ({
      ...b,
      spent: spendingByCat[b.categoryId] || 0,
    })),
    [budgets, spendingByCat]
  );

  const stats = useMemo(() => {
    const [year, m] = currentMonth.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach((tx) => {
      const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
      if (date >= start && date <= end) {
        if (tx.type === 'income') monthlyIncome += tx.amount;
        else if (tx.type === 'expense' || tx.type === 'shared_expense') monthlyExpense += tx.amount;
        // 'transfer' is intentionally excluded — it's not income or expense
      }
    });

    const myAccounts = computedAccounts.filter((a) => a.userId === userProfile?.uid);
    const partnerAccounts = computedAccounts.filter((a) => a.userId === userProfile?.partnerId);
    const personalBalance = myAccounts.reduce((sum, a) => sum + a.balance, 0);
    const partnerBalance = partnerAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalBalance = personalBalance + partnerBalance;

    const totalBudget = budgetsWithActualSpent.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetsWithActualSpent.reduce((sum, b) => sum + b.spent, 0);
    const budgetUsage = percentageOf(totalSpent, totalBudget);

    return {
      totalBalance,
      personalBalance,
      partnerBalance,
      monthlyIncome,
      monthlyExpense,
      cashFlow: monthlyIncome - monthlyExpense,
      budgetUsage,
    };
  }, [transactions, computedAccounts, budgetsWithActualSpent, userProfile, currentMonth]);

  const recentTransactions = useMemo(() => transactions.slice(0, 8), [transactions]);

  const spendingByCategory = useMemo(() => {
    const [year, m] = currentMonth.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);

    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type !== 'expense' && tx.type !== 'shared_expense') return;
      const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
      if (date < start || date > end) return;
      const cat = categories.find((c) => c.id === tx.categoryId);
      const catName = cat ? cat.name : 'Lainnya';
      map[catName] = (map[catName] || 0) + tx.amount;
    });

    const totalCatExpense = Object.values(map).reduce((sum, val) => sum + val, 0);
    return Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalCatExpense > 0 ? Math.round((amount / totalCatExpense) * 100) : 0,
    }));
  }, [transactions, categories, currentMonth]);

  const activeGoals = useMemo(() => {
    return goals.filter((g) => g.status === 'active');
  }, [goals]);

  return {
    stats,
    recentTransactions,
    spendingByCategory,
    activeGoals,
    budgetsWithActualSpent,
  };
}
