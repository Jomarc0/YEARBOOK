import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { createAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { getErrorMessage, getVoiceNotesInbox, getVoiceNotesOutbox, imageUrl, unwrap } from '../lib/api';

const TABS = [
  { key: 'inbox', label: 'Received', icon: 'inbox' },
  { key: 'outbox', label: 'Sent', icon: 'paper-plane' },
];

const personForNote = (note: any, tab: string) => tab === 'inbox' ? note?.sender : note?.recipient;
const personName = (person: any) => person?.name || 'Classmate';
const personPhoto = (person: any) => imageUrl(person?.avatar_url || person?.profile_picture || person?.photo);
const initials = (name = '') => name.trim().split(/\s+/).map((word) => word[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';
const audioUrl = (note: any) => imageUrl(note?.audio_url || note?.audio_path);
const fmtDate = (value?: string) => value ? new Date(value).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending';
const fmtDuration = (seconds?: number) => seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : null;

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const color = status === 'approved' ? '#15803d' : status === 'rejected' ? '#b91c1c' : '#c2410c';
  const bg = status === 'approved' ? '#f0fdf4' : status === 'rejected' ? '#fef2f2' : '#fff7ed';
  const icon = status === 'approved' ? 'check-circle' : status === 'rejected' ? 'times-circle' : 'clock-o';
  const label = status === 'approved' ? 'Delivered' : status === 'rejected' ? 'Not approved' : 'Pending approval';

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <FontAwesome name={icon as any} size={10} color={color} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

export default function VoiceNotesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('inbox');
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playing, setPlaying] = useState<any>(null);
  const [error, setError] = useState('');
  const playerRef = useRef<any>(null);

  const loadNotes = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const payload = tab === 'inbox' ? await getVoiceNotesInbox() : await getVoiceNotesOutbox();
      const data = unwrap(payload);
      setNotes(Array.isArray(data) ? data : data?.data || []);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load voice memories.'));
      setNotes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, tab]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const togglePlay = (note: any) => {
    const url = audioUrl(note);
    if (!url) return;

    if (playing === note.id) {
      playerRef.current?.pause?.();
      setPlaying(null);
      return;
    }

    playerRef.current?.pause?.();
    playerRef.current?.remove?.();
    const player = createAudioPlayer({ uri: url });
    playerRef.current = player;
    setPlaying(note.id);
    player.play();
  };

  const renderHeader = () => (
    <>
      <View style={styles.hero}>
        <Text style={styles.kicker}>MEMORIES</Text>
        <Text style={styles.title}>Voice <Text style={styles.gold}>Memories</Text></Text>
        <Text style={styles.subtitle}>Audio dedications from your classmates, approved and preserved forever.</Text>
      </View>
      <View style={styles.tabShell}>
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <TouchableOpacity key={item.key} style={[styles.tabButton, active && styles.tabActive]} onPress={() => { setTab(item.key); setPlaying(null); }}>
              <FontAwesome name={item.icon as any} size={14} color={active ? '#fdb813' : '#94a3b8'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {tab === 'outbox' && (
        <TouchableOpacity style={styles.cta} activeOpacity={0.88} onPress={() => router.push('/directory' as any)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Send a voice memory to a classmate</Text>
            <Text style={styles.ctaText}>Open a student profile from Directory and tap Voice.</Text>
          </View>
          <FontAwesome name="microphone" size={22} color="#fdb813" />
        </TouchableOpacity>
      )}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={notes}
        keyExtractor={(item, index) => String(item?.id || index)}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          const other = personForNote(item, tab);
          const photo = personPhoto(other);
          const isPlayable = tab === 'inbox' || item?.status === 'approved';
          const isPlaying = playing === item.id;

          return (
            <View style={[styles.noteCard, item?.status === 'rejected' && styles.rejectedCard]}>
              {photo ? <Image source={photo} style={styles.avatar} /> : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initials(personName(other))}</Text>
                </View>
              )}
              <View style={styles.noteCopy}>
                <View style={styles.noteTitleRow}>
                  <Text style={styles.noteTitle} numberOfLines={1}>{item?.title || 'Voice memory'}</Text>
                  {tab === 'outbox' ? <StatusBadge status={item?.status} /> : null}
                </View>
                <Text style={styles.noteMeta} numberOfLines={1}>
                  {tab === 'inbox' ? 'From' : 'To'} {personName(other)} · {fmtDate(item?.created_at)}
                  {fmtDuration(item?.duration_seconds) ? ` · ${fmtDuration(item.duration_seconds)}` : ''}
                </Text>
                <View style={styles.waveRow}>
                  {Array.from({ length: 18 }, (_, index) => (
                    <View key={String(index)} style={[styles.waveBar, { height: 7 + Math.abs(Math.sin(index * 0.9)) * 12, backgroundColor: isPlaying ? '#fdb813' : '#e2e8f0' }]} />
                  ))}
                </View>
              </View>
              {isPlayable ? (
                <TouchableOpacity style={[styles.playButton, isPlaying && styles.playButtonActive]} onPress={() => togglePlay(item)}>
                  <FontAwesome name={isPlaying ? 'pause' : 'play'} size={14} color={isPlaying ? '#1d2b4b' : '#fdb813'} />
                </TouchableOpacity>
              ) : (
                <View style={styles.pendingButton}>
                  <FontAwesome name="clock-o" size={15} color="#c2410c" />
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={styles.loading} /> : (
          <View style={styles.empty}>
            <FontAwesome name={tab === 'inbox' ? 'inbox' : 'paper-plane'} size={44} color="#dbe3ef" />
            <Text style={styles.emptyTitle}>{tab === 'inbox' ? 'No voice memories yet' : 'Nothing sent yet'}</Text>
            <Text style={styles.emptyText}>{tab === 'inbox' ? 'When classmates send you a voice memory it will appear here.' : 'Visit a classmate profile to record and send one.'}</Text>
          </View>
        )}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotes(); }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 36 },
  hero: { backgroundColor: '#1d2b4b', paddingHorizontal: 24, paddingTop: 72, paddingBottom: 86, alignItems: 'center', borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
  kicker: { color: 'rgba(255,255,255,0.58)', fontSize: 11, letterSpacing: 1.7, fontWeight: '900' },
  title: { color: '#ffffff', fontSize: 38, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  gold: { color: '#fdb813' },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 330, marginTop: 10 },
  tabShell: { marginHorizontal: 20, marginTop: -36, backgroundColor: '#ffffff', borderRadius: 18, padding: 6, flexDirection: 'row', elevation: 7, shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 7 } },
  tabButton: { flex: 1, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  tabActive: { backgroundColor: '#1d2b4b' },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '900' },
  tabTextActive: { color: '#ffffff' },
  cta: { marginHorizontal: 20, marginTop: 26, marginBottom: 6, borderRadius: 18, backgroundColor: '#1d2b4b', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  ctaText: { color: 'rgba(255,255,255,0.62)', fontSize: 12, lineHeight: 17, marginTop: 4 },
  errorText: { marginHorizontal: 20, marginTop: 16, color: '#b91c1c', textAlign: 'center' },
  noteCard: { marginHorizontal: 20, marginTop: 14, backgroundColor: '#ffffff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: '#edf2f7', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 },
  rejectedCard: { opacity: 0.62 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#eef2ff' },
  avatarFallback: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fdb813', fontWeight: '900', fontSize: 15 },
  noteCopy: { flex: 1, minWidth: 0 },
  noteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  noteTitle: { color: '#1d2b4b', fontSize: 14, fontWeight: '900', flexShrink: 1 },
  noteMeta: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '900' },
  waveRow: { height: 24, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 3, borderRadius: 999 },
  playButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  playButtonActive: { backgroundColor: '#fdb813' },
  pendingButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: 42 },
  empty: { marginHorizontal: 20, marginTop: 24, backgroundColor: '#ffffff', borderRadius: 24, paddingVertical: 54, paddingHorizontal: 28, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 17, fontWeight: '900', marginTop: 16 },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 7 },
});
