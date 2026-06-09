import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { faceSearch, getAppConfig, getErrorMessage, getGallery, getGalleryAlbum, getGraduationAlbum, getGraduationGallery, imageUrl, paginationMeta, unwrap } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = [
  { key: 'general', label: 'All Photos', icon: 'image', type: 'general', category: null },
  { key: 'graduation:photos', label: 'Graduation', icon: 'graduation-cap', type: 'graduation', category: 'photos' },
  { key: 'graduation:videos', label: 'Videos', icon: 'film', type: 'graduation', category: 'videos' },
  { key: 'graduation:program', label: 'Program', icon: 'file-pdf-o', type: 'graduation', category: 'program' },
  { key: 'graduation:invitations', label: 'Invitation', icon: 'envelope-open-o', type: 'graduation', category: 'invitations' },
  { key: 'graduation:songs', label: 'Grad Song', icon: 'music', type: 'graduation', category: 'songs' },
  { key: 'graduation:mass', label: 'Baccalaureate', icon: 'institution', type: 'graduation', category: 'mass' },
];

const albumId = (album: any) => album?.id || album?.album_id;
const albumTitle = (album: any) => album?.title || album?.name || album?.album_title || 'Gallery Album';
const firstFilledList = (...lists: any[]) => lists.find((list) => Array.isArray(list) && list.length) || [];
const albumPhotos = (album: any) => firstFilledList(album?.photos, album?.media_files, album?.mediaFiles, album?.media, album?.items);
const graduationMedia = (album: any, category?: string | null) => {
  if (['videos', 'songs', 'mass'].includes(String(category))) {
    return firstFilledList(album?.mediaFiles, album?.media_files, album?.videos, album?.audios, album?.photos, album?.media, album?.items);
  }
  return albumPhotos(album);
};
const albumImage = (album: any) => imageUrl(album?.cover_photo_url || album?.cover_url || album?.cover_photo || album?.cover || album?.thumbnail || album?.media_url || albumPhotos(album)[0]?.url || albumPhotos(album)[0]?.path || albumPhotos(album)[0]?.file_path);
const photoUrl = (photo: any) => imageUrl(
  photo?.url ||
  photo?.path ||
  photo?.image ||
  photo?.file_path ||
  photo?.media_url ||
  photo?.gallery?.file_path ||
  photo?.gallery?.media?.[0]?.file_path ||
  photo?.media?.[0]?.file_path ||
  photo
);
const photoCount = (album: any) => album?.photos_count ?? album?.media_count ?? album?.count ?? albumPhotos(album).length ?? 0;
const isVideoUrl = (uri?: string | null) => Boolean(uri && /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(uri));
const mediaKind = (item: any, uri?: string | null) => {
  const mime = String(item?.mime_type || '').toLowerCase();
  const resource = String(item?.resource_type || '').toLowerCase();
  const path = String(uri || item?.file_path || item?.url || '').toLowerCase();
  if (mime.includes('pdf') || /\.pdf(\?|$)/i.test(path)) return 'pdf';
  if (mime.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|flac)(\?|$)/i.test(path)) return 'audio';
  if (resource === 'video' || mime.startsWith('video/') || isVideoUrl(path)) return 'video';
  return 'image';
};
const mediaIcon = (kind: string) => kind === 'pdf' ? 'file-pdf-o' : kind === 'audio' ? 'music' : kind === 'video' ? 'film' : 'camera';
const tabMediaKind = (category?: string | null) => {
  if (category === 'program') return 'pdf';
  if (category === 'songs') return 'audio';
  if (category === 'videos' || category === 'mass') return 'video';
  return 'image';
};
const mediaCountLabel = (category?: string | null) => {
  if (category === 'program') return 'files';
  if (category === 'songs') return 'audio';
  if (category === 'videos' || category === 'mass') return 'videos';
  return 'photos';
};
const friendlyGalleryError = (error: any) => (
  error?.message === 'Network Error'
    ? 'Unable to connect to the gallery. Pull down to retry.'
    : getErrorMessage(error, 'Unable to load gallery albums.')
);
const normalizeFaceScore = (value: any) => {
  const score = Number(value || 0);
  if (!Number.isFinite(score) || score <= 0) return 0;
  return score <= 1 ? score * 100 : score;
};
const faceScore = (item: any) => normalizeFaceScore(item?.similarity ?? item?.confidence ?? item?.score ?? item?.Similarity);
export default function GalleryScreen() {
  const [activeTab, setActiveTab] = useState('general');
  const [albums, setAlbums] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [faceResults, setFaceResults] = useState<any[]>([]);
  const [isFaceVisible, setIsFaceVisible] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);

  const tab = useMemo(() => TABS.find((item) => item.key === activeTab) || TABS[0], [activeTab]);
  const isGraduation = tab.type === 'graduation';
  const schoolName = appConfig?.school_name || 'National University Lipa';

  const loadAlbums = useCallback(async (nextPage = 1, append = false) => {
    try {
      setError('');
      if (append) setLoadingMore(true);
      else if (!refreshing) setLoading(true);

      const payload = tab.type === 'graduation'
        ? await getGraduationGallery({ category: tab.category || 'photos', page: nextPage })
        : await getGallery({
          page: nextPage,
          type: tab.type,
          ...(tab.category ? { category: tab.category } : {}),
        });
      const data = unwrap(payload);
      const meta = paginationMeta(payload);
      const nextAlbums = Array.isArray(data) ? data : [];

      setAlbums((current) => append ? [...current, ...nextAlbums] : nextAlbums);
      setPage(meta.currentPage);
      setLastPage(meta.lastPage);
    } catch (requestError: any) {
      setAlbums([]);
      setError(friendlyGalleryError(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [refreshing, tab.category, tab.type]);

  useEffect(() => {
    loadAlbums(1);
  }, [loadAlbums]);

  useEffect(() => {
    let active = true;

    getAppConfig().catch(() => null).then((configPayload) => {
      if (!active) return;
      setAppConfig(configPayload ? unwrap(configPayload) : null);
    });

    return () => { active = false; };
  }, []);

  const switchTab = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(key);
    setFaceResults([]);
    setIsGridVisible(false);
  };

  const openViewer = async (album: any) => {
    const initialMedia = isGraduation ? graduationMedia(album, tab.category) : albumPhotos(album);
    setSelectedAlbum(album);
    setPreviewImage(albumImage(album));
    setPhotos(initialMedia);
    setIsViewerVisible(true);

    const id = albumId(album);
    if (id) {
      try {
        const payload = isGraduation ? await getGraduationAlbum(id) : await getGalleryAlbum(id);
        const fullAlbum = unwrap(payload);
        setSelectedAlbum((current: any) => ({ ...current, ...fullAlbum }));
        const fullPhotos = isGraduation ? graduationMedia(fullAlbum, tab.category) : albumPhotos(fullAlbum);
        setPhotos(Array.isArray(fullPhotos) ? fullPhotos : []);
        setPreviewImage(albumImage(fullAlbum) || photoUrl(fullPhotos[0]));
      } catch {}
    }
  };

  const closeViewer = () => {
    setIsViewerVisible(false);
    setIsGridVisible(false);
    setSelectedAlbum(null);
    setPhotos([]);
  };

  const handleFaceSearch = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to run face search.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const form = new FormData();
    form.append('face_image', {
      uri: asset.uri,
      name: asset.fileName || 'face-search.jpg',
      type: asset.mimeType || 'image/jpeg',
    } as any);
    form.append('type', tab.type);
    if (tab.category) form.append('category', tab.category);

    try {
      setFaceLoading(true);
      setIsFaceVisible(true);
      const payload = await faceSearch(form);
      const data = unwrap(payload);
      const results = Array.isArray(data) ? data : data?.photos || data?.matches || [];
      const normalizedResults = Array.isArray(results) ? results : [];
      setFaceResults(normalizedResults);
      Haptics.notificationAsync(normalizedResults.length ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    } catch (requestError: any) {
      Alert.alert('Face search failed', getErrorMessage(requestError, 'Unable to run face search.'));
    } finally {
      setFaceLoading(false);
    }
  };

  const renderAlbum = ({ item }: { item: any }) => {
    const media = isGraduation ? graduationMedia(item, tab.category) : albumPhotos(item);
    const cover = imageUrl(item?.cover_photo_url || item?.cover_url || item?.cover_photo || item?.cover || item?.thumbnail || item?.media_url || media[0]?.url || media[0]?.path || media[0]?.file_path);
    const count = item?.photos_count ?? item?.media_count ?? item?.count ?? media.length ?? 0;
    const fallbackKind = cover ? mediaKind(media[0], cover) : tabMediaKind(tab.category);
    const countLabel = mediaCountLabel(tab.category);

    return (
      <TouchableOpacity
        style={styles.albumCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          openViewer(item);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {cover && mediaKind(media[0], cover) === 'image' ? <Image source={cover} style={styles.albumImage} contentFit="cover" transition={400} /> : (
            <View style={styles.albumImageFallback}>
              <FontAwesome name={mediaIcon(fallbackKind) as any} size={34} color="#7b8ba6" />
            </View>
          )}
          <View style={styles.photoCountBadge}>
            <FontAwesome name={tab.icon as any} size={10} color="#fdb813" />
            <Text style={styles.photoCountText}>{count} {countLabel}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.albumTitle} numberOfLines={2}>{albumTitle(item)}</Text>
          <Text style={styles.albumTime}>
            {item?.event_date ? new Date(item.event_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : item?.category || 'No date'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="dark" />
      <FlatList
        data={albums}
        keyExtractor={(item, index) => String(albumId(item) || index)}
        renderItem={renderAlbum}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={(
          <>
            <View style={styles.compactHeader}>
              <View>
                <Text style={styles.heroLabel}>Gallery</Text>
                <Text style={styles.compactTitle}>{isGraduation ? 'Graduation' : 'Albums'}</Text>
              </View>
              <TouchableOpacity style={styles.infoButton} onPress={() => Alert.alert('Content ownership', `All media in this gallery is protected content from ${schoolName}.`)}>
                <FontAwesome name="info" size={15} color="#F5A623" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchShell}>
              <View style={styles.searchContainer}>
                  <FontAwesome name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    editable={false}
                    style={styles.searchInput}
                    placeholder={faceLoading ? 'Searching...' : 'Search gallery by face...'}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity style={styles.cameraButton} onPress={handleFaceSearch} disabled={faceLoading}>
                    {faceLoading ? <ActivityIndicator color="#F5A623" size="small" /> : <FontAwesome name="camera" size={15} color="#F5A623" />}
                  </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryChipRow}>
              {TABS.map((item) => {
                const active = activeTab === item.key;
                return (
                  <TouchableOpacity key={item.key} style={[styles.galleryChip, active && styles.galleryChipActive]} onPress={() => switchTab(item.key)}>
                    <Text style={[styles.galleryChipText, active && styles.galleryChipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{tab.label}</Text>
            </View>
          </>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={{ marginTop: 32 }} /> : (
          <View style={styles.emptyPanel}>
            <FontAwesome name="image" size={38} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Nothing Here Yet</Text>
            <Text style={styles.emptyText}>{error || 'No content in this section yet.'}</Text>
          </View>
        )}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#1d2b4b" style={{ marginVertical: 20 }} /> : <View style={{ height: 110 }} />}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAlbums(1); }} />}
        onEndReached={() => {
          if (!loadingMore && page < lastPage) loadAlbums(page + 1, true);
        }}
      />

      <Modal visible={isViewerVisible} transparent animationType="fade" onRequestClose={closeViewer}>
        <View style={styles.viewerOverlay}>
          <StatusBar style="light" />
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => isGridVisible ? setIsGridVisible(false) : closeViewer()} style={styles.closeButton}>
              <FontAwesome name={isGridVisible ? 'chevron-left' : 'times'} size={23} color="white" />
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>{isGridVisible ? `All Photos (${photos.length})` : albumTitle(selectedAlbum)}</Text>
            <View style={styles.shareButton} />
          </View>

          {!isGridVisible ? (
            <View style={styles.lightboxContainer}>
              <View style={styles.mainImageContainer}>
                {previewImage && mediaKind(null, previewImage) === 'image' ? (
                  <Image source={previewImage} style={styles.fullImage} contentFit="contain" transition={300} />
                ) : previewImage ? (
                  <View style={styles.videoPreview}>
                    <FontAwesome name={mediaIcon(mediaKind(null, previewImage)) as any} size={44} color="#fdb813" />
                    <Text style={styles.videoPreviewTitle}>
                      {mediaKind(null, previewImage) === 'pdf' ? 'Document' : mediaKind(null, previewImage) === 'audio' ? 'Audio Media' : 'Video Media'}
                    </Text>
                    <TouchableOpacity style={styles.openVideoButton} onPress={() => Linking.openURL(previewImage)}>
                      <FontAwesome name="external-link" size={13} color="#1d2b4b" />
                      <Text style={styles.openVideoText}>
                        {mediaKind(null, previewImage) === 'pdf' ? 'Open File' : mediaKind(null, previewImage) === 'audio' ? 'Open Audio' : 'Open Video'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : <Text style={styles.viewerEmpty}>No preview available.</Text>}
              </View>
              <View style={styles.viewerFooter}>
                <View style={styles.albumInfo}>
                  <Text style={styles.photoCountBig}>{photos.length || photoCount(selectedAlbum)} items in Album</Text>
                  <Text style={styles.albumDate}>{selectedAlbum?.description || selectedAlbum?.category || 'Visual Archive'}</Text>
                </View>
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => setIsGridVisible(true)}>
                  <Text style={styles.viewAllBtnText}>View All Media</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              data={photos}
              numColumns={3}
              keyExtractor={(_, index) => String(index)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.gridItem} onPress={() => { setPreviewImage(photoUrl(item)); setIsGridVisible(false); }}>
                  {mediaKind(item, photoUrl(item)) !== 'image' ? (
                    <View style={styles.gridVideo}>
                      <FontAwesome name={mediaIcon(mediaKind(item, photoUrl(item))) as any} size={22} color="#fdb813" />
                    </View>
                  ) : (
                    <Image source={photoUrl(item)} style={styles.gridImage} contentFit="cover" />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.gridList}
            />
          )}
        </View>
      </Modal>

      <Modal visible={isFaceVisible} animationType="slide" onRequestClose={() => setIsFaceVisible(false)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.faceHeader}>
            <TouchableOpacity onPress={() => setIsFaceVisible(false)}>
              <FontAwesome name="chevron-left" size={20} color="#1d2b4b" />
            </TouchableOpacity>
            <Text style={styles.faceTitle}>Face Search Results</Text>
            <View style={{ width: 20 }} />
          </View>
          <FlatList
            data={faceResults}
            keyExtractor={(item, index) => String(item?.id || item?.photo_id || index)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.faceCard}
                activeOpacity={0.88}
                onPress={() => {
                  const matchedImage = photoUrl(item);
                  if (!matchedImage) return;
                  setPreviewImage(matchedImage);
                  setSelectedAlbum(item?.album || item?.gallery?.album || { title: item?.caption || item?.name || 'Face Match' });
                  setPhotos([item]);
                  setIsFaceVisible(false);
                  setIsGridVisible(false);
                  setIsViewerVisible(true);
                }}
              >
                {photoUrl(item) ? <Image source={photoUrl(item)} style={styles.faceImage} /> : <View style={styles.faceImageFallback} />}
                <View style={styles.faceInfo}>
                  <Text style={styles.faceName}>{item?.student?.name || item?.name || item?.title || 'Matched photo'}</Text>
                  <Text style={styles.faceMeta}>{faceScore(item) ? `${Math.round(faceScore(item))}% match` : item?.album?.title || 'Gallery match'}</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#94a3b8" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={faceLoading ? <ActivityIndicator color="#1d2b4b" style={{ marginTop: 30 }} /> : <Text style={styles.emptyText}>No face matches found.</Text>}
            contentContainerStyle={styles.faceContent}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  scrollContent: { paddingBottom: 0 },
  compactHeader: { height: 56, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compactTitle: { color: '#1A2547', fontSize: 24, fontWeight: '900' },
  infoButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  hero: { backgroundColor: '#24365f', paddingTop: 54, paddingHorizontal: 20, paddingBottom: 38, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, alignItems: 'center' },
  heroLabel: { color: '#F5A623', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#ffffff', fontSize: 34, lineHeight: 40, fontWeight: '900', textAlign: 'center' },
  heroGold: { color: '#fdb813' },
  heroSubtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 340, marginTop: 8, marginBottom: 18 },
  ownershipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12, width: '100%', marginBottom: 24 },
  shieldCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#fdb813', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  ownershipTextWrap: { flex: 1 },
  ownershipKicker: { color: 'rgba(255,255,255,0.56)', fontSize: 9, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center' },
  ownershipText: { color: '#ffffff', fontSize: 11, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  ownershipGold: { color: '#fdb813' },
  protectedPill: { borderWidth: 1, borderColor: 'rgba(253,184,19,0.5)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 8 },
  protectedText: { color: '#fdb813', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  searchShell: { marginHorizontal: 18, marginBottom: 12 },
  searchContainer: { minHeight: 56, borderRadius: 12, backgroundColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: '#1A2547', fontSize: 15 },
  cameraButton: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  galleryChipRow: { gap: 8, paddingHorizontal: 18, paddingBottom: 8 },
  galleryChip: { height: 32, borderRadius: 12, borderWidth: 1, borderColor: '#1A2547', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  galleryChipActive: { backgroundColor: '#F5A623', borderColor: '#F5A623' },
  galleryChipText: { color: '#1A2547', fontSize: 12, fontWeight: '900' },
  galleryChipTextActive: { color: '#ffffff' },
  galleryFilterWrap: { marginHorizontal: 18, marginTop: -18, marginBottom: 8 },
  accessCard: { marginHorizontal: 18, marginTop: 10, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', padding: 14, shadowColor: '#1d2b4b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3 },
  accessTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  accessBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, backgroundColor: '#fdb813', paddingHorizontal: 11, paddingVertical: 6 },
  accessBadgeText: { color: '#1d2b4b', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  accessPercent: { color: '#64748b', fontSize: 11, fontWeight: '900' },
  accessTrack: { height: 7, borderRadius: 999, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  accessFill: { height: '100%', borderRadius: 999, backgroundColor: '#1d2b4b' },
  accessText: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 8 },
  tabsCard: { marginHorizontal: 18, marginTop: -18, backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', shadowColor: '#1d2b4b', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 },
  primaryTabs: { flexDirection: 'row', padding: 6, borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
  secondaryTabs: { flexDirection: 'row', padding: 6 },
  tabButton: { flex: 1, minHeight: 42, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  smallTabButton: { minHeight: 38 },
  activeTabButton: { backgroundColor: '#1d2b4b' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: '900', marginLeft: 5 },
  smallTabText: { fontSize: 10 },
  activeTabText: { color: '#ffffff' },
  sectionHeader: { paddingHorizontal: 22, marginTop: 34, marginBottom: 18 },
  sectionTitle: { color: '#1d2b4b', fontSize: 21, fontWeight: '900' },
  columnWrapper: { paddingHorizontal: 18, gap: 14 },
  albumCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', marginBottom: 18, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  imageContainer: { position: 'relative', height: 190, backgroundColor: '#dfe6f1' },
  albumImage: { width: '100%', height: '100%' },
  albumImageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dfe6f1' },
  photoCountBadge: { position: 'absolute', top: 14, right: 12, backgroundColor: 'rgba(255,255,255,0.96)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoCountText: { fontSize: 11, fontWeight: '900', color: '#1d2b4b' },
  info: { paddingHorizontal: 16, paddingVertical: 16, minHeight: 86 },
  albumTitle: { fontSize: 15, lineHeight: 19, fontWeight: '900', color: '#1d2b4b', marginBottom: 10 },
  albumTime: { fontSize: 12, color: '#94a3b8' },
  emptyPanel: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 52, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 18, fontWeight: '900', marginTop: 14 },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center', padding: 18 },
  viewerOverlay: { flex: 1, backgroundColor: '#000000' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  closeButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  viewerTitle: { flex: 1, color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginHorizontal: 10 },
  shareButton: { width: 44, height: 44 },
  lightboxContainer: { flex: 1 },
  mainImageContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '100%' },
  viewerEmpty: { color: 'white' },
  videoPreview: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  videoPreviewTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  openVideoButton: { minHeight: 46, borderRadius: 14, backgroundColor: '#fdb813', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  openVideoText: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  viewerFooter: { padding: 30, paddingBottom: 50, backgroundColor: 'rgba(0,0,0,0.5)' },
  albumInfo: { marginBottom: 20 },
  photoCountBig: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  albumDate: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  viewAllBtn: { backgroundColor: 'white', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  viewAllBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  gridList: { padding: 2 },
  gridItem: { flex: 1 / 3, aspectRatio: 1, padding: 2 },
  gridImage: { width: '100%', height: '100%', borderRadius: 4 },
  gridVideo: { width: '100%', height: '100%', borderRadius: 4, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  faceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#ffffff' },
  faceTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: 'bold' },
  faceContent: { padding: 20 },
  faceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  faceImage: { width: 64, height: 64, borderRadius: 12, marginRight: 14 },
  faceImageFallback: { width: 64, height: 64, borderRadius: 12, marginRight: 14, backgroundColor: '#eef2ff' },
  faceInfo: { flex: 1 },
  faceName: { color: '#1C1C1E', fontSize: 16, fontWeight: 'bold' },
  faceMeta: { color: '#8E8E93', fontSize: 13, marginTop: 4 },
});
