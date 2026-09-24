import { useState, useEffect } from 'react';
import { subscribeTransactions } from '../services/transactionService';
import type { Transaction } from '../../../types';

export function useTransactions(coupleId: string | null | undefined, limitCount = 100) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coupleId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeTransactions(
      coupleId,
      (data) => {
        setTransactions(data);
        setLoading(false);
        setError(null);
      },
      limitCount
    );

    return () => unsub();
  }, [coupleId, limitCount]);

  return { transactions, loading, error };
}
