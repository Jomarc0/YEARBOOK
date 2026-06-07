import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { createAudioPlayer } from 'expo-audio';
import {
  clearSession,
  fetchCurrentUser,
  getAppConfig,
  getBatchmates,
  getCurrentUser,
  getErrorMessage,
  getProfileStorageUsage,
  getStudent,
  getStudentAchievements,
  getStudentPosts,
  getAlumniMe,
  getVoiceNotesInbox,
  imageUrl,
  updatePassword,
  updateProfileAcademic,
  updateProfileAchievements,
  updateProfileBio,
  deleteProfilePost,
  deleteTaggedPhoto,
  updateProfileMotto,
  updateProfilePhoto,
  updateProfilePost,
  updateProfileVisibility,
  updateAlumniCareer,
  uploadProfileMedia,
  uploadTaggedPhoto,
  unwrap,
  getTaggedPhotos,
} from '../../lib/api';

const { height } = Dimensions.get('window');

const TABS = [
  { key: 'posts', label: 'Posts', icon: 'th-large' },
  { key: 'tagged', label: 'Tagged', icon: 'tag' },
  { key: 'yearbook', label: 'Yearbook', icon: 'book' },
  { key: 'academic', label: 'Academic', icon: 'graduation-cap' },
  { key: 'achievements', label: 'Awards', icon: 'trophy' },
  { key: 'voice', label: 'Voice', icon: 'microphone' },
];

const VISIBILITY = [
  { key: 'public', label: 'Public', icon: 'globe', desc: 'Anyone can view your profile' },
  { key: 'batchmates', label: 'Batchmates', icon: 'users', desc: 'Only students in your batch can view' },
  { key: 'private', label: 'Private', icon: 'lock', desc: 'Only you can view your profile' },
];

const safeStudent = (user: any) => user?.student_record || user?.studentRecord || user?.student || {};
const fullName = (user: any) => user?.name || 'Student';
const profilePhoto = (user: any) => imageUrl(user?.profile_picture || user?.profile_pic || safeStudent(user)?.photo);
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'NU';
const course = (user: any) => safeStudent(user)?.course || user?.course || 'Pioneer Student';
const graduationYear = (user: any) => safeStudent(user)?.graduation_year || user?.graduation_year || user?.batch_year || '';
const studentNo = (user: any) => safeStudent(user)?.student_no || user?.student_id || user?.student_no || '';
const motto = (user: any) => safeStudent(user)?.motto || user?.motto || '';
const isGraduate = (user: any) => Boolean(graduationYear(user));
const isPremium = (user: any) => Boolean(user?.is_premium || user?.is_subscribed || user?.tier === 'premium' || user?.tier === 'standard');
const listFromPayload = (payload: any) => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};
const formatDuration = (seconds?: number) => seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : null;
const audioUrl = (note: any) => imageUrl(note?.audio_url || note?.audio_path);
const isVideoPath = (uri?: string | null) => Boolean(uri && /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(uri));
const isVideoMedia = (media: any) => {
  const resource = String(media?.resource_type || '').toLowerCase();
  const mime = String(media?.mimeType || media?.mime_type || '').toLowerCase();
  const path = String(media?.file_path || media?.url || media?.uri || '').toLowerCase();
  return resource === 'video' || mime.startsWith('video/') || isVideoPath(path);
};
const postMediaItems = (post: any) => {
  if (Array.isArray(post?.media) && post.media.length) return post.media;
  const path = post?.file_path || post?.url || post?.path;
  return path ? [{ file_path: path, resource_type: post?.ai_metadata?.resource_type }] : [];
};
const mediaSource = (media: any) => imageUrl(media?.file_path || media?.url || media?.path || media?.uri);
const formatBytes = (bytes?: number) => {
  const value = Number(bytes || 0);
  if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
};
const storagePercent = (usage: any) => Math.min(100, Math.round((Number(usage?.used_bytes || 0) / Math.max(Number(usage?.limit_bytes || 1), 1)) * 100));

const normalizeAchievement = (item: any) => {
  let meta: any = {};
  try { meta = JSON.parse(item?.type || '{}'); } catch {}
  return {
    id: item?.id ?? null,
    title: item?.title || item?.name || '',
    subtitle: item?.subtitle || item?.description || '',
    icon: meta?.icon || 'fa-star',
    color: meta?.color || '#fdb813',
  };
};

