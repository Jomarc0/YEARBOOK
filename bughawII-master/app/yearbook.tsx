import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addYearbookBookmark, getAlumniFromYearbookPage, getAppConfig, getErrorMessage, getMobileYearbookPdfUrl, getYearbookBatches, getYearbookBookmarks, getYearbookPages, imageUrl, searchYearbook, unwrap } from '../lib/api';

const batchId = (item: any) => item?.id || item?.batch_id;
const batchTitle = (item: any) => item?.title || item?.name || `Batch ${item?.year || ''}`.trim();
const flattenBatches = (payload: any) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (!data || typeof data !== 'object') return [];
  return Object.values(data).flatMap((group: any) => Array.isArray(group) ? group : []);
};

export default function YearbookScreen() {
  const router = useRouter();
  const { batchId: requestedBatchId, pageIndex: requestedPageIndex } = useLocalSearchParams();
  const targetPageIndex = typeof requestedPageIndex === 'string' ? requestedPageIndex : '';
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerIndex, setReaderIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [appConfig, setAppConfig] = useState<any>(null);
  const features = appConfig?.features || {};
  const yearbookEnabled = features.enable_flipbook_viewer !== false && features.publish_yearbook !== false;
  const pdfEnabled = features.enable_yearbook_pdf_download !== false;
  const yearbookName = appConfig?.yearbook_name || 'Sinag-Bughaw Digital Yearbook';

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

  const openBatch = useCallback(async (batch: any) => {
    if (!yearbookEnabled) return;

    setSelectedBatch(batch);
    setPages([]);
    setBookmarks([]);
    const id = batchId(batch);
    if (!id) return;
    const [pagesPayload, bookmarksPayload] = await Promise.allSettled([
      getYearbookPages(id),
      getYearbookBookmarks(id),
    ]);
    if (pagesPayload.status === 'fulfilled') {
      const raw = unwrap(pagesPayload.value);
      setPages(Array.isArray(raw) ? raw : raw?.pages || []);
    }
    if (bookmarksPayload.status === 'fulfilled') {
      const raw = unwrap(bookmarksPayload.value);
      setBookmarks(Array.isArray(raw) ? raw : []);
    }
  }, [yearbookEnabled]);

  const loadBatches = useCallback(async () => {
    if (!yearbookEnabled) {
      setBatches([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');
      if (!refreshing) setLoading(true);
      const payload = await getYearbookBatches();
      const nextBatches = flattenBatches(payload);
      setBatches(nextBatches);
      if (requestedBatchId && !selectedBatch) {
        const target = nextBatches.find((item: any) => String(batchId(item)) === String(requestedBatchId));
        if (target) openBatch(target);
      }
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load yearbooks.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [openBatch, refreshing, requestedBatchId, selectedBatch, yearbookEnabled]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const runSearch = async () => {
    if (!selectedBatch || !query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const payload = await searchYearbook(batchId(selectedBatch), query.trim());
      const data = unwrap(payload);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (requestError: any) {
      Alert.alert('Search failed', getErrorMessage(requestError, 'Unable to search this yearbook.'));
    }
  };

  const bookmarkPage = async (page: any, index: number) => {
    if (!selectedBatch) return;
    try {
      await addYearbookBookmark({
        batch_id: batchId(selectedBatch),
        page_index: page?.pageIndex ?? page?.index ?? index,
        label: page?.label || page?.title || `Page ${index + 1}`,
      });
      const payload = await getYearbookBookmarks(batchId(selectedBatch));
      const data = unwrap(payload);
      setBookmarks(Array.isArray(data) ? data : []);
      Alert.alert('Bookmarked', 'This page was added to your yearbook bookmarks.');
    } catch (requestError: any) {
      Alert.alert('Bookmark failed', getErrorMessage(requestError, 'Unable to bookmark this page.'));
    }
  };

  const openYearbookPdf = async () => {
    if (!pdfEnabled) {
      Alert.alert('PDF disabled', 'Yearbook PDF downloads are currently disabled by platform settings.');
      return;
    }

    const id = batchId(selectedBatch);
    if (!id) return;

    try {
      const url = await getMobileYearbookPdfUrl(id);
      await Linking.openURL(url);
    } catch (requestError: any) {
      Alert.alert('PDF unavailable', getErrorMessage(requestError, 'Unable to open this yearbook PDF. Premium access may be required.'));
    }
  };

  const openLinkedAlumni = async (page: any, index: number) => {
    const id = batchId(selectedBatch);
    if (!id) return;
    const resolvedPageIndex = page?.pageIndex ?? page?.index ?? index;

    try {
      const payload = await getAlumniFromYearbookPage(id, resolvedPageIndex);
      const linked = unwrap(payload);
      const alumniId = linked?.alumni_id || linked?.user_id || linked?.id;
      if (!alumniId) throw new Error('No alumni linked to this page.');
      router.push({
        pathname: '/alumni',
        params: {
          batchId: String(id),
          highlight: String(alumniId),
        },
      } as any);
    } catch (requestError: any) {
      Alert.alert('No linked alumni', getErrorMessage(requestError, 'No alumni profile is linked to this yearbook page yet.'));
    }
  };

  const visiblePages = useMemo(() => searchResults.length ? searchResults : pages, [pages, searchResults]);
  const activePage = visiblePages[Math.max(0, Math.min(readerIndex, visiblePages.length - 1))];
  const pageLabel = (page: any, index: number) => page?.label || page?.title || page?.type || `Page ${index + 1}`;
  const pageNumber = (page: any, index: number) => page?.pageIndex ?? page?.index ?? index + 1;
  const openReader = (index: number) => {
    setReaderIndex(index);
    setReaderOpen(true);
  };
  const goPage = (direction: 1 | -1) => {
    setReaderIndex((current) => Math.max(0, Math.min(current + direction, visiblePages.length - 1)));
  };

  if (!yearbookEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.unavailableWrap}>
          <View style={styles.unavailableIcon}>
            <FontAwesome name="book" size={24} color="#fdb813" />
          </View>
          <Text style={styles.unavailableTitle}>Yearbook Unavailable</Text>
          <Text style={styles.unavailableText}>
            The digital yearbook is not published yet or the flipbook viewer is disabled.
          </Text>
          <TouchableOpacity style={styles.unavailableButton} onPress={() => router.replace('/(tabs)/home' as any)}>
            <FontAwesome name="home" size={14} color="#1d2b4b" />
            <Text style={styles.unavailableButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yearbook</Text>
      </View>

      <FlatList
        data={batches}
        keyExtractor={(item, index) => String(batchId(item) || index)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.batchCard} onPress={() => openBatch(item)}>
            {imageUrl(item?.coverUrl || item?.cover_url || item?.cover) ? <Image source={imageUrl(item?.coverUrl || item?.cover_url || item?.cover)} style={styles.cover} /> : <View style={styles.coverFallback}><FontAwesome name="book" size={24} color="#fdb813" /></View>}
            <View style={styles.info}>
              <Text style={styles.title}>{batchTitle(item)}</Text>
              <Text style={styles.meta}>{item?.school_year || item?.year || item?.status || 'Flipbook pages'}</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#C7C7CC" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" /> : <Text style={styles.emptyText}>{error || 'No yearbooks found.'}</Text>}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBatches(); }} />}
      />

      <Modal visible={!!selectedBatch} animationType="slide" onRequestClose={() => setSelectedBatch(null)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedBatch(null)}>
              <FontAwesome name="chevron-left" size={20} color="#1d2b4b" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{batchTitle(selectedBatch)}</Text>
            <Text style={styles.bookmarkCount}>{bookmarks.length}</Text>
          </View>
          <View style={styles.searchRow}>
            <TextInput style={styles.searchInput} placeholder="Search flipbook..." value={query} onChangeText={setQuery} onSubmitEditing={runSearch} />
            <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
              <FontAwesome name="search" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {pdfEnabled ? (
            <TouchableOpacity style={styles.pdfButton} onPress={openYearbookPdf}>
              <FontAwesome name="file-pdf-o" size={14} color="#fdb813" />
              <Text style={styles.pdfButtonText}>Open Premium PDF</Text>
            </TouchableOpacity>
          ) : null}
          <FlatList
            data={visiblePages}
            keyExtractor={(item, index) => String(item?.id || item?.pageIndex || index)}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={[styles.pageCard, targetPageIndex && String(item?.pageIndex ?? item?.index ?? index) === targetPageIndex && styles.pageCardHighlighted]} onPress={() => openReader(index)} activeOpacity={0.88}>
                <Text style={styles.pageNumber}>PAGE {pageNumber(item, index)}</Text>
                <Text style={styles.pageTitle}>{pageLabel(item, index)}</Text>
                <Text style={styles.pageExcerpt}>{item?.excerpt || item?.subtitle || item?.description || 'Open in the web flipbook for the full rendered layout.'}</Text>
                <TouchableOpacity style={styles.bookmarkButton} onPress={() => bookmarkPage(item, index)}>
                  <FontAwesome name="bookmark-o" size={14} color="#1d2b4b" />
                  <Text style={styles.bookmarkText}>Bookmark</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.alumniButton} onPress={() => openLinkedAlumni(item, index)}>
                  <FontAwesome name="users" size={14} color="#92590e" />
                  <Text style={styles.alumniButtonText}>Find Alumni</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No flipbook pages found.</Text>}
            contentContainerStyle={styles.content}
          />

          <Modal visible={readerOpen} animationType="slide" onRequestClose={() => setReaderOpen(false)}>
            <SafeAreaView style={styles.readerContainer}>
              <StatusBar style="light" />
              <View style={styles.readerHeader}>
                <TouchableOpacity style={styles.readerIconButton} onPress={() => setReaderOpen(false)}>
                  <FontAwesome name="chevron-left" size={18} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.readerTitleWrap}>
                  <Text style={styles.readerKicker}>PAGE {activePage ? pageNumber(activePage, readerIndex) : '-'}</Text>
                  <Text style={styles.readerTitle} numberOfLines={1}>{activePage ? pageLabel(activePage, readerIndex) : 'Yearbook Page'}</Text>
                </View>
                <TouchableOpacity style={styles.readerIconButton} onPress={() => activePage && bookmarkPage(activePage, readerIndex)}>
                  <FontAwesome name="bookmark-o" size={17} color="#fdb813" />
                </TouchableOpacity>
              </View>

              <View style={styles.readerPage}>
                <View style={styles.readerPaper}>
                  <Text style={styles.readerPageNumber}>{yearbookName}</Text>
                  <Text style={styles.readerPageTitle}>{activePage ? pageLabel(activePage, readerIndex) : 'Page'}</Text>
                  <Text style={styles.readerBody}>
                    {activePage?.excerpt || activePage?.subtitle || activePage?.description || activePage?.content || 'This mobile reader presents the flipbook page content in a phone-friendly format. Open the PDF for the full rendered spread.'}
                  </Text>
                  {activePage?.students?.length ? (
                    <View style={styles.readerChips}>
                      {activePage.students.slice(0, 8).map((student: any, index: number) => (
                        <Text key={String(student?.id || index)} style={styles.readerChip}>{student?.name || student?.full_name || 'Student'}</Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.readerControls}>
                <TouchableOpacity style={[styles.readerNavButton, readerIndex <= 0 && styles.readerNavDisabled]} onPress={() => goPage(-1)} disabled={readerIndex <= 0}>
                  <FontAwesome name="chevron-left" size={14} color="#1d2b4b" />
                  <Text style={styles.readerNavText}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.readerProgress}>{visiblePages.length ? `${readerIndex + 1} / ${visiblePages.length}` : '0 / 0'}</Text>
                <TouchableOpacity style={[styles.readerNavButton, readerIndex >= visiblePages.length - 1 && styles.readerNavDisabled]} onPress={() => goPage(1)} disabled={readerIndex >= visiblePages.length - 1}>
                  <Text style={styles.readerNavText}>Next</Text>
                  <FontAwesome name="chevron-right" size={14} color="#1d2b4b" />
                </TouchableOpacity>
              </View>

              {pdfEnabled ? (
                <TouchableOpacity style={styles.readerPdfButton} onPress={openYearbookPdf}>
                  <FontAwesome name="file-pdf-o" size={14} color="#1d2b4b" />
                  <Text style={styles.readerPdfText}>Open Full PDF</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.readerAlumniButton} onPress={() => activePage && openLinkedAlumni(activePage, readerIndex)}>
                <FontAwesome name="users" size={14} color="#fdb813" />
                <Text style={styles.readerAlumniText}>Open Linked Alumni</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: { backgroundColor: '#1d2b4b', paddingHorizontal: 24, paddingVertical: 20 },
  headerTitle: { color: '#fdb813', fontSize: 24, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  batchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, elevation: 2 },
  cover: { width: 58, height: 76, borderRadius: 10, marginRight: 14 },
  coverFallback: { width: 58, height: 76, borderRadius: 10, marginRight: 14, backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  title: { color: '#1C1C1E', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#8E8E93', marginTop: 3, fontSize: 13 },
  emptyText: { color: '#8E8E93', textAlign: 'center', padding: 24 },
  unavailableWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  unavailableIcon: { width: 66, height: 66, borderRadius: 20, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  unavailableTitle: { color: '#1d2b4b', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  unavailableText: { color: '#64748b', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  unavailableButton: { minHeight: 46, borderRadius: 14, backgroundColor: '#fdb813', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  unavailableButtonText: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  detailTitle: { color: '#1C1C1E', fontWeight: 'bold', fontSize: 18 },
  bookmarkCount: { color: '#1d2b4b', fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, backgroundColor: '#f4f7fe', borderRadius: 14, paddingHorizontal: 14, marginRight: 10 },
  searchButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  pdfButton: { marginHorizontal: 20, marginBottom: 4, minHeight: 46, borderRadius: 14, backgroundColor: '#1d2b4b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  pdfButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  pageCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 14, elevation: 2 },
  pageCardHighlighted: { borderWidth: 2, borderColor: '#fdb813' },
  pageNumber: { color: '#8E8E93', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  pageTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  pageExcerpt: { color: '#4A4A4A', fontSize: 14, lineHeight: 20, marginTop: 8 },
  bookmarkButton: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  bookmarkText: { color: '#1d2b4b', fontWeight: 'bold', marginLeft: 8 },
  alumniButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderRadius: 12, backgroundColor: 'rgba(253,184,19,0.14)', borderWidth: 1, borderColor: 'rgba(253,184,19,0.28)', paddingHorizontal: 12, paddingVertical: 9 },
  alumniButtonText: { color: '#92590e', fontSize: 12, fontWeight: '900' },
  readerContainer: { flex: 1, backgroundColor: '#1d2b4b' },
  readerHeader: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  readerIconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  readerTitleWrap: { flex: 1, minWidth: 0 },
  readerKicker: { color: '#fdb813', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  readerTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900', marginTop: 2 },
  readerPage: { flex: 1, padding: 18, justifyContent: 'center' },
  readerPaper: { minHeight: '78%', borderRadius: 22, backgroundColor: '#ffffff', padding: 24, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  readerPageNumber: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  readerPageTitle: { color: '#1d2b4b', fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 14 },
  readerBody: { color: '#475569', fontSize: 15, lineHeight: 24, marginTop: 16 },
  readerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  readerChip: { color: '#3f51b5', backgroundColor: '#eef2ff', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '900' },
  readerControls: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingBottom: 12 },
  readerNavButton: { flex: 1, height: 46, borderRadius: 14, backgroundColor: '#fdb813', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  readerNavDisabled: { opacity: 0.45 },
  readerNavText: { color: '#1d2b4b', fontSize: 12, fontWeight: '900' },
  readerProgress: { minWidth: 58, textAlign: 'center', color: '#ffffff', fontSize: 12, fontWeight: '900' },
  readerPdfButton: { marginHorizontal: 18, marginBottom: 18, height: 46, borderRadius: 14, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  readerPdfText: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  readerAlumniButton: { marginHorizontal: 18, marginBottom: 18, height: 46, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(253,184,19,0.34)', backgroundColor: 'rgba(253,184,19,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  readerAlumniText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});
