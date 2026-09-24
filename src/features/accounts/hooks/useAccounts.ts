import { useState, useEffect } from 'react';
import { subscribeAccounts } from '../services/accountService';
import type { Account } from '../../../types';

export function useAccounts(coupleId: string | null | undefined) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coupleId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeAccounts(coupleId, (data) => {
      setAccounts(data);
      setLoading(false);
      setError(null);
    });

    return () => unsub();
  }, [coupleId]);

  return { accounts, loading, error };
}