function Avatar({ user, size = 104 }: { user: any; size?: number }) {
  const photo = profilePhoto(user);
  if (photo) return <Image source={photo} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#eef2ff' }} contentFit="cover" />;
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarFallbackText, { fontSize: size * 0.34 }]}>{initials(fullName(user))}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestedTab = typeof params.tab === 'string' ? params.tab : '';
  const requestedPhotoId = typeof params.photoId === 'string' ? params.photoId : '';
  const requestedPhotoUrl = typeof params.photoUrl === 'string' ? params.photoUrl : '';
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [taggedPhotos, setTaggedPhotos] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(requestedTab || 'posts');
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [taggedUploadOpen, setTaggedUploadOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [playingVoice, setPlayingVoice] = useState<any>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const playerRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  const [form, setForm] = useState<any>({
    bio: '',
    motto: '',
    visibility: 'public',
    student_id: '',
    course: '',
    graduation_year: '',
    batch: '',
    job_title: '',
    company: '',
    location: '',
    field: '',
    career_bio: '',
  });
  const [achievementForm, setAchievementForm] = useState<any[]>([]);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [uploadAsset, setUploadAsset] = useState<any>(null);
  const [uploadAssets, setUploadAssets] = useState<any[]>([]);
  const [uploadTagOptions, setUploadTagOptions] = useState<any[]>([]);
  const [uploadTaggedUsers, setUploadTaggedUsers] = useState<any[]>([]);
  const [uploadTagQuery, setUploadTagQuery] = useState('');
  const [taggedAsset, setTaggedAsset] = useState<any>(null);
  const [taggedCaption, setTaggedCaption] = useState('');
  const [postForm, setPostForm] = useState({ caption: '', visibility: 'public' });
  const features = appConfig?.features || {};
  const postsEnabled = features.allow_student_posts !== false;
  const premiumEnabled = features.enable_premium_subscription !== false;
  const premiumBadgeEnabled = features.premium_badge_display !== false;
  const yearbookEnabled = features.enable_flipbook_viewer !== false && features.publish_yearbook !== false;
  const schoolName = appConfig?.school_name || 'National University Lipa';

  const hydrateForms = useCallback((nextUser: any, nextAchievements: any[]) => {
    setForm({
      bio: nextUser?.bio || '',
      motto: motto(nextUser),
      visibility: nextUser?.profile_visibility === 'alumni_only' ? 'batchmates' : (nextUser?.profile_visibility || 'public'),
      student_id: studentNo(nextUser),
      course: course(nextUser) === 'Pioneer Student' ? '' : course(nextUser),
      graduation_year: graduationYear(nextUser) ? String(graduationYear(nextUser)) : '',
      batch: nextUser?.batch || safeStudent(nextUser)?.batch || '',
      job_title: nextUser?.career?.job_title || nextUser?.careerProfile?.job_title || '',
      company: nextUser?.career?.company || nextUser?.careerProfile?.company || '',
      location: nextUser?.career?.location || nextUser?.careerProfile?.location || '',
      field: nextUser?.career?.field || nextUser?.careerProfile?.field || '',
      career_bio: nextUser?.career?.bio || nextUser?.careerProfile?.bio || '',
    });
    setAchievementForm(nextAchievements.map(normalizeAchievement));
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const cached = await getCurrentUser();
      if (cached) setUser(cached);

      const [fresh, configPayload] = await Promise.all([
        fetchCurrentUser(),
        getAppConfig().catch(() => null),
      ]);
      if (configPayload) setAppConfig(unwrap(configPayload));
      const userId = fresh?.id || cached?.id;
      const profilePayload = userId ? await getStudent(userId).catch(() => fresh) : fresh;
      const profile = unwrap(profilePayload) || fresh || cached;

      const [postsResult, achievementsResult, taggedResult, voiceResult, alumniResult] = await Promise.allSettled([
        userId ? getStudentPosts(userId) : Promise.resolve([]),
        userId ? getStudentAchievements(userId) : Promise.resolve([]),
        userId ? getTaggedPhotos(userId) : Promise.resolve([]),
        getVoiceNotesInbox(),
        getAlumniMe(),
      ]);

      const nextPosts = postsResult.status === 'fulfilled' ? listFromPayload(postsResult.value) : [];
      const nextAchievements = achievementsResult.status === 'fulfilled' ? listFromPayload(achievementsResult.value) : [];
      const nextTagged = taggedResult.status === 'fulfilled' ? listFromPayload(taggedResult.value) : [];
      const nextVoice = voiceResult.status === 'fulfilled' ? listFromPayload(voiceResult.value) : [];

      const alumniProfile = alumniResult.status === 'fulfilled' ? unwrap(alumniResult.value) : null;
      const mergedProfile = alumniProfile ? { ...profile, career: alumniProfile.career } : profile;

      setUser(mergedProfile);
      setPosts(nextPosts);
      setTaggedPhotos(nextTagged);
      setAchievements(nextAchievements);
      setVoiceNotes(nextVoice);
      hydrateForms(mergedProfile, nextAchievements);
      getProfileStorageUsage()
        .then((payload) => setStorageUsage(unwrap(payload)))
        .catch(() => setStorageUsage(null));
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load your profile.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hydrateForms, refreshing]);

  useFocusEffect(
    React.useCallback(() => {
      if (requestedTab && TABS.some((item) => item.key === requestedTab)) setActiveTab(requestedTab);
      loadProfile();
    }, [loadProfile, requestedTab])
  );

  const openSheet = (type: 'settings' | 'password') => {
    if (type === 'settings') setSettingsOpen(true);
    else setPasswordOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: height, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setSettingsOpen(false);
      setPasswordOpen(false);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    });
  };

  const handlePickProfilePicture = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      setSaving(true);
      const asset = result.assets[0];
      const data = new FormData();
      data.append('photo', {
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);
      await updateProfilePhoto(data);
      await loadProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (requestError: any) {
      Alert.alert('Upload failed', getErrorMessage(requestError, 'Unable to update profile photo.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePickPostMedia = async () => {
    if (!postsEnabled) {
      Alert.alert('Posts disabled', 'Student posts are currently disabled by platform settings.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a post.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploadAsset(result.assets[0]);
    setUploadAssets(result.assets);
    setUploadTaggedUsers([]);
    setUploadTagQuery('');
    setPostForm({ caption: '', visibility: 'public' });
    getBatchmates({ per_page: 30 })
      .then((payload) => setUploadTagOptions(listFromPayload(payload)))
      .catch(() => setUploadTagOptions([]));
    setUploadOpen(true);
  };

  const submitPostUpload = async () => {
    if (!postsEnabled) {
      Alert.alert('Posts disabled', 'Student posts are currently disabled by platform settings.');
      return;
    }

    const assets = uploadAssets.length ? uploadAssets : uploadAsset ? [uploadAsset] : [];
    if (!assets.length) return;
    try {
      setSaving(true);
      const data = new FormData();
      assets.forEach((asset, index) => {
        data.append('files[]', {
          uri: asset.uri,
          name: asset.fileName || `profile-post-${index + 1}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        } as any);
      });
      data.append('caption', postForm.caption);
      data.append('visibility', postForm.visibility);
      uploadTaggedUsers.forEach((student) => data.append('tagged_user_ids[]', String(student.id)));

      await uploadProfileMedia(data);
      getProfileStorageUsage()
        .then((payload) => setStorageUsage(unwrap(payload)))
        .catch(() => {});
      setUploadOpen(false);
      setUploadAsset(null);
      setUploadAssets([]);
      setUploadTaggedUsers([]);
      setUploadTagQuery('');
      await loadProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (requestError: any) {
      const message = getErrorMessage(requestError, 'Unable to upload this post.');
      if (requestError?.response?.status === 403) {
        Alert.alert('Upgrade required', message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Premium', onPress: () => router.push('/payment' as any) },
        ]);
      } else {
        Alert.alert('Upload failed', message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePickTaggedPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a tagged photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    setTaggedAsset(result.assets[0]);
    setTaggedCaption('');
    setTaggedUploadOpen(true);
  };

  const submitTaggedPhoto = async () => {
    if (!taggedAsset?.uri || !user?.id) return;
    try {
      setSaving(true);
      const data = new FormData();
      data.append('photo', {
        uri: taggedAsset.uri,
        name: taggedAsset.fileName || 'tagged-photo.jpg',
        type: taggedAsset.mimeType || 'image/jpeg',
      } as any);
      data.append('user_id', String(user.id));
      data.append('caption', taggedCaption);

      await uploadTaggedPhoto(data);
      setTaggedUploadOpen(false);
      setTaggedAsset(null);
      setTaggedCaption('');
      await loadProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (requestError: any) {
      Alert.alert('Upload failed', getErrorMessage(requestError, 'Unable to upload this tagged photo.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTaggedPhoto = (photo: any) => {
    if (!photo?.id) return;
    Alert.alert('Remove tagged photo?', 'This removes the photo from your tagged gallery.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await deleteTaggedPhoto(photo.id);
            await loadProfile();
          } catch (requestError: any) {
            Alert.alert('Remove failed', getErrorMessage(requestError, 'Unable to remove this tagged photo.'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const openPostManager = (post: any) => {
    setSelectedPost(post);
    setPostForm({
      caption: post?.caption || '',
      visibility: post?.visibility === 'friends' ? 'batchmates' : (post?.visibility || 'public'),
    });
    setUploadTaggedUsers(post?.tagged_users || post?.tagged_students || []);
    setUploadTagQuery('');
    getBatchmates({ per_page: 30 })
      .then((payload) => setUploadTagOptions(listFromPayload(payload)))
      .catch(() => setUploadTagOptions([]));
    setPostOpen(true);
  };

  const savePostChanges = async () => {
    if (!selectedPost?.id) return;
    try {
      setSaving(true);
      await updateProfilePost(selectedPost.id, {
        caption: postForm.caption,
        visibility: postForm.visibility,
        tagged_user_ids: uploadTaggedUsers.map((student) => student.id),
      });
      setPostOpen(false);
      setSelectedPost(null);
      setUploadTaggedUsers([]);
      setUploadTagQuery('');
      await loadProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (requestError: any) {
      Alert.alert('Save failed', getErrorMessage(requestError, 'Unable to update this post.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePost = () => {
    if (!selectedPost?.id) return;
    Alert.alert('Delete post?', 'This removes the post from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await deleteProfilePost(selectedPost.id);
            setPostOpen(false);
            setSelectedPost(null);
            await loadProfile();
          } catch (requestError: any) {
            Alert.alert('Delete failed', getErrorMessage(requestError, 'Unable to delete this post.'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await Promise.all([
        updateProfileBio(form.bio),
        updateProfileMotto(form.motto),
        updateProfileVisibility(form.visibility),
        updateProfileAcademic({
          student_id: form.student_id || null,
          course: form.course || null,
          graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
          batch: form.batch || null,
        }),
        updateAlumniCareer({
          job_title: form.job_title || null,
          company: form.company || null,
          location: form.location || null,
          field: form.field || null,
          bio: form.career_bio || null,
        }),
        updateProfileAchievements(achievementForm.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          type: JSON.stringify({ icon: item.icon || 'fa-star', color: item.color || '#fdb813' }),
        }))),
      ]);
      await loadProfile();
      closeSheet();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (requestError: any) {
      Alert.alert('Save failed', getErrorMessage(requestError, 'Unable to save profile settings.'));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.password || !passwordForm.password_confirmation) {
      Alert.alert('Missing fields', 'Please complete all password fields.');
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      Alert.alert('Password mismatch', 'New password and confirmation must match.');
      return;
    }
    try {
      setSaving(true);
      await updatePassword(passwordForm);
      closeSheet();
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (requestError: any) {
      Alert.alert('Update failed', getErrorMessage(requestError, 'Unable to update password.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await clearSession();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.replace('/login');
  };

  const toggleVoice = (note: any) => {
    const url = audioUrl(note);
    if (!url) return;
    if (playingVoice === note.id) {
      playerRef.current?.pause?.();
      setPlayingVoice(null);
      return;
    }
    playerRef.current?.pause?.();
    playerRef.current?.remove?.();
    const player = createAudioPlayer({ uri: url });
    playerRef.current = player;
    setPlayingVoice(note.id);
    player.play();
  };

  const addAchievement = () => setAchievementForm((current) => [...current, { id: null, title: '', subtitle: '', icon: 'fa-star', color: '#fdb813' }]);
  const updateAchievement = (index: number, patch: any) => setAchievementForm((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const removeAchievement = (index: number) => setAchievementForm((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const stats = useMemo(() => [
    { label: 'Posts', value: posts.length },
    { label: 'Views', value: user?.profile_views || 0 },
    { label: 'Program', value: course(user).split(' ').map((part: string) => part[0]).join('').slice(0, 6) || 'NU' },
  ], [posts.length, user]);

  const renderHeader = () => (
    <>
      <View style={styles.profileCard}>
        <View style={styles.cover}>
          <View style={styles.coverDot} />
          <View style={styles.coverGlow} />
        </View>
        <View style={styles.profileBody}>
          <TouchableOpacity style={styles.avatarRing} onPress={handlePickProfilePicture} disabled={saving}>
            <Avatar user={user} size={104} />
            <View style={styles.editBadge}>
              <FontAwesome name="camera" size={11} color="#1d2b4b" />
            </View>
          </TouchableOpacity>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{fullName(user)}</Text>
            {premiumBadgeEnabled && isPremium(user) && (
              <View style={styles.tierBadge}>
                <FontAwesome name="star" size={10} color="#1d2b4b" />
                <Text style={styles.tierText}>{user?.tier === 'standard' ? 'Standard' : 'Premium'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.meta}>{course(user)} - {schoolName}</Text>
          {isGraduate(user) ? <Text style={styles.gradBadge}>GRADUATE {graduationYear(user)}</Text> : null}

          <View style={styles.actionRow}>
            {(premiumEnabled && !isPremium(user)) || (isPremium(user) && yearbookEnabled) ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => isPremium(user) ? router.push('/yearbook') : router.push('/payment' as any)}>
                <FontAwesome name={isPremium(user) ? 'book' : 'star'} size={14} color="#fdb813" />
                <Text style={styles.primaryButtonText}>{isPremium(user) ? 'View Yearbook' : 'Go Premium'}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.iconButton} onPress={() => openSheet('settings')}>
              <FontAwesome name="pencil" size={16} color="#1d2b4b" />
            </TouchableOpacity>
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
          const active = activeTab === item.key;
          if (item.key === 'yearbook' && !isGraduate(user)) return null;
          return (
            <TouchableOpacity key={item.key} style={[styles.tab, active && styles.tabActive]} onPress={() => setActiveTab(item.key)}>
              <FontAwesome name={item.icon as any} size={13} color={active ? '#fdb813' : '#94a3b8'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );

  const renderContent = () => {
    if (loading) return <ActivityIndicator color="#1d2b4b" style={{ marginTop: 34 }} />;

    if (activeTab === 'posts') {
      return (
        <>
          {postsEnabled ? (
            <View style={styles.postActionRow}>
              <TouchableOpacity style={styles.uploadButton} onPress={handlePickPostMedia} disabled={saving}>
                <FontAwesome name="plus" size={13} color="#fdb813" />
                <Text style={styles.uploadButtonText}>Upload Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.featureNotice}>
              <FontAwesome name="lock" size={13} color="#92590e" />
              <Text style={styles.featureNoticeText}>Student posts are currently disabled.</Text>
            </View>
          )}
          {posts.length ? (
            <View style={styles.postGrid}>
              {posts.map((post) => {
                const media = postMediaItems(post)[0];
                const uri = mediaSource(media);
                const video = isVideoMedia(media);
                return (
                  <TouchableOpacity key={String(post?.id)} style={styles.postCell} onPress={() => openPostManager(post)} activeOpacity={0.88}>
                    {uri && !video ? (
                      <Image source={uri} style={styles.postImage} contentFit="cover" />
                    ) : uri && video ? (
                      <View style={styles.videoTile}>
                        <FontAwesome name="video-camera" size={22} color="#fdb813" />
                        <Text style={styles.videoTileText}>Video</Text>
                      </View>
                    ) : (
                      <FontAwesome name="camera" size={26} color="#cbd5e1" />
                    )}
                    {!!post?.caption && <View style={styles.captionStrip}><Text style={styles.captionStripText} numberOfLines={1}>{post.caption}</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : <Empty icon="camera" title="No Posts Yet" text="Upload a memory to show on your profile." />}
        </>
      );
    }

    if (activeTab === 'tagged') {
      return (
        <>
          {requestedPhotoUrl ? (
            <View style={styles.deepLinkPreview}>
              <FontAwesome name="image" size={14} color="#fdb813" />
              <View style={{ flex: 1 }}>
                <Text style={styles.deepLinkPreviewTitle}>Tagged photo from notification</Text>
                <Text style={styles.deepLinkPreviewText} numberOfLines={1}>{requestedPhotoUrl}</Text>
              </View>
            </View>
          ) : null}
          <View style={styles.postActionRow}>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickTaggedPhoto} disabled={saving}>
              <FontAwesome name="tag" size={13} color="#fdb813" />
              <Text style={styles.uploadButtonText}>Add Tagged Photo</Text>
            </TouchableOpacity>
          </View>
          {taggedPhotos.length ? (
            <View style={styles.taggedGrid}>
              {taggedPhotos.map((photo) => {
                const photoSource = imageUrl(photo?.photo_url || photo?.photo_path || photo?.file_path);
                const highlighted = requestedPhotoId && String(photo?.id || photo?.photo_id) === requestedPhotoId;
                return (
                  <TouchableOpacity key={String(photo?.id)} style={[styles.taggedCell, highlighted && styles.taggedCellHighlighted]} onLongPress={() => confirmDeleteTaggedPhoto(photo)} activeOpacity={0.9}>
                    {photoSource ? <Image source={photoSource} style={styles.postImage} contentFit="cover" /> : <FontAwesome name="image" size={26} color="#cbd5e1" />}
                    <View style={styles.taggedOverlay}>
                      <FontAwesome name="tag" size={10} color="#fdb813" />
                      <Text style={styles.taggedOverlayText} numberOfLines={1}>{photo?.caption || photo?.created_at || 'Tagged photo'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : <Empty icon="tags" title="No Tagged Photos Yet" text="Photos tagged to your profile will appear here." />}
        </>
      );
    }

    if (activeTab === 'yearbook') {
      return (
        <View style={styles.card}>
          <InfoRow icon="graduation-cap" label="Class Of" value={graduationYear(user) || 'Not set'} />
          <InfoRow icon="quote-left" label="Motto" value={motto(user) || 'No motto yet.'} />
          <InfoRow icon="heart" label="Fondest Memory" value={safeStudent(user)?.fondest_memory || user?.fondest_memory || 'No memory added yet.'} />
          <InfoRow icon="rocket" label="Future Plans" value={safeStudent(user)?.future_plans || user?.future_plans || 'No future plans added yet.'} />
        </View>
      );
    }

    if (activeTab === 'academic') {
      return (
        <View style={styles.card}>
          <InfoRow icon="id-card" label="Student ID" value={studentNo(user) || 'Not set'} />
          <InfoRow icon="book" label="Course" value={course(user)} />
          <InfoRow icon="calendar" label="Graduation Year" value={graduationYear(user) || 'Not set'} />
          <InfoRow icon="users" label="Batch" value={user?.batch || safeStudent(user)?.batch || 'Not set'} />
          <InfoRow icon="briefcase" label="Career" value={user?.career?.job_title || 'Not set'} />
          <InfoRow icon="building" label="Company" value={user?.career?.company || 'Not set'} />
          <InfoRow icon="map-marker" label="Location" value={user?.career?.location || 'Not set'} />
          <InfoRow icon="tag" label="Field" value={user?.career?.field || 'Not set'} />
        </View>
      );
    }

    if (activeTab === 'achievements') {
      return achievements.length ? (
        <View style={styles.card}>
          {achievements.map((item, index) => {
            const achievement = normalizeAchievement(item);
            return (
              <View key={String(achievement.id || index)} style={[styles.achievementRow, index < achievements.length - 1 && styles.rowBorder]}>
                <View style={styles.awardIcon}>
                  <FontAwesome name="trophy" size={15} color={achievement.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{achievement.title || 'Achievement'}</Text>
                  <Text style={styles.rowText}>{achievement.subtitle || 'No description'}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : <Empty icon="trophy" title="No Achievements Yet" text="Add achievements from Profile Settings." />;
    }

    if (activeTab === 'voice') {
      return voiceNotes.length ? (
        <View style={styles.card}>
          {voiceNotes.map((note, index) => {
            const playing = playingVoice === note.id;
            return (
              <View key={String(note.id || index)} style={[styles.voiceRow, index < voiceNotes.length - 1 && styles.rowBorder]}>
                <View style={styles.voiceCopy}>
                  <Text style={styles.rowTitle}>{note?.title || 'Voice Memory'}</Text>
                  <Text style={styles.rowText}>From {note?.sender?.name || 'Classmate'}{formatDuration(note?.duration_seconds) ? ` · ${formatDuration(note.duration_seconds)}` : ''}</Text>
                  <View style={styles.waveRow}>
                    {Array.from({ length: 18 }, (_, waveIndex) => (
                      <View key={String(waveIndex)} style={[styles.waveBar, { height: 7 + Math.abs(Math.sin(waveIndex * 0.8)) * 12, backgroundColor: playing ? '#fdb813' : '#e2e8f0' }]} />
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={[styles.playButton, playing && styles.playButtonActive]} onPress={() => toggleVoice(note)}>
                  <FontAwesome name={playing ? 'pause' : 'play'} size={13} color={playing ? '#1d2b4b' : '#fdb813'} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : <Empty icon="microphone-slash" title="No Voice Notes Yet" text="Approved voice memories from classmates will appear here." />;
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

      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.footerButton} onPress={() => openSheet('password')}>
          <FontAwesome name="lock" size={15} color="#1d2b4b" />
          <Text style={styles.footerButtonText}>Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerButton, styles.logoutButton]} onPress={handleSignOut}>
          <FontAwesome name="sign-out" size={15} color="#dc2626" />
          <Text style={[styles.footerButtonText, { color: '#dc2626' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <SettingsModal
        visible={settingsOpen}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
        closeSheet={closeSheet}
        form={form}
        setForm={setForm}
        achievementForm={achievementForm}
        addAchievement={addAchievement}
        updateAchievement={updateAchievement}
        removeAchievement={removeAchievement}
        saveSettings={saveSettings}
        saving={saving}
      />

      <PasswordModal
        visible={passwordOpen}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
        closeSheet={closeSheet}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        savePassword={savePassword}
        saving={saving}
      />

      <PostEditorModal
        visible={uploadOpen}
        title="Upload Post"
        storageUsage={storageUsage}
        imageUri={uploadAsset?.uri}
        imageUris={uploadAssets.map((asset) => asset.uri)}
        mediaItems={uploadAssets.length ? uploadAssets : uploadAsset ? [uploadAsset] : []}
        postForm={postForm}
        setPostForm={setPostForm}
        tagOptions={uploadTagOptions}
        taggedUsers={uploadTaggedUsers}
        setTaggedUsers={setUploadTaggedUsers}
        tagQuery={uploadTagQuery}
        setTagQuery={setUploadTagQuery}
        onClose={() => { setUploadOpen(false); setUploadAsset(null); setUploadAssets([]); setUploadTaggedUsers([]); setUploadTagQuery(''); }}
        onSave={submitPostUpload}
        saving={saving}
        saveLabel="Upload"
      />

      <TaggedPhotoModal
        visible={taggedUploadOpen}
        imageUri={taggedAsset?.uri}
        caption={taggedCaption}
        setCaption={setTaggedCaption}
        onClose={() => { setTaggedUploadOpen(false); setTaggedAsset(null); setTaggedCaption(''); }}
        onSave={submitTaggedPhoto}
        saving={saving}
      />

      <PostEditorModal
        visible={postOpen}
        title="Edit Post"
        imageUri={mediaSource(postMediaItems(selectedPost)[0])}
        mediaItems={postMediaItems(selectedPost)}
        postForm={postForm}
        setPostForm={setPostForm}
        tagOptions={uploadTagOptions}
        taggedUsers={uploadTaggedUsers}
        setTaggedUsers={setUploadTaggedUsers}
        tagQuery={uploadTagQuery}
        setTagQuery={setUploadTagQuery}
        onClose={() => { setPostOpen(false); setSelectedPost(null); setUploadTaggedUsers([]); setUploadTagQuery(''); }}
        onSave={savePostChanges}
        onDelete={confirmDeletePost}
        saving={saving}
        saveLabel="Save Changes"
      />
    </SafeAreaView>
  );
}

function TaggedPhotoModal(props: any) {
  const { visible, imageUri, caption, setCaption, onClose, onSave, saving } = props;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tagged Photo</Text>
          <TouchableOpacity onPress={onClose}><FontAwesome name="times" size={20} color="#94a3b8" /></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} contentContainerStyle={{ padding: 18, paddingBottom: 34 }}>
          {imageUri ? <Image source={imageUri} style={styles.postPreview} contentFit="cover" /> : null}
          <Text style={styles.inputLabel}>CAPTION</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={160}
            placeholder="Add a short caption..."
          />
          <Text style={styles.helperText}>This will tag the photo to your profile and store it in Laravel.</Text>
          <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Uploading...' : 'Upload Tagged Photo'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function AudiencePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const options = [
    { key: 'public', label: 'Public', icon: 'globe' },
    { key: 'batchmates', label: 'Batchmates', icon: 'users' },
    { key: 'private', label: 'Private', icon: 'lock' },
  ];
  return (
    <View style={styles.audienceRow}>
      {options.map((item) => {
        const active = value === item.key;
        return (
          <TouchableOpacity key={item.key} style={[styles.audienceOption, active && styles.audienceActive]} onPress={() => onChange(item.key)}>
            <FontAwesome name={item.icon as any} size={12} color={active ? '#fdb813' : '#94a3b8'} />
            <Text style={[styles.audienceText, active && styles.audienceTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PostEditorModal(props: any) {
  const {
    visible,
    title,
    storageUsage,
    imageUri,
    imageUris = [],
    mediaItems = [],
    postForm,
    setPostForm,
    tagOptions = [],
    taggedUsers = [],
    setTaggedUsers,
    tagQuery = '',
    setTagQuery,
    onClose,
    onSave,
    onDelete,
    saving,
    saveLabel,
  } = props;
  const uploadMode = !onDelete;
  const canEditTags = Boolean(setTaggedUsers);
  const normalizedMediaItems = mediaItems.length
    ? mediaItems
    : (imageUris.length ? imageUris.map((uri: string) => ({ uri })) : imageUri ? [{ uri: imageUri }] : []);
  const previewUris = normalizedMediaItems.map((item: any) => mediaSource(item)).filter(Boolean);
  const firstMedia = normalizedMediaItems[0];
  const firstUri = previewUris[0];
  const firstIsVideo = isVideoMedia(firstMedia);
  const filteredTags = tagOptions.filter((student: any) => {
    const needle = tagQuery.trim().toLowerCase();
    if (!needle) return true;
    return `${student?.name || ''} ${student?.course || ''}`.toLowerCase().includes(needle);
  }).slice(0, 8);
  const toggleTaggedUser = (student: any) => {
    if (!setTaggedUsers) return;
    setTaggedUsers((current: any[]) => (
      current.some((item) => item.id === student.id)
        ? current.filter((item) => item.id !== student.id)
        : [...current, student]
    ));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}><FontAwesome name="times" size={20} color="#94a3b8" /></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 34 }}>
          {uploadMode && storageUsage ? (
            <View style={styles.storageCard}>
              <View style={styles.storageTop}>
                <View style={styles.storageTier}>
                  <FontAwesome name={storageUsage.tier === 'premium' ? 'star' : storageUsage.tier === 'standard' ? 'bolt' : 'user'} size={12} color="#1d2b4b" />
                  <Text style={styles.storageTierText}>{storageUsage.tier_label || storageUsage.tier || 'Free'}</Text>
                </View>
                <Text style={styles.storagePercentText}>{storagePercent(storageUsage)}% used</Text>
              </View>
              <View style={styles.storageTrack}>
                <View style={[styles.storageFill, { width: `${storagePercent(storageUsage)}%` }]} />
              </View>
              <Text style={styles.storageText}>{formatBytes(storageUsage.used_bytes)} of {formatBytes(storageUsage.limit_bytes)} used before this upload.</Text>
            </View>
          ) : null}
          {firstUri ? (
            <>
              {firstIsVideo ? (
                <View style={styles.videoPreview}>
                  <FontAwesome name="video-camera" size={30} color="#fdb813" />
                  <Text style={styles.videoPreviewTitle}>Video post</Text>
                  <Text style={styles.videoPreviewText} numberOfLines={1}>{String(firstMedia?.fileName || firstMedia?.file_path || firstMedia?.uri || 'Attached video').split('/').pop()}</Text>
                  {!uploadMode ? (
                    <TouchableOpacity style={styles.openMediaButton} onPress={() => Linking.openURL(firstUri)}>
                      <FontAwesome name="external-link" size={12} color="#1d2b4b" />
                      <Text style={styles.openMediaButtonText}>Open Video</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <Image source={firstUri} style={styles.postPreview} contentFit="cover" />
              )}
              {previewUris.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewStrip}>
                  {normalizedMediaItems.map((item: any, index: number) => {
                    const uri = mediaSource(item);
                    const video = isVideoMedia(item);
                    return (
                    <View key={`${uri}-${index}`} style={styles.previewThumbWrap}>
                      {uri && !video ? <Image source={uri} style={styles.previewThumb} contentFit="cover" /> : (
                        <View style={styles.previewVideoThumb}>
                          <FontAwesome name="video-camera" size={16} color="#fdb813" />
                        </View>
                      )}
                      <Text style={styles.previewThumbBadge}>{index + 1}</Text>
                    </View>
                  );})}
                </ScrollView>
              ) : null}
              {uploadMode ? <Text style={styles.helperText}>{previewUris.length} media file{previewUris.length === 1 ? '' : 's'} selected.</Text> : null}
            </>
          ) : null}
          <Text style={styles.inputLabel}>CAPTION</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={postForm.caption}
            onChangeText={(caption) => setPostForm((current: any) => ({ ...current, caption }))}
            multiline
            placeholder="Write a caption..."
          />
          <Text style={styles.inputLabel}>AUDIENCE</Text>
          <AudiencePicker value={postForm.visibility} onChange={(visibility) => setPostForm((current: any) => ({ ...current, visibility }))} />

          {canEditTags ? (
            <>
              <Text style={styles.inputLabel}>TAG PEOPLE</Text>
              <View style={styles.tagSearchBox}>
                <FontAwesome name="search" size={12} color="#94a3b8" />
                <TextInput
                  style={styles.tagSearchInput}
                  value={tagQuery}
                  onChangeText={setTagQuery}
                  placeholder="Search batchmates..."
                  placeholderTextColor="#94a3b8"
                />
              </View>
              {taggedUsers.length ? (
                <View style={styles.selectedTagWrap}>
                  {taggedUsers.map((student: any) => (
                    <TouchableOpacity key={student.id} style={styles.selectedTagPill} onPress={() => toggleTaggedUser(student)}>
                      <Text style={styles.selectedTagText}>{student.name}</Text>
                      <FontAwesome name="times" size={9} color="#3f51b5" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <View style={styles.tagOptionList}>
                {filteredTags.map((student: any) => {
                  const selected = taggedUsers.some((item: any) => item.id === student.id);
                  return (
                    <TouchableOpacity key={student.id} style={[styles.tagOptionRow, selected && styles.tagOptionActive]} onPress={() => toggleTaggedUser(student)}>
                      <Avatar user={student} size={30} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tagOptionName} numberOfLines={1}>{student.name}</Text>
                        <Text style={styles.tagOptionMeta} numberOfLines={1}>{student.course || 'Student'}</Text>
                      </View>
                      {selected ? <FontAwesome name="check-circle" size={16} color="#3f51b5" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : saveLabel}</Text>
          </TouchableOpacity>
          {onDelete ? (
            <TouchableOpacity style={styles.deletePostButton} onPress={onDelete} disabled={saving}>
              <FontAwesome name="trash" size={14} color="#dc2626" />
              <Text style={styles.deletePostText}>Delete Post</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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

function SettingsModal(props: any) {
  const { visible, fadeAnim, slideAnim, closeSheet, form, setForm, achievementForm, addAchievement, updateAchievement, removeAchievement, saveSettings, saving } = props;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeSheet}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSheet} />
        </Animated.View>
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Settings</Text>
              <TouchableOpacity onPress={closeSheet}><FontAwesome name="times" size={20} color="#94a3b8" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.inputLabel}>BIO</Text>
              <TextInput style={[styles.input, styles.textArea]} value={form.bio} onChangeText={(bio) => setForm((current: any) => ({ ...current, bio }))} multiline placeholder="Tell your batchmates about you..." />

              <Text style={styles.inputLabel}>MOTTO</Text>
              <TextInput style={styles.input} value={form.motto} onChangeText={(mottoText) => setForm((current: any) => ({ ...current, motto: mottoText }))} placeholder="Your yearbook quote..." />

              <Text style={styles.inputLabel}>VISIBILITY</Text>
              {VISIBILITY.map((item) => (
                <TouchableOpacity key={item.key} style={[styles.visibilityOption, form.visibility === item.key && styles.visibilityActive]} onPress={() => setForm((current: any) => ({ ...current, visibility: item.key }))}>
                  <FontAwesome name={item.icon as any} size={15} color={form.visibility === item.key ? '#fdb813' : '#94a3b8'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.visibilityTitle}>{item.label}</Text>
                    <Text style={styles.visibilityDesc}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={styles.inputLabel}>ACADEMIC INFO</Text>
              <TextInput style={styles.input} value={form.student_id} onChangeText={(student_id) => setForm((current: any) => ({ ...current, student_id }))} placeholder="Student ID" />
              <TextInput style={styles.input} value={form.course} onChangeText={(nextCourse) => setForm((current: any) => ({ ...current, course: nextCourse }))} placeholder="Course" />
              <TextInput style={styles.input} value={form.graduation_year} onChangeText={(graduation_year) => setForm((current: any) => ({ ...current, graduation_year }))} placeholder="Graduation year" keyboardType="numeric" />
              <TextInput style={styles.input} value={form.batch} onChangeText={(batch) => setForm((current: any) => ({ ...current, batch }))} placeholder="Batch" />

              <Text style={styles.inputLabel}>ALUMNI CAREER</Text>
              <TextInput style={styles.input} value={form.job_title} onChangeText={(job_title) => setForm((current: any) => ({ ...current, job_title }))} placeholder="Job title" />
              <TextInput style={styles.input} value={form.company} onChangeText={(company) => setForm((current: any) => ({ ...current, company }))} placeholder="Company" />
              <TextInput style={styles.input} value={form.location} onChangeText={(location) => setForm((current: any) => ({ ...current, location }))} placeholder="Location" />
              <TextInput style={styles.input} value={form.field} onChangeText={(field) => setForm((current: any) => ({ ...current, field }))} placeholder="Career field" />
              <TextInput style={[styles.input, styles.textArea]} value={form.career_bio} onChangeText={(career_bio) => setForm((current: any) => ({ ...current, career_bio }))} multiline placeholder="Short career bio..." />

              <View style={styles.modalSectionHeader}>
                <Text style={styles.inputLabel}>ACHIEVEMENTS</Text>
                <TouchableOpacity onPress={addAchievement}><Text style={styles.addText}>+ Add</Text></TouchableOpacity>
              </View>
              {achievementForm.map((item: any, index: number) => (
                <View key={String(index)} style={styles.achievementEditor}>
                  <TouchableOpacity style={styles.removeAchievement} onPress={() => removeAchievement(index)}>
                    <FontAwesome name="times" size={12} color="#dc2626" />
                  </TouchableOpacity>
                  <TextInput style={styles.input} value={item.title} onChangeText={(title) => updateAchievement(index, { title })} placeholder="Achievement title" />
                  <TextInput style={styles.input} value={item.subtitle} onChangeText={(subtitle) => updateAchievement(index, { subtitle })} placeholder="Description / event" />
                </View>
              ))}

              <TouchableOpacity style={styles.saveButton} onPress={saveSettings} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile Settings'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function PasswordModal(props: any) {
  const { visible, fadeAnim, slideAnim, closeSheet, passwordForm, setPasswordForm, savePassword, saving } = props;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeSheet}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSheet} />
        </Animated.View>
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={closeSheet}><FontAwesome name="times" size={20} color="#94a3b8" /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
            <TextInput style={styles.input} secureTextEntry value={passwordForm.current_password} onChangeText={(current_password) => setPasswordForm((current: any) => ({ ...current, current_password }))} />
            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <TextInput style={styles.input} secureTextEntry value={passwordForm.password} onChangeText={(password) => setPasswordForm((current: any) => ({ ...current, password }))} />
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <TextInput style={styles.input} secureTextEntry value={passwordForm.password_confirmation} onChangeText={(password_confirmation) => setPasswordForm((current: any) => ({ ...current, password_confirmation }))} />
            <TouchableOpacity style={styles.saveButton} onPress={savePassword} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  content: { paddingBottom: 120 },
  profileCard: { margin: 14, backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  cover: { height: 136, backgroundColor: '#1d2b4b', overflow: 'hidden' },
  coverDot: { ...StyleSheet.absoluteFillObject, opacity: 0.08, backgroundColor: '#fdb813' },
  coverGlow: { position: 'absolute', right: -58, top: -70, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(253,184,19,0.08)' },
  profileBody: { paddingHorizontal: 20, paddingBottom: 22, alignItems: 'center' },
  avatarRing: { marginTop: -58, padding: 4, backgroundColor: '#ffffff', borderRadius: 60, borderWidth: 3, borderColor: '#fdb813' },
  avatarFallback: { backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: '#fdb813', fontWeight: '900' },
  editBadge: { position: 'absolute', right: 2, bottom: 7, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fdb813', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  name: { color: '#1d2b4b', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tierText: { color: '#1d2b4b', fontSize: 10, fontWeight: '900' },
  meta: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 7 },
  gradBadge: { marginTop: 8, color: '#047857', backgroundColor: '#ecfdf5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden', fontSize: 10, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 18 },
  primaryButton: { flex: 1, height: 46, borderRadius: 13, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  iconButton: { width: 48, height: 46, borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#eef2ff', marginTop: 20, paddingTop: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#1d2b4b', fontSize: 16, fontWeight: '900' },
  statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800', marginTop: 3 },
  tabs: { marginHorizontal: 14, marginBottom: 12, backgroundColor: '#ffffff', borderRadius: 16, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabActive: { backgroundColor: '#f8fafc', borderBottomWidth: 2, borderBottomColor: '#1d2b4b' },
  tabText: { color: '#94a3b8', fontSize: 10, fontWeight: '900' },
  tabTextActive: { color: '#1d2b4b' },
  errorText: { marginHorizontal: 16, color: '#dc2626', textAlign: 'center', marginBottom: 10 },
  card: { marginHorizontal: 14, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 18 },
  infoRow: { flexDirection: 'row', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  infoValue: { color: '#1d2b4b', fontSize: 14, fontWeight: '700', marginTop: 3 },
  postGrid: { marginHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 3, borderRadius: 18, overflow: 'hidden' },
  postActionRow: { marginHorizontal: 14, marginBottom: 12, alignItems: 'flex-end' },
  featureNotice: { marginHorizontal: 14, marginBottom: 12, borderRadius: 14, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureNoticeText: { color: '#92590e', fontSize: 12, fontWeight: '900' },
  uploadButton: { height: 42, borderRadius: 13, backgroundColor: '#1d2b4b', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15 },
  uploadButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  postCell: { width: '32.8%', aspectRatio: 1, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  postImage: { width: '100%', height: '100%' },
  videoTile: { width: '100%', height: '100%', backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', gap: 7 },
  videoTileText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  captionStrip: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(29,43,75,0.78)', paddingHorizontal: 6, paddingVertical: 4 },
  captionStripText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  taggedGrid: { marginHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  taggedCell: { width: '31.9%', aspectRatio: 1, borderRadius: 15, overflow: 'hidden', backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  taggedCellHighlighted: { borderWidth: 3, borderColor: '#fdb813' },
  taggedOverlay: { position: 'absolute', left: 6, right: 6, bottom: 6, minHeight: 24, borderRadius: 9, backgroundColor: 'rgba(29,43,75,0.82)', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7 },
  taggedOverlayText: { flex: 1, color: '#ffffff', fontSize: 9, fontWeight: '800' },
  deepLinkPreview: { marginHorizontal: 14, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(253,184,19,0.45)', backgroundColor: '#fffdf5', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  deepLinkPreviewTitle: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  deepLinkPreviewText: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  postPreview: { width: '100%', aspectRatio: 1, borderRadius: 18, backgroundColor: '#e2e8f0', marginBottom: 10 },
  videoPreview: { width: '100%', aspectRatio: 1, borderRadius: 18, backgroundColor: '#1d2b4b', marginBottom: 10, alignItems: 'center', justifyContent: 'center', padding: 20 },
  videoPreviewTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', marginTop: 12 },
  videoPreviewText: { color: '#cbd5e1', fontSize: 12, marginTop: 6, textAlign: 'center' },
  openMediaButton: { minHeight: 40, borderRadius: 12, backgroundColor: '#fdb813', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  openMediaButtonText: { color: '#1d2b4b', fontSize: 12, fontWeight: '900' },
  previewStrip: { gap: 8, paddingBottom: 8 },
  previewThumbWrap: { width: 58, height: 58, borderRadius: 14, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  previewThumb: { width: '100%', height: '100%' },
  previewVideoThumb: { width: '100%', height: '100%', backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  previewThumbBadge: { position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9, overflow: 'hidden', backgroundColor: 'rgba(29,43,75,0.82)', color: '#ffffff', fontSize: 9, fontWeight: '900', textAlign: 'center', lineHeight: 18 },
  audienceRow: { gap: 9, marginBottom: 12 },
  audienceOption: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, backgroundColor: '#ffffff' },
  audienceActive: { backgroundColor: '#1d2b4b', borderColor: '#1d2b4b' },
  audienceText: { color: '#64748b', fontSize: 13, fontWeight: '900' },
  audienceTextActive: { color: '#ffffff' },
  deletePostButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginBottom: 28 },
  deletePostText: { color: '#dc2626', fontSize: 13, fontWeight: '900' },
  tagSearchBox: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, marginBottom: 10 },
  tagSearchInput: { flex: 1, color: '#1d2b4b', fontSize: 13 },
  selectedTagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
  selectedTagPill: { borderRadius: 999, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectedTagText: { color: '#3f51b5', fontSize: 11, fontWeight: '900' },
  tagOptionList: { gap: 7, marginBottom: 4 },
  tagOptionRow: { minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: '#eef2ff', backgroundColor: '#ffffff', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagOptionActive: { backgroundColor: '#eef2ff', borderColor: '#bfdbfe' },
  tagOptionName: { color: '#1d2b4b', fontSize: 12, fontWeight: '900' },
  tagOptionMeta: { color: '#94a3b8', fontSize: 10, marginTop: 1 },
  achievementRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  awardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: '#1d2b4b', fontSize: 14, fontWeight: '900' },
  rowText: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  voiceCopy: { flex: 1 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 22, marginTop: 6 },
  waveBar: { width: 3, borderRadius: 999 },
  playButton: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  playButtonActive: { backgroundColor: '#fdb813' },
  empty: { marginHorizontal: 14, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 50, paddingHorizontal: 28, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 16, fontWeight: '900', marginTop: 14 },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  footerActions: { position: 'absolute', left: 14, right: 14, bottom: 12, flexDirection: 'row', gap: 10 },
  footerButton: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  logoutButton: { borderColor: '#fecaca' },
  footerButtonText: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  absoluteFill: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: height * 0.92, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#1d2b4b', fontSize: 20, fontWeight: '900' },
  modalBody: { maxHeight: height * 0.78 },
  inputLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 14, marginBottom: 7 },
  input: { minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', color: '#1d2b4b', paddingHorizontal: 14, fontSize: 14, marginBottom: 10 },
  textArea: { minHeight: 86, textAlignVertical: 'top', paddingTop: 12 },
  helperText: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginBottom: 2 },
  storageCard: { margin: 18, marginBottom: 0, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', padding: 14 },
  storageTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  storageTier: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, backgroundColor: '#fdb813', paddingHorizontal: 10, paddingVertical: 6 },
  storageTierText: { color: '#1d2b4b', fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  storagePercentText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  storageTrack: { height: 8, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  storageFill: { height: '100%', borderRadius: 999, backgroundColor: '#fdb813' },
  storageText: { color: '#64748b', fontSize: 12, marginTop: 9 },
  visibilityOption: { borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  visibilityActive: { borderColor: '#1d2b4b', backgroundColor: '#f8fafc' },
  visibilityTitle: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  visibilityDesc: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  modalSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addText: { color: '#3f51b5', fontSize: 12, fontWeight: '900', marginTop: 14 },
  achievementEditor: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, marginBottom: 10 },
  removeAchievement: { alignSelf: 'flex-end', width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  saveButton: { minHeight: 50, borderRadius: 14, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 28 },
  saveButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
