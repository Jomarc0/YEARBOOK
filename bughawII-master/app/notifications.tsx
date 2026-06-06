import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getErrorMessage, getNotifications, markAllNotificationsRead, markNotificationRead, unwrap } from '../lib/api';
import { colors, shadows } from '../components/webTheme';

const notificationId = (item: any) => item?.id || item?.notification_id;
const notificationTitle = (item: any) => item?.title || item?.data?.title || item?.type || 'Notification';
const notificationBody = (item: any) => item?.body || item?.message || item?.data?.body || item?.data?.message || 'You have a new update.';
const notificationDate = (item: any) => item?.created_at || item?.time || item?.date;
const isUnread = (item: any) => !item?.read_at && item?.read !== true && item?.is_read !== true;
const notificationTarget = (item: any) => {
  const type = String(item?.data?.type || item?.type || '').toLowerCase();
  if (type.includes('message') || type.includes('chat')) return '/messages';
  if (type.includes('voice')) return '/voice-notes';
  if (type.includes('photo') || type.includes('tag')) return '/profile';
  if (type.includes('payment') || type.includes('subscription')) return '/payment';
  if (type.includes('yearbook')) return '/yearbook';
  return null;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const payload = await getNotifications();
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
    const target = notificationTarget(item);
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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
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
        data={notifications}
        keyExtractor={(item, index) => String(notificationId(item) || index)}
        renderItem={({ item }) => {
          const unread = isUnread(item);
          return (
            <TouchableOpacity style={[styles.card, unread && styles.unreadCard]} activeOpacity={0.88} onPress={() => markOneRead(item)}>
              <View style={[styles.iconBox, unread && styles.iconBoxUnread]}>
                <FontAwesome name={unread ? 'bell' : 'bell-o'} size={15} color={unread ? colors.gold : colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{notificationTitle(item)}</Text>
                  {unread ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.cardBody} numberOfLines={3}>{notificationBody(item)}</Text>
                {!!notificationDate(item) && <Text style={styles.cardDate}>{formatDate(notificationDate(item))}</Text>}
              </View>
              {notificationTarget(item) ? <FontAwesome name="chevron-right" size={13} color="#cbd5e1" /> : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.navy} style={{ marginTop: 60 }} /> : (
          <View style={styles.empty}>
            <FontAwesome name="bell-slash" size={42} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>{error || 'You are all caught up.'}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.navy, fontSize: 27, fontWeight: '900', marginTop: 2 },
  readButton: { minHeight: 36, justifyContent: 'center' },
  readButtonText: { color: colors.indigo, fontSize: 12, fontWeight: '900' },
  readButtonDisabled: { color: '#cbd5e1' },
  content: { paddingHorizontal: 18, paddingBottom: 110 },
  card: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12, flexDirection: 'row', gap: 12, ...shadows.card },
  unreadCard: { borderColor: 'rgba(253,184,19,0.45)', backgroundColor: '#fffdf5' },
  iconBox: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  iconBoxUnread: { backgroundColor: colors.navy },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.navy, fontSize: 14, fontWeight: '900', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  cardDate: { color: '#94a3b8', fontSize: 11, fontWeight: '800', marginTop: 9 },
  empty: { alignItems: 'center', paddingTop: 92, paddingHorizontal: 24 },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '900', marginTop: 14 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 6 },
});
