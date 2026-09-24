import { useState, useEffect } from 'react';
import { subscribeBudgets } from '../services/budgetService';
import type { Budget } from '../../../types';

export function useBudgets(coupleId: string | null | undefined, month: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coupleId || !month) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeBudgets(coupleId, month, (data) => {
      setBudgets(data);
      setLoading(false);
      setError(null);
    });

    return () => unsub();
  }, [coupleId, month]);

  return { budgets, loading, error };
}
