import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getAlumni, getAlumniYearbookEntry, getErrorMessage, imageUrl, paginationMeta, unwrap } from '../lib/api';
import { colors, shadows } from '../components/webTheme';

const FIELDS = ['All Fields', 'Engineering', 'Business', 'Education', 'Health Sciences', 'Technology', 'Arts', 'Law', 'Other'];

const alumniName = (item: any) => item?.name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim() || 'Alumni';
const alumniPhoto = (item: any) => imageUrl(item?.profile_picture || item?.avatar || item?.photo);
const career = (item: any) => item?.career || {};
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'NU';

export default function AlumniScreen() {
  const router = useRouter();
  const [alumni, setAlumni] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [field, setField] = useState('All Fields');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const params = useMemo(() => ({
    q: query.trim() || undefined,
    field: field === 'All Fields' ? undefined : field,
  }), [field, query]);

  const loadAlumni = useCallback(async (nextPage = 1, append = false) => {
    try {
      setError('');
      if (append) setLoadingMore(true);
      else if (!refreshing) setLoading(true);

      const payload = await getAlumni({ ...params, page: nextPage });
      const data = unwrap(payload);
      const list = Array.isArray(data) ? data : [];
      const meta = paginationMeta(payload);

      setAlumni((current) => append ? [...current, ...list] : list);
      setPage(meta.currentPage);
      setLastPage(meta.lastPage);
      setTotal(payload?.total ?? payload?.meta?.total ?? list.length);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load alumni.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [params, refreshing]);

  useEffect(() => {
    const timer = setTimeout(() => loadAlumni(1), 350);
    return () => clearTimeout(timer);
  }, [loadAlumni]);

  const cycleField = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const index = FIELDS.indexOf(field);
    setField(FIELDS[(index + 1) % FIELDS.length]);
  };

  const openYearbook = async (item: any) => {
    try {
      const payload = await getAlumniYearbookEntry(item.id);
      const entry = unwrap(payload);
      if (!entry?.batch_id) throw new Error('No yearbook entry found.');
      router.push({ pathname: '/yearbook', params: { batchId: String(entry.batch_id) } } as any);
    } catch (requestError: any) {
      Alert.alert('Yearbook unavailable', getErrorMessage(requestError, 'No yearbook entry was found for this alumni.'));
    }
  };

  const openProfile = (item: any) => {
    router.push({ pathname: '/messages', params: { userId: String(item.id), name: alumniName(item) } } as any);
  };

  const renderHeader = () => (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>National University Lipa</Text>
        <Text style={styles.heroTitle}>Alumni <Text style={styles.gold}>Tracker</Text></Text>
        <Text style={styles.heroText}>Find batchmates, careers, locations, and their yearbook entries.</Text>
        <View style={styles.statsPill}>
          <FontAwesome name="graduation-cap" size={13} color={colors.gold} />
          <Text style={styles.statsText}>{loading ? 'Loading alumni...' : `${total} alumni`}</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <FontAwesome name="search" size={14} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search alumni..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity style={styles.fieldButton} onPress={cycleField}>
          <FontAwesome name="briefcase" size={12} color={colors.gold} />
          <Text style={styles.fieldText}>{field}</Text>
          <FontAwesome name="refresh" size={11} color="#94a3b8" />
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={alumni}
        keyExtractor={(item, index) => String(item?.id || index)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatarWrap}>
              {alumniPhoto(item) ? (
                <Image source={alumniPhoto(item)} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.initials}>{initials(alumniName(item))}</Text>
                </View>
              )}
              {item?.is_verified ? (
                <View style={styles.verified}>
                  <FontAwesome name="check" size={8} color="#ffffff" />
                </View>
              ) : null}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.name} numberOfLines={1}>{alumniName(item)}</Text>
              <Text style={styles.meta} numberOfLines={1}>{item?.section || item?.course || 'NU Lipa Alumni'}</Text>
              <View style={styles.batchPill}>
                <FontAwesome name="graduation-cap" size={9} color={colors.gold} />
                <Text style={styles.batchText}>Batch {item?.batch_year || item?.graduation_year || 'NU'}</Text>
              </View>

              {career(item)?.job_title ? (
                <View style={styles.careerBox}>
                  <Text style={styles.job} numberOfLines={1}>{career(item).job_title}</Text>
                  <Text style={styles.company} numberOfLines={1}>{career(item).company || career(item).location || 'Career profile'}</Text>
                </View>
              ) : (
                <Text style={styles.emptyCareer}>No career details yet.</Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryAction} onPress={() => openYearbook(item)}>
                  <FontAwesome name="book" size={12} color={colors.gold} />
                  <Text style={styles.primaryActionText}>Yearbook</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction} onPress={() => openProfile(item)}>
                  <FontAwesome name="comment" size={12} color={colors.indigo} />
                  <Text style={styles.secondaryActionText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} /> : (
          <View style={styles.empty}>
            <FontAwesome name="users" size={38} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Alumni Found</Text>
            <Text style={styles.emptyText}>Try a different name or career field.</Text>
          </View>
        )}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.navy} style={{ marginVertical: 20 }} /> : <View style={{ height: 90 }} />}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAlumni(1); }} />}
        onEndReached={() => {
          if (!loadingMore && page < lastPage) loadAlumni(page + 1, true);
        }}
        onEndReachedThreshold={0.35}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  content: { paddingBottom: 20 },
  hero: { backgroundColor: colors.navy, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 34, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  eyebrow: { color: 'rgba(253,184,19,0.72)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3, textAlign: 'center' },
  heroTitle: { color: '#ffffff', fontSize: 30, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  gold: { color: colors.gold },
  heroText: { color: 'rgba(255,255,255,0.72)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  statsPill: { alignSelf: 'center', marginTop: 16, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(253,184,19,0.34)', backgroundColor: 'rgba(253,184,19,0.12)', paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  filters: { padding: 18, gap: 10 },
  searchBox: { minHeight: 50, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, color: colors.navy, fontSize: 14 },
  fieldButton: { minHeight: 46, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fieldText: { color: colors.navy, fontSize: 12, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center', paddingHorizontal: 18, marginBottom: 8 },
  card: { marginHorizontal: 18, marginBottom: 14, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 15, flexDirection: 'row', gap: 14, ...shadows.card },
  avatarWrap: { width: 62, height: 62 },
  avatar: { width: 62, height: 62, borderRadius: 18 },
  avatarFallback: { width: 62, height: 62, borderRadius: 18, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.gold, fontSize: 18, fontWeight: '900' },
  verified: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.indigo, borderWidth: 2, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, minWidth: 0 },
  name: { color: colors.navy, fontSize: 16, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  batchPill: { alignSelf: 'flex-start', marginTop: 9, borderRadius: 999, backgroundColor: 'rgba(253,184,19,0.12)', borderWidth: 1, borderColor: 'rgba(253,184,19,0.25)', paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  batchText: { color: '#92590e', fontSize: 10, fontWeight: '900' },
  careerBox: { marginTop: 10, borderRadius: 13, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#edf2f7', padding: 10 },
  job: { color: colors.navy, fontSize: 13, fontWeight: '900' },
  company: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  emptyCareer: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 12 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 13 },
  primaryAction: { flex: 1, height: 40, borderRadius: 12, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryActionText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  secondaryAction: { flex: 1, height: 40, borderRadius: 12, backgroundColor: colors.softIndigo, borderWidth: 1, borderColor: '#dbe4ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryActionText: { color: colors.indigo, fontSize: 12, fontWeight: '900' },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 40 },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 13, marginTop: 5 },
});
