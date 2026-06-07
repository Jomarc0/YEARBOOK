import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createAudioPlayer, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { getAppConfig, getDiscoveryStudent, getErrorMessage, getStudent, getStudentAchievements, getStudentPosts, getTaggedPhotos, getVoiceNotesForProfile, imageUrl, sendVoiceNote, trackStudentView, unwrap } from '../../lib/api';

const TABS = [
  { key: 'posts', label: 'Posts', icon: 'th-large' },
  { key: 'tagged', label: 'Tagged', icon: 'tag' },
  { key: 'yearbook', label: 'Yearbook', icon: 'book' },
  { key: 'academic', label: 'Academic', icon: 'graduation-cap' },
  { key: 'achievements', label: 'Awards', icon: 'trophy' },
  { key: 'voice', label: 'Voice', icon: 'microphone' },
];

const safeStudent = (user: any) => user?.student_record || user?.studentRecord || user?.student || user || {};
const fullName = (user: any) => user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Student';
const profilePhoto = (user: any) => imageUrl(user?.profile_picture || user?.profile_pic || safeStudent(user)?.photo || user?.photo);
const course = (user: any) => safeStudent(user)?.course || user?.course || 'Pioneer Student';
const year = (user: any) => safeStudent(user)?.graduation_year || user?.graduation_year || user?.batch_year || user?.batch || '';
const studentNo = (user: any) => safeStudent(user)?.student_no || user?.student_id || user?.student_no || '';
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'NU';
const listFromPayload = (payload: any) => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};
const listFromValue = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).map((title, index) => ({ id: `text-${index}`, title }));
  }
  return [];
};
const postMedia = (post: any) => Array.isArray(post?.media) && post.media.length ? post.media : post?.file_path ? [{ file_path: post.file_path, resource_type: post?.ai_metadata?.resource_type }] : [];
const mediaUrl = (item: any) => imageUrl(item?.file_path || item?.url || item?.path);
const isVideo = (item: any) => String(item?.resource_type || '').toLowerCase() === 'video' || /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(String(item?.file_path || item?.url || ''));
const formatDuration = (seconds?: number) => seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : null;
const audioUrl = (note: any) => imageUrl(note?.audio_url || note?.audio_path || note?.url);
const isPremium = (user: any) => Boolean(user?.is_premium || user?.is_subscribed || user?.tier === 'premium' || user?.tier === 'standard');

function Avatar({ user }: { user: any }) {
  const photo = profilePhoto(user);
  if (photo) return <Image source={photo} style={styles.avatar} contentFit="cover" />;
  return <View style={styles.avatarFallback}><Text style={styles.avatarText}>{initials(fullName(user))}</Text></View>;
}

