import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '@/api/yearbook.api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await notificationsApi.list();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read_at).length);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    await notificationsApi.markRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAll = useCallback(async () => {
    await notificationsApi.markAll();
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  const registerToken = useCallback(async (fcmToken) => {
    await notificationsApi.registerToken(fcmToken);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAll,
    registerToken,
    refetch: fetch,
  };
}