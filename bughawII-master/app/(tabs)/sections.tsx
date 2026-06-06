import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { generateYearbook, getBatches, getErrorMessage, getSections, unwrap } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterDropdown from '../../components/FilterDropdown';

const COURSE_FILTERS = [
  { label: 'All Programs', value: 'All Programs' },
  { label: 'BS Architecture', value: 'Bachelor of Science in Architecture' },
  { label: 'BS Civil Engineering', value: 'Bachelor of Science in Civil Engineering' },
  { label: 'BS Computer Science', value: 'Bachelor of Science in Computer Science' },
  { label: 'BS Information Technology', value: 'Bachelor of Science in Information Technology' },
  { label: 'BS Nursing', value: 'Bachelor of Science in Nursing' },
  { label: 'BS Medical Technology', value: 'Bachelor of Science in Medical Technology' },
  { label: 'BS Psychology', value: 'Bachelor of Science in Psychology' },
  { label: 'BS Accountancy', value: 'Bachelor of Science in Accountancy' },
  { label: 'BSBA Financial Management', value: 'Bachelor of Science in Business Administration - Financial Management' },
  { label: 'BSBA Marketing Management', value: 'Bachelor of Science in Business Administration - Marketing Management' },
  { label: 'BS Tourism Management', value: 'Bachelor of Science in Tourism Management' },
  { label: 'ABM', value: 'ABM' },
  { label: 'STEM', value: 'STEM' },
  { label: 'HUMSS', value: 'HUMSS' },
];

const sectionId = (section: any) => section?.id || section?.section_id;
const sectionName = (section: any) => section?.name || section?.title || section?.section || 'Section';
const sectionCourse = (section: any) => section?.course || section?.program || section?.batch?.course || 'Academic section';
const sectionYear = (section: any) => section?.batch?.graduation_year || section?.graduation_year || section?.year || '2025';
const sectionCount = (section: any) => section?.students_count ?? section?.student_count ?? section?.students?.length ?? 0;
const batchId = (batch: any) => batch?.id || batch?.batch_id;
const batchYear = (batch: any) => batch?.graduation_year || batch?.year || batch?.name || 'Batch';
const batchCourse = (batch: any) => batch?.course || batch?.department || 'Graduation batch';
const batchStudents = (batch: any) => batch?.students_count ?? batch?.student_count ?? batch?.total_students ?? 0;
const batchSections = (batch: any) => batch?.sections || [];

const flattenBatches = (payload: any) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  return Object.values(data).flatMap((group: any) => Array.isArray(group) ? group : []);
};

