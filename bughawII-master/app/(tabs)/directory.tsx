import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, ImageBackground, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { createAudioPlayer, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { faceSearch, getErrorMessage, getSearchFilters, getStudent, getStudentAchievements, getStudentSuggestions, getStudents, getVoiceNotesForProfile, imageUrl, paginationMeta, sendVoiceNote, unwrap } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterDropdown from '../../components/FilterDropdown';

const { height } = Dimensions.get('window');

const COURSE_SHORT: Record<string, string> = {
  'Bachelor of Science in Architecture': 'BSArch',
  'Bachelor of Science in Civil Engineering': 'BSCE',
  'Bachelor of Science in Computer Science': 'BSCS',
  'Bachelor of Science in Information Technology': 'BSIT',
  'Bachelor of Multimedia Arts': 'BMA',
  'Bachelor of Science in Nursing': 'BSN',
  'Bachelor of Science in Medical Technology': 'BSMT',
  'Bachelor of Science in Psychology': 'BSPsy',
  'Bachelor of Science in Accountancy': 'BSA',
  'Bachelor of Science in Business Administration - Financial Management': 'BSBA-FM',
  'Bachelor of Science in Business Administration - Marketing Management': 'BSBA-MM',
  'Bachelor of Science in Tourism Management': 'BSTM',
  'Master in Management': 'MM',
  ABM: 'ABM',
  STEM: 'STEM',
  HUMSS: 'HUMSS',
};

const COURSE_FILTERS = [
  { label: 'All Programs', value: 'All Programs' },
  ...Object.entries(COURSE_SHORT).map(([value, label]) => ({ label, value })),
];

const getCourseShort = (course: string, fallback = 'Student') => COURSE_SHORT[course] || course || fallback;
const getStudentId = (student: any) => student?.id || student?.user_id || student?.student_id;
const getStudentName = (student: any) => student?.name || student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Unnamed Student';
const getStudentCourse = (student: any) => student?.course || student?.program || student?.degree || 'No program listed';
const getStudentSection = (student: any) => student?.section?.name || student?.section_name || student?.section || 'No section';
const getStudentYear = (student: any) => student?.batch_year || student?.year_level || student?.year || student?.batch?.year || student?.graduation_year || new Date().getFullYear();
const getStudentPhoto = (student: any) => imageUrl(student?.profile_picture || student?.profile_pic || student?.photo || student?.avatar);
const getInitials = (name = '') => name.trim().split(/\s+/).map((word) => word[0]?.toUpperCase() || '').slice(0, 2).join('') || 'NU';
const getRecipientId = (student: any) => student?.user_id || student?.user?.id || student?.id;
const getAudioUrl = (note: any) => imageUrl(note?.audio_url || note?.audio_path || note?.url);
const formatDuration = (seconds?: number) => {
  if (!seconds) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
const formatDate = (value?: string) => {
  if (!value) return 'Pending';
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function DirectoryScreen() {
  const router = useRouter();
  const { filter, q } = useLocalSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [courseFilters, setCourseFilters] = useState(COURSE_FILTERS);
  const [batchFilters, setBatchFilters] = useState([{ label: 'All Years', value: 'All Years' }]);
  const [activeFilter, setActiveFilter] = useState('All Programs');
  const [activeBatchYear, setActiveBatchYear] = useState('All Years');
  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [faceSearching, setFaceSearching] = useState(false);
  const [faceMatches, setFaceMatches] = useState<any[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<any>>(new Set());
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedAchievements, setSelectedAchievements] = useState<any[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceSending, setVoiceSending] = useState(false);
  const [voiceTitle, setVoiceTitle] = useState('Voice memory');
  const [playingVoiceId, setPlayingVoiceId] = useState<any>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const audioPlayerRef = useRef<any>(null);
  const suggestionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 300);

  useEffect(() => {
    if (filter && typeof filter === 'string') setActiveFilter(filter);
  }, [filter]);

  const clearFaceResults = () => {
    setFaceMatches([]);
    setMatchedIds(new Set());
  };

  useEffect(() => {
    let mounted = true;

    getSearchFilters()
      .then((payload) => {
        if (!mounted) return;

        const courses = Array.isArray(payload?.courses) ? payload.courses : payload?.data?.courses || [];
        const batchYears = Array.isArray(payload?.batch_years) ? payload.batch_years : payload?.data?.batch_years || [];

        if (courses.length) {
          setCourseFilters([
            { label: 'All Programs', value: 'All Programs' },
            ...courses.map((item: any) => ({
              label: item?.label || getCourseShort(item?.value || item, 'Program'),
              value: item?.value || item,
            })),
          ]);
        }

        if (batchYears.length) {
          setBatchFilters([
            { label: 'All Years', value: 'All Years' },
            ...batchYears.map((year: any) => ({ label: String(year), value: String(year) })),
          ]);
        }
      })
      .catch(() => {
        setCourseFilters(COURSE_FILTERS);
        setBatchFilters([{ label: 'All Years', value: 'All Years' }]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSuggestLoading(true);
      const payload = await getStudentSuggestions({ q: text.trim() });
      setSuggestions(Array.isArray(payload?.suggestions) ? payload.suggestions : []);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async (nextPage = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else if (!refreshing) setLoading(true);

      setError('');
      const params: any = { page: nextPage, per_page: 20 };
      if (query.trim()) params.q = query.trim();
      if (activeFilter !== 'All Programs') params.course = activeFilter;
      if (activeBatchYear !== 'All Years') params.batch_year = activeBatchYear;

      const payload = await getStudents(params);
      const data = unwrap(payload);
      const meta = paginationMeta(payload);
      const nextStudents = Array.isArray(data) ? data : [];

      setStudents((current) => (append ? [...current, ...nextStudents] : nextStudents));
      setTotal(payload?.meta?.total || payload?.total || nextStudents.length);
      setPage(meta.currentPage);
      setLastPage(meta.lastPage);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load the student directory.'));
      if (!append) setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeBatchYear, activeFilter, query, refreshing]);

  useEffect(() => {
    const timer = setTimeout(() => loadStudents(1), 350);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const handleFaceSearch = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    try {
      setFaceSearching(true);
      clearFaceResults();
      setSuggestions([]);
      setShowSuggestions(false);
      const asset = result.assets[0];
      const form = new FormData();
      form.append('face_image', {
        uri: asset.uri,
        name: asset.fileName || 'face-search.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const payload = await faceSearch(form);
      const matches = (payload?.matches || payload?.data?.matches || []).filter((match: any) => match?.user_id || match?.id);
      setFaceMatches(matches);
      setMatchedIds(new Set(matches.map((match: any) => match.user_id || match.id)));

      const topName = matches[0]?.name;
      if (topName) setQuery(topName);
      Haptics.notificationAsync(matches.length ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Face search failed. Please try again.'));
    } finally {
      setFaceSearching(false);
    }
  };

  const toggleModal = (visible: boolean, student: any = null) => {
    if (visible) {
      setSelectedStudent(student);
      setSelectedAchievements([]);
      setVoiceNotes([]);
      setVoiceTitle('Voice memory');
      setRecordedUri(null);
      setIsModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
      ]).start();

      const id = getStudentId(student);
      if (id) {
        Promise.allSettled([getStudent(id), getStudentAchievements(id)]).then(([profileResult, achievementResult]) => {
          if (profileResult.status === 'fulfilled') setSelectedStudent((current: any) => ({ ...current, ...unwrap(profileResult.value) }));
          if (achievementResult.status === 'fulfilled') {
            const achievements = unwrap(achievementResult.value);
            setSelectedAchievements(Array.isArray(achievements) ? achievements : []);
          }
        });
        loadVoiceNotes(id);
      }
    } else {
      audioPlayerRef.current?.pause?.();
      setPlayingVoiceId(null);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: height, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        setIsModalVisible(false);
        setSelectedStudent(null);
      });
    }
  };

  const handleSendMessage = async () => {
    const id = getStudentId(selectedStudent);
    if (!id) return;
    toggleModal(false);
    router.push({ pathname: '/messages', params: { userId: String(id), name: getStudentName(selectedStudent) } } as any);
  };

  const loadVoiceNotes = async (userId: any) => {
    try {
      setVoiceLoading(true);
      const payload = await getVoiceNotesForProfile(userId);
      const data = unwrap(payload);
      setVoiceNotes(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setVoiceNotes([]);
    } finally {
      setVoiceLoading(false);
    }
  };

  const handleStartRecording = async () => {
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (requestError: any) {
      Alert.alert('Recording failed', getErrorMessage(requestError, 'Unable to start recording.'));
    }
  };

  const handleStopRecording = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const status = recorder.getStatus();
      setRecordedUri(status.url || recorder.uri || null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (requestError: any) {
      Alert.alert('Recording failed', getErrorMessage(requestError, 'Unable to stop recording.'));
    }
  };

  const handleSendVoiceNote = async () => {
    const recipientId = getRecipientId(selectedStudent);
    if (!recipientId || !recordedUri) return;

    try {
      setVoiceSending(true);
      const durationSeconds = Math.max(1, Math.round((recorderState.durationMillis || 0) / 1000));
      const form = new FormData();
      form.append('recipient_id', String(recipientId));
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
      await loadVoiceNotes(recipientId);
      Alert.alert('Voice memory sent', 'Your voice note is pending approval before it appears on their profile.');
    } catch (requestError: any) {
      Alert.alert('Send failed', getErrorMessage(requestError, 'Unable to send this voice memory.'));
    } finally {
      setVoiceSending(false);
    }
  };

  const toggleVoicePlayback = async (note: any) => {
    const url = getAudioUrl(note);
    if (!url) return;

    if (playingVoiceId === note.id) {
      audioPlayerRef.current?.pause?.();
      setPlayingVoiceId(null);
      return;
    }

    audioPlayerRef.current?.pause?.();
    audioPlayerRef.current?.remove?.();
    const player = createAudioPlayer({ uri: url });
    audioPlayerRef.current = player;
    setPlayingVoiceId(note.id);
    player.play();
  };

  const selectedFilterLabel = useMemo(() => courseFilters.find((item) => item.value === activeFilter)?.label || activeFilter, [activeFilter, courseFilters]);
  const isFaceMode = faceMatches.length > 0;

  const renderStudent = ({ item, index }: { item: any; index: number }) => {
    const name = getStudentName(item);
    const photo = getStudentPhoto(item);
    const matched = matchedIds.has(getStudentId(item)) || matchedIds.has(item?.user_id);

    return (
      <TouchableOpacity
        style={[styles.studentCard, matched && styles.studentCardMatched, index % 2 === 0 ? styles.leftCard : styles.rightCard]}
        activeOpacity={0.88}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleModal(true, item);
        }}
      >
        <View style={styles.photoArea}>
          {photo ? <Image source={photo} style={styles.cardPhoto} contentFit="cover" /> : (
            <View style={styles.initialsArea}>
              <Text style={styles.initialsText}>{getInitials(name)}</Text>
            </View>
          )}
          <View style={styles.batchBadge}>
            <FontAwesome name="graduation-cap" size={9} color="#fdb813" />
            <Text style={styles.batchText}>{getStudentYear(item)}</Text>
          </View>
          {matched ? (
            <View style={styles.matchBadge}>
              <FontAwesome name="camera" size={9} color="#1d2b4b" />
              <Text style={styles.matchText}>match</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.courseBadge}>
            <Text style={styles.courseBadgeText}>{getCourseShort(getStudentCourse(item)).toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={students}
        keyExtractor={(item, index) => String(getStudentId(item) || index)}
        renderItem={renderStudent}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={(
          <>
            <ImageBackground source={require('../../assets/images/NU-building.jpg')} style={styles.hero} resizeMode="cover">
              <View style={styles.heroOverlay} />
              <View style={styles.dotPattern} />
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <FontAwesome name="users" size={10} color="#fdb813" />
                  <Text style={styles.heroBadgeText}>STUDENT DIRECTORY</Text>
                </View>
                <Text style={styles.heroTitle}>Sinag-Bughaw <Text style={styles.heroTitleGold}>Pioneers</Text></Text>
                <Text style={styles.heroSubtitle}>Connecting the innovators of National University Lipa. Built by Pioneers, for Pioneers.</Text>
                <View style={styles.searchShell}>
                  <View style={styles.searchContainer}>
                    <FontAwesome name="search" size={16} color="#fdb813" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={isFaceMode ? 'Showing face match results...' : 'Search names, student IDs, or programs...'}
                      placeholderTextColor="rgba(255,255,255,0.48)"
                      value={query}
                      onChangeText={(value) => {
                        setQuery(value);
                        setShowSuggestions(true);
                        clearFaceResults();
                        if (suggestionTimer.current) clearTimeout(suggestionTimer.current);
                        suggestionTimer.current = setTimeout(() => loadSuggestions(value), 150);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    <TouchableOpacity style={styles.cameraButton} onPress={handleFaceSearch} disabled={faceSearching}>
                      {faceSearching ? <ActivityIndicator color="#fdb813" size="small" /> : <FontAwesome name="camera" size={15} color="#fdb813" />}
                    </TouchableOpacity>
                  </View>
                </View>
                {showSuggestions && suggestions.length ? (
                  <View style={styles.suggestionBox}>
                    {suggestions.map((item) => (
                      <TouchableOpacity
                        key={String(item.id)}
                        style={styles.suggestionRow}
                        onPress={() => {
                          setQuery(item.name || '');
                          setSuggestions([]);
                          setShowSuggestions(false);
                          clearFaceResults();
                        }}
                      >
                        {item.profile_picture ? (
                          <Image source={imageUrl(item.profile_picture)} style={styles.suggestionAvatar} contentFit="cover" />
                        ) : (
                          <View style={styles.suggestionInitials}>
                            <Text style={styles.suggestionInitialsText}>{getInitials(item.name)}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.suggestionMeta} numberOfLines={1}>{item.student_id || 'Student'} - {item.course_short || 'Program'}</Text>
                        </View>
                        <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : suggestLoading ? (
                  <View style={styles.suggestionLoading}>
                    <ActivityIndicator color="#fdb813" size="small" />
                    <Text style={styles.suggestionLoadingText}>Finding students...</Text>
                  </View>
                ) : null}
                {isFaceMode ? (
                  <View style={styles.faceBanner}>
                    <Text style={styles.faceBannerText}>{faceMatches.length} face match{faceMatches.length > 1 ? 'es' : ''} found</Text>
                    <TouchableOpacity onPress={() => { clearFaceResults(); setQuery(''); }}>
                      <Text style={styles.clearFaceText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </ImageBackground>

            <View style={styles.filtersWrap}>
              <FilterDropdown
                label="Program"
                icon="graduation-cap"
                options={courseFilters.map((item) => ({
                  ...item,
                  icon: item.value === 'All Programs' ? 'users' : 'graduation-cap',
                }))}
                value={activeFilter}
                onChange={(value) => {
                  clearFaceResults();
                  setActiveFilter(value);
                }}
              />
              <FilterDropdown
                label="Batch Year"
                icon="calendar"
                options={batchFilters.map((item) => ({
                  ...item,
                  icon: item.value === 'All Years' ? 'calendar' : 'graduation-cap',
                }))}
                value={activeBatchYear}
                onChange={(value) => {
                  clearFaceResults();
                  setActiveBatchYear(value);
                }}
              />
            </View>

            {!loading ? (
              <Text style={styles.resultCount}>
                {isFaceMode ? 'Showing ' : query ? 'Found ' : 'Showing '}
                <Text style={styles.resultStrong}>{isFaceMode ? faceMatches.length : total}</Text>
                {isFaceMode ? ' face matches' : query ? ` results for "${query}"` : ` students${activeFilter !== 'All Programs' ? ` in ${selectedFilterLabel}` : ''}${activeBatchYear !== 'All Years' ? ` from ${activeBatchYear}` : ''}`}
              </Text>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={{ marginTop: 34 }} /> : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="user-times" size={42} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
          </View>
        )}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#1d2b4b" style={{ marginVertical: 20 }} /> : <View style={{ height: 110 }} />}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStudents(1); }} />}
        onEndReached={() => {
          if (!loadingMore && page < lastPage) loadStudents(page + 1, true);
        }}
      />

      <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={() => toggleModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => toggleModal(false)} />
          </Animated.View>

          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
            <FlatList
              data={selectedAchievements}
              keyExtractor={(item, index) => String(item?.id || index)}
              ListHeaderComponent={(
                <View style={styles.profileModalContent}>
                  <View style={styles.blueHeader} />
                  <View style={styles.profileInfoSection}>
                    {getStudentPhoto(selectedStudent) ? <Image source={getStudentPhoto(selectedStudent)} style={styles.largeAvatar} contentFit="cover" /> : (
                      <View style={[styles.largeAvatar, styles.avatarFallback]}>
                        <Text style={styles.largeAvatarFallbackText}>{getInitials(getStudentName(selectedStudent))}</Text>
                      </View>
                    )}
                    <Text style={styles.userName}>{getStudentName(selectedStudent)}</Text>
                    <Text style={styles.userDegree}>{getStudentCourse(selectedStudent)}</Text>
                    <Text style={styles.userYear}>{getStudentYear(selectedStudent)} - {getStudentSection(selectedStudent)}</Text>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.primaryActionButton} onPress={handleSendMessage}>
                        <Text style={styles.primaryActionButtonText}>Message</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.voiceActionButton} onPress={recorderState.isRecording ? handleStopRecording : handleStartRecording}>
                        <FontAwesome name={recorderState.isRecording ? 'stop' : 'microphone'} size={14} color="#1d2b4b" />
                        <Text style={styles.voiceActionButtonText}>{recorderState.isRecording ? 'Stop' : 'Voice'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.contentSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome name="book" size={16} color="#1d2b4b" style={{ marginRight: 10 }} />
                      <Text style={styles.sectionTitle}>ABOUT</Text>
                    </View>
                    <Text style={styles.aboutText}>{selectedStudent?.bio || selectedStudent?.motto || 'No bio has been added yet.'}</Text>
                    <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                      <FontAwesome name="bookmark-o" size={16} color="#1d2b4b" style={{ marginRight: 10 }} />
                      <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
                    </View>
                  </View>
                </View>
              )}
              renderItem={({ item }) => (
                <View style={[styles.achievementCardYellow, { marginHorizontal: 24 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.achievementTitleYellow}>{item?.title || item?.name || 'Achievement'}</Text>
                    <Text style={styles.achievementSubYellow}>{item?.description || item?.date || item?.year || 'Student achievement'}</Text>
                  </View>
                  <FontAwesome name="bookmark-o" size={18} color="#A67C00" />
                </View>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { paddingHorizontal: 24 }]}>No achievements listed.</Text>}
              ListFooterComponent={(
                <View style={styles.voiceSection}>
                  <View style={styles.sectionHeader}>
                    <FontAwesome name="microphone" size={16} color="#1d2b4b" style={{ marginRight: 10 }} />
                    <Text style={styles.sectionTitle}>VOICE MEMORIES</Text>
                  </View>

                  <View style={styles.voiceComposer}>
                    <View style={styles.voiceComposerTop}>
                      <View style={styles.voiceIconCircle}>
                        <FontAwesome name={recorderState.isRecording ? 'circle' : 'microphone'} size={18} color="#fdb813" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.voiceComposerTitle}>{recordedUri ? 'Recording ready' : recorderState.isRecording ? 'Recording voice memory' : 'Send a voice memory'}</Text>
                        <Text style={styles.voiceComposerMeta}>
                          {recorderState.isRecording || recordedUri ? formatDuration(Math.round((recorderState.durationMillis || 0) / 1000)) || '0:00' : 'Audio dedications are reviewed before delivery.'}
                        </Text>
                      </View>
                    </View>

                    <TextInput
                      style={styles.voiceTitleInput}
                      value={voiceTitle}
                      onChangeText={setVoiceTitle}
                      placeholder="Voice memory title"
                      placeholderTextColor="#94a3b8"
                    />

                    <View style={styles.voiceButtonRow}>
                      <TouchableOpacity style={[styles.recordButton, recorderState.isRecording && styles.stopButton]} onPress={recorderState.isRecording ? handleStopRecording : handleStartRecording}>
                        <FontAwesome name={recorderState.isRecording ? 'stop' : 'microphone'} size={14} color={recorderState.isRecording ? '#ffffff' : '#fdb813'} />
                        <Text style={[styles.recordButtonText, recorderState.isRecording && styles.stopButtonText]}>{recorderState.isRecording ? 'Stop Recording' : recordedUri ? 'Re-record' : 'Start Recording'}</Text>
                      </TouchableOpacity>

                      {recordedUri ? (
                        <TouchableOpacity style={styles.sendVoiceButton} onPress={handleSendVoiceNote} disabled={voiceSending}>
                          {voiceSending ? <ActivityIndicator color="#1d2b4b" size="small" /> : <FontAwesome name="paper-plane" size={14} color="#1d2b4b" />}
                          <Text style={styles.sendVoiceButtonText}>Send</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {voiceLoading ? (
                    <ActivityIndicator color="#1d2b4b" style={{ marginTop: 20 }} />
                  ) : voiceNotes.length ? (
                    voiceNotes.map((note) => {
                      const playing = playingVoiceId === note.id;
                      return (
                        <View key={String(note.id)} style={styles.voiceNoteCard}>
                          <View style={styles.voiceNoteInfo}>
                            <Text style={styles.voiceNoteTitle} numberOfLines={1}>{note.title || 'Voice memory'}</Text>
                            <Text style={styles.voiceNoteMeta}>
                              From {note?.sender?.name || 'Classmate'} · {formatDate(note.created_at)}
                              {formatDuration(note.duration_seconds) ? ` · ${formatDuration(note.duration_seconds)}` : ''}
                            </Text>
                            <View style={styles.waveRow}>
                              {Array.from({ length: 18 }, (_, index) => (
                                <View key={String(index)} style={[styles.waveBar, { height: 7 + Math.abs(Math.sin(index * 0.8)) * 12, backgroundColor: playing ? '#fdb813' : '#e2e8f0' }]} />
                              ))}
                            </View>
                          </View>
                          <TouchableOpacity style={[styles.playVoiceButton, playing && styles.playVoiceButtonActive]} onPress={() => toggleVoicePlayback(note)}>
                            <FontAwesome name={playing ? 'pause' : 'play'} size={14} color={playing ? '#1d2b4b' : '#fdb813'} />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.voiceEmpty}>
                      <FontAwesome name="microphone-slash" size={28} color="#cbd5e1" />
                      <Text style={styles.voiceEmptyTitle}>No voice memories yet</Text>
                      <Text style={styles.voiceEmptyText}>Be the first to send a message they can keep.</Text>
                    </View>
                  )}
                </View>
              )}
            />
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  scrollContent: { paddingBottom: 0 },
  hero: { minHeight: 360, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(29,43,75,0.9)' },
  dotPattern: { ...StyleSheet.absoluteFillObject, opacity: 0.05, backgroundColor: 'transparent' },
  heroContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 36, paddingBottom: 30 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(253,184,19,0.15)', borderWidth: 1, borderColor: 'rgba(253,184,19,0.35)', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, marginBottom: 14 },
  heroBadgeText: { color: '#fdb813', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: '#ffffff', fontSize: 32, lineHeight: 38, fontWeight: '900', textAlign: 'center' },
  heroTitleGold: { color: '#fdb813' },
  heroSubtitle: { color: 'rgba(255,255,255,0.74)', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 24, maxWidth: 340 },
  searchShell: { width: '100%', borderRadius: 17, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.08)', paddingLeft: 14 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 14 },
  cameraButton: { width: 40, height: 40, borderRadius: 11, borderWidth: 1, borderColor: '#fdb813', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  faceBanner: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(253,184,19,0.4)', backgroundColor: 'rgba(253,184,19,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  faceBannerText: { color: '#fdb813', fontSize: 12, fontWeight: '800' },
  clearFaceText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  suggestionBox: { width: '100%', marginTop: 10, borderRadius: 16, overflow: 'hidden', backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
  suggestionRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  suggestionAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#eef2ff' },
  suggestionInitials: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  suggestionInitialsText: { color: '#fdb813', fontSize: 12, fontWeight: '900' },
  suggestionName: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  suggestionMeta: { color: '#8fa0bf', fontSize: 11, marginTop: 2 },
  suggestionLoading: { marginTop: 10, alignSelf: 'stretch', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  suggestionLoadingText: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '800' },
  filtersWrap: { paddingTop: 22, paddingHorizontal: 18, paddingBottom: 4, gap: 10 },
  filterContent: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  activeFilterPill: { backgroundColor: '#3f51b5', borderColor: '#3f51b5' },
  filterText: { color: '#1d2b4b', fontSize: 12, fontWeight: '900' },
  activeFilterText: { color: '#ffffff' },
  resultCount: { color: '#94a3b8', textAlign: 'center', fontSize: 12, marginTop: 20, marginBottom: 24 },
  resultStrong: { color: '#1d2b4b', fontWeight: '900' },
  errorText: { color: '#dc2626', textAlign: 'center', marginHorizontal: 20, marginBottom: 16 },
  columnWrapper: { paddingHorizontal: 14, gap: 12 },
  studentCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#dbe3ef', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  leftCard: { marginRight: 0 },
  rightCard: { marginLeft: 0 },
  studentCardMatched: { borderColor: '#fdb813', borderWidth: 2 },
  photoArea: { height: 178, backgroundColor: '#1d2b4b', position: 'relative' },
  cardPhoto: { width: '100%', height: '100%' },
  initialsArea: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d2b4b' },
  initialsText: { color: '#fdb813', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  batchBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(29,43,75,0.86)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  batchText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  matchBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fdb813', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  matchText: { color: '#1d2b4b', fontSize: 10, fontWeight: '900' },
  cardInfo: { minHeight: 84, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 14 },
  name: { color: '#1d2b4b', fontSize: 13, fontWeight: '900', textAlign: 'center', marginBottom: 10, textTransform: 'capitalize' },
  courseBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  courseBadgeText: { color: '#3f51b5', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  emptyContainer: { marginHorizontal: 18, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 54, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 18, fontWeight: '900', marginTop: 16 },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center', marginTop: 6 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  absoluteFill: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: height * 0.9, overflow: 'hidden' },
  profileModalContent: { flex: 1 },
  blueHeader: { height: 150, backgroundColor: '#1d2b4b', width: '100%' },
  profileInfoSection: { alignItems: 'center', marginTop: -70, paddingHorizontal: 24 },
  largeAvatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: '#FFFFFF', backgroundColor: '#eef2ff', marginBottom: 20 },
  avatarFallback: { backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  largeAvatarFallbackText: { color: '#fdb813', fontSize: 44, fontWeight: '900' },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 6, textAlign: 'center' },
  userDegree: { fontSize: 16, color: '#1d2b4b', fontWeight: '500', marginBottom: 4, textAlign: 'center' },
  userYear: { fontSize: 14, color: '#8E8E93', marginBottom: 20 },
  actionButtons: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 30 },
  primaryActionButton: { flex: 1, height: 50, backgroundColor: '#1d2b4b', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  primaryActionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  voiceActionButton: { width: 96, height: 50, backgroundColor: '#fdb813', borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 7 },
  voiceActionButtonText: { color: '#1d2b4b', fontWeight: '900', fontSize: 13 },
  contentSection: { paddingHorizontal: 24, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 0.5 },
  aboutText: { fontSize: 14, color: '#4A4A4A', lineHeight: 22 },
  achievementCardYellow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8e1', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FFF1B8' },
  achievementTitleYellow: { fontSize: 15, fontWeight: 'bold', color: '#874D00', marginBottom: 2 },
  achievementSubYellow: { fontSize: 12, color: '#A67C00' },
  voiceSection: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 44 },
  voiceComposer: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 },
  voiceComposerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  voiceIconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  voiceComposerTitle: { color: '#1d2b4b', fontSize: 15, fontWeight: '900' },
  voiceComposerMeta: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  voiceTitleInput: { height: 44, borderRadius: 12, backgroundColor: '#f4f7fe', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 13, color: '#1d2b4b', fontSize: 13, marginBottom: 12 },
  voiceButtonRow: { flexDirection: 'row', gap: 10 },
  recordButton: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  stopButton: { backgroundColor: '#dc2626' },
  recordButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  stopButtonText: { color: '#ffffff' },
  sendVoiceButton: { width: 92, height: 44, borderRadius: 12, backgroundColor: '#fdb813', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  sendVoiceButtonText: { color: '#1d2b4b', fontSize: 12, fontWeight: '900' },
  voiceNoteCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 15, marginBottom: 12 },
  voiceNoteInfo: { flex: 1, minWidth: 0 },
  voiceNoteTitle: { color: '#1d2b4b', fontSize: 14, fontWeight: '900' },
  voiceNoteMeta: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 22, marginTop: 8 },
  waveBar: { width: 3, borderRadius: 999 },
  playVoiceButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  playVoiceButtonActive: { backgroundColor: '#fdb813' },
  voiceEmpty: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 34, paddingHorizontal: 20, alignItems: 'center' },
  voiceEmptyTitle: { color: '#1d2b4b', fontSize: 15, fontWeight: '900', marginTop: 12 },
  voiceEmptyText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 5 },
});
