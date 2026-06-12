import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAnnouncements, getErrorMessage, unwrap } from '../lib/api';
import { colors, shadows } from '../components/webTheme';

const announcementId = (item: any) => item?.id || item?.announcement_id;
const announcementTitle = (item: any) => item?.title || item?.headline || 'Announcement';
const announcementBody = (item: any) => item?.body || item?.message || item?.content || item?.description || '';
const announcementDate = (item: any) => item?.published_at || item?.created_at || item?.date;
const announcementAudience = (item: any) => item?.audience || item?.target || item?.recipient_type || 'Students';
const announcementType = (item: any) => String(item?.type || item?.category || 'information').toLowerCase();
const announcementTypeLabel = (item: any) => {
  const type = announcementType(item);
  return type.charAt(0).toUpperCase() + type.slice(1);
};
const TABS = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'information', label: 'Info', icon: 'info-circle' },
  { key: 'event', label: 'Events', icon: 'calendar' },
  { key: 'reminder', label: 'Reminders', icon: 'bell' },
  { key: 'urgent', label: 'Urgent', icon: 'exclamation-circle' },
];

const listFromPayload = (payload: any) => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

// Removes duplicate records (e.g. caused by backend joins returning repeated
// rows) based on the resolved entity id. Items without a resolvable id are
// always kept.
const dedupeById = (list: any[], getId: (item: any) => any) => {
  const seen = new Set();
  return list.filter((item) => {
    const id = getId(item);
    if (id == null) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const formatDate = (value?: string) => {
  if (!value) return 'Latest';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Latest';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const loadAnnouncements = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const payload = await getAnnouncements();
      setAnnouncements(dedupeById(listFromPayload(payload), announcementId));
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load announcements.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].filter((item) => activeTab === 'all' || announcementType(item) === activeTab).sort((a, b) => {
      const left = new Date(announcementDate(a) || 0).getTime();
      const right = new Date(announcementDate(b) || 0).getTime();
      return right - left;
    });
  }, [activeTab, announcements]);

  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/home' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.84}>
          <FontAwesome name="chevron-left" size={15} color={colors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Campus Updates</Text>
          <Text style={styles.title}>Announcements</Text>
        </View>
      </View>

      <FlatList
        horizontal
        data={TABS}
        keyExtractor={(tab) => tab.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        renderItem={({ item: tab }) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={() => setActiveTab(tab.key)} activeOpacity={0.86}>
              <FontAwesome name={tab.icon as any} size={11} color={active ? colors.navy : '#94a3b8'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={sortedAnnouncements}
        keyExtractor={(item, index) => {
          const id = announcementId(item);
          return `${id != null ? id : 'announcement'}-${index}`;
        }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconBox}>
                <FontAwesome name="bullhorn" size={15} color={colors.gold} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitle}>{announcementTitle(item)}</Text>
                <Text style={styles.cardMeta}>{formatDate(announcementDate(item))} - {announcementAudience(item)}</Text>
              </View>
              <View style={[styles.categoryBadge, announcementType(item) === 'urgent' ? styles.categoryUrgent : styles.categoryNeutral]}>
                <Text style={[styles.categoryText, announcementType(item) === 'urgent' ? styles.categoryTextUrgent : styles.categoryTextNeutral]}>
                  {announcementTypeLabel(item)}
                </Text>
              </View>
            </View>
            {!!announcementBody(item) && <Text style={styles.cardBody}>{announcementBody(item)}</Text>}
          </View>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.navy} style={{ marginTop: 70 }} /> : (
          <View style={styles.empty}>
            <FontAwesome name="bullhorn" size={42} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Announcements</Text>
            <Text style={styles.emptyText}>{error || 'There are no announcements for this tab yet.'}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAnnouncements(); }} />}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.navy, fontSize: 27, fontWeight: '900', marginTop: 2 },
  tabs: { 
  gap: 8, 
  paddingLeft: 18, 
  paddingRight: 18, 
  paddingTop: 4,
  paddingBottom: 14 
},
tab: { 
  minWidth: 64, 
  height: 36, 
  borderRadius: 13, 
  backgroundColor: '#ffffff', 
  borderWidth: 1, 
  borderColor: colors.border, 
  alignItems: 'center', 
  justifyContent: 'center', 
  flexDirection: 'row', 
  gap: 5, 
  paddingHorizontal: 12 
},
tabActive: { 
  backgroundColor: '#FFF3D6', 
  borderColor: 'rgba(245,166,35,0.72)',
  shadowColor: '#F5A623',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 2
},
  tabText: { color: '#94a3b8', fontSize: 10, fontWeight: '900', flexShrink: 1 },
  tabTextActive: { color: colors.navy },
  content: { paddingHorizontal: 18, paddingBottom: 110 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12, ...shadows.card },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.navy, fontSize: 15, fontWeight: '900' },
  cardMeta: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 3 },
  categoryBadge: { minHeight: 28, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  categoryUrgent: { backgroundColor: '#fff7e6', borderColor: 'rgba(245,166,35,0.72)' },
  categoryNeutral: { backgroundColor: '#ffffff', borderColor: colors.navy },
  categoryText: { fontSize: 10, fontWeight: '900' },
  categoryTextUrgent: { color: colors.navy },
  categoryTextNeutral: { color: colors.navy },
  cardBody: { color: '#475569', fontSize: 13, lineHeight: 20, marginTop: 12 },
  empty: { minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { color: colors.navy, fontSize: 20, fontWeight: '900', marginTop: 16 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 6 },
});