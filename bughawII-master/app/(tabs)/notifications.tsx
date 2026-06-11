import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, PanResponder, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getAppConfig, getErrorMessage, getNotifications, markAllNotificationsRead, markNotificationRead, unwrap } from '../../lib/api';
import { colors, shadows } from '../../components/webTheme';

const notificationId = (item: any) => item?.id || item?.notification_id;
const notificationTitle = (item: any) => item?.title || item?.data?.title || item?.type || 'Notification';
const notificationBody = (item: any) => item?.body || item?.message || item?.data?.body || item?.data?.message || 'You have a new update.';
const notificationDate = (item: any) => item?.created_at || item?.time || item?.date;
const isUnread = (item: any) => !item?.read_at && item?.read !== true && item?.is_read !== true;
const notificationData = (item: any) => item?.data || {};
const notificationType = (item: any) => String(notificationData(item)?.type || item?.type || '').toLowerCase();
const firstValue = (source: any, keys: string[]) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '') return source[key];
  }
  return null;
};
const targetFromActionUrl = (actionUrl?: string) => {
  if (!actionUrl || typeof actionUrl !== 'string') return null;

  const path = actionUrl.replace(/^https?:\/\/[^/]+/i, '');
  const studentMatch = path.match(/\/students?\/([^/?#]+)/i);
  if (studentMatch?.[1]) return { pathname: '/student/[id]', params: { id: studentMatch[1] } };

  const messageMatch = path.match(/\/messages?\/([^/?#]+)/i);
  if (messageMatch?.[1]) return { pathname: '/messages', params: { userId: messageMatch[1] } };

  const yearbookMatch = path.match(/\/yearbook\/([^/?#]+)(?:\/view)?/i);
  if (yearbookMatch?.[1]) {
    const pageMatch = path.match(/[?&](?:page|pageIndex|page_index)=([^&#]+)/i);
    return {
      pathname: '/yearbook',
      params: {
        batchId: yearbookMatch[1],
        view: '1',
        ...(pageMatch?.[1] ? { pageIndex: pageMatch[1] } : {}),
      },
    };
  }

  if (path.includes('/payment')) return { pathname: '/payment' };
  if (path.includes('/dashboard') || path === '/') return '/home';
  return null;
};
const isPaymentNotification = (item: any) => {
  const type = notificationType(item);
  return type === 'subscription_confirmed' || type.includes('payment') || type.includes('subscription');
};
const notificationTarget = (item: any, subscriptionEnabled = true, yearbookEnabled = true) => {
  const type = notificationType(item);
  const data = notificationData(item);
  const actionTarget = targetFromActionUrl(firstValue(data, ['action_url', 'actionUrl', 'url', 'link']));

  if (type === 'new_message' || type.includes('message') || type.includes('chat')) {
    const senderId = firstValue(data, ['sender_id', 'senderId', 'from_user_id', 'fromUserId', 'user_id', 'userId']);
    return {
      pathname: '/messages',
      params: senderId ? { userId: String(senderId), name: data?.sender_name || data?.senderName || 'Student' } : undefined,
    };
  }

  if (type === 'voice_note_received' || type === 'voice_note_rejected' || type.includes('voice')) {
    const noteId = firstValue(data, ['voice_note_id', 'voiceNoteId', 'note_id', 'noteId']);
    return { pathname: '/voice-notes', params: noteId ? { noteId: String(noteId), tab: type === 'voice_note_rejected' ? 'outbox' : 'inbox' } : undefined };
  }

  if (type === 'photo_tagged' || type.includes('photo') || type.includes('tag')) {
    const photoId = firstValue(data, ['photo_id', 'photoId', 'tagged_photo_id', 'taggedPhotoId']);
    const photoUrl = firstValue(data, ['photo_url', 'photoUrl', 'image_url', 'imageUrl']);
    return {
      pathname: '/profile',
      params: {
        tab: 'tagged',
        ...(photoId ? { photoId: String(photoId) } : {}),
        ...(photoUrl ? { photoUrl: String(photoUrl) } : {}),
      },
    };
  }

  if (isPaymentNotification(item)) {
    if (!subscriptionEnabled) return null;
    const plan = firstValue(data, ['plan', 'plan_name', 'planName']);
    return { pathname: '/payment', params: plan ? { plan: String(plan) } : undefined };
  }

  if (type === 'announcement') return actionTarget || '/announcements';
  if (type === 'memory_reminder') return actionTarget || '/home';
  if (type.includes('yearbook')) {
    if (!yearbookEnabled) return null;
    const batchId = firstValue(data, ['batch_id', 'batchId']);
    const pageIndex = firstValue(data, ['page_index', 'pageIndex', 'page']);
    return {
      pathname: '/yearbook',
      params: {
        ...(batchId ? { batchId: String(batchId) } : {}),
        ...(batchId ? { view: '1' } : {}),
        ...(pageIndex !== null ? { pageIndex: String(pageIndex) } : {}),
      },
    };
  }
  return actionTarget;
};
const notificationIcon = (item: any) => {
  const type = notificationType(item);
  if (type.includes('message') || type.includes('chat')) return 'commenting';
  if (type.includes('voice')) return 'microphone';
  if (type.includes('photo') || type.includes('tag')) return 'image';
  if (type.includes('subscription') || type.includes('payment')) return 'credit-card';
  if (type.includes('memory')) return 'history';
  if (type.includes('yearbook')) return 'book';
  return 'bell';
};

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [appConfig, setAppConfig] = useState<any>(null);
  const features = appConfig?.features || {};
  const subscriptionEnabled = features.enable_premium_subscription !== false;
  const yearbookEnabled = features.enable_flipbook_viewer !== false;

  const loadNotifications = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const [configPayload, payload] = await Promise.all([
        getAppConfig().catch(() => null),
        getNotifications(),
      ]);
      if (configPayload) setAppConfig(unwrap(configPayload));
      const data = unwrap(payload);
      setNotifications(Array.isArray(data) ? data : data?.data || []);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markOneRead = async (item: any) => {
    const id = notificationId(item);
    const target = notificationTarget(item, subscriptionEnabled, yearbookEnabled);
    if (id && isUnread(item)) {
      setNotifications((current) => current.map((entry) => notificationId(entry) === id ? { ...entry, read_at: new Date().toISOString(), read: true, is_read: true } : entry));
      markNotificationRead(id).catch(() => loadNotifications());
    }
    if (target) router.push(target as any);
  };

  const markAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString(), read: true, is_read: true })));
    await markAllNotificationsRead().catch(() => loadNotifications());
  };

  const unreadCount = notifications.filter(isUnread).length;
  const visibleNotifications = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const grouped = new Map<string, any>();
    notifications
      .slice()
      .sort((a, b) => new Date(notificationDate(b) || 0).getTime() - new Date(notificationDate(a) || 0).getTime())
      .forEach((item) => {
        const type = notificationType(item);
        const body = notificationBody(item).trim().toLowerCase();
        const created = new Date(notificationDate(item) || 0).getTime();
        const isSubscription = type.includes('subscription') || notificationTitle(item).toLowerCase().includes('subscription activated');
        if (!isSubscription || !body || !created) {
          grouped.set(String(notificationId(item) || `${type}-${created}-${grouped.size}`), item);
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
  }, [notifications]);
  const sectionedNotifications = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const today = visibleNotifications.filter((item) => {
      const date = new Date(notificationDate(item) || 0);
      return date >= start;
    });
    const earlier = visibleNotifications.filter((item) => {
      const date = new Date(notificationDate(item) || 0);
      return date < start;
    });
    return [
      ...(today.length ? [{ _section: 'Today' }, ...today] : []),
      ...(earlier.length ? [{ _section: 'Earlier' }, ...earlier] : []),
    ];
  }, [visibleNotifications]);

  const dismissOne = (item: any) => {
    const id = notificationId(item);
    setNotifications((current) => current.filter((entry) => notificationId(entry) !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={15} color={colors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Updates</Text>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <TouchableOpacity style={styles.readButton} onPress={markAllRead} disabled={!unreadCount}>
          <Text style={[styles.readButtonText, !unreadCount && styles.readButtonDisabled]}>Read all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sectionedNotifications}
        keyExtractor={(item, index) => String(item?._section || notificationId(item) || index)}
        renderItem={({ item }) => {
          if (item?._section) return <Text style={styles.sectionLabel}>{item._section}</Text>;
          return (
            <NotificationRow
              item={item}
              onOpen={() => markOneRead(item)}
              onDismiss={() => dismissOne(item)}
              subscriptionEnabled={subscriptionEnabled}
              yearbookEnabled={yearbookEnabled}
            />
          );
        }}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.navy} style={{ marginTop: 60 }} /> : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <FontAwesome name="bell" size={34} color="#9CA3AF" />
              <View style={styles.emptyCheck}>
                <FontAwesome name="check" size={12} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
            <Text style={styles.emptyText}>{error || 'No new notifications'}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
      />
    </SafeAreaView>
  );
}

function NotificationRow({ item, onOpen, onDismiss, subscriptionEnabled, yearbookEnabled }: any) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const unread = isUnread(item);
  const panResponder = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_event, gesture) => {
      if (gesture.dx < 0) translateX.setValue(Math.max(gesture.dx, -92));
    },
    onPanResponderRelease: (_event, gesture) => {
      if (gesture.dx < -72) {
        Animated.timing(translateX, { toValue: -420, duration: 180, useNativeDriver: true }).start(onDismiss);
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  }), [onDismiss, translateX]);

  return (
    <View style={styles.swipeShell}>
      <View style={styles.deleteBehind}>
        <FontAwesome name="trash" size={16} color="#FFFFFF" />
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity style={[styles.card, unread && styles.unreadCard]} activeOpacity={0.88} onPress={onOpen}>
          <View style={[styles.iconBox, unread && styles.iconBoxUnread]}>
            <FontAwesome name={notificationIcon(item) as any} size={15} color={unread ? colors.gold : colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{notificationTitle(item)}</Text>
              {unread ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.cardBody} numberOfLines={3}>{notificationBody(item)}</Text>
            <View style={styles.cardFoot}>
              {!!notificationDate(item) && <Text style={styles.cardDate}>{formatDate(notificationDate(item))}</Text>}
              {item?._duplicateCount > 1 ? <Text style={styles.duplicateText}>· {item._duplicateCount}</Text> : null}
            </View>
          </View>
          {notificationTarget(item, subscriptionEnabled, yearbookEnabled) ? <FontAwesome name="chevron-right" size={13} color="#cbd5e1" /> : null}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.navy, fontSize: 27, fontWeight: '900', marginTop: 2 },
  readButton: { minHeight: 36, justifyContent: 'center' },
  readButtonText: { color: '#1A2547', fontSize: 12, fontWeight: '900' },
  readButtonDisabled: { color: '#cbd5e1' },
  content: { paddingHorizontal: 18 },
  sectionLabel: { color: '#6B7280', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  swipeShell: { position: 'relative' },
  deleteBehind: { position: 'absolute', right: 0, top: 0, bottom: 10, width: 86, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10, flexDirection: 'row', gap: 12, ...shadows.card },
  unreadCard: { borderColor: 'rgba(253,184,19,0.45)', backgroundColor: '#fffdf5' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  iconBoxUnread: { backgroundColor: colors.navy },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.navy, fontSize: 14, fontWeight: '900', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  cardDate: { color: '#94a3b8', fontSize: 11, fontWeight: '800' },
  duplicateText: { color: colors.gold, fontSize: 11, fontWeight: '900' },
  dismissButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyIcon: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  emptyCheck: { position: 'absolute', right: 9, bottom: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.navy, fontSize: 20, fontWeight: '900', marginTop: 16 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 6 },
});
