import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '@/api/yearbook.api';

const notificationData = (item) => item?.data ?? {};
const notificationType = (item) => String(notificationData(item)?.type || item?.type || '').toLowerCase();
const notificationBody = (item) => item?.body || item?.message || notificationData(item)?.body || notificationData(item)?.message || '';
const notificationTitle = (item) => item?.title || notificationData(item)?.title || item?.type || 'Notification';
const notificationDate = (item) => item?.created_at || item?.time || item?.date;
const dedupeSubscriptionNotifications = (items = []) => {
  const dayMs = 24 * 60 * 60 * 1000;
  const grouped = new Map();
  items
    .slice()
    .sort((a, b) => new Date(notificationDate(b) || 0).getTime() - new Date(notificationDate(a) || 0).getTime())
    .forEach((item, index) => {
      const type = notificationType(item);
      const body = notificationBody(item).trim().toLowerCase();
      const created = new Date(notificationDate(item) || 0).getTime();
      const isSubscription = type.includes('subscription') || notificationTitle(item).toLowerCase().includes('subscription activated');
      if (!isSubscription || !body || !created) {
        grouped.set(String(item?.id || `${type}-${created}-${index}`), item);
        return;
      }
      const key = `${type}:${body}`;
      const existing = grouped.get(key);
      const existingDate = existing ? new Date(notificationDate(existing) || 0).getTime() : 0;
      if (existing && Math.abs(existingDate - created) <= dayMs) {
        grouped.set(key, { ...existing, _duplicateCount: Number(existing._duplicateCount || 1) + 1 });
        return;
      }
      grouped.set(key, { ...item, _duplicateCount: 1 });
    });
  return Array.from(grouped.values());
};

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await notificationsApi.list();
      const list = dedupeSubscriptionNotifications(data.data ?? data ?? []);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read_at).length);
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
