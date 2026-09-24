import { useState, useEffect } from 'react';
import { subscribeGoals } from '../services/goalService';
import type { Goal } from '../../../types';

export function useGoals(coupleId: string | null | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coupleId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeGoals(coupleId, (data) => {
      setGoals(data);
      setLoading(false);
      setError(null);
    });

    return () => unsub();
  }, [coupleId]);

  return { goals, loading, error };
}
