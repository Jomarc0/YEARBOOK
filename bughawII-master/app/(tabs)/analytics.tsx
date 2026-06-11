import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { getAnalyticsSummary, getAppConfig, getBatchmateAnalytics, getErrorMessage, getMyStats, getMyStatsTrend, getTopViewed, getTrending, imageUrl, unwrap } from '../../lib/api';

const TABS = [
  { id: 'trending', label: 'Trending', title: 'Trending this week', desc: 'Profiles with the most views in the last 7 days', icon: 'fire', color: '#fb923c' },
  { id: 'top-viewed', label: 'Most Viewed', title: 'Most viewed all-time', desc: 'Alumni with the highest total profile view counts', icon: 'eye', color: '#4f46e5' },
  { id: 'batchmates', label: 'Batchmates', title: 'Batchmate analytics', desc: 'Compare profile engagement inside your batch and section', icon: 'users', color: '#fdb813' },
  { id: 'my-stats', label: 'My Stats', title: 'Your engagement stats', desc: 'How your profile is performing among your batchmates', icon: 'bar-chart', color: '#10b981' },
];

const initials = (name = 'NU') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NU';
const personName = (item: any) => item?.name || item?.full_name || item?.student?.name || 'Alumni Profile';
const personImage = (item: any) => imageUrl(item?.profile_picture || item?.profile_pic || item?.photo || item?.student?.profile_picture);
const cleanProgram = (value: any) => {
  const text = String(value || '').trim();
  return text && text.toLowerCase() !== 'no program listed' ? text : '';
};
const isStudentEntity = (item: any) => {
  const type = String(item?.type || item?.role || item?.entity_type || item?.model_type || '').toLowerCase();
  if (type && !/(profile|student|alumni|user)/.test(type)) return false;
  return Boolean(item?.student || item?.student_id || item?.student_record_id || item?.user_id || item?.graduation_year || item?.batch_year || item?.course || item?.program || item?.name);
};
const personMeta = (item: any) => {
  const course = cleanProgram(item?.course || item?.program || item?.student?.course);
  const batch = item?.batch || item?.graduation_year || item?.batch_year || item?.student?.graduation_year;
  if (course && batch) return `${course} · ${batch}`;
  return course || batch || '';
};

const listFromPayload = (payload: any) => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.profiles)) return raw.profiles;
  if (Array.isArray(raw?.top_profiles)) return raw.top_profiles;
  if (Array.isArray(raw?.batchmates)) return raw.batchmates;
  if (Array.isArray(raw?.students)) return raw.students;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const objectFromPayload = (payload: any) => {
  const raw = unwrap(payload);
  return raw && !Array.isArray(raw) ? raw : {};
};

const numberValue = (...values: any[]) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== '');
  return Number(value || 0);
};

function Avatar({ item, size = 44 }: { item: any; size?: number }) {
  const name = personName(item);
  const photo = personImage(item);

  if (photo) {
    return <Image source={photo} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} contentFit="cover" />;
  }

  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
    </View>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medalColors = ['#fdb813', '#a3b1c8', '#d59b72'];
  return (
    <View style={styles.rankWrap}>
      <FontAwesome name="heart" size={17} color="#4d91df" />
      <View style={[styles.rankBubble, { backgroundColor: medalColors[rank - 1] || '#eef2ff' }]}>
        <Text style={styles.rankText}>{rank <= 3 ? rank : `#${rank}`}</Text>
      </View>
    </View>
  );
}

function AlumniRow({ item, rank, metric }: { item: any; rank: number; metric: number }) {
  const meta = personMeta(item);
  return (
    <TouchableOpacity style={styles.alumniRow} activeOpacity={0.86}>
      <RankBadge rank={rank} />
      <Avatar item={item} />
      <View style={styles.personCopy}>
        <Text style={styles.personName} numberOfLines={1}>{personName(item)}</Text>
        {meta ? <Text style={styles.personMeta} numberOfLines={1}>{meta}</Text> : null}
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricValue}>{metric.toLocaleString()}</Text>
        <Text style={styles.metricLabel}>views</Text>
      </View>
    </TouchableOpacity>
  );
}

