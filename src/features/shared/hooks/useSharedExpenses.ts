import { useState, useEffect } from 'react';
import { subscribeSharedExpenses, subscribeSettlements } from '../services/sharedExpenseService';
import type { SharedExpense, Settlement } from '../../../types';

export function useSharedExpenses(coupleId: string | null | undefined) {
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coupleId) {
      setExpenses([]);
      setSettlements([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubExpenses = subscribeSharedExpenses(coupleId, (data) => {
      setExpenses(data);
      setLoading(false);
    });

    const unsubSettlements = subscribeSettlements(coupleId, (data) => {
      setSettlements(data);
    });

    return () => {
      unsubExpenses();
      unsubSettlements();
    };
  }, [coupleId]);

  return { expenses, settlements, loading, error };
}