export default function StudentProfileScreen() {
  const router = useRouter();
  const { id, source, userId: routeUserId } = useLocalSearchParams();
  const studentId = Array.isArray(id) ? id[0] : id;
  const sourceName = Array.isArray(source) ? source[0] : source;
  const explicitUserId = Array.isArray(routeUserId) ? routeUserId[0] : routeUserId;
  const isDiscoveryProfile = sourceName === 'discovery';
  const [student, setStudent] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [tagged, setTagged] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState<any>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [voiceTitle, setVoiceTitle] = useState('Voice memory');
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [voiceSending, setVoiceSending] = useState(false);
  const playerRef = useRef<any>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 300);

  const name = fullName(student);
  const canShowYearbook = Boolean(year(student));
  const userId = explicitUserId || student?.user_id || student?.user?.id || (!isDiscoveryProfile ? student?.id || studentId : null);
  const features = appConfig?.features || {};
  const postsEnabled = features.allow_student_posts !== false;
  const premiumBadgeEnabled = features.premium_badge_display !== false;
  const directoryEnabled = features.enable_student_directory_search !== false;
  const schoolName = appConfig?.school_name || 'National University Lipa';

  const loadProfile = useCallback(async () => {
    if (!studentId) return;
    try {
      setError('');
      if (!refreshing) setLoading(true);

      const [configResult, profileResult] = await Promise.allSettled([
        getAppConfig(),
        isDiscoveryProfile ? getDiscoveryStudent(studentId) : getStudent(studentId),
      ]);
      let profile: any = null;
      if (configResult.status === 'fulfilled') setAppConfig(unwrap(configResult.value));
      const primaryProfile = profileResult;

      if (primaryProfile.status === 'fulfilled') {
        profile = unwrap(primaryProfile.value);
        setStudent(profile);
        setAchievements(listFromValue(profile?.achievements));
      } else {
        const restrictedStudent = primaryProfile.reason?.response?.data?.student;
        if (restrictedStudent) {
          profile = restrictedStudent;
          setStudent(restrictedStudent);
          setError(getErrorMessage(primaryProfile.reason, 'Upgrade to view the full student profile.'));
        } else {
          setError(getErrorMessage(primaryProfile.reason, 'Unable to load this student profile.'));
        }
      }

      const resolvedUserId = explicitUserId || profile?.user_id || profile?.user?.id || (!isDiscoveryProfile ? profile?.id || studentId : null);
      if (!resolvedUserId) {
        setPosts([]);
        setTagged([]);
        setVoiceNotes([]);
        return;
      }

      trackStudentView(resolvedUserId).catch(() => {});

      const [postsResult, taggedResult, achievementsResult, voiceResult] = await Promise.allSettled([
        getStudentPosts(resolvedUserId),
        getTaggedPhotos(resolvedUserId),
        getStudentAchievements(resolvedUserId),
        getVoiceNotesForProfile(resolvedUserId),
      ]);

      if (postsResult.status === 'fulfilled') setPosts(listFromPayload(postsResult.value));
      if (taggedResult.status === 'fulfilled') setTagged(listFromPayload(taggedResult.value));
      if (achievementsResult.status === 'fulfilled') setAchievements(listFromPayload(achievementsResult.value));
      if (voiceResult.status === 'fulfilled') setVoiceNotes(listFromPayload(voiceResult.value));

      const failed = [postsResult, taggedResult, achievementsResult, voiceResult].find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failed) setError(getErrorMessage(failed.reason, 'Some profile sections could not be loaded.'));
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load this student profile.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [explicitUserId, isDiscoveryProfile, refreshing, studentId]);

  useFocusEffect(React.useCallback(() => {
    loadProfile();
  }, [loadProfile]));

  const stats = useMemo(() => [
    { label: 'Posts', value: posts.length },
    { label: 'Awards', value: achievements.length },
    { label: 'Voice', value: voiceNotes.length },
  ], [achievements.length, posts.length, voiceNotes.length]);

  const messageStudent = () => {
    if (!userId) {
      Alert.alert('Message unavailable', 'This student record is not linked to a user account yet.');
      return;
    }
    router.push({ pathname: '/messages', params: { userId: String(userId), name } } as any);
  };

  const toggleVoice = (note: any) => {
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

  const startRecording = async () => {
    if (!userId) {
      Alert.alert('Voice unavailable', 'This student record is not linked to a user account yet.');
      return;
    }

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone needed', 'Allow microphone access to record a voice memory.');
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: 300 });
      setRecordedUri(null);
    } catch (requestError: any) {
      Alert.alert('Recording failed', getErrorMessage(requestError, 'Unable to start recording.'));
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const status = recorder.getStatus();
      setRecordedUri(status.url || recorder.uri || null);
    } catch (requestError: any) {
      Alert.alert('Recording failed', getErrorMessage(requestError, 'Unable to stop recording.'));
    }
  };

  const submitVoiceNote = async () => {
    if (!userId || !recordedUri) return;

    try {
      setVoiceSending(true);
      const durationSeconds = Math.max(1, Math.round((recorderState.durationMillis || 0) / 1000));
      const form = new FormData();
      form.append('recipient_id', String(userId));
      form.append('title', voiceTitle.trim() || 'Voice memory');
      form.append('duration_seconds', String(durationSeconds));
      form.append('audio', {
        uri: recordedUri,
        name: 'voice-memory.m4a',
        type: 'audio/m4a',
      } as any);

      await sendVoiceNote(form);
      setRecordedUri(null);
      setVoiceTitle('Voice memory');
      const payload = await getVoiceNotesForProfile(userId);
      setVoiceNotes(listFromPayload(payload));
      Alert.alert('Voice memory sent', 'Your voice note is pending approval before it appears on this profile.');
    } catch (requestError: any) {
      Alert.alert('Send failed', getErrorMessage(requestError, 'Unable to send this voice memory.'));
    } finally {
      setVoiceSending(false);
    }
  };

  const openMedia = (item: any) => {
    const url = mediaUrl(item);
    if (url && isVideo(item)) Linking.openURL(url).catch(() => Alert.alert('Unable to open video'));
  };

  const renderHeader = () => (
    <>
      <View style={styles.profileCard}>
        <View style={styles.cover}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={16} color="#1d2b4b" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileBody}>
          <View style={styles.avatarRing}><Avatar user={student} /></View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {premiumBadgeEnabled && isPremium(student) ? (
              <View style={styles.tierBadge}>
                <FontAwesome name="star" size={10} color="#1d2b4b" />
                <Text style={styles.tierText}>{student?.tier === 'standard' ? 'Standard' : 'Premium'}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta}>{course(student)} - {schoolName}</Text>
          {canShowYearbook ? <Text style={styles.gradBadge}>CLASS OF {year(student)}</Text> : null}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={messageStudent}>
              <FontAwesome name="paper-plane" size={13} color="#fdb813" />
              <Text style={styles.primaryButtonText}>Message</Text>
            </TouchableOpacity>
            {directoryEnabled ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/directory', params: { q: name } } as any)}>
                <FontAwesome name="search" size={13} color="#1d2b4b" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.statsRow}>
            {stats.map((item) => (
              <View key={item.label} style={styles.statItem}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.tabs}>
        {TABS.map((item) => {
          if (item.key === 'yearbook' && !canShowYearbook) return null;
          const active = tab === item.key;
          return (
            <TouchableOpacity key={item.key} style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(item.key)}>
              <FontAwesome name={item.icon as any} size={13} color={active ? '#fdb813' : '#94a3b8'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  const renderContent = () => {
    if (loading) return <ActivityIndicator color="#1d2b4b" style={{ marginTop: 34 }} />;

    if (tab === 'posts') {
      if (!postsEnabled) {
        return <Empty icon="lock" title="Posts Disabled" text="Student posts are currently disabled by platform settings." />;
      }

      return posts.length ? (
        <View style={styles.grid}>
          {posts.map((post) => {
            const item = postMedia(post)[0];
            const url = mediaUrl(item);
            return (
              <TouchableOpacity key={String(post.id)} style={styles.cell} onPress={() => openMedia(item)}>
                {url && !isVideo(item) ? <Image source={url} style={styles.cellImage} contentFit="cover" /> : url && isVideo(item) ? (
                  <View style={styles.videoCell}><FontAwesome name="video-camera" size={22} color="#fdb813" /><Text style={styles.videoText}>Video</Text></View>
                ) : <FontAwesome name="camera" size={26} color="#cbd5e1" />}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : <Empty icon="camera" title="No Posts Yet" text="No public posts are available for this profile." />;
    }

    if (tab === 'tagged') {
      return tagged.length ? (
        <View style={styles.grid}>
          {tagged.map((photo) => {
            const url = imageUrl(photo?.photo_url || photo?.photo_path || photo?.file_path);
            return (
              <View key={String(photo.id)} style={styles.cell}>
                {url ? <Image source={url} style={styles.cellImage} contentFit="cover" /> : <FontAwesome name="tag" size={24} color="#cbd5e1" />}
              </View>
            );
          })}
        </View>
      ) : <Empty icon="tags" title="No Tagged Photos" text="Tagged memories will appear here." />;
    }

    if (tab === 'yearbook') {
      return (
        <View style={styles.card}>
          <InfoRow icon="graduation-cap" label="Class Of" value={year(student) || 'Not set'} />
          <InfoRow icon="id-card" label="Student No." value={studentNo(student) || 'Not set'} />
          <InfoRow icon="quote-left" label="Motto" value={safeStudent(student)?.motto || student?.motto || 'No motto yet.'} />
          <InfoRow icon="heart" label="Fondest Memory" value={safeStudent(student)?.fondest_memory || student?.fondest_memory || 'No memory added yet.'} />
          <InfoRow icon="rocket" label="Future Plans" value={safeStudent(student)?.future_plans || student?.future_plans || 'No future plans added yet.'} />
        </View>
      );
    }

    if (tab === 'academic') {
      return (
        <View style={styles.card}>
          <InfoRow icon="id-card" label="Student ID" value={studentNo(student) || 'Not set'} />
          <InfoRow icon="book" label="Course" value={course(student)} />
          <InfoRow icon="calendar" label="Graduation Year" value={year(student) || 'Not set'} />
          <InfoRow icon="users" label="Section" value={student?.section?.name || student?.section || 'Not set'} />
        </View>
      );
    }

    if (tab === 'achievements') {
      return achievements.length ? (
        <View style={styles.card}>
          {achievements.map((item, index) => (
            <View key={String(item.id || index)} style={[styles.row, index < achievements.length - 1 && styles.rowBorder]}>
              <View style={styles.rowIcon}><FontAwesome name="trophy" size={14} color="#fdb813" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item?.title || item?.name || 'Achievement'}</Text>
                <Text style={styles.rowText}>{item?.subtitle || item?.description || item?.date_awarded || 'Student achievement'}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : <Empty icon="trophy" title="No Achievements Yet" text="No achievements are listed for this profile." />;
    }

    if (tab === 'voice') {
      return (
        <View style={styles.voiceWrap}>
          <View style={styles.voiceComposer}>
            <View style={styles.voiceComposerHeader}>
              <View style={styles.voiceComposerIcon}>
                <FontAwesome name={recorderState.isRecording ? 'circle' : 'microphone'} size={16} color="#fdb813" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voiceComposerTitle}>{recordedUri ? 'Recording ready' : recorderState.isRecording ? 'Recording voice memory' : 'Send a voice memory'}</Text>
                <Text style={styles.voiceComposerText}>
                  {recorderState.isRecording || recordedUri ? formatDuration(Math.round((recorderState.durationMillis || 0) / 1000)) || '0:00' : 'Voice notes are reviewed before appearing.'}
                </Text>
              </View>
            </View>
            <TextInput
              style={styles.voiceInput}
              value={voiceTitle}
              onChangeText={setVoiceTitle}
              placeholder="Voice memory title"
              placeholderTextColor="#94a3b8"
            />
            <View style={styles.voiceActionRow}>
              <TouchableOpacity style={[styles.recordButton, recorderState.isRecording && styles.recordButtonStop]} onPress={recorderState.isRecording ? stopRecording : startRecording}>
                <FontAwesome name={recorderState.isRecording ? 'stop' : 'microphone'} size={13} color="#ffffff" />
                <Text style={styles.recordButtonText}>{recorderState.isRecording ? 'Stop' : recordedUri ? 'Re-record' : 'Record'}</Text>
              </TouchableOpacity>
              {recordedUri ? (
                <TouchableOpacity style={styles.sendVoiceButton} onPress={submitVoiceNote} disabled={voiceSending}>
                  {voiceSending ? <ActivityIndicator size="small" color="#1d2b4b" /> : <FontAwesome name="paper-plane" size={13} color="#1d2b4b" />}
                  <Text style={styles.sendVoiceText}>Send</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {voiceNotes.length ? (
            <View style={styles.card}>
              {voiceNotes.map((note, index) => {
                const active = playing === note.id;
                return (
                  <View key={String(note.id || index)} style={[styles.row, index < voiceNotes.length - 1 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{note?.title || 'Voice Memory'}</Text>
                      <Text style={styles.rowText}>From {note?.sender?.name || 'Classmate'}{formatDuration(note?.duration_seconds) ? ` - ${formatDuration(note.duration_seconds)}` : ''}</Text>
                      <View style={styles.waveRow}>
                        {Array.from({ length: 18 }, (_, waveIndex) => (
                          <View key={String(waveIndex)} style={[styles.waveBar, { height: 7 + Math.abs(Math.sin(waveIndex * 0.8)) * 12, backgroundColor: active ? '#fdb813' : '#e2e8f0' }]} />
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity style={[styles.playButton, active && styles.playButtonActive]} onPress={() => toggleVoice(note)}>
                      <FontAwesome name={active ? 'pause' : 'play'} size={13} color={active ? '#1d2b4b' : '#fdb813'} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : <Empty icon="microphone-slash" title="No Voice Notes" text="No approved voice memories yet." />}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="dark" />
      <FlatList
        data={[{ id: 'content' }]}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderContent}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} />}
      />
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><FontAwesome name={icon} size={13} color="#fdb813" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{String(value || 'Not set')}</Text>
      </View>
    </View>
  );
}

function Empty({ icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <FontAwesome name={icon} size={40} color="#dbe3ef" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  content: { paddingBottom: 36 },
  profileCard: { margin: 14, backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  cover: { height: 128, backgroundColor: '#1d2b4b' },
  backButton: { position: 'absolute', left: 16, top: 18, width: 40, height: 40, borderRadius: 13, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  profileBody: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 22 },
  avatarRing: { marginTop: -56, padding: 4, backgroundColor: '#ffffff', borderRadius: 60, borderWidth: 3, borderColor: '#fdb813' },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#eef2ff' },
  avatarFallback: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fdb813', fontSize: 34, fontWeight: '900' },
  nameRow: { marginTop: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  name: { color: '#1d2b4b', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: '#fdb813', paddingHorizontal: 10, paddingVertical: 5 },
  tierText: { color: '#1d2b4b', fontSize: 10, fontWeight: '900' },
  meta: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 7 },
  gradBadge: { marginTop: 8, color: '#047857', backgroundColor: '#ecfdf5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden', fontSize: 10, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 18 },
  primaryButton: { flex: 1, height: 46, borderRadius: 13, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  secondaryButton: { width: 48, height: 46, borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#eef2ff', marginTop: 20, paddingTop: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#1d2b4b', fontSize: 16, fontWeight: '900' },
  statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800', marginTop: 3 },
  tabs: { marginHorizontal: 14, marginBottom: 12, backgroundColor: '#ffffff', borderRadius: 16, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabActive: { backgroundColor: '#f8fafc', borderBottomWidth: 2, borderBottomColor: '#1d2b4b' },
  tabText: { color: '#94a3b8', fontSize: 10, fontWeight: '900' },
  tabTextActive: { color: '#1d2b4b' },
  errorText: { marginHorizontal: 16, color: '#b45309', textAlign: 'center', marginBottom: 10 },
  grid: { marginHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 3, borderRadius: 18, overflow: 'hidden' },
  cell: { width: '32.8%', aspectRatio: 1, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  cellImage: { width: '100%', height: '100%' },
  videoCell: { width: '100%', height: '100%', backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', gap: 7 },
  videoText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  card: { marginHorizontal: 14, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 18 },
  voiceWrap: { gap: 12 },
  voiceComposer: { marginHorizontal: 14, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  voiceComposerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
  voiceComposerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  voiceComposerTitle: { color: '#1d2b4b', fontSize: 14, fontWeight: '900' },
  voiceComposerText: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  voiceInput: { minHeight: 44, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 13, color: '#1d2b4b', fontSize: 13, marginBottom: 12 },
  voiceActionRow: { flexDirection: 'row', gap: 10 },
  recordButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  recordButtonStop: { backgroundColor: '#dc2626' },
  recordButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  sendVoiceButton: { width: 92, minHeight: 44, borderRadius: 12, backgroundColor: '#fdb813', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  sendVoiceText: { color: '#1d2b4b', fontSize: 12, fontWeight: '900' },
  infoRow: { flexDirection: 'row', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  infoValue: { color: '#1d2b4b', fontSize: 14, fontWeight: '700', marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: '#1d2b4b', fontSize: 14, fontWeight: '900' },
  rowText: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 22, marginTop: 6 },
  waveBar: { width: 3, borderRadius: 999 },
  playButton: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  playButtonActive: { backgroundColor: '#fdb813' },
  empty: { marginHorizontal: 14, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 50, paddingHorizontal: 28, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 16, fontWeight: '900', marginTop: 14 },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 6 },
});
