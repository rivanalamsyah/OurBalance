import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { formatCurrency, formatDate } from '../../../utils/format';
import type { Transaction, Category } from '../../../types';

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
}

export function TransactionRow({ transaction, categories }: TransactionRowProps) {
  const cat = categories.find((c) => c.id === transaction.categoryId);
  const isIncome = transaction.type === 'income';
  const date = transaction.date instanceof Timestamp
    ? transaction.date.toDate()
    : new Date(transaction.date as string | number | Date);

  const iconMap: Record<string, ReactNode> = {
    income: <TrendingUp size={16} />,
    expense: <TrendingDown size={16} />,
    transfer: <Wallet size={16} />,
    shared_expense: <Users size={16} />,
  };

  return (
    <div className="transaction-item">
      <div className={`transaction-icon ${transaction.type}`}>
        {iconMap[transaction.type]}
      </div>
      <div className="transaction-info">
        <div className="transaction-desc">{transaction.description}</div>
        <div className="transaction-meta">
          {cat?.name || 'Tanpa Kategori'} · {formatDate(date, 'dd MMM')}
        </div>
      </div>
      <div className={`transaction-amount ${isIncome ? 'amount-positive' : 'amount-negative'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
      </div>
    </div>
  );
}
