import type { Account, Transaction } from '../types';

export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Account[] {
  const netChanges: Record<string, number> = {};

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.accountId) {
      if (tx.type === 'income') {
        netChanges[tx.accountId] = (netChanges[tx.accountId] || 0) + amount;
      } else if (tx.type === 'expense' || tx.type === 'shared_expense') {
        netChanges[tx.accountId] = (netChanges[tx.accountId] || 0) - amount;
      } else if (tx.type === 'transfer') {
        netChanges[tx.accountId] = (netChanges[tx.accountId] || 0) - amount;
      }
    }
    if (tx.type === 'transfer' && tx.toAccountId) {
      netChanges[tx.toAccountId] = (netChanges[tx.toAccountId] || 0) + amount;
    }
  });

  return accounts.map((acc) => {
    const initial = acc.initialBalance !== undefined ? acc.initialBalance : 0;
    const computedBalance = initial + (netChanges[acc.id] || 0);
    return {
      ...acc,
      balance: computedBalance,
    };
  });
}