export default function SectionsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'sections' | 'batches'>('sections');
  const [sections, setSections] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState('All Programs');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [generatingId, setGeneratingId] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const [sectionPayload, batchPayload] = await Promise.all([getSections(), getBatches()]);
      const nextSections = unwrap(sectionPayload);
      setSections(Array.isArray(nextSections) ? nextSections : []);
      setBatches(flattenBatches(batchPayload));
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load sections and batches.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections.filter((section) => {
      const byCourse = activeCourse === 'All Programs' || sectionCourse(section) === activeCourse;
      const text = `${sectionName(section)} ${sectionCourse(section)} ${sectionYear(section)}`.toLowerCase();
      return byCourse && (!q || text.includes(q));
    });
  }, [activeCourse, query, sections]);

  const filteredBatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches.filter((batch) => {
      const byCourse = activeCourse === 'All Programs' || batch?.course === activeCourse;
      const text = `${batchYear(batch)} ${batchCourse(batch)} ${batch?.department || ''}`.toLowerCase();
      return byCourse && (!q || text.includes(q));
    });
  }, [activeCourse, batches, query]);

  const handleGenerate = async (batch: any) => {
    const id = batchId(batch);
    if (!id) return;
    try {
      setGeneratingId(id);
      const response = await generateYearbook(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Generate Yearbook', response?.message || `Yearbook ${batchYear(batch)} generation queued.`);
    } catch (requestError: any) {
      Alert.alert('Generate failed', getErrorMessage(requestError, 'Unable to generate this yearbook. Admin access may be required.'));
    } finally {
      setGeneratingId(null);
    }
  };

  const renderSection = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.sectionCard}
      activeOpacity={0.9}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/directory', params: { filter: sectionName(item) } });
      }}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.iconBox}>
          <FontAwesome name="stack-overflow" size={16} color="#3f51b5" />
        </View>
        <View style={styles.yearPill}>
          <Text style={styles.yearPillText}>{sectionYear(item)}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>Section {sectionName(item)}</Text>
      <Text style={styles.cardCourse} numberOfLines={2}>{sectionCourse(item)}</Text>
      <Text style={styles.cardYear}>{sectionYear(item)}</Text>
      <View style={styles.countRow}>
        <FontAwesome name="users" size={13} color="#fdb813" />
        <Text style={styles.countText}>{sectionCount(item)} students</Text>
      </View>
    </TouchableOpacity>
  );

  const renderBatch = ({ item }: { item: any }) => {
    const id = batchId(item);
    const sectionsList = batchSections(item);
    const shownSections = sectionsList.slice(0, 3);
    const extra = Math.max(sectionsList.length - shownSections.length, 0);

    return (
      <View style={styles.batchCard}>
        <View style={styles.batchTop}>
          <View style={styles.batchIcon}>
            <FontAwesome name="institution" size={15} color="#fdb813" />
          </View>
          <View style={styles.batchCountPill}>
            <Text style={styles.batchCountText}>{sectionsList.length || item?.sections_count || 0} sections</Text>
          </View>
        </View>
        <View style={styles.batchTitleRow}>
          <Text style={styles.batchTitle}>{batchYear(item)}</Text>
          <Text style={styles.batchYearGold}>{batchYear(item)}</Text>
        </View>
        <View style={styles.countRow}>
          <FontAwesome name="users" size={13} color="#64748b" />
          <Text style={styles.countText}>{batchStudents(item)} students</Text>
        </View>
        <View style={styles.sectionsPreview}>
          <View style={styles.previewHeader}>
            <FontAwesome name="stack-overflow" size={12} color="#fdb813" />
            <Text style={styles.previewHeaderText}>{sectionsList.length || item?.sections_count || 0} sections</Text>
          </View>
          <View style={styles.sectionChips}>
            {shownSections.map((section: any) => (
              <View key={section.id || section.name} style={styles.sectionChip}>
                <Text style={styles.sectionChipText}>{section.name || sectionName(section)}</Text>
              </View>
            ))}
            {extra > 0 ? (
              <View style={styles.moreChip}>
                <Text style={styles.moreChipText}>+{extra} more</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.batchmateButton}
          onPress={() => router.push({ pathname: '/directory', params: { batch: String(id || batchYear(item)) } } as any)}
        >
          <Text style={styles.batchmateText}>View Batchmates →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewYearbookButton}
          onPress={() => router.push({ pathname: '/yearbook', params: { batchId: String(id) } } as any)}
          disabled={!id}
        >
          <FontAwesome name="eye" size={12} color="#1d2b4b" />
          <Text style={styles.viewYearbookText}>View Yearbook</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => handleGenerate(item)}
          disabled={generatingId === id}
        >
          {generatingId === id ? <ActivityIndicator color="#fdb813" size="small" /> : <FontAwesome name="book" size={12} color="#fdb813" />}
          <Text style={styles.generateText}>{generatingId === id ? 'Generating...' : `Generate Yearbook · ${batchYear(item)}`}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const data = mode === 'sections' ? filteredSections : filteredBatches;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={data}
        keyExtractor={(item, index) => String((mode === 'sections' ? sectionId(item) : batchId(item)) || index)}
        renderItem={mode === 'sections' ? renderSection : renderBatch}
        numColumns={2}
        columnWrapperStyle={mode === 'sections' ? styles.columnWrapper : undefined}
        ListHeaderComponent={(
          <>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Sections & <Text style={styles.heroGold}>Batches</Text></Text>
              <Text style={styles.heroSubtitle}>Browse academic sections and graduation batches.</Text>
              <View style={styles.searchShell}>
                <FontAwesome name="search" size={15} color="#fdb813" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search sections, courses, students..."
                  placeholderTextColor="rgba(255,255,255,0.48)"
                  value={query}
                  onChangeText={setQuery}
                />
                <View style={styles.searchCamera}>
                  <FontAwesome name="camera" size={14} color="#fdb813" />
                </View>
              </View>
              <View style={styles.modeSwitch}>
                <TouchableOpacity style={[styles.modeButton, mode === 'sections' && styles.modeActive]} onPress={() => setMode('sections')}>
                  <FontAwesome name="stack-overflow" size={13} color={mode === 'sections' ? '#1d2b4b' : 'rgba(255,255,255,0.65)'} />
                  <Text style={[styles.modeText, mode === 'sections' && styles.modeTextActive]}>Sections</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, mode === 'batches' && styles.modeActive]} onPress={() => setMode('batches')}>
                  <FontAwesome name="graduation-cap" size={13} color={mode === 'batches' ? '#1d2b4b' : 'rgba(255,255,255,0.65)'} />
                  <Text style={[styles.modeText, mode === 'batches' && styles.modeTextActive]}>Batches</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.filterSelectWrap}>
              <FilterDropdown
                label="Program"
                icon="graduation-cap"
                options={COURSE_FILTERS.map((item) => ({
                  ...item,
                  icon: item.value === 'All Programs' ? 'users' : 'graduation-cap',
                }))}
                value={activeCourse}
                onChange={setActiveCourse}
              />
            </View>
            {mode === 'batches' ? (
              <View style={styles.batchSummary}>
                <View style={styles.batchSummaryIcon}>
                  <FontAwesome name="institution" size={15} color="#fdb813" />
                </View>
                <Text style={styles.batchSummaryText}>{filteredBatches.length} batch{filteredBatches.length === 1 ? '' : 'es'}</Text>
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={{ marginTop: 34 }} /> : (
          <View style={styles.emptyPanel}>
            <FontAwesome name={mode === 'sections' ? 'stack-overflow' : 'graduation-cap'} size={38} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No {mode === 'sections' ? 'Sections' : 'Batches'} Found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
          </View>
        )}
        ListFooterComponent={<View style={{ height: 110 }} />}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  scrollContent: { paddingBottom: 0 },
  hero: { backgroundColor: '#34479b', paddingTop: 70, paddingHorizontal: 22, paddingBottom: 58, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, alignItems: 'center' },
  heroTitle: { color: '#ffffff', fontSize: 34, fontWeight: '900', textAlign: 'center' },
  heroGold: { color: '#fdb813' },
  heroSubtitle: { color: 'rgba(255,255,255,0.76)', fontSize: 15, marginTop: 8, marginBottom: 22, textAlign: 'center' },
  searchShell: { width: '100%', minHeight: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', flexDirection: 'row', alignItems: 'center', paddingLeft: 14, marginBottom: 26 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 14, marginLeft: 12 },
  searchCamera: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#fdb813', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  modeSwitch: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 5 },
  modeButton: { flexDirection: 'row', alignItems: 'center', minWidth: 118, justifyContent: 'center', paddingVertical: 12, borderRadius: 13 },
  modeActive: { backgroundColor: '#ffffff' },
  modeText: { color: 'rgba(255,255,255,0.7)', fontWeight: '900', marginLeft: 8 },
  modeTextActive: { color: '#1d2b4b' },
  filterSelectWrap: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 18 },
  filterContent: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 30, paddingBottom: 22 },
  filterPill: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dbe3ef', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10 },
  filterActive: { backgroundColor: '#1d2b4b', borderColor: '#1d2b4b' },
  filterText: { color: '#475569', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#ffffff' },
  columnWrapper: { paddingHorizontal: 14, gap: 12 },
  sectionCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#dbe3ef', padding: 18, marginBottom: 14, minHeight: 218 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  yearPill: { backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 },
  yearPillText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  cardTitle: { color: '#1d2b4b', fontSize: 18, lineHeight: 22, fontWeight: '900', marginBottom: 6 },
  cardCourse: { color: '#1d39c4', fontSize: 12, fontWeight: '700', minHeight: 30 },
  cardYear: { color: '#94a3b8', fontSize: 12, marginTop: 8, marginBottom: 12 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  countText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  batchSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, marginBottom: 18 },
  batchSummaryIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  batchSummaryText: { color: '#64748b', fontSize: 13, fontWeight: '900', backgroundColor: '#eef2ff', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  batchCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#dbe3ef', marginHorizontal: 22, marginBottom: 18, padding: 18 },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  batchIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  batchCountPill: { backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 },
  batchCountText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  batchTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  batchTitle: { color: '#1d2b4b', fontSize: 20, fontWeight: '900' },
  batchYearGold: { color: '#fdb813', fontSize: 23, fontWeight: '900' },
  sectionsPreview: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginTop: 12 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  previewHeaderText: { color: '#475569', fontSize: 12, fontWeight: '900', marginLeft: 6 },
  sectionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  sectionChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  sectionChipText: { color: '#3f51b5', fontSize: 10, fontWeight: '800' },
  moreChip: { backgroundColor: '#1d2b4b', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  moreChipText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  batchmateButton: { alignSelf: 'flex-start', backgroundColor: '#eef2ff', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, marginBottom: 12 },
  batchmateText: { color: '#3f51b5', fontSize: 12, fontWeight: '900' },
  viewYearbookButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fdb813', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, marginBottom: 12 },
  viewYearbookText: { color: '#1d2b4b', fontSize: 12, fontWeight: '900' },
  generateButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1d2b4b', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  generateText: { color: '#fdb813', fontSize: 12, fontWeight: '900' },
  errorText: { color: '#dc2626', textAlign: 'center', marginBottom: 14 },
  emptyPanel: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 54, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 18, fontWeight: '900', marginTop: 16 },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center', marginTop: 6 },
});
