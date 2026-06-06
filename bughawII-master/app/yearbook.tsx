import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { addYearbookBookmark, getErrorMessage, getMobileYearbookPdfUrl, getYearbookBatches, getYearbookBookmarks, getYearbookPages, imageUrl, searchYearbook, unwrap } from '../lib/api';

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
  const { batchId: requestedBatchId } = useLocalSearchParams();
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const openBatch = useCallback(async (batch: any) => {
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
  }, []);

  const loadBatches = useCallback(async () => {
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
  }, [openBatch, refreshing, requestedBatchId, selectedBatch]);

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
    const id = batchId(selectedBatch);
    if (!id) return;

    try {
      const url = await getMobileYearbookPdfUrl(id);
      await Linking.openURL(url);
    } catch (requestError: any) {
      Alert.alert('PDF unavailable', getErrorMessage(requestError, 'Unable to open this yearbook PDF. Premium access may be required.'));
    }
  };

  const visiblePages = useMemo(() => searchResults.length ? searchResults : pages, [pages, searchResults]);

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
          <TouchableOpacity style={styles.pdfButton} onPress={openYearbookPdf}>
            <FontAwesome name="file-pdf-o" size={14} color="#fdb813" />
            <Text style={styles.pdfButtonText}>Open Premium PDF</Text>
          </TouchableOpacity>
          <FlatList
            data={visiblePages}
            keyExtractor={(item, index) => String(item?.id || item?.pageIndex || index)}
            renderItem={({ item, index }) => (
              <View style={styles.pageCard}>
                <Text style={styles.pageNumber}>PAGE {item?.pageIndex ?? item?.index ?? index + 1}</Text>
                <Text style={styles.pageTitle}>{item?.label || item?.title || item?.type || 'Yearbook Page'}</Text>
                <Text style={styles.pageExcerpt}>{item?.excerpt || item?.subtitle || item?.description || 'Open in the web flipbook for the full rendered layout.'}</Text>
                <TouchableOpacity style={styles.bookmarkButton} onPress={() => bookmarkPage(item, index)}>
                  <FontAwesome name="bookmark-o" size={14} color="#1d2b4b" />
                  <Text style={styles.bookmarkText}>Bookmark</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No flipbook pages found.</Text>}
            contentContainerStyle={styles.content}
          />
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
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  detailTitle: { color: '#1C1C1E', fontWeight: 'bold', fontSize: 18 },
  bookmarkCount: { color: '#1d2b4b', fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, backgroundColor: '#f4f7fe', borderRadius: 14, paddingHorizontal: 14, marginRight: 10 },
  searchButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  pdfButton: { marginHorizontal: 20, marginBottom: 4, minHeight: 46, borderRadius: 14, backgroundColor: '#1d2b4b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  pdfButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  pageCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 14, elevation: 2 },
  pageNumber: { color: '#8E8E93', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  pageTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  pageExcerpt: { color: '#4A4A4A', fontSize: 14, lineHeight: 20, marginTop: 8 },
  bookmarkButton: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  bookmarkText: { color: '#1d2b4b', fontWeight: 'bold', marginLeft: 8 },
});
