import { useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { getCurrentMonth, percentageOf } from '../../../utils/format';
import type { Transaction, Account, Budget, Goal, Category, UserProfile } from '../../../types';

export function useDashboardData(
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[],
  goals: Goal[],
  categories: Category[],
  userProfile: UserProfile | null,
  partnerProfile: UserProfile | null
) {
  const currentMonth = getCurrentMonth();

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
      }
    });

    const myAccounts = accounts.filter((a) => a.userId === userProfile?.uid);
    const partnerAccounts = accounts.filter((a) => a.userId === userProfile?.partnerId);
    const personalBalance = myAccounts.reduce((sum, a) => sum + a.balance, 0);
    const partnerBalance = partnerAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalBalance = personalBalance + partnerBalance;

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
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
  }, [transactions, accounts, budgets, userProfile, currentMonth]);

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
      map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
    });

    return Object.entries(map)
      .map(([catId, amount]) => ({
        name: categories.find((c) => c.id === catId)?.name || 'Lainnya',
        amount,
        percentage: percentageOf(amount, stats.monthlyExpense),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, categories, currentMonth, stats.monthlyExpense]);

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status === 'active').slice(0, 3),
    [goals]
  );

  return {
    stats,
    recentTransactions,
    spendingByCategory,
    activeGoals,
  };
}
