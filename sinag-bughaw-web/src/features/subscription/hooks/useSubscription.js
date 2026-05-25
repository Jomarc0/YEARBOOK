import { useCallback, useEffect, useState } from 'react';
import { paymentsApi } from '@/api/payment.api';

export function useSubscription() {
  const [status,  setStatus]  = useState(null);   // null | 'standard' | 'premium'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await paymentsApi.subscriptionStatus();
      setStatus(data.tier ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await paymentsApi.history();
      setHistory(data);
    } catch (err) {
      setError(err);
    }
  }, []);

  const subscribe = useCallback(async (plan) => {
    const { data } = await paymentsApi.createIntent(plan);
    return data; // contains checkout_url for PayMongo redirect
  }, []);

  const isPremium  = status === 'premium';
  const isStandard = status === 'standard';

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    history,
    loading,
    error,
    isPremium,
    isStandard,
    subscribe,
    fetchStatus,
    fetchHistory,
  };
}