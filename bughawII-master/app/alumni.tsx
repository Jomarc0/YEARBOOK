import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getAlumni, getAlumniMe, getAppConfig, getBatches, getCurrentUser, getErrorMessage, imageUrl, paginationMeta, unwrap, updateAlumniCareer } from '../lib/api';
import { colors, shadows } from '../components/webTheme';

const FIELDS = ['All Fields', 'Engineering', 'Business', 'Education', 'Health Sciences', 'Technology', 'Arts', 'Law', 'Other'];
const TRACKER_TABS = [
  { id: 'directory', label: 'Directory', icon: 'users' },
  { id: 'profile', label: 'My Alumni Profile', icon: 'briefcase' },
];

const alumniName = (item: any) => item?.name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim() || 'Alumni';
const alumniPhoto = (item: any) => imageUrl(item?.profile_picture || item?.avatar || item?.photo);
const alumniUserId = (item: any) => item?.user_id || item?.account_user_id || item?.user?.id || item?.student?.user_id || item?.student?.account_user_id || item?.id;
const career = (item: any) => item?.career || {};
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'NU';
const batchId = (item: any) => item?.id ?? item?.batch_id;
const batchLabel = (item: any) => item?.title || item?.name || `Batch ${item?.year || item?.batch_year || ''}`.trim();
const graduationYear = (item: any) => item?.graduation_year || item?.batch_year || item?.student?.graduation_year || item?.student_record?.graduation_year;
const isGraduate = (item: any) => {
  const role = String(item?.role || item?.user?.role || '').toLowerCase();
  if (['alumni', 'graduate', 'graduated'].includes(role)) return true;
  if (['student', 'faculty', 'admin', 'super_admin'].includes(role)) return false;
  const year = Number(graduationYear(item));
  return Number.isFinite(year) && year <= new Date().getFullYear();
};
const flattenBatches = (payload: any) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (!data || typeof data !== 'object') return [];
  return Object.values(data).flatMap((group: any) => Array.isArray(group) ? group : []);
};
const firstParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default function AlumniScreen() {
  const router = useRouter();
  const routeParams = useLocalSearchParams();
  const requestedBatchParam = firstParam(routeParams.batchId as string | string[] | undefined) || firstParam(routeParams.batch_id as string | string[] | undefined);
  const highlightedAlumniId = firstParam(routeParams.highlight as string | string[] | undefined) || firstParam(routeParams.highlightId as string | string[] | undefined) || firstParam(routeParams.alumniId as string | string[] | undefined);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [field, setField] = useState('All Fields');
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [me, setMe] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('directory');
  const [careerOpen, setCareerOpen] = useState(false);
  const [careerSaving, setCareerSaving] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [careerForm, setCareerForm] = useState({
    job_title: '',
    company: '',
    location: '',
    field: '',
    bio: '',
  });

  const params = useMemo(() => ({
    q: query.trim() || undefined,
    field: field === 'All Fields' ? undefined : field,
    batch_id: selectedBatch ? batchId(selectedBatch) : undefined,
  }), [field, query, selectedBatch]);
  const schoolName = appConfig?.school_name || 'National University Lipa';
  const canEditCareer = isGraduate(me);

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

  useEffect(() => {
    let active = true;

    getAppConfig()
      .then((payload) => {
        if (active) setAppConfig(unwrap(payload));
      })
      .catch(() => {
        if (active) setAppConfig(null);
      });

    return () => { active = false; };
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      const payload = await getBatches();
      const nextBatches = flattenBatches(payload);
      setBatches(nextBatches);
      if (requestedBatchParam && !selectedBatch) {
        const matchingBatch = nextBatches.find((item: any) => String(batchId(item)) === String(requestedBatchParam));
        if (matchingBatch) setSelectedBatch(matchingBatch);
      }
    } catch {
      setBatches([]);
    }
  }, [requestedBatchParam, selectedBatch]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const loadMyAlumniProfile = useCallback(async () => {
    try {
      const [cachedUser, payload] = await Promise.all([
        getCurrentUser().catch(() => null),
        getAlumniMe(),
      ]);
      const profile = unwrap(payload);
      setMe({ ...(cachedUser || {}), ...(profile || {}), role: profile?.role || cachedUser?.role });
      const careerProfile = profile?.career || {};
      setCareerForm({
        job_title: careerProfile.job_title || '',
        company: careerProfile.company || '',
        location: careerProfile.location || '',
        field: careerProfile.field || '',
        bio: careerProfile.bio || '',
      });
    } catch {
      const cachedUser = await getCurrentUser().catch(() => null);
      setMe(cachedUser);
    }
  }, []);

  useEffect(() => {
    loadMyAlumniProfile();
  }, [loadMyAlumniProfile]);

  const cycleField = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const index = FIELDS.indexOf(field);
    setField(FIELDS[(index + 1) % FIELDS.length]);
  };

  const chooseBatch = (batch: any | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBatch(batch);
    setBatchOpen(false);
  };

  const openStudentProfile = (item: any) => {
    router.push({ pathname: '/student/[id]', params: { id: String(item.id), source: 'alumni' } } as any);
  };

  const openMessage = (item: any) => {
    const id = alumniUserId(item);
    if (!id) return;
    router.push({ pathname: '/messages', params: { userId: String(id), name: alumniName(item) } } as any);
  };

  const updateCareerField = (key: keyof typeof careerForm, value: string) => {
    setCareerForm((current) => ({ ...current, [key]: value }));
  };

  const saveCareer = async () => {
    if (!canEditCareer) {
      Alert.alert('Career profile unavailable', 'Career details are available after graduation.');
      return;
    }
    try {
      setCareerSaving(true);
      await updateAlumniCareer(careerForm);
      setCareerOpen(false);
      await loadMyAlumniProfile();
      await loadAlumni(1);
      Alert.alert('Career updated', 'Your alumni tracker profile has been updated.');
    } catch (requestError: any) {
      Alert.alert('Unable to save', getErrorMessage(requestError, 'Please check your details and try again.'));
    } finally {
      setCareerSaving(false);
    }
  };

  const myCareer = career(me);
  const showDirectory = activeTab === 'directory';

  const renderHeader = () => (
    <>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.82}>
          <FontAwesome name="chevron-left" size={14} color={colors.navy} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>{schoolName}</Text>
        <Text style={styles.heroTitle}>Alumni <Text style={styles.gold}>Tracker</Text></Text>
        <Text style={styles.heroText}>Find batchmates, careers, and locations.</Text>
        <View style={styles.statsPill}>
          <FontAwesome name="graduation-cap" size={13} color={colors.gold} />
          <Text style={styles.statsText}>{loading ? 'Loading alumni...' : `${total} alumni`}</Text>
        </View>
        {requestedBatchParam || highlightedAlumniId ? (
          <View style={styles.deepLinkPill}>
            <FontAwesome name="link" size={10} color={colors.gold} />
            <Text style={styles.deepLinkText}>
              {highlightedAlumniId ? 'Opened from yearbook link' : 'Filtered from yearbook'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.tabShell}>
        {TRACKER_TABS.map((item) => {
          const selected = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.trackerTab, selected && styles.trackerTabActive]}
              onPress={() => setActiveTab(item.id)}
              activeOpacity={0.86}
            >
              <FontAwesome name={item.icon as any} size={13} color={selected ? colors.gold : '#7d8aa3'} />
              <Text style={[styles.trackerTabText, selected && styles.trackerTabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showDirectory ? <View style={styles.filters}>
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
        <TouchableOpacity style={styles.fieldButton} onPress={() => setBatchOpen(true)}>
          <FontAwesome name="calendar" size={12} color={colors.gold} />
          <Text style={styles.fieldText}>{selectedBatch ? batchLabel(selectedBatch) : 'All Batches'}</Text>
          <FontAwesome name="chevron-down" size={11} color="#94a3b8" />
        </TouchableOpacity>
      </View> : null}

      {!showDirectory && !canEditCareer ? (
        <View style={styles.lockedCareerCard}>
          <View style={styles.lockedCareerIcon}>
            <FontAwesome name="lock" size={18} color={colors.gold} />
          </View>
          <Text style={styles.lockedCareerTitle}>Career details unlock after graduation</Text>
          <Text style={styles.lockedCareerText}>
            Alumni career profiles are only for graduates. Current students can browse alumni, but cannot add job or company details yet.
          </Text>
        </View>
      ) : null}

      {!showDirectory && canEditCareer ? (
      <View style={styles.myCareerCard}>
        <View style={styles.myCareerIcon}>
          <FontAwesome name="briefcase" size={15} color={colors.gold} />
        </View>
        <View style={styles.myCareerBody}>
          <Text style={styles.myCareerLabel}>My alumni profile</Text>
          <Text style={styles.myCareerTitle} numberOfLines={1}>
            {myCareer?.job_title || 'Add your career details'}
          </Text>
          <Text style={styles.myCareerMeta} numberOfLines={1}>
            {[myCareer?.company, myCareer?.location, myCareer?.field].filter(Boolean).join(' • ') || 'Help batchmates know where you are now.'}
          </Text>
        </View>
        <TouchableOpacity style={styles.editCareerButton} onPress={() => setCareerOpen(true)}>
          <FontAwesome name="pencil" size={11} color={colors.navy} />
          <Text style={styles.editCareerText}>Edit</Text>
        </TouchableOpacity>
      </View>
      ) : null}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={showDirectory ? alumni : []}
        keyExtractor={(item, index) => {
          const id = item?.id ?? item?.user_id ?? item?.alumni_id;
          return id != null ? String(id) : `alumni-${index}`;
        }}
        renderItem={({ item }) => (
          <View style={[styles.card, highlightedAlumniId && String(item?.id) === String(highlightedAlumniId) && styles.cardHighlighted]}>
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
              {highlightedAlumniId && String(item?.id) === String(highlightedAlumniId) ? (
                <View style={styles.highlightPill}>
                  <FontAwesome name="bookmark" size={9} color={colors.navy} />
                  <Text style={styles.highlightText}>Highlighted</Text>
                </View>
              ) : null}
              <Text style={styles.meta} numberOfLines={1}>{item?.section || item?.course || `${schoolName} Alumni`}</Text>
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
                <TouchableOpacity style={styles.primaryAction} onPress={() => openStudentProfile(item)}>
                  <FontAwesome name="user" size={12} color={colors.gold} />
                  <Text style={styles.primaryActionText}>Profile</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.messageAction} onPress={() => openMessage(item)}>
                <FontAwesome name="comment" size={12} color={colors.indigo} />
                <Text style={styles.messageActionText}>Send message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!showDirectory ? null : loading ? <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} /> : (
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
      <Modal visible={careerOpen && canEditCareer} transparent animationType="slide" onRequestClose={() => setCareerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.careerSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Career Profile</Text>
                <Text style={styles.sheetSub}>This appears in Alumni Tracker.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setCareerOpen(false)}>
                <FontAwesome name="times" size={14} color={colors.navy} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.formInput}
              placeholder="Job title"
              placeholderTextColor="#94a3b8"
              value={careerForm.job_title}
              onChangeText={(value) => updateCareerField('job_title', value)}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Company"
              placeholderTextColor="#94a3b8"
              value={careerForm.company}
              onChangeText={(value) => updateCareerField('company', value)}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Location"
              placeholderTextColor="#94a3b8"
              value={careerForm.location}
              onChangeText={(value) => updateCareerField('location', value)}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Career field"
              placeholderTextColor="#94a3b8"
              value={careerForm.field}
              onChangeText={(value) => updateCareerField('field', value)}
            />
            <TextInput
              style={[styles.formInput, styles.bioInput]}
              placeholder="Short bio"
              placeholderTextColor="#94a3b8"
              value={careerForm.bio}
              onChangeText={(value) => updateCareerField('bio', value)}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity style={[styles.saveCareerButton, careerSaving && styles.disabledButton]} onPress={saveCareer} disabled={careerSaving}>
              {careerSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveCareerText}>Save career profile</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={batchOpen} transparent animationType="slide" onRequestClose={() => setBatchOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.batchSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Filter by Batch</Text>
                <Text style={styles.sheetSub}>Show alumni from one graduation batch.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setBatchOpen(false)}>
                <FontAwesome name="times" size={14} color={colors.navy} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.batchOption, !selectedBatch && styles.batchOptionActive]} onPress={() => chooseBatch(null)}>
              <Text style={[styles.batchOptionText, !selectedBatch && styles.batchOptionTextActive]}>All Batches</Text>
              {!selectedBatch ? <FontAwesome name="check" size={13} color={colors.gold} /> : null}
            </TouchableOpacity>
            <FlatList
              data={batches}
              keyExtractor={(item, index) => {
                const id = batchId(item);
                return id != null ? String(id) : `batch-${index}`;
              }}
              renderItem={({ item }) => {
                const active = selectedBatch && String(batchId(selectedBatch)) === String(batchId(item));
                return (
                  <TouchableOpacity style={[styles.batchOption, active && styles.batchOptionActive]} onPress={() => chooseBatch(item)}>
                    <Text style={[styles.batchOptionText, active && styles.batchOptionTextActive]}>{batchLabel(item)}</Text>
                    {active ? <FontAwesome name="check" size={13} color={colors.gold} /> : <Text style={styles.batchYear}>{item?.year || item?.batch_year || ''}</Text>}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.noBatches}>No batches available yet.</Text>}
              style={styles.batchList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  content: { paddingBottom: 20 },
  hero: { backgroundColor: colors.navy, paddingHorizontal: 22, paddingTop: 28, paddingBottom: 34, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { alignSelf: 'flex-start', height: 42, borderRadius: 14, backgroundColor: '#ffffff', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  backText: { color: colors.navy, fontSize: 13, fontWeight: '900' },
  eyebrow: { color: 'rgba(253,184,19,0.72)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3, textAlign: 'center' },
  heroTitle: { color: '#ffffff', fontSize: 30, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  gold: { color: colors.gold },
  heroText: { color: 'rgba(255,255,255,0.72)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  statsPill: { alignSelf: 'center', marginTop: 16, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(253,184,19,0.34)', backgroundColor: 'rgba(253,184,19,0.12)', paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  deepLinkPill: { alignSelf: 'center', marginTop: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 },
  deepLinkText: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '900' },
  tabShell: { marginHorizontal: 18, marginTop: -24, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, padding: 6, flexDirection: 'row', gap: 6, ...shadows.card },
  trackerTab: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  trackerTabActive: { backgroundColor: colors.navy },
  trackerTabText: { color: '#7d8aa3', fontSize: 12, fontWeight: '900' },
  trackerTabTextActive: { color: '#ffffff' },
  filters: { padding: 18, gap: 10 },
  searchBox: { minHeight: 50, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, color: colors.navy, fontSize: 14 },
  fieldButton: { minHeight: 46, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fieldText: { color: colors.navy, fontSize: 12, fontWeight: '900' },
  myCareerCard: { marginHorizontal: 18, marginBottom: 14, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadows.card },
  myCareerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  myCareerBody: { flex: 1, minWidth: 0 },
  myCareerLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  myCareerTitle: { color: colors.navy, fontSize: 14, fontWeight: '900', marginTop: 3 },
  myCareerMeta: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  editCareerButton: { height: 36, borderRadius: 12, backgroundColor: colors.gold, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  editCareerText: { color: colors.navy, fontSize: 12, fontWeight: '900' },
  lockedCareerCard: { marginHorizontal: 18, marginTop: 16, marginBottom: 14, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18, alignItems: 'center', ...shadows.card },
  lockedCareerIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  lockedCareerTitle: { color: colors.navy, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  lockedCareerText: { color: colors.muted, fontSize: 13, fontWeight: '700', lineHeight: 19, textAlign: 'center', marginTop: 7 },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center', paddingHorizontal: 18, marginBottom: 8 },
  card: { marginHorizontal: 18, marginBottom: 14, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 15, flexDirection: 'row', gap: 14, ...shadows.card },
  cardHighlighted: { borderColor: colors.gold, borderWidth: 2, backgroundColor: '#fffaf0' },
  avatarWrap: { width: 62, height: 62 },
  avatar: { width: 62, height: 62, borderRadius: 18 },
  avatarFallback: { width: 62, height: 62, borderRadius: 18, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.gold, fontSize: 18, fontWeight: '900' },
  verified: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.indigo, borderWidth: 2, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, minWidth: 0 },
  name: { color: colors.navy, fontSize: 16, fontWeight: '900' },
  highlightPill: { alignSelf: 'flex-start', marginTop: 6, borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  highlightText: { color: colors.navy, fontSize: 10, fontWeight: '900' },
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
  messageAction: { height: 36, borderRadius: 11, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 9 },
  messageActionText: { color: colors.indigo, fontSize: 12, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.42)', justifyContent: 'flex-end' },
  careerSheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28 },
  batchSheet: { maxHeight: '72%', backgroundColor: '#ffffff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 999, backgroundColor: '#e2e8f0', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: colors.navy, fontSize: 20, fontWeight: '900' },
  sheetSub: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  closeButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  formInput: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#f8fafc', paddingHorizontal: 14, color: colors.navy, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  bioInput: { minHeight: 92, paddingTop: 13 },
  saveCareerButton: { height: 50, borderRadius: 15, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveCareerText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  disabledButton: { opacity: 0.65 },
  batchList: { marginTop: 4 },
  batchOption: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#f8fafc', paddingHorizontal: 14, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  batchOptionActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  batchOptionText: { color: colors.navy, fontSize: 14, fontWeight: '900' },
  batchOptionTextActive: { color: '#ffffff' },
  batchYear: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  noBatches: { color: colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'center', paddingVertical: 18 },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 40 },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 13, marginTop: 5 },
});