import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import {
  deleteTranscript,
  getErrorMessage,
  getTranscript,
  getTranscriptSubtitles,
  getTranscripts,
  paginationMeta,
  regenerateTranscriptNotes,
  uploadTranscript,
  unwrap,
} from '../lib/api';

const STATUS = {
  done: { label: 'Ready', color: '#059669', bg: '#ecfdf5', icon: 'check' },
  processing: { label: 'Processing', color: '#ca8a04', bg: '#fefce8', icon: 'spinner' },
  failed: { label: 'Failed', color: '#dc2626', bg: '#fef2f2', icon: 'times' },
  pending: { label: 'Pending', color: '#64748b', bg: '#f1f5f9', icon: 'clock-o' },
};

const transcriptText = (item: any) => item?.transcript_text || item?.transcript || item?.text || item?.content || '';
const notesText = (item: any) => item?.notes || item?.ai_notes || item?.summary || '';
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'done', label: 'Ready' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed', label: 'Failed' },
];

export default function TranscriptsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'transcript' | 'notes'>('transcript');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const hasProcessing = useMemo(() => items.some((item) => ['pending', 'processing'].includes(item?.status)), [items]);
  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items;
    if (statusFilter === 'processing') return items.filter((item) => ['pending', 'processing'].includes(item?.status));
    return items.filter((item) => item?.status === statusFilter);
  }, [items, statusFilter]);
  const summary = useMemo(() => ({
    total: items.length,
    ready: items.filter((item) => item?.status === 'done').length,
    processing: items.filter((item) => ['pending', 'processing'].includes(item?.status)).length,
    failed: items.filter((item) => item?.status === 'failed').length,
  }), [items]);

  const loadTranscripts = useCallback(async (nextPage = 1, append = false) => {
    try {
      setError('');
      if (append) setLoadingMore(true);
      else if (!refreshing) setLoading(true);

      const payload = await getTranscripts({ page: nextPage, q: query.trim() || undefined });
      const data = unwrap(payload);
      const meta = paginationMeta(payload);
      setItems((current) => append ? [...current, ...(Array.isArray(data) ? data : [])] : (Array.isArray(data) ? data : []));
      setPage(meta.currentPage);
      setLastPage(meta.lastPage);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load transcripts.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [query, refreshing]);

  useEffect(() => {
    const timer = setTimeout(() => loadTranscripts(1), 300);
    return () => clearTimeout(timer);
  }, [loadTranscripts]);

  useEffect(() => {
    if (!hasProcessing) return undefined;
    const timer = setInterval(() => loadTranscripts(1), 5000);
    return () => clearInterval(timer);
  }, [hasProcessing, loadTranscripts]);

  const openTranscript = async (item: any) => {
    setSelected(item);
    setDetailTab('transcript');
    try {
      const payload = await getTranscript(item.id);
      setSelected({ ...item, ...unwrap(payload) });
    } catch (requestError: any) {
      Alert.alert('Transcript unavailable', getErrorMessage(requestError, 'Unable to load this transcript.'));
    }
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*', 'video/mp4', 'video/webm'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadFile(asset);
    if (!uploadTitle.trim()) {
      setUploadTitle(asset.name?.replace(/\.[^/.]+$/, '') || 'Graduation Speech');
    }
  };

  const submitUpload = async () => {
    if (!uploadTitle.trim()) {
      Alert.alert('Title required', 'Please enter a title for this transcript.');
      return;
    }
    if (!uploadFile?.uri) {
      Alert.alert('Audio required', 'Please select an audio file first.');
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append('title', uploadTitle.trim());
      data.append('audio', {
        uri: uploadFile.uri,
        name: uploadFile.name || 'speech.m4a',
        type: uploadFile.mimeType || 'audio/mpeg',
      } as any);

      await uploadTranscript(data);
      setUploadOpen(false);
      setUploadTitle('');
      setUploadFile(null);
      await loadTranscripts(1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Uploaded', 'Your audio was queued for transcription.');
    } catch (requestError: any) {
      Alert.alert('Upload failed', getErrorMessage(requestError, 'Check the file type and size, then try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRegenerateNotes = async () => {
    if (!selected?.id) return;
    try {
      const payload = await regenerateTranscriptNotes(selected.id);
      setSelected((current: any) => ({ ...current, notes: unwrap(payload)?.notes || payload?.notes || current?.notes }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Notes updated', 'AI speech notes were regenerated.');
    } catch (requestError: any) {
      Alert.alert('Request failed', getErrorMessage(requestError, 'Unable to regenerate notes.'));
    }
  };

  const shareTranscriptText = async () => {
    const text = transcriptText(selected);
    if (!text) {
      Alert.alert('Transcript unavailable', 'There is no transcript text to share yet.');
      return;
    }

    await Share.share({
      title: selected?.title || 'Transcript',
      message: text,
    });
  };

  const shareSubtitles = async (format: 'srt' | 'vtt') => {
    if (!selected?.id) return;

    try {
      const subtitles = await getTranscriptSubtitles(selected.id, format);
      await Share.share({
        title: `${selected?.title || 'Transcript'} ${format.toUpperCase()}`,
        message: String(subtitles || ''),
      });
    } catch (requestError: any) {
      Alert.alert('Subtitle unavailable', getErrorMessage(requestError, `Unable to load ${format.toUpperCase()} subtitles.`));
    }
  };

  const confirmDelete = (item = selected) => {
    if (!item?.id) return;
    Alert.alert('Delete transcript?', 'This removes the transcript and its uploaded audio.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTranscript(item.id);
            setSelected(null);
            await loadTranscripts(1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch (requestError: any) {
            Alert.alert('Delete failed', getErrorMessage(requestError, 'Unable to delete this transcript.'));
          }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.summaryRow}>
        <SummaryTile label="Total" value={summary.total} icon="files-o" />
        <SummaryTile label="Ready" value={summary.ready} icon="check" />
        <SummaryTile label="Working" value={summary.processing} icon="spinner" />
        <SummaryTile label="Failed" value={summary.failed} icon="warning" />
      </View>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search speeches, transcripts, notes..." placeholderTextColor="#94a3b8" value={query} onChangeText={setQuery} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {STATUS_FILTERS.map((item) => {
          const active = statusFilter === item.key;
          return (
            <TouchableOpacity key={item.key} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setStatusFilter(item.key)}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={styles.uploadButton} onPress={() => setUploadOpen(true)}>
        <FontAwesome name="microphone" size={14} color="#fdb813" />
        <Text style={styles.uploadButtonText}>Upload Speech Audio</Text>
      </TouchableOpacity>
      {hasProcessing ? <Text style={styles.processingHint}>Processing transcripts refresh automatically.</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SINAG-BUGHAW</Text>
        <Text style={styles.headerTitle}>Speech Transcripts</Text>
        <Text style={styles.headerText}>Upload audio and read AI-generated transcript notes.</Text>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item, index) => String(item?.id || index)}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <TranscriptCard item={item} onPress={() => openTranscript(item)} onDelete={() => confirmDelete(item)} />}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={{ marginTop: 30 }} /> : <Text style={styles.emptyText}>{error || 'No transcripts found.'}</Text>}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#1d2b4b" style={{ marginVertical: 20 }} /> : null}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTranscripts(1); }} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loadingMore && page < lastPage) loadTranscripts(page + 1, true);
        }}
      />

      <Modal visible={uploadOpen} animationType="slide" onRequestClose={() => setUploadOpen(false)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setUploadOpen(false)}>
              <FontAwesome name="chevron-left" size={20} color="#1d2b4b" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Upload Audio</Text>
            <View style={{ width: 20 }} />
          </View>
          <View style={styles.uploadBody}>
            <Text style={styles.inputLabel}>SPEECH TITLE</Text>
            <TextInput style={styles.input} value={uploadTitle} onChangeText={setUploadTitle} placeholder="Graduation speech title" />
            <TouchableOpacity style={styles.filePicker} onPress={pickAudio}>
              <FontAwesome name="file-audio-o" size={22} color="#fdb813" />
              <View style={{ flex: 1 }}>
                <Text style={styles.fileTitle}>{uploadFile?.name || 'Choose audio file'}</Text>
                <Text style={styles.fileMeta}>MP3, WAV, M4A, OGG, FLAC, WEBM, MP4 up to 25 MB</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={submitUpload} disabled={uploading}>
              <Text style={styles.saveButtonText}>{uploading ? 'Uploading...' : 'Queue Transcription'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <FontAwesome name="chevron-left" size={20} color="#1d2b4b" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Transcript</Text>
            <TouchableOpacity onPress={() => confirmDelete()}>
              <FontAwesome name="trash" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.detailContent}>
            <StatusBadge status={selected?.status} />
            <Text style={styles.titleLarge}>{selected?.title || selected?.filename || 'Transcript'}</Text>
            <View style={styles.metaPills}>
              {selected?.language ? <MetaPill icon="globe" text={String(selected.language).toUpperCase()} /> : null}
              {selected?.duration_formatted ? <MetaPill icon="clock-o" text={selected.duration_formatted} /> : null}
              {selected?.word_count ? <MetaPill icon="align-left" text={`${Number(selected.word_count).toLocaleString()} words`} /> : null}
            </View>
            <View style={styles.segmented}>
              {(['transcript', 'notes'] as const).map((tab) => (
                <TouchableOpacity key={tab} style={[styles.segment, detailTab === tab && styles.segmentActive]} onPress={() => setDetailTab(tab)}>
                  <Text style={[styles.segmentText, detailTab === tab && styles.segmentTextActive]}>{tab === 'transcript' ? 'Transcript' : 'AI Notes'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {detailTab === 'transcript' ? (
              <>
                <Text style={styles.body}>{transcriptText(selected) || transcriptFallback(selected?.status)}</Text>
                {selected?.status === 'done' ? (
                  <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionChip} onPress={shareTranscriptText}>
                      <FontAwesome name="copy" size={12} color="#fdb813" />
                      <Text style={styles.actionChipText}>Share Text</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionChip} onPress={() => shareSubtitles('srt')}>
                      <FontAwesome name="download" size={12} color="#fdb813" />
                      <Text style={styles.actionChipText}>SRT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionChip} onPress={() => shareSubtitles('vtt')}>
                      <FontAwesome name="file-text-o" size={12} color="#fdb813" />
                      <Text style={styles.actionChipText}>VTT</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.body}>{notesText(selected) || 'No AI notes are available yet.'}</Text>
                {selected?.status === 'done' ? (
                  <TouchableOpacity style={styles.notesButton} onPress={handleRegenerateNotes}>
                    <FontAwesome name="magic" size={13} color="#fdb813" />
                    <Text style={styles.notesButtonText}>Regenerate Notes</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function transcriptFallback(status?: string) {
  if (status === 'processing') return 'Groq AI is transcribing this audio. Please check again shortly.';
  if (status === 'pending') return 'This audio is queued for transcription.';
  if (status === 'failed') return 'Transcription failed. You may delete and upload the file again.';
  return 'Transcript text is not available yet.';
}

function StatusBadge({ status }: { status?: string }) {
  const config = STATUS[status as keyof typeof STATUS] || STATUS.pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <FontAwesome name={config.icon as any} size={11} color={config.color} />
      <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function MetaPill({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.metaPill}>
      <FontAwesome name={icon} size={10} color="#fdb813" />
      <Text style={styles.metaPillText}>{text}</Text>
    </View>
  );
}

function SummaryTile({ label, value, icon }: { label: string; value: number; icon: any }) {
  return (
    <View style={styles.summaryTile}>
      <FontAwesome name={icon} size={13} color="#fdb813" />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function TranscriptCard({ item, onPress, onDelete }: { item: any; onPress: () => void; onDelete: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.iconBox}>
        <FontAwesome name="microphone" size={18} color="#fdb813" />
      </View>
      <View style={styles.info}>
        <View style={styles.cardTop}>
          <Text style={styles.title} numberOfLines={1}>{item?.title || item?.filename || 'Transcript'}</Text>
          <StatusBadge status={item?.status} />
        </View>
        <Text style={styles.meta} numberOfLines={2}>
          {item?.language ? `${String(item.language).toUpperCase()} · ` : ''}
          {item?.duration_formatted || item?.created_at || 'Speech transcript'}
        </Text>
      </View>
      <TouchableOpacity style={styles.cardAction} onPress={onDelete}>
        <FontAwesome name="trash-o" size={15} color="#94a3b8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: { backgroundColor: '#1d2b4b', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  eyebrow: { color: '#fdb813', fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  headerText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, marginTop: 6 },
  content: { padding: 16, paddingBottom: 40 },
  listHeader: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryTile: { flex: 1, minHeight: 76, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', gap: 3 },
  summaryValue: { color: '#1d2b4b', fontSize: 18, fontWeight: '900' },
  summaryLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 15, height: 52, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#1d2b4b', fontSize: 14 },
  filterRow: { gap: 8, paddingBottom: 12 },
  filterChip: { minHeight: 36, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: '#1d2b4b', borderColor: '#1d2b4b' },
  filterChipText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  filterChipTextActive: { color: '#fdb813' },
  uploadButton: { height: 48, borderRadius: 15, backgroundColor: '#1d2b4b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  uploadButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  processingHint: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: '#1d2b4b', fontSize: 15, fontWeight: '900' },
  meta: { color: '#94a3b8', marginTop: 5, fontSize: 12 },
  cardAction: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '900' },
  emptyText: { color: '#8E8E93', textAlign: 'center', padding: 24 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  detailTitle: { color: '#1d2b4b', fontWeight: '900', fontSize: 18 },
  detailContent: { padding: 20, paddingBottom: 38 },
  titleLarge: { color: '#1d2b4b', fontSize: 24, fontWeight: '900', marginTop: 12, marginBottom: 16 },
  metaPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: -8, marginBottom: 16 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 6 },
  metaPillText: { color: '#64748b', fontSize: 10, fontWeight: '900' },
  segmented: { flexDirection: 'row', backgroundColor: '#e9eef8', borderRadius: 15, padding: 4, marginBottom: 16 },
  segment: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#1d2b4b' },
  segmentText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  segmentTextActive: { color: '#fdb813' },
  body: { color: '#475569', fontSize: 15, lineHeight: 24, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  notesButton: { height: 46, borderRadius: 14, backgroundColor: '#1d2b4b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  notesButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  actionChip: { minHeight: 42, borderRadius: 13, backgroundColor: '#1d2b4b', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionChipText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  uploadBody: { padding: 20 },
  inputLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 7 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', color: '#1d2b4b', paddingHorizontal: 14, fontSize: 14, marginBottom: 14 },
  filePicker: { minHeight: 86, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  fileTitle: { color: '#1d2b4b', fontSize: 14, fontWeight: '900' },
  fileMeta: { color: '#94a3b8', fontSize: 11, lineHeight: 17, marginTop: 4 },
  saveButton: { minHeight: 50, borderRadius: 15, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  saveButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