function StatTile({ icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}18` }]}>
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statTileValue}>{Number(value || 0).toLocaleString()}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, color, title, desc }: { icon: any; color: string; title: string; desc: string }) {
  return (
    <View style={styles.emptyPanel}>
      <View style={[styles.emptyIcon, { backgroundColor: `${color}18` }]}>
        <FontAwesome name={icon} size={24} color={color} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{desc}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [tab, setTab] = useState('trending');
  const [summary, setSummary] = useState<any>({});
  const [trending, setTrending] = useState<any[]>([]);
  const [topViewed, setTopViewed] = useState<any[]>([]);
  const [batchmateStats, setBatchmateStats] = useState<any[]>([]);
  const [statsTrend, setStatsTrend] = useState<any>({});
  const [myStats, setMyStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [appConfig, setAppConfig] = useState<any>(null);

  const activeTab = useMemo(() => TABS.find((item) => item.id === tab) || TABS[0], [tab]);
  const activeList = (tab === 'top-viewed' ? topViewed : tab === 'batchmates' ? batchmateStats : trending).filter(isStudentEntity);
  const schoolName = appConfig?.school_name || 'National University Lipa';
  const yearbookName = appConfig?.yearbook_name || 'Sinag-Bughaw Digital Yearbook';

  const loadAnalytics = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);

      const [configResult, summaryResult, trendingResult, topViewedResult, batchmateResult, statsResult, trendResult] = await Promise.allSettled([
        getAppConfig(),
        getAnalyticsSummary(),
        getTrending(),
        getTopViewed(10),
        getBatchmateAnalytics(),
        getMyStats(),
        getMyStatsTrend(),
      ]);

      if (configResult.status === 'fulfilled') setAppConfig(objectFromPayload(configResult.value));
      if (summaryResult.status === 'fulfilled') setSummary(objectFromPayload(summaryResult.value));
      if (trendingResult.status === 'fulfilled') setTrending(listFromPayload(trendingResult.value));
      if (topViewedResult.status === 'fulfilled') setTopViewed(listFromPayload(topViewedResult.value));
      if (batchmateResult.status === 'fulfilled') setBatchmateStats(listFromPayload(batchmateResult.value));
      if (statsResult.status === 'fulfilled') setMyStats(objectFromPayload(statsResult.value));
      if (trendResult.status === 'fulfilled') setStatsTrend(objectFromPayload(trendResult.value));

      const failed = [summaryResult, trendingResult, topViewedResult, batchmateResult, statsResult, trendResult].find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failed) setError(getErrorMessage(failed.reason, 'Some analytics could not be loaded.'));
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load analytics.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const renderHero = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbMuted}>{yearbookName.replace(/\s*Digital Yearbook/i, '').toUpperCase()}</Text>
          <FontAwesome name="chevron-right" size={9} color="rgba(255,255,255,0.25)" />
          <Text style={styles.breadcrumbActive}>ANALYTICS</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{schoolName.toUpperCase()}</Text>
        </View>

        <Text style={styles.heroTitle}>
          Alumni <Text style={styles.gold}>Analytics</Text>
        </Text>
        <Text style={styles.heroCopy}>Discover trending profiles and engagement stats across your batch.</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <FontAwesome name="users" size={16} color="#fdb813" />
            <View>
              <Text style={styles.summaryValue}>{numberValue(summary?.total_students, summary?.students, summary?.alumni).toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Alumni</Text>
            </View>
          </View>
          <View style={styles.summaryPill}>
            <FontAwesome name="image" size={16} color="#fdb813" />
            <View>
              <Text style={styles.summaryValue}>{numberValue(summary?.total_photos, summary?.photos).toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Photos</Text>
            </View>
          </View>
          <View style={styles.summaryPill}>
            <FontAwesome name="comment-o" size={16} color="#fdb813" />
            <View>
              <Text style={styles.summaryValue}>{numberValue(summary?.total_messages, summary?.messages).toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Messages</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tabsShell}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.tabButton, active && styles.tabActive]}
                onPress={() => setTab(item.id)}
                activeOpacity={0.86}
              >
                <FontAwesome name={item.icon as any} size={14} color={active ? '#1d2b4b' : '#60708c'} />
                <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <FontAwesome name={activeTab.icon as any} size={19} color={activeTab.color} />
          <Text style={styles.sectionTitle}>{activeTab.title}</Text>
        </View>
        <Text style={styles.sectionDesc}>{activeTab.desc}</Text>
      </View>

      {!!error && <Text style={styles.warningText}>{error}</Text>}
    </>
  );

  if (tab === 'my-stats') {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar style="light" />
        <FlatList
          data={[]}
          renderItem={null as any}
          ListHeaderComponent={(
            <>
              {renderHero()}
              {loading ? <ActivityIndicator color="#1d2b4b" style={styles.loading} /> : (
                <>
                  <View style={styles.statsGrid}>
                    <StatTile icon="eye" label="Profile views" value={myStats?.profile_views} color="#4f46e5" />
                    <StatTile icon="image" label="Photos uploaded" value={myStats?.photos_uploaded} color="#10b981" />
                    <StatTile icon="users" label="Times tagged" value={myStats?.times_tagged} color="#8b5cf6" />
                    <StatTile icon="send" label="Messages sent" value={myStats?.messages_sent} color="#fb923c" />
                    <StatTile icon="comments" label="Messages received" value={myStats?.messages_received} color="#ec4899" />
                  </View>
                  <View style={styles.chartPanel}>
                    <Text style={styles.chartTitle}>Profile views</Text>
                    <View style={styles.bars}>
                      {(statsTrend?.values || myStats?.trend?.values || myStats?.views_trend || [2, 4, 3, 6, 5, 7, 4]).map((value: number, index: number, values: number[]) => {
                        const max = Math.max(...values, 1);
                        return <View key={String(index)} style={[styles.bar, { height: Math.max(8, (Number(value || 0) / max) * 78) }]} />;
                      })}
                    </View>
                  </View>
                </>
              )}
            </>
          )}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAnalytics(); }} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={activeList}
        keyExtractor={(item, index) => String(item?.id || item?.user_id || index)}
        ListHeaderComponent={renderHero}
        renderItem={({ item, index }) => (
          <AlumniRow
            item={item}
            rank={index + 1}
            metric={numberValue(tab === 'trending' ? item?.views_this_week : item?.views, item?.total_views, item?.profile_views)}
          />
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={styles.loading} /> : (
          <EmptyState
            icon={tab === 'trending' ? 'fire' : 'eye'}
            color={activeTab.color}
            title={tab === 'trending' ? 'No trending data yet' : 'No data yet'}
            desc={tab === 'trending' ? 'Check back later. Views are tracked weekly.' : 'Profile views will appear here once alumni start getting visits.'}
          />
        )}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAnalytics(); }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb' },
  content: { paddingBottom: 36 },
  hero: { backgroundColor: '#1B2A4A', paddingHorizontal: 22, paddingTop: 50, paddingBottom: 24, overflow: 'hidden' },
  breadcrumb: { flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 14 },
  breadcrumbMuted: { color: 'rgba(255,255,255,0.42)', fontSize: 11, letterSpacing: 1.4, fontWeight: '900' },
  breadcrumbActive: { color: '#fdb813', fontSize: 11, letterSpacing: 1.4, fontWeight: '900' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(253,184,19,0.48)', backgroundColor: 'rgba(253,184,19,0.10)', paddingHorizontal: 13, paddingVertical: 7, marginBottom: 16 },
  badgeText: { color: '#fdb813', fontSize: 10, letterSpacing: 1.6, fontWeight: '900' },
  heroTitle: { color: '#ffffff', fontSize: 34, fontWeight: '900', lineHeight: 39 },
  gold: { color: '#fdb813' },
  heroCopy: { color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 330 },
  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  summaryPill: { flex: 1, minHeight: 62, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6 },
  summaryValue: { color: '#ffffff', fontSize: 18, fontWeight: '900', lineHeight: 20 },
  summaryLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 10, marginTop: 3 },
  tabsShell: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#dfe6f2' },
  tabs: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  tabButton: { minWidth: 118, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5eaf3', backgroundColor: '#ffffff' },
  tabActive: { borderColor: '#1d2b4b', backgroundColor: '#eef2ff' },
  tabText: { color: '#60708c', fontSize: 12, fontWeight: '900' },
  tabTextActive: { color: '#071b3d' },
  sectionHeader: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionTitle: { color: '#071b3d', fontSize: 19, fontWeight: '900' },
  sectionDesc: { color: '#8fa0bf', fontSize: 13, lineHeight: 20, marginTop: 7 },
  warningText: { marginHorizontal: 22, marginBottom: 12, color: '#b45309', backgroundColor: '#fff7ed', borderRadius: 12, padding: 12, fontSize: 12, fontWeight: '700' },
  loading: { marginTop: 34 },
  alumniRow: { marginHorizontal: 16, marginBottom: 12, minHeight: 76, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8edf5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, shadowColor: '#102044', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  rankWrap: { width: 28, alignItems: 'center', marginRight: 7 },
  rankBubble: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: -5 },
  rankText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  avatar: { borderWidth: 2, borderColor: 'rgba(253,184,19,0.32)', backgroundColor: '#eef2ff' },
  avatarFallback: { borderWidth: 2, borderColor: 'rgba(253,184,19,0.32)', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fdb813', fontWeight: '900' },
  personCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  personName: { color: '#020617', fontSize: 14, fontWeight: '900' },
  personMeta: { color: '#8fa0bf', fontSize: 11, marginTop: 4 },
  metric: { width: 54, alignItems: 'flex-end', marginLeft: 6 },
  metricValue: { color: '#020617', fontSize: 15, fontWeight: '900' },
  metricLabel: { color: '#8fa0bf', fontSize: 10, marginTop: 2 },
  statsGrid: { paddingHorizontal: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statTile: { width: '47.8%', minHeight: 128, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8edf5', padding: 16, shadowColor: '#102044', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  statTileValue: { color: '#071b3d', fontSize: 24, fontWeight: '900' },
  statTileLabel: { color: '#8fa0bf', fontSize: 12, marginTop: 5 },
  chartPanel: { marginHorizontal: 22, marginTop: 16, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8edf5', padding: 18 },
  chartTitle: { color: '#071b3d', fontSize: 14, fontWeight: '900', marginBottom: 16 },
  bars: { height: 88, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  bar: { flex: 1, backgroundColor: '#4f46e5', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  emptyPanel: { marginHorizontal: 22, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8edf5', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 54 },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: '#071b3d', fontSize: 17, fontWeight: '900' },
  emptyText: { color: '#8fa0bf', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
});
