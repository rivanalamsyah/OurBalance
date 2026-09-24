import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ensureCoupleId, getPartnerProfile } from '../services/userService';
import type { UserProfile } from '../../../types';

export function useCouple() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await ensureCoupleId(user.uid);
      await refreshProfile();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal menginisialisasi pasangan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!userProfile?.partnerId) {
      setPartnerProfile(null);
      return;
    }
    getPartnerProfile(userProfile.partnerId)
      .then(setPartnerProfile)
      .catch(() => setPartnerProfile(null));
  }, [userProfile?.partnerId]);

  return {
    coupleId: userProfile?.coupleId ?? null,
    partnerProfile,
    loading,
    error,
    refresh: initialize,
  };
}
