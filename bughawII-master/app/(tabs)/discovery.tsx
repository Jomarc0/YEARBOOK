import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  fetchCurrentUser,
  getBatchmates,
  getBatches,
  getCurrentUser,
  getDiscoveryCrossProgram,
  getDiscoverySchool,
  getDiscoverySectionmates,
  getErrorMessage,
  getSearchFilters,
  imageUrl,
  paginationMeta,
  searchFace,
  unwrap,
} from '../../lib/api';
import FilterDropdown from '../../components/FilterDropdown';

const COURSE_FILTERS = [
  { key: 'all', label: 'All Programs', value: '' },
  { key: 'arch', label: 'BS Architecture', value: 'BS Architecture' },
  { key: 'ce', label: 'BS Civil Engineering', value: 'BS Civil Engineering' },
  { key: 'cs', label: 'BS Computer Science', value: 'BS Computer Science' },
  { key: 'it', label: 'BS Information Technology', value: 'BS Information Technology' },
  { key: 'nursing', label: 'BS Nursing', value: 'BS Nursing' },
  { key: 'medtech', label: 'BS Medical Technology', value: 'BS Medical Technology' },
  { key: 'psych', label: 'BS Psychology', value: 'BS Psychology' },
  { key: 'acct', label: 'BS Accountancy', value: 'BS Accountancy' },
  { key: 'fm', label: 'BSBA Financial Management', value: 'BSBA Financial Management' },
  { key: 'mm', label: 'BSBA Marketing Management', value: 'BSBA Marketing Management' },
  { key: 'tm', label: 'BS Tourism Management', value: 'BS Tourism Management' },
  { key: 'abm', label: 'ABM', value: 'ABM' },
  { key: 'stem', label: 'STEM', value: 'STEM' },
  { key: 'humss', label: 'HUMSS', value: 'HUMSS' },
];

const MODE_CONFIG = [
  { key: 'batch', label: 'My Batch', hint: 'Same course & year', icon: 'graduation-cap' },
  { key: 'section', label: 'My Section', hint: 'My classmates', icon: 'stack-overflow' },
  { key: 'school', label: 'Whole School', hint: 'All students', icon: 'institution' },
  { key: 'cross', label: 'Cross-Program', hint: 'Other programs', icon: 'random' },
];

const years = Array.from({ length: 7 }, (_, index) => String(2026 - index));

const studentName = (item: any) => item?.name || item?.full_name || item?.student_name || 'Student';
const studentCourse = (item: any) => item?.course || item?.program || item?.student?.course || 'Yearbook profile';
const studentSection = (item: any) => item?.section?.name || item?.section_name || item?.section || '';
const studentYear = (item: any) => String(item?.graduation_year || item?.batch_year || item?.batch || item?.year || item?.student?.graduation_year || '');
const studentNo = (item: any) => item?.student_no || item?.student_number || item?.student_id || item?.student?.student_no || '';
const studentPhoto = (item: any) => imageUrl(item?.profile_picture || item?.profile_pic || item?.photo || item?.student?.profile_picture);

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NU';

const getPayloadList = (payload: any) => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getPayloadMeta = (payload: any) => {
  const raw = unwrap(payload);
  if (raw?.current_page || raw?.last_page) {
    return {
      currentPage: raw?.current_page ?? 1,
      lastPage: raw?.last_page ?? 1,
    };
  }
  return paginationMeta(payload);
};

const flattenBatches = (payload: any) => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (raw && typeof raw === 'object') return Object.values(raw).flat();
  return [];
};

const userStudent = (user: any) => user?.student || user?.profile || user || {};
const userCourse = (user: any) => userStudent(user)?.course || user?.course || '';
const userYear = (user: any) => String(userStudent(user)?.graduation_year || user?.graduation_year || user?.batch_year || '');
const hasPremium = (user: any) => Boolean(user?.is_premium || user?.premium || user?.subscription?.active || user?.subscription_status === 'active');

export default function DiscoveryScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('batch');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [courseFilters, setCourseFilters] = useState(COURSE_FILTERS);
  const [yearFilters, setYearFilters] = useState(years);
  const [students, setStudents] = useState<any[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string | number>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [faceSearching, setFaceSearching] = useState(false);
  const [openingYearbook, setOpeningYearbook] = useState(false);
  const [error, setError] = useState('');

  const currentMode = useMemo(() => MODE_CONFIG.find((item) => item.key === mode) || MODE_CONFIG[0], [mode]);
  const premium = hasPremium(user);

  const visibleStudents = useMemo(() => {
    if (!matchedIds.size) return students;
    return students.filter((item) => matchedIds.has(item?.id) || matchedIds.has(item?.user_id) || matchedIds.has(item?.student_id));
  }, [matchedIds, students]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const cached = await getCurrentUser();
      if (cached) {
        setUser(cached);
        setCourse((current) => current || userCourse(cached));
        setYear((current) => current || userYear(cached));
      }

      const fresh = await fetchCurrentUser();
      if (fresh) {
        setUser(fresh);
        setCourse((current) => current || userCourse(fresh));
        setYear((current) => current || userYear(fresh));
      }
    } catch {
      // Discovery can still render public results if the local session is stale.
    }
  }, []);

  const loadStudents = useCallback(async (nextPage = 1, append = false) => {
    try {
      setError('');
      if (append) setLoadingMore(true);
      else if (!refreshing) setLoading(true);

      const search = query.trim();
      const params = {
        page: nextPage,
        search,
        q: search,
        course: course || undefined,
        year: year || undefined,
      };

      const payload = mode === 'school'
        ? await getDiscoverySchool(params)
        : mode === 'cross'
          ? await getDiscoveryCrossProgram(params)
          : mode === 'section'
            ? await getDiscoverySectionmates(params)
            : await getBatchmates(params);

      const data = getPayloadList(payload);
      const meta = getPayloadMeta(payload);

      setStudents((current) => append ? [...current, ...data] : data);
      setPage(meta.currentPage);
      setLastPage(meta.lastPage);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load discovery results.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [course, mode, query, refreshing, year]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    getSearchFilters()
      .then((payload) => {
        const courses = Array.isArray(payload?.courses) ? payload.courses : payload?.data?.courses || [];
        const batchYears = Array.isArray(payload?.batch_years) ? payload.batch_years : payload?.data?.batch_years || [];

        if (courses.length) {
          setCourseFilters([
            { key: 'all', label: 'All Programs', value: '' },
            ...courses.map((item: any, index: number) => ({
              key: String(item?.value || item?.label || index),
              label: item?.label || item?.value || 'Program',
              value: item?.value || item?.label || '',
            })),
          ]);
        }

        if (batchYears.length) {
          setYearFilters(batchYears.map((item: any) => String(item)));
        }
      })
      .catch(() => {
        setCourseFilters(COURSE_FILTERS);
        setYearFilters(years);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadStudents(1), 300);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const handleFaceSearch = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access to search by face.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setFaceSearching(true);
      const asset = result.assets[0];
      const form = new FormData();
      form.append('face_image', {
        uri: asset.uri,
        name: asset.fileName || 'face-search.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const payload = await searchFace(form);
      const matches = payload?.matches || payload?.data?.matches || payload?.data || [];
      const ids = new Set((Array.isArray(matches) ? matches : []).map((match: any) => match?.user_id || match?.student_id || match?.id).filter(Boolean));

      setMatchedIds(ids);
      Alert.alert('Face search complete', ids.size ? `${ids.size} possible match${ids.size === 1 ? '' : 'es'} found.` : 'No matching profiles were found.');
    } catch (requestError: any) {
      Alert.alert('Face search failed', getErrorMessage(requestError, 'Unable to search by face.'));
    } finally {
      setFaceSearching(false);
    }
  };

  const handleOpenYearbook = async () => {
    try {
      setOpeningYearbook(true);
      const payload = await getBatches({ year: year || undefined, course: course || undefined });
      const batches = flattenBatches(payload) as any[];
      const target = batches.find((batch) => String(batch?.year || batch?.batch_year || batch?.graduation_year || batch?.name) === String(year))
        || batches[0];

      if (!target?.id) {
        Alert.alert('Yearbook not found', 'Select a batch year with an available yearbook.');
        return;
      }
      router.push({ pathname: '/yearbook', params: { batchId: String(target.id) } } as any);
    } catch (requestError: any) {
      Alert.alert('Yearbook unavailable', getErrorMessage(requestError, 'Unable to open this yearbook.'));
    } finally {
      setOpeningYearbook(false);
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <Text style={styles.eyebrow}>NATIONAL UNIVERSITY LIPA</Text>
        <Text style={styles.heroTitle}>
          Student <Text style={styles.gold}>Discovery</Text>
        </Text>
        <Text style={styles.heroCopy}>Find classmates, explore other programs, and connect with the NU Lipa community.</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.upgradePill} onPress={() => router.push('/payment' as any)}>
            <FontAwesome name="lock" size={12} color="#fdb813" />
            <Text style={styles.upgradeText}>Upgrade to Premium</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.faceHint} onPress={handleFaceSearch} disabled={faceSearching}>
            {faceSearching ? <ActivityIndicator size="small" color="#fdb813" /> : <FontAwesome name="camera" size={12} color="#fdb813" />}
            <Text style={styles.faceHintText}>Camera icon to search by face</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modePanel}>
        {MODE_CONFIG.map((item) => {
          const active = mode === item.key;
          return (
            <TouchableOpacity key={item.key} style={[styles.modeButton, active && styles.modeButtonActive]} onPress={() => { setMode(item.key); setMatchedIds(new Set()); }}>
              <FontAwesome name={item.icon as any} size={16} color={active ? '#fdb813' : '#71809c'} />
              <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{item.label}</Text>
              <Text style={[styles.modeHint, active && styles.modeHintActive]}>{item.hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIcon}>
          <FontAwesome name={currentMode.icon as any} size={17} color="#fdb813" />
        </View>
        <View>
          <Text style={styles.sectionTitle}>{currentMode.label}</Text>
          <Text style={styles.sectionSubtitle}>{currentMode.hint}</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={15} color="#8fa0bf" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, student no..."
            placeholderTextColor="#8fa0bf"
            value={query}
            onChangeText={(text) => { setQuery(text); setMatchedIds(new Set()); }}
          />
          <TouchableOpacity style={styles.cameraButton} onPress={handleFaceSearch} disabled={faceSearching}>
            {faceSearching ? <ActivityIndicator color="#fdb813" size="small" /> : <FontAwesome name="camera" size={14} color="#fdb813" />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.discoveryFilters}>
        <FilterDropdown
          label="Program"
          icon="graduation-cap"
          options={courseFilters.map((item) => ({
            label: item.label,
            value: item.value,
            icon: item.value ? 'graduation-cap' : 'users',
          }))}
          value={course}
          onChange={(value) => {
            setCourse(value);
            setMatchedIds(new Set());
          }}
        />
        <FilterDropdown
          label="Year"
          icon="calendar"
          options={[
            { label: 'All Years', value: '', icon: 'calendar' },
            ...yearFilters.map((item) => ({ label: item, value: item, icon: 'calendar' })),
          ]}
          value={year}
          onChange={(value) => {
            setYear(value);
            setMatchedIds(new Set());
          }}
        />
      </View>

      {mode === 'batch' && (
        <TouchableOpacity style={styles.generateButton} onPress={handleOpenYearbook} disabled={openingYearbook}>
          {openingYearbook ? <ActivityIndicator color="#fdb813" size="small" /> : <FontAwesome name="book" size={14} color="#fdb813" />}
          <Text style={styles.generateText}>Open Yearbook - Batch {year || '2026'}</Text>
        </TouchableOpacity>
      )}

      {!premium && (
        <View style={styles.premiumBanner}>
          <View style={styles.lockIcon}>
            <FontAwesome name="lock" size={20} color="#fdb813" />
          </View>
          <View style={styles.premiumCopy}>
            <Text style={styles.premiumTitle}>Unlock Full Discovery</Text>
            <Text style={styles.premiumText}>Premium sees all students, full profiles, mottos & contact info.</Text>
          </View>
          <TouchableOpacity style={styles.premiumButton} onPress={() => router.push('/payment' as any)}>
            <Text style={styles.premiumButtonText}>Upgrade</Text>
            <FontAwesome name="arrow-right" size={12} color="#102044" />
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.resultCount}>
        {visibleStudents.length} {mode === 'batch' ? 'batchmates' : 'students'} · {premium ? 'Full profiles' : 'Public profiles only'}
      </Text>
    </>
  );

  const renderStudent = ({ item }: { item: any }) => {
    const name = studentName(item);
    const photo = studentPhoto(item);
    const matched = matchedIds.has(item?.id) || matchedIds.has(item?.user_id) || matchedIds.has(item?.student_id);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push({ pathname: '/directory', params: { q: name } } as any)}
      >
        <View style={styles.cardMedia}>
          {photo ? <Image source={photo} style={styles.cardImage} contentFit="cover" /> : <Text style={styles.initials}>{initials(name)}</Text>}
          {!!studentYear(item) && (
            <View style={styles.batchBadge}>
              <FontAwesome name="graduation-cap" size={9} color="#fdb813" />
              <Text style={styles.batchBadgeText}>{studentYear(item)}</Text>
            </View>
          )}
          {matched && (
            <View style={styles.matchBadge}>
              <FontAwesome name="camera" size={9} color="#102044" />
              <Text style={styles.matchBadgeText}>Match</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.meta} numberOfLines={1}>{studentCourse(item)}</Text>
          {!!studentSection(item) && <Text style={styles.subMeta} numberOfLines={1}>{studentSection(item)}</Text>}
          {!!studentNo(item) && <Text style={styles.tag}>{studentNo(item)}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={visibleStudents}
        keyExtractor={(item, index) => String(item?.id || item?.user_id || index)}
        numColumns={2}
        columnWrapperStyle={styles.cardRow}
        ListHeaderComponent={renderHeader}
        renderItem={renderStudent}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={styles.loading} /> : (
          <View style={styles.emptyPanel}>
            <FontAwesome name="user-times" size={54} color="#dfe4ee" />
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptyText}>{error || 'No batchmates found. Check your graduation year in Profile Settings.'}</Text>
          </View>
        )}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#1d2b4b" style={{ marginVertical: 20 }} /> : null}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStudents(1); }} />}
        onEndReached={() => {
          if (!loadingMore && page < lastPage) loadStudents(page + 1, true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb' },
  content: { paddingBottom: 36 },
  hero: { minHeight: 265, backgroundColor: '#31408f', paddingHorizontal: 22, paddingTop: 58, paddingBottom: 70, alignItems: 'center', overflow: 'hidden', borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroOrb: { position: 'absolute', right: -36, top: -42, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)' },
  eyebrow: { color: '#b9c4e0', fontSize: 11, letterSpacing: 1.5, fontWeight: '900', marginBottom: 10 },
  heroTitle: { color: '#ffffff', fontSize: 33, fontWeight: '900', textAlign: 'center' },
  gold: { color: '#fdb813' },
  heroCopy: { color: '#d8dff4', fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 340, marginTop: 8 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' },
  upgradePill: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fdb813', backgroundColor: 'rgba(253,184,19,0.12)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999 },
  upgradeText: { color: '#fdb813', fontWeight: '900', fontSize: 12 },
  faceHint: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999 },
  faceHintText: { color: '#d8dff4', fontWeight: '800', fontSize: 12 },
  modePanel: { marginHorizontal: 18, marginTop: -38, backgroundColor: '#ffffff', borderRadius: 16, padding: 8, flexDirection: 'row', elevation: 8, shadowColor: '#102044', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  modeButton: { flex: 1, minHeight: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingHorizontal: 4 },
  modeButtonActive: { backgroundColor: '#1d2b4b' },
  modeLabel: { color: '#4f6081', fontSize: 11, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  modeLabelActive: { color: '#ffffff' },
  modeHint: { color: '#9aa8c0', fontSize: 9, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  modeHintActive: { color: '#cbd5ec' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 22, marginTop: 32, marginBottom: 16 },
  sectionIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: '#071b3d', fontSize: 22, fontWeight: '900' },
  sectionSubtitle: { color: '#8fa0bf', fontSize: 13, marginTop: 2 },
  toolbar: { paddingHorizontal: 22, marginBottom: 12 },
  searchContainer: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#d7dfef', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 7 },
  searchInput: { flex: 1, color: '#102044', fontSize: 14, paddingHorizontal: 10 },
  cameraButton: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#fdb813', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff8e6' },
  discoveryFilters: { paddingHorizontal: 22, gap: 10, paddingBottom: 16 },
  filterRow: { paddingHorizontal: 22, gap: 8, paddingBottom: 8 },
  yearRow: { paddingHorizontal: 22, gap: 8, paddingBottom: 16 },
  filterChip: { height: 34, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#d7dfef', backgroundColor: '#ffffff', justifyContent: 'center' },
  yearChip: { height: 34, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#d7dfef', backgroundColor: '#eef3fb', justifyContent: 'center' },
  filterChipActive: { backgroundColor: '#1d2b4b', borderColor: '#1d2b4b' },
  filterText: { color: '#516381', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#fdb813' },
  generateButton: { alignSelf: 'flex-end', marginHorizontal: 22, marginBottom: 18, height: 42, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: '#fdb813', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff' },
  generateText: { color: '#f3a900', fontWeight: '900', fontSize: 12 },
  premiumBanner: { marginHorizontal: 22, marginBottom: 22, borderRadius: 14, backgroundColor: '#263187', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  premiumCopy: { flex: 1 },
  premiumTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  premiumText: { color: '#d8dff4', fontSize: 11, lineHeight: 15, marginTop: 2 },
  premiumButton: { height: 40, borderRadius: 12, backgroundColor: '#fdb813', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  premiumButtonText: { color: '#102044', fontSize: 11, fontWeight: '900' },
  resultCount: { marginHorizontal: 22, marginBottom: 14, color: '#5d6f8f', fontSize: 13, fontWeight: '800' },
  cardRow: { paddingHorizontal: 16, gap: 12 },
  card: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: '#dfe6f2', elevation: 2, shadowColor: '#102044', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  cardMedia: { height: 140, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  cardImage: { ...StyleSheet.absoluteFillObject },
  initials: { color: '#fdb813', fontSize: 36, fontWeight: '900' },
  batchBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#1d2b4b', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  batchBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  matchBadge: { position: 'absolute', left: 10, bottom: 10, backgroundColor: '#fdb813', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchBadgeText: { color: '#102044', fontSize: 10, fontWeight: '900' },
  cardBody: { minHeight: 98, padding: 13, alignItems: 'center' },
  name: { color: '#071b3d', fontSize: 14, fontWeight: '900', textAlign: 'center', width: '100%' },
  meta: { color: '#304dba', fontSize: 11, fontWeight: '800', marginTop: 5, textAlign: 'center', width: '100%' },
  subMeta: { color: '#8fa0bf', fontSize: 10, marginTop: 3, textAlign: 'center', width: '100%' },
  tag: { marginTop: 8, backgroundColor: '#eef3ff', color: '#4657c5', fontSize: 10, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  loading: { marginTop: 42 },
  emptyPanel: { marginHorizontal: 22, minHeight: 250, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { color: '#071b3d', fontSize: 20, fontWeight: '900', marginTop: 16 },
  emptyText: { color: '#8fa0bf', textAlign: 'center', lineHeight: 20, marginTop: 8 },
});
