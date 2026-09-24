import { useState, useEffect } from 'react';
import { subscribeCategories } from '../services/categoryService';
import type { Category } from '../../../types';

export function useCategories(coupleId: string | null | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coupleId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeCategories(coupleId, (data) => {
      setCategories(data);
      setLoading(false);
      setError(null);
    });

    return () => unsub();
  }, [coupleId]);

  return { categories, loading, error };
}
