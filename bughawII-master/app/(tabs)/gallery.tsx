import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { bulkUploadMedia, createGalleryAlbum, deleteGalleryMedia, deleteMediaPhoto, faceSearch, fetchCurrentUser, getAppConfig, getErrorMessage, getGallery, getGalleryAlbum, getGraduationAlbum, getGraduationAlbumPhotos, getGraduationGallery, getTranscriptSubtitles, getTranscripts, imageUrl, paginationMeta, recordContentView, STORAGE_BASE_URL, unwrap, uploadMediaVideo } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#1B2A5E',
  gold: '#F5A623',
  background: '#F0F2F7',
  card: '#FFFFFF',
  border: '#E0E3EC',
  muted: '#888888',
  thumbnail: '#E8EAEF',
};

const TABS = [
  { key: 'general', label: 'All Photos', icon: 'image', type: 'general', category: null },
  { key: 'graduation:photos', label: 'Graduation', icon: 'graduation-cap', type: 'graduation', category: 'photos' },
  { key: 'graduation:videos', label: 'Videos', icon: 'film', type: 'graduation', category: 'videos' },
  { key: 'graduation:program', label: 'Program', icon: 'file-pdf-o', type: 'graduation', category: 'program' },
  { key: 'graduation:invitations', label: 'Invitation', icon: 'envelope-open-o', type: 'graduation', category: 'invitations' },
  { key: 'graduation:songs', label: 'Grad Song', icon: 'music', type: 'graduation', category: 'songs' },
  { key: 'graduation:mass', label: 'Baccalaureate', icon: 'institution', type: 'graduation', category: 'mass' },
];

const TYPE_OPTIONS = [
  { label: 'All Photos', key: 'general' },
  { label: 'Graduation', key: 'graduation:photos' },
  { label: 'Videos', key: 'graduation:videos' },
  { label: 'Program', key: 'graduation:program' },
  { label: 'Invitations', key: 'graduation:invitations' },
  { label: 'Grad Song', key: 'graduation:songs' },
  { label: 'Baccalaureate', key: 'graduation:mass' },
];

const DEFAULT_YEAR_OPTIONS = ['All Years', '2026', '2025', '2024', '2023', '2022'];

const albumId = (album: any) => album?.id || album?.album_id;
const albumListKey = (album: any, index: number, scope: string) => {
  const source = album?.source_type || album?.source || (album?.graduation_year || album?.event_year || album?.category ? 'graduation' : 'general');
  const id = albumId(album) || album?.slug || album?.title || album?.name || index;
  return `${scope}:${source}:album:${id}:${index}`;
};
const faceResultKey = (item: any, index: number) => {
  const album = item?.album || item?.gallery?.album || item?.graduation_album || {};
  const source = item?.source_type || item?.source || (item?.graduation_album_id ? 'graduation' : 'general');
  const category = album?.category || item?.category || 'media';
  const mediaId = item?.photo_id || item?.media_id || item?.graduation_photo_id || item?.id || item?.file_path || item?.url || index;
  return `${source}:${category}:match:${mediaId}:${index}`;
};
const albumTitle = (album: any) => album?.title || album?.name || album?.album_title || 'Gallery Album';
const firstFilledList = (...lists: any[]) => lists.find((list) => Array.isArray(list) && list.length) || [];
const albumPhotos = (album: any) => firstFilledList(album?.photos, album?.media_files, album?.mediaFiles, album?.media, album?.items);
const graduationMedia = (album: any, category?: string | null) => {
  if (['videos', 'songs', 'mass'].includes(String(category))) {
    return firstFilledList(album?.mediaFiles, album?.media_files, album?.videos, album?.audios, album?.photos, album?.media, album?.items);
  }
  return albumPhotos(album);
};
const rawMediaPath = (item: any) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  return (
    item?.video_url ||
    item?.file_url ||
    item?.download_url ||
    item?.source_url ||
    item?.url ||
    item?.path ||
    item?.file_path ||
    item?.media_url ||
    item?.audio_url ||
    item?.document_url ||
    item?.gallery?.file_path ||
    item?.gallery?.media?.[0]?.file_path ||
    item?.media?.[0]?.file_path ||
    null
  );
};
const resolveMediaUrl = (item: any) => {
  const path = rawMediaPath(item);
  if (!path || typeof path !== 'string') return null;
  if (/^(https?:|data:|file:|content:|blob:)/i.test(path)) return path;
  const cleanPath = path.replace(/^\/+/, '');
  if (cleanPath.startsWith('storage/')) return `${STORAGE_BASE_URL}/${cleanPath}`;
  return imageUrl(cleanPath);
};
const photoUrl = (photo: any) => imageUrl(
  photo?.thumbnail_url ||
  photo?.thumbnail ||
  photo?.thumb_url ||
  photo?.preview_url ||
  photo?.poster_url ||
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
const mediaFileUrl = (item: any) => resolveMediaUrl(item);
const imageExtensionFromMime = (mime?: string | null) => {
  const normalized = String(mime || '').toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('gif')) return 'gif';
  return 'jpg';
};
const imageUploadPart = (asset: any, fallbackName = 'face-search') => {
  const mimeType = String(asset?.mimeType || '').startsWith('image/') ? asset.mimeType : 'image/jpeg';
  const extension = imageExtensionFromMime(mimeType);
  const rawName = asset?.fileName || `${fallbackName}.${extension}`;
  const name = /\.[a-z0-9]+$/i.test(rawName) ? rawName : `${rawName}.${extension}`;

  return {
    uri: Platform.OS === 'ios' ? String(asset?.uri || '').replace('file://', '') : asset?.uri,
    name,
    type: mimeType,
  };
};
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
const mediaPreviewImage = (item: any) => {
  if (!item) return null;
  const explicitPreview = imageUrl(
    item?.cover_photo_url ||
    item?.cover_url ||
    item?.cover_photo ||
    item?.cover ||
    item?.thumbnail_url ||
    item?.thumbnail ||
    item?.thumb_url ||
    item?.preview_url ||
    item?.poster_url ||
    item?.poster ||
    item?.image ||
    item?.image_url
  );
  if (explicitPreview) return explicitPreview;

  const path = rawMediaPath(item);
  return mediaKind(item, path) === 'image' ? imageUrl(path) : null;
};
const isApprovedMedia = (item: any) => {
  const status = String(item?.status || item?.moderation_status || item?.approval_status || item?.pivot?.status || '').toLowerCase();
  const explicitRejected = ['rejected', 'denied', 'declined', 'pending', 'unapproved', 'hidden'].includes(status);
  if (explicitRejected) return false;
  if (item?.is_approved === false || item?.approved === false || item?.is_public === false) return false;
  return status ? ['approved', 'published', 'active', 'public'].includes(status) : true;
};
const approvedMediaItems = (items: any[]) => items.filter((item) => isApprovedMedia(item));
const albumImage = (album: any) => approvedMediaItems(albumPhotos(album)).map(mediaPreviewImage).find(Boolean) || null;
const albumCoverImage = (_album: any, media: any[]) => approvedMediaItems(media).map(mediaPreviewImage).find(Boolean) || null;
const mediaIcon = (kind: string) => kind === 'pdf' ? 'file-pdf-o' : kind === 'audio' ? 'music' : kind === 'video' ? 'film' : 'camera';
const mediaTypeLabel = (kind: string) => kind === 'pdf' ? 'PDF Document' : kind === 'audio' ? 'Audio File' : kind === 'video' ? 'Video Media' : 'Image Media';
const metadataObject = (item: any) => {
  const raw = item?.metadata || item?.meta || item?.ai_metadata || item?.document_metadata || {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw && typeof raw === 'object' ? raw : {};
};
const transcriptLines = (item: any) => {
  const meta = metadataObject(item);
  const lines = item?.transcript_lines || item?.transcript?.lines || meta?.transcript_lines || meta?.transcript?.lines;
  if (Array.isArray(lines) && lines.length) {
    return lines.map((line: any, index: number) => ({
      time: line?.time || line?.timestamp || line?.start || `${index}:00`,
      text: line?.text || line?.content || String(line),
    }));
  }
  const text = item?.transcript_text || item?.transcript || meta?.transcript_text || meta?.transcript;
  if (typeof text === 'string' && text.trim()) {
    return text.split(/\r?\n/).filter(Boolean).slice(0, 4).map((line, index) => ({ time: `${index}:00`, text: line.trim() }));
  }
  return [];
};
const documentContents = (item: any) => {
  const meta = metadataObject(item);
  const contents = item?.contents || item?.table_of_contents || item?.toc || meta?.contents || meta?.table_of_contents || meta?.toc;
  if (Array.isArray(contents) && contents.length) {
    return contents.map((entry: any, index: number) => ({
      title: entry?.title || entry?.label || String(entry),
      page: entry?.page || entry?.page_number || index + 1,
    }));
  }
  return [
    { title: 'Opening Program', page: 1 },
    { title: 'Processional and Ceremony Flow', page: 2 },
    { title: 'Awards and Recognition', page: 3 },
  ];
};
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
const albumSubtitle = (album: any, category?: string | null) => {
  if (category === 'program') return 'Program Document';
  if (category === 'invitations') return 'Invitation Archive';
  if (category === 'videos' || category === 'mass') return 'Video Archive';
  if (category === 'songs') return 'Audio Archive';
  return album?.description || album?.category || 'Visual Archive';
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
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'NU';
const hasPaidAccess = (user: any) => Boolean(
  user?.is_premium ||
  user?.is_subscribed ||
  user?.tier === 'premium' ||
  user?.tier === 'standard' ||
  user?.subscription?.active ||
  user?.subscription_status === 'active'
);
const graduationCategoryLabel = (category?: string | null) => {
  const normalized = String(category || '').toLowerCase();
  return TYPE_OPTIONS.find((item) => item.key === `graduation:${normalized}`)?.label || (normalized ? normalized.replace(/_/g, ' ') : 'Graduation');
};
const faceResultTabKey = (item: any) => {
  const source = String(item?.source_type || item?.source || '').toLowerCase();
  const album = item?.album || item?.gallery?.album || item?.graduation_album || {};
  const category = album?.category || item?.category;
  if (source === 'general' || (!category && !item?.graduation_album_id)) return 'general';
  const resultTab = TABS.find((entry) => entry.type === 'graduation' && entry.category === category);
  return resultTab?.key || 'graduation:photos';
};
const faceResultLocation = (item: any) => {
  const album = item?.album || item?.gallery?.album || item?.graduation_album || {};
  const source = String(item?.source_type || item?.source || '').toLowerCase();
  const category = album?.category || item?.category;
  const albumName = album?.title || item?.album_title || item?.title || 'Matched media';
  if (source === 'general' || faceResultTabKey(item) === 'general') {
    return `All Photos - ${albumName}`;
  }
  return `${graduationCategoryLabel(category)} - ${albumName}`;
};
const dedupeFaceResults = (items: any[]) => {
  const byKey = new Map();
  items.forEach((item) => {
    const key = [
      item?.source_type || item?.source || (item?.graduation_album_id ? 'graduation' : 'general'),
      item?.photo_id || item?.media_id || item?.id || item?.file_path || item?.url,
    ].join(':');
    const existing = byKey.get(key);
    if (!existing || faceScore(item) > faceScore(existing)) byKey.set(key, item);
  });
  return [...byKey.values()].sort((a, b) => faceScore(b) - faceScore(a));
};

function InAppMediaPlayer({ source, poster, kind }: { source: string | null; poster?: string | null; kind: string }) {
  const player = useVideoPlayer(source, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  if (!source) {
    return (
      <View style={styles.mediaPlaceholder}>
        <FontAwesome name={mediaIcon(kind) as any} size={38} color="#7b8ba6" />
      </View>
    );
  }

  return (
    <View style={styles.videoPreviewPanel}>
      {poster ? <Image source={poster} style={styles.videoPosterImage} contentFit="cover" /> : null}
      <VideoView
        player={player}
        style={styles.videoPlayer}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
      />
    </View>
  );
}

const transcriptStatus = (status?: string) => {
  const key = String(status || 'pending').toLowerCase();
  if (key === 'done') return { bg: '#ecfdf5', color: '#059669', icon: 'check-circle', label: 'Done' };
  if (key === 'processing') return { bg: '#fefce8', color: '#ca8a04', icon: 'spinner', label: 'Processing' };
  if (key === 'failed') return { bg: '#fef2f2', color: '#dc2626', icon: 'exclamation-circle', label: 'Failed' };
  return { bg: '#f1f5f9', color: '#64748b', icon: 'clock-o', label: 'Pending' };
};

function TranscriptModal({
  visible,
  onClose,
  title,
  transcripts,
  selected,
  setSelected,
  activeTab,
  setActiveTab,
  loading,
  actionLoading,
  onSubtitle,
  onCopy,
}: any) {
  const selectedStatus = transcriptStatus(selected?.status);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.transcriptOverlay}>
        <TouchableOpacity style={styles.transcriptBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.transcriptModal}>
          <View style={styles.transcriptHeader}>
            <View style={styles.transcriptHeaderLeft}>
              <View style={styles.transcriptHeaderIcon}>
                <FontAwesome name="file-text" size={14} color={COLORS.gold} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.transcriptModalTitle}>Speeches & Transcripts</Text>
                <Text style={styles.transcriptModalSub} numberOfLines={1}>{title || 'Graduation speech'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.transcriptClose} onPress={onClose}>
              <FontAwesome name="times" size={15} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.transcriptEmptyState}>
              <ActivityIndicator color={COLORS.navy} />
            </View>
          ) : transcripts.length === 0 ? (
            <View style={styles.transcriptEmptyState}>
              <FontAwesome name="microphone-slash" size={38} color="#CBD5E1" />
              <Text style={styles.transcriptEmptyTitle}>No Transcripts Yet</Text>
              <Text style={styles.transcriptEmptyText}>No speeches have been transcribed for this video.</Text>
            </View>
          ) : (
            <View style={styles.transcriptBody}>
              <ScrollView style={styles.transcriptList} contentContainerStyle={styles.transcriptListContent}>
                {transcripts.map((item: any) => {
                  const status = transcriptStatus(item?.status);
                  const active = selected?.id === item?.id;
                  return (
                    <TouchableOpacity
                      key={String(item?.id)}
                      style={[styles.transcriptListItem, active && styles.transcriptListItemActive]}
                      onPress={() => {
                        setSelected(item);
                        setActiveTab('transcript');
                      }}
                    >
                      <View style={[styles.transcriptListIcon, active && styles.transcriptListIconActive]}>
                        <FontAwesome name="microphone" size={12} color={active ? COLORS.gold : '#94A3B8'} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.transcriptListTitle, active && styles.transcriptListTitleActive]} numberOfLines={2}>{item?.title || 'Graduation Speech'}</Text>
                        <View style={[styles.transcriptStatusPill, { backgroundColor: active ? 'rgba(255,255,255,0.12)' : status.bg }]}>
                          <FontAwesome name={status.icon as any} size={9} color={active ? 'rgba(255,255,255,0.7)' : status.color} />
                          <Text style={[styles.transcriptStatusText, { color: active ? 'rgba(255,255,255,0.7)' : status.color }]}>{status.label}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.transcriptDetail}>
                {selected?.status === 'done' ? (
                  <View style={styles.transcriptTabs}>
                    {(['transcript', 'notes'] as const).map((tab) => (
                      <TouchableOpacity key={tab} style={[styles.transcriptTab, activeTab === tab && styles.transcriptTabActive]} onPress={() => setActiveTab(tab)}>
                        <Text style={[styles.transcriptTabText, activeTab === tab && styles.transcriptTabTextActive]}>{tab === 'transcript' ? 'Full Transcript' : 'AI Notes'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                <ScrollView style={styles.transcriptTextScroll} contentContainerStyle={styles.transcriptTextContent}>
                  {selected?.status === 'done' ? (
                    activeTab === 'transcript' ? (
                      selected?.transcript_text ? (
                        <Text style={styles.transcriptFullText}>{selected.transcript_text}</Text>
                      ) : <Text style={styles.transcriptMuted}>No transcript text available.</Text>
                    ) : selected?.notes ? (
                      <Text style={styles.transcriptNotes}>{selected.notes}</Text>
                    ) : <Text style={styles.transcriptMuted}>No AI notes generated yet.</Text>
                  ) : (
                    <View style={styles.transcriptProcessing}>
                      <FontAwesome name={selectedStatus.icon as any} size={28} color={selectedStatus.color} />
                      <Text style={styles.transcriptMuted}>{selectedStatus.label === 'Processing' ? 'Groq Whisper is transcribing this speech.' : selectedStatus.label === 'Failed' ? 'Transcription failed.' : 'Queued for transcription.'}</Text>
                    </View>
                  )}
                </ScrollView>

                {selected?.status === 'done' ? (
                  <View style={styles.transcriptActions}>
                    <TouchableOpacity style={styles.transcriptActionPrimary} onPress={() => onSubtitle(selected.id, 'srt')} disabled={actionLoading}>
                      <FontAwesome name="download" size={12} color={COLORS.gold} />
                      <Text style={styles.transcriptActionPrimaryText}>SRT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.transcriptActionGold} onPress={() => onSubtitle(selected.id, 'vtt')} disabled={actionLoading}>
                      <FontAwesome name="download" size={12} color={COLORS.navy} />
                      <Text style={styles.transcriptActionGoldText}>VTT</Text>
                    </TouchableOpacity>
                    {!!selected?.transcript_text && (
                      <TouchableOpacity style={styles.transcriptActionSoft} onPress={() => onCopy(selected.transcript_text)} disabled={actionLoading}>
                        <FontAwesome name="copy" size={12} color="#475569" />
                        <Text style={styles.transcriptActionSoftText}>Copy</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const { albumId: targetAlbumId, photoId: targetPhotoId } = useLocalSearchParams();
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
  const [previewMedia, setPreviewMedia] = useState<any>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [activeYear, setActiveYear] = useState('All Years');
  const [faceResults, setFaceResults] = useState<any[]>([]);
  const [isFaceVisible, setIsFaceVisible] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [filterSheet, setFilterSheet] = useState<null | 'type' | 'year'>(null);
  const [query, setQuery] = useState('');
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<'album' | 'media'>('album');
  const [uploadTargetAlbum, setUploadTargetAlbum] = useState<any>(null);
  const [gallerySaving, setGallerySaving] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [uploadAssets, setUploadAssets] = useState<any[]>([]);
  const [uploadCaption, setUploadCaption] = useState('');
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [transcriptTab, setTranscriptTab] = useState<'transcript' | 'notes'>('transcript');
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptActionLoading, setTranscriptActionLoading] = useState(false);
  const openedRouteAlbumRef = useRef<string | null>(null);

  const tab = useMemo(() => TABS.find((item) => item.key === activeTab) || TABS[0], [activeTab]);
  const isGraduation = tab.type === 'graduation';
  const schoolName = appConfig?.school_name || 'National University Lipa';
  const yearFilters = DEFAULT_YEAR_OPTIONS;
  const visibleAlbums = useMemo(() => {
    const term = query.trim().toLowerCase();
    return albums.filter((album) => {
      const year = String(album?.year || album?.graduation_year || album?.event_year || (album?.event_date ? new Date(album.event_date).getFullYear() : ''));
      const byYear = activeYear === 'All Years' || year === activeYear;
      const media = isGraduation ? graduationMedia(album, tab.category) : albumPhotos(album);
      const text = [
        albumTitle(album),
        albumSubtitle(album, tab.category),
        album?.description,
        album?.category,
        album?.event_date,
        year,
        ...media.map((item: any) => [
          item?.title,
          item?.caption,
          item?.name,
          item?.file_name,
          item?.original_name,
        ].filter(Boolean).join(' ')),
      ].filter(Boolean).join(' ').toLowerCase();
      return byYear && (!term || text.includes(term));
    });
  }, [activeYear, albums, isGraduation, query, tab.category]);
  const previewUrl = mediaFileUrl(previewMedia) || previewImage;
  const previewKind = mediaKind(previewMedia, previewUrl || previewImage);
  const previewThumb = mediaPreviewImage(previewMedia) || (previewKind === 'image' ? photoUrl(previewMedia) : null) || previewImage;
  const currentTranscriptLines = transcriptLines(previewMedia);
  const activeTypeLabel = TYPE_OPTIONS.find((item) => item.key === activeTab)?.label || tab.label;
  const userInitials = initials(user?.name || user?.student_record?.full_name || 'NU');
  const selectedAlbumId = selectedAlbum ? albumId(selectedAlbum) : null;
  const uploadTargetAlbumId = uploadTargetAlbum ? albumId(uploadTargetAlbum) : null;
  const subscriptionEnabled = appConfig?.features?.enable_premium_subscription !== false;
  const canUploadGallery = !subscriptionEnabled || hasPaidAccess(user);

  const mediaTranscriptPhotoId = (item: any) => item?.graduation_photo_id || item?.graduationPhotoId || item?.photo_id || item?.photo?.id || item?.media_id || item?.id;
  const faceLocation = (item: any) => {
    return faceResultLocation(item);
  };
  const openExternalMedia = async (url?: string | null, label = 'media') => {
    if (!url) {
      Alert.alert('Unavailable', `No ${label} file is available for this item.`);
      return;
    }
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (!canOpen) {
      Alert.alert('Cannot open file', `Your device cannot open this ${label}.`);
      return;
    }
    await Linking.openURL(url);
  };

  const loadAlbums = useCallback(async (nextPage = 1, append = false) => {
    try {
      setError('');
      if (append) setLoadingMore(true);
      else if (!refreshing) setLoading(true);

      const payload = tab.type === 'graduation'
        ? await getGraduationGallery({ category: tab.category || 'photos', page: nextPage, ...(activeYear !== 'All Years' ? { year: activeYear } : {}) })
        : await getGallery({
          page: nextPage,
          type: tab.type,
          ...(tab.category ? { category: tab.category } : {}),
          ...(activeYear !== 'All Years' ? { year: activeYear } : {}),
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
  }, [activeYear, refreshing, tab.category, tab.type]);

  useEffect(() => {
    loadAlbums(1);
  }, [loadAlbums]);

  useEffect(() => {
    let active = true;

    getAppConfig().catch(() => null).then((configPayload) => {
      if (!active) return;
      setAppConfig(configPayload ? unwrap(configPayload) : null);
    });
    fetchCurrentUser().then((nextUser) => {
      if (active) setUser(nextUser);
    }).catch(() => {});

    return () => { active = false; };
  }, []);

  const switchTab = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(key);
    setActiveYear('All Years');
    setQuery('');
    setFaceResults([]);
    setIsGridVisible(false);
  };

  const selectType = (key: string) => {
    switchTab(key);
    setFilterSheet(null);
  };

  const selectYear = (year: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveYear(year);
    setFilterSheet(null);
  };

  const openViewer = async (album: any) => {
    const initialMedia = isGraduation ? graduationMedia(album, tab.category) : albumPhotos(album);
    setSelectedAlbum(album);
    setPreviewMedia(initialMedia[0] || album);
    setPreviewImage(mediaPreviewImage(initialMedia[0]) || albumImage(album));
    setPhotos(initialMedia);
    setIsViewerVisible(true);

    const id = albumId(album);
    if (id) {
      recordContentView({
        content_type: isGraduation ? 'graduation_album' : 'gallery_album',
        content_id: Number(id),
        title: albumTitle(album),
        category: tab.category || tab.type || 'gallery',
        url: isGraduation ? `/graduation/${id}` : `/gallery/${id}`,
      }).catch(() => {});
      try {
        const payload = isGraduation ? await getGraduationAlbum(id) : await getGalleryAlbum(id);
        const fullAlbum = unwrap(payload);
        setSelectedAlbum((current: any) => ({ ...current, ...fullAlbum }));
        let fullPhotos = isGraduation ? graduationMedia(fullAlbum, tab.category) : albumPhotos(fullAlbum);
        if (isGraduation && !fullPhotos.length) {
          const photosPayload = await getGraduationAlbumPhotos(id).catch(() => null);
          const photoData = photosPayload ? unwrap(photosPayload) : [];
          fullPhotos = Array.isArray(photoData) ? photoData : photoData?.photos || photoData?.data || [];
        }
        setPhotos(Array.isArray(fullPhotos) ? fullPhotos : []);
        setPreviewMedia(fullPhotos[0] || fullAlbum);
        setPreviewImage(mediaPreviewImage(fullPhotos[0]) || albumImage(fullAlbum));
      } catch {}
    }
  };

  const closeViewer = () => {
    setIsViewerVisible(false);
    setIsGridVisible(false);
    setSelectedAlbum(null);
    setPhotos([]);
    setPreviewMedia(null);
  };

  useEffect(() => {
    const rawAlbumId = Array.isArray(targetAlbumId) ? targetAlbumId[0] : targetAlbumId;
    if (!rawAlbumId || openedRouteAlbumRef.current === String(rawAlbumId)) return;

    let active = true;
    openedRouteAlbumRef.current = String(rawAlbumId);
    setActiveTab('general');

    getGalleryAlbum(rawAlbumId)
      .then((payload) => {
        if (!active) return;
        const album = unwrap(payload);
        const media = albumPhotos(album);
        const rawPhotoId = Array.isArray(targetPhotoId) ? targetPhotoId[0] : targetPhotoId;
        const targetMedia = rawPhotoId
          ? media.find((item: any) => String(item?.id || item?.photo_id || item?.media_id) === String(rawPhotoId))
          : null;
        setSelectedAlbum(album);
        setPhotos(media);
        setPreviewMedia(targetMedia || media[0] || album);
        setPreviewImage(mediaPreviewImage(targetMedia || media[0]) || albumImage(album));
        setIsViewerVisible(true);
      })
      .catch(() => {
        openedRouteAlbumRef.current = null;
      });

    return () => { active = false; };
  }, [targetAlbumId, targetPhotoId]);

  const openUploadFlow = (album: any = null) => {
    if (!canUploadGallery) {
      router.push('/payment' as any);
      return;
    }
    setUploadTargetAlbum(album);
    setUploadAssets([]);
    setUploadCaption('');
    setUploadStep('album');
    setUploadModalOpen(true);
  };

  const closeUploadFlow = () => {
    setUploadModalOpen(false);
    setUploadStep('album');
    setUploadTargetAlbum(null);
    setUploadAssets([]);
    setUploadCaption('');
  };

  const refreshSelectedAlbum = async () => {
    if (!selectedAlbumId || isGraduation) return;
    const payload = await getGalleryAlbum(selectedAlbumId);
    const fullAlbum = unwrap(payload);
    const fullPhotos = albumPhotos(fullAlbum);
    setSelectedAlbum((current: any) => ({ ...current, ...fullAlbum }));
    setPhotos(Array.isArray(fullPhotos) ? fullPhotos : []);
    setPreviewMedia(fullPhotos[0] || fullAlbum);
    setPreviewImage(mediaPreviewImage(fullPhotos[0]) || albumImage(fullAlbum));
    loadAlbums(1);
  };

  const submitAlbum = async () => {
    if (!canUploadGallery) {
      Alert.alert('Upgrade required', 'Standard or Premium is required to create gallery albums.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose a plan', onPress: () => router.push('/payment' as any) },
      ]);
      return;
    }
    if (!newAlbumTitle.trim()) {
      Alert.alert('Album title required', 'Please enter a title for the new gallery album.');
      return;
    }

    try {
      setGallerySaving(true);
      const payload = await createGalleryAlbum({
        title: newAlbumTitle.trim(),
        description: newAlbumDescription.trim() || undefined,
        type: 'general',
      });
      const createdAlbum = unwrap(payload);
      setAlbumModalOpen(false);
      setNewAlbumTitle('');
      setNewAlbumDescription('');
      await loadAlbums(1);
      if (uploadModalOpen) {
        setUploadTargetAlbum(createdAlbum);
        setUploadStep('media');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Album created', `${albumTitle(createdAlbum)} is ready for uploads.`);
    } catch (requestError: any) {
      Alert.alert('Album not created', getErrorMessage(requestError, 'Unable to create this album.'));
    } finally {
      setGallerySaving(false);
    }
  };

  const pickUploadAssets = async () => {
    if (!canUploadGallery) {
      Alert.alert('Upgrade required', 'Standard or Premium is required to upload gallery media.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose a plan', onPress: () => router.push('/payment' as any) },
      ]);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to upload gallery media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;
    setUploadAssets(result.assets);
  };

  const submitUpload = async () => {
    const targetAlbumId = uploadTargetAlbumId || selectedAlbumId;
    if (!targetAlbumId || isGraduation) return;
    if (!canUploadGallery) {
      Alert.alert('Upgrade required', 'Standard or Premium is required to upload gallery media.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose a plan', onPress: () => router.push('/payment' as any) },
      ]);
      return;
    }
    if (!uploadAssets.length) {
      Alert.alert('No media selected', 'Please choose at least one photo or video.');
      return;
    }

    try {
      setGallerySaving(true);
      const photosToUpload = uploadAssets.filter((asset) => !String(asset.mimeType || '').startsWith('video/'));
      const videosToUpload = uploadAssets.filter((asset) => String(asset.mimeType || '').startsWith('video/'));

      if (photosToUpload.length) {
        const form = new FormData();
        form.append('album_id', String(targetAlbumId));
        if (uploadCaption.trim()) form.append('caption', uploadCaption.trim());
        photosToUpload.forEach((asset, index) => {
          form.append('photos[]', {
            uri: asset.uri,
            name: asset.fileName || `gallery-photo-${index + 1}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          } as any);
        });
        await bulkUploadMedia(form);
      }

      for (const [index, asset] of videosToUpload.entries()) {
        const form = new FormData();
        form.append('album_id', String(targetAlbumId));
        if (uploadCaption.trim()) form.append('caption', uploadCaption.trim());
        form.append('video', {
          uri: asset.uri,
          name: asset.fileName || `gallery-video-${index + 1}.mp4`,
          type: asset.mimeType || 'video/mp4',
        } as any);
        await uploadMediaVideo(form);
      }

      closeUploadFlow();
      if (String(targetAlbumId) === String(selectedAlbumId)) {
        await refreshSelectedAlbum();
      } else {
        await loadAlbums(1);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Upload submitted', 'Your media was uploaded and is waiting for admin approval.');
    } catch (requestError: any) {
      Alert.alert('Upload failed', getErrorMessage(requestError, 'Unable to upload this gallery media.'));
    } finally {
      setGallerySaving(false);
    }
  };

  const confirmDeleteMedia = (item = previewMedia) => {
    if (!item || isGraduation) return;
    if (!canUploadGallery) {
      Alert.alert('Upgrade required', 'Standard or Premium is required to manage gallery media.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose a plan', onPress: () => router.push('/payment' as any) },
      ]);
      return;
    }
    const id = item?.id || item?.media_id || item?.photo_id;
    if (!id) {
      Alert.alert('Delete unavailable', 'This media item has no deleteable id.');
      return;
    }

    Alert.alert('Delete media?', 'This removes the media from the gallery album.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setGallerySaving(true);
            await deleteGalleryMedia(id).catch(() => deleteMediaPhoto(id));
            await refreshSelectedAlbum();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch (requestError: any) {
            Alert.alert('Delete failed', getErrorMessage(requestError, 'Unable to delete this media item.'));
          } finally {
            setGallerySaving(false);
          }
        },
      },
    ]);
  };

  const openTranscriptModal = async (item = previewMedia) => {
    const photoId = mediaTranscriptPhotoId(item);
    const album = selectedAlbumId;
    const searchText = item?.title || item?.caption || item?.name || albumTitle(selectedAlbum);
    setTranscriptModalOpen(true);
    setTranscriptLoading(true);
    setTranscriptTab('transcript');
    setSelectedTranscript(null);
    setTranscripts([]);

    try {
      const requests = [
        photoId ? getTranscripts({ graduation_photo_id: photoId }) : null,
        album ? getTranscripts({ album_id: album }) : null,
        searchText ? getTranscripts({ q: searchText }) : null,
      ].filter(Boolean) as Promise<any>[];
      const results = await Promise.allSettled(requests);
      const byId = new Map();
      results.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        const raw = unwrap(result.value);
        const list = Array.isArray(raw) ? raw : raw?.data || [];
        list.forEach((entry: any) => byId.set(entry?.id || `${entry?.title}-${byId.size}`, entry));
      });
      const list = [...byId.values()];
      setTranscripts(list);
      setSelectedTranscript(list[0] || null);
    } catch {
      setTranscripts([]);
    } finally {
      setTranscriptLoading(false);
    }
  };

  const copyText = async (text: string, label = 'Transcript copied') => {
    await Clipboard.setStringAsync(text);
    Alert.alert(label, 'The text was copied to your clipboard.');
  };

  const copySubtitle = async (id: any, format: string) => {
    try {
      setTranscriptActionLoading(true);
      const text = await getTranscriptSubtitles(id, format);
      await copyText(String(text || ''), `${format.toUpperCase()} copied`);
    } catch (requestError: any) {
      Alert.alert('Subtitle unavailable', getErrorMessage(requestError, `Unable to copy ${format.toUpperCase()} subtitles.`));
    } finally {
      setTranscriptActionLoading(false);
    }
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
    const makeForm = (type: 'general' | 'graduation') => {
      const form = new FormData();
      form.append('face_image', imageUploadPart(asset, `face-search-${type}`) as any);
      form.append('type', type);
      return form;
    };

    try {
      setFaceLoading(true);
      setIsFaceVisible(true);
      const responses = await Promise.allSettled([
        faceSearch(makeForm('general')),
        faceSearch(makeForm('graduation')),
      ]);
      const normalizedResults = dedupeFaceResults(responses.flatMap((response, index) => {
        if (response.status !== 'fulfilled') return [];
        const source = index === 0 ? 'general' : 'graduation';
        const data = unwrap(response.value);
        const results = Array.isArray(data) ? data : data?.photos || data?.matches || [];
        return Array.isArray(results) ? results.map((match: any) => ({ ...match, source_type: match?.source_type || source })) : [];
      }));
      setFaceResults(normalizedResults);
      if (normalizedResults[0]) {
        setActiveTab(faceResultTabKey(normalizedResults[0]));
      }
      Haptics.notificationAsync(normalizedResults.length ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    } catch (requestError: any) {
      Alert.alert('Face search failed', getErrorMessage(requestError, 'Unable to run face search.'));
    } finally {
      setFaceLoading(false);
    }
  };

  const openFaceResult = async (item: any) => {
    const matchedImage = photoUrl(item);
    const album = item?.album || item?.gallery?.album || item?.graduation_album || {};
    const resultCategory = album?.category || item?.category;
    const resultAlbumId = item?.album_id || item?.graduation_album_id || album?.id;
    const targetTab = faceResultTabKey(item);
    const resultTab = TABS.find((entry) => entry.key === targetTab) || null;
    setActiveTab(targetTab);

    setPreviewMedia(item);
    setPreviewImage(matchedImage);
    setSelectedAlbum(album?.id ? album : { ...album, id: resultAlbumId, title: album?.title || item?.album_title || 'Face Match' });
    setPhotos([item]);
    setIsFaceVisible(false);
    setIsGridVisible(false);
    setIsViewerVisible(true);

    if (resultAlbumId && resultTab?.type === 'graduation') {
      try {
        const payload = await getGraduationAlbum(resultAlbumId);
        const fullAlbum = unwrap(payload);
        const fullMedia = graduationMedia(fullAlbum, resultCategory);
        setSelectedAlbum(fullAlbum);
        setPhotos(Array.isArray(fullMedia) && fullMedia.length ? fullMedia : [item]);
        const match = (Array.isArray(fullMedia) ? fullMedia : []).find((entry: any) => String(entry?.id) === String(item?.id || item?.photo_id));
        setPreviewMedia(match || item);
        setPreviewImage(mediaPreviewImage(match || item) || matchedImage);
      } catch {}
    } else if (resultAlbumId && targetTab === 'general') {
      try {
        const payload = await getGalleryAlbum(resultAlbumId);
        const fullAlbum = unwrap(payload);
        const fullMedia = albumPhotos(fullAlbum);
        setSelectedAlbum(fullAlbum);
        setPhotos(Array.isArray(fullMedia) && fullMedia.length ? fullMedia : [item]);
        const match = (Array.isArray(fullMedia) ? fullMedia : []).find((entry: any) => String(entry?.id) === String(item?.id || item?.media_id || item?.photo_id));
        setPreviewMedia(match || item);
        setPreviewImage(mediaPreviewImage(match || item) || matchedImage);
      } catch {}
    }
  };

  const renderAlbum = ({ item }: { item: any }) => {
    const media = isGraduation ? graduationMedia(item, tab.category) : albumPhotos(item);
    const cover = albumCoverImage(item, media);
    const count = item?.photos_count ?? item?.media_count ?? item?.count ?? media.length ?? 0;
    const fallbackKind = cover ? mediaKind(media[0], cover) : tabMediaKind(tab.category);
    const countLabel = mediaCountLabel(tab.category);
    const badgeTone = countLabel === 'photos' ? 'photo' : 'dark';

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
          {cover ? <Image source={cover} style={styles.albumImage} contentFit="cover" transition={400} /> : (
            <View style={styles.albumImageFallback}>
              <FontAwesome name={mediaIcon(fallbackKind) as any} size={34} color="#7b8ba6" />
            </View>
          )}
          <View style={[styles.photoCountBadge, badgeTone === 'dark' && styles.photoCountBadgeDark]}>
            <FontAwesome name={tab.icon as any} size={10} color={badgeTone === 'dark' ? '#ffffff' : COLORS.navy} />
            <Text style={[styles.photoCountText, badgeTone === 'dark' && styles.photoCountTextDark]}>{count} {countLabel}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.albumTitle} numberOfLines={2}>{albumTitle(item)}</Text>
          <Text style={styles.albumTime} numberOfLines={1}>{albumSubtitle(item, tab.category)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heroLabel}>Gallery</Text>
          <Text style={styles.compactTitle}>Albums</Text>
        </View>
        <TouchableOpacity style={styles.avatarButton} onPress={() => Alert.alert('Content ownership', `All media in this gallery is protected content from ${schoolName}.`)}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchShell}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={faceLoading ? 'Searching by face...' : 'Search gallery or tap camera for face search...'}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.cameraButton} onPress={handleFaceSearch} disabled={faceLoading}>
            {faceLoading ? <ActivityIndicator color="#F5A623" size="small" /> : <FontAwesome name="camera" size={15} color="#F5A623" />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity style={[styles.dropdownPill, styles.typeDropdown]} activeOpacity={0.88} onPress={() => setFilterSheet('type')}>
          <View>
            <Text style={styles.typeDropdownLabel}>Type</Text>
            <Text style={styles.typeDropdownValue} numberOfLines={1}>{activeTypeLabel}</Text>
          </View>
          <FontAwesome name="chevron-down" size={12} color={COLORS.navy} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dropdownPill, styles.yearDropdown]} activeOpacity={0.88} onPress={() => setFilterSheet('year')}>
          <View>
            <Text style={styles.yearDropdownLabel}>Year</Text>
            <Text style={styles.yearDropdownValue} numberOfLines={1}>{activeYear}</Text>
          </View>
          <FontAwesome name="chevron-down" size={12} color={COLORS.gold} />
        </TouchableOpacity>
        {!isGraduation ? (
          <TouchableOpacity style={[styles.galleryActionButton, !canUploadGallery && styles.galleryActionLocked]} onPress={() => openUploadFlow()}>
            <FontAwesome name={canUploadGallery ? 'upload' : 'lock'} size={12} color={COLORS.navy} />
            <Text style={styles.galleryActionText}>{canUploadGallery ? 'Upload' : 'Locked'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={visibleAlbums}
        keyExtractor={(item, index) => albumListKey(item, index, activeTab)}
        renderItem={renderAlbum}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={(
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{activeTypeLabel}</Text>
          </View>
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

      <Modal transparent visible={Boolean(filterSheet)} animationType="fade" onRequestClose={() => setFilterSheet(null)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setFilterSheet(null)} />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{filterSheet === 'type' ? 'Filter by type' : 'Filter by year'}</Text>
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {(filterSheet === 'type' ? TYPE_OPTIONS : yearFilters).map((option: any) => {
                const label = typeof option === 'string' ? option : option.label;
                const value = typeof option === 'string' ? option : option.key;
                const selected = filterSheet === 'type' ? activeTab === value : activeYear === value;
                return (
                  <TouchableOpacity key={value} style={styles.sheetOption} onPress={() => filterSheet === 'type' ? selectType(value) : selectYear(value)} activeOpacity={0.84}>
                    <Text style={styles.sheetOptionText}>{label}</Text>
                    <View style={[styles.optionCircle, selected && styles.optionCircleSelected]}>
                      {selected ? <FontAwesome name="check" size={11} color={COLORS.navy} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.applyButton} onPress={() => setFilterSheet(null)}>
              <Text style={styles.applyButtonText}>Apply filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isViewerVisible} animationType="fade" onRequestClose={closeViewer}>
        <View style={styles.viewerOverlay}>
          <StatusBar style="light" />
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => isGridVisible ? setIsGridVisible(false) : closeViewer()} style={styles.closeButton}>
              <FontAwesome name={isGridVisible ? 'chevron-left' : 'times'} size={isGridVisible ? 20 : 23} color="white" />
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>{isGridVisible ? `All Photos (${photos.length})` : albumTitle(selectedAlbum)}</Text>
            {!isGraduation ? (
              <TouchableOpacity style={styles.closeButton} onPress={() => openUploadFlow(selectedAlbum)} disabled={gallerySaving}>
                <FontAwesome name={canUploadGallery ? 'upload' : 'lock'} size={16} color="white" />
              </TouchableOpacity>
            ) : <View style={styles.shareButton} />}
          </View>

          {!isGridVisible ? (
            <View style={styles.lightboxContainer}>
              <ScrollView contentContainerStyle={styles.detailContent}>
                {previewKind === 'image' ? (
                  <View style={styles.imagePreviewPanel}>
                    {previewThumb ? <Image source={previewThumb} style={styles.detailImage} contentFit="contain" transition={300} /> : (
                      <View style={styles.mediaPlaceholder}>
                        <FontAwesome name="camera" size={38} color="#7b8ba6" />
                      </View>
                    )}
                    <View style={styles.coverCountBadge}>
                      <Text style={styles.coverCountText}>{photos.length || photoCount(selectedAlbum)} photos</Text>
                    </View>
                    {previewThumb ? (
                      <TouchableOpacity style={styles.openMediaButton} onPress={() => openExternalMedia(previewUrl || previewThumb, 'image')}>
                        <FontAwesome name="expand" size={13} color={COLORS.navy} />
                        <Text style={styles.openMediaButtonText}>Open Full Image</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : previewKind === 'video' || previewKind === 'audio' ? (
                  <>
                    <View>
                      <InAppMediaPlayer source={previewUrl} poster={previewThumb} kind={previewKind} />
                      <View style={styles.previewVideoBadge}>
                        <Text style={styles.previewVideoBadgeText}>{previewKind === 'audio' ? 'AUDIO' : 'VIDEO'}</Text>
                      </View>
                    </View>
                    {isGraduation ? (
                      <TouchableOpacity style={styles.viewTranscriptButton} onPress={() => openTranscriptModal(previewMedia)}>
                        <FontAwesome name="file-text" size={13} color={COLORS.navy} />
                        <Text style={styles.viewTranscriptText}>View Transcript</Text>
                      </TouchableOpacity>
                    ) : currentTranscriptLines.length ? (
                      <View style={styles.detailPanel}>
                        <Text style={styles.detailPanelTitle}>Transcript</Text>
                        {currentTranscriptLines.map((line, index) => (
                          <View key={`${line.time}-${index}`} style={styles.transcriptLine}>
                            <Text style={styles.transcriptTime}>{line.time}</Text>
                            <Text style={styles.transcriptText}>{line.text}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </>
                ) : (
                  <>
                    <View style={styles.documentPreviewPanel}>
                      <View style={styles.documentIconBox}>
                        <FontAwesome name={mediaIcon(previewKind) as any} size={42} color="#fdb813" />
                      </View>
                      <Text style={styles.documentLabel}>{mediaTypeLabel(previewKind)}</Text>
                      <TouchableOpacity style={styles.openMediaButton} onPress={() => openExternalMedia(previewUrl, 'PDF')}>
                        <FontAwesome name="external-link" size={13} color={COLORS.navy} />
                        <Text style={styles.openMediaButtonText}>Open PDF</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.detailPanel}>
                      <Text style={styles.detailPanelTitle}>Contents</Text>
                      {documentContents(previewMedia).map((entry, index) => (
                        <View key={`${entry.title}-${index}`} style={styles.contentsRow}>
                          <Text style={styles.contentsTitle}>{entry.title}</Text>
                          <Text style={styles.contentsPage}>p. {entry.page}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
                <View style={styles.albumMetaRow}>
                  <View>
                    <Text style={styles.photoCountBig}>{photos.length || photoCount(selectedAlbum)} items in album</Text>
                    <Text style={styles.albumDate}>{albumSubtitle(selectedAlbum, tab.category)}</Text>
                  </View>
                  <View style={styles.contentTypePill}>
                    <Text style={styles.contentTypePillText}>{previewKind}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => setIsGridVisible(true)}>
                  <Text style={styles.viewAllBtnText}>View All Media</Text>
                </TouchableOpacity>
                {!isGraduation && previewMedia && canUploadGallery ? (
                  <TouchableOpacity style={styles.deleteMediaButton} onPress={() => confirmDeleteMedia(previewMedia)} disabled={gallerySaving}>
                    <FontAwesome name="trash" size={13} color="#dc2626" />
                    <Text style={styles.deleteMediaText}>Delete Selected Media</Text>
                  </TouchableOpacity>
                ) : null}
                {previewKind === 'image' ? (
                  <View style={styles.inlinePhotoGrid}>
                    {photos.map((item, index) => {
                      const itemUrl = photoUrl(item);
                      const kind = mediaKind(item, mediaFileUrl(item) || itemUrl);
                      return (
                        <TouchableOpacity key={String(item?.id || index)} style={styles.inlineGridItem} onPress={() => { setPreviewMedia(item); setPreviewImage(itemUrl); }}>
                          {itemUrl ? <Image source={itemUrl} style={styles.inlineGridImage} contentFit="cover" /> : (
                            <View style={styles.inlineGridPlaceholder}>
                              <FontAwesome name={mediaIcon(kind) as any} size={19} color="#7b8ba6" />
                            </View>
                          )}
                          {kind === 'video' ? (
                            <View style={styles.inlineVideoBadge}>
                              <Text style={styles.inlineVideoBadgeText}>VIDEO</Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </ScrollView>
            </View>
          ) : (
            <FlatList
              data={photos}
              numColumns={3}
              keyExtractor={(_, index) => String(index)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.gridItem} onPress={() => { setPreviewMedia(item); setPreviewImage(photoUrl(item)); setIsGridVisible(false); }} onLongPress={() => confirmDeleteMedia(item)}>
                  {photoUrl(item) ? (
                    <Image source={photoUrl(item)} style={styles.gridImage} contentFit="cover" />
                  ) : (
                    <View style={styles.gridPlaceholder}>
                      <FontAwesome name={mediaIcon(mediaKind(item, mediaFileUrl(item))) as any} size={20} color="#7b8ba6" />
                    </View>
                  )}
                  {mediaKind(item, mediaFileUrl(item) || photoUrl(item)) === 'video' ? (
                    <>
                      <View style={styles.gridPlayOverlay}>
                        <FontAwesome name="play" size={16} color="#ffffff" />
                      </View>
                      <View style={styles.videoBadge}>
                        <Text style={styles.videoBadgeText}>video</Text>
                      </View>
                    </>
                  ) : mediaKind(item, mediaFileUrl(item) || photoUrl(item)) !== 'image' ? (
                    <View style={styles.fileBadge}>
                      <Text style={styles.videoBadgeText}>{mediaKind(item, mediaFileUrl(item) || photoUrl(item))}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.gridList}
            />
          )}
        </View>
      </Modal>

      <TranscriptModal
        visible={transcriptModalOpen}
        onClose={() => setTranscriptModalOpen(false)}
        title={previewMedia?.title || previewMedia?.caption || albumTitle(selectedAlbum)}
        transcripts={transcripts}
        selected={selectedTranscript}
        setSelected={setSelectedTranscript}
        activeTab={transcriptTab}
        setActiveTab={setTranscriptTab}
        loading={transcriptLoading}
        actionLoading={transcriptActionLoading}
        onSubtitle={copySubtitle}
        onCopy={(text: string) => copyText(text)}
      />

      <Modal visible={albumModalOpen} transparent animationType="slide" onRequestClose={() => setAlbumModalOpen(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setAlbumModalOpen(false)} />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Create Gallery Album</Text>
            <TextInput style={styles.formInput} placeholder="Album title" value={newAlbumTitle} onChangeText={setNewAlbumTitle} />
            <TextInput style={[styles.formInput, styles.formTextArea]} placeholder="Description" value={newAlbumDescription} onChangeText={setNewAlbumDescription} multiline textAlignVertical="top" />
            <TouchableOpacity style={[styles.applyButton, gallerySaving && styles.actionDisabled]} onPress={submitAlbum} disabled={gallerySaving}>
              <Text style={styles.applyButtonText}>{gallerySaving ? 'Creating...' : 'Create album'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={uploadModalOpen} transparent animationType="slide" onRequestClose={closeUploadFlow}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeUploadFlow} />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.uploadStepRow}>
              <View style={[styles.uploadStepPill, styles.uploadStepPillDone]}>
                <Text style={styles.uploadStepNumber}>{uploadStep === 'album' ? '1' : '✓'}</Text>
              </View>
              <Text style={[styles.uploadStepText, uploadStep === 'album' && styles.uploadStepTextActive]}>Select Album</Text>
              <FontAwesome name="chevron-right" size={10} color="#94a3b8" />
              <View style={[styles.uploadStepPill, uploadStep === 'media' && styles.uploadStepPillDone]}>
                <Text style={styles.uploadStepNumber}>2</Text>
              </View>
              <Text style={[styles.uploadStepText, uploadStep === 'media' && styles.uploadStepTextActive]}>Upload Media</Text>
            </View>

            {uploadStep === 'album' ? (
              <>
                <View style={styles.uploadSheetHeader}>
                  <Text style={styles.sheetTitle}>Select or Create an Album</Text>
                  <TouchableOpacity style={styles.newAlbumMiniButton} onPress={() => setAlbumModalOpen(true)}>
                    <FontAwesome name="plus" size={10} color={COLORS.navy} />
                    <Text style={styles.newAlbumMiniText}>New Album</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.uploadAlbumList} showsVerticalScrollIndicator={false}>
                  {albums.filter((album) => !isGraduation).map((album, index) => {
                    const selected = String(albumId(album)) === String(uploadTargetAlbumId);
                    return (
                      <TouchableOpacity key={albumListKey(album, index, 'upload')} style={[styles.uploadAlbumOption, selected && styles.uploadAlbumOptionActive]} onPress={() => setUploadTargetAlbum(album)}>
                        <FontAwesome name="folder" size={13} color={selected ? COLORS.gold : '#94a3b8'} />
                        <View style={styles.uploadAlbumCopy}>
                          <Text style={[styles.uploadAlbumTitle, selected && styles.uploadAlbumTitleActive]} numberOfLines={1}>{albumTitle(album)}</Text>
                          <Text style={styles.uploadAlbumMeta}>{photoCount(album)} item{photoCount(album) === 1 ? '' : 's'}</Text>
                        </View>
                        {selected ? <FontAwesome name="check-circle" size={16} color={COLORS.gold} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity style={[styles.applyButton, !uploadTargetAlbumId && styles.actionDisabled]} onPress={() => uploadTargetAlbumId && setUploadStep('media')} disabled={!uploadTargetAlbumId}>
                  <Text style={styles.applyButtonText}>Continue to Upload</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.selectedUploadAlbum}>
                  <View style={styles.selectedUploadAlbumBadge}>
                    <FontAwesome name="folder" size={12} color={COLORS.gold} />
                    <Text style={styles.selectedUploadAlbumText} numberOfLines={1}>{albumTitle(uploadTargetAlbum)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setUploadStep('album')}>
                    <Text style={styles.changeAlbumText}>Change Album</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.filePickerButton} onPress={pickUploadAssets}>
                  <FontAwesome name="photo" size={18} color={COLORS.gold} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filePickerTitle}>{uploadAssets.length ? `${uploadAssets.length} selected` : 'Choose photos or videos'}</Text>
                    <Text style={styles.filePickerMeta}>Uploads are reviewed by admins before appearing.</Text>
                  </View>
                </TouchableOpacity>
                {uploadAssets.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.uploadPreviewStrip}>
                    {uploadAssets.map((asset, index) => (
                      <View key={`${asset.uri}-${index}`} style={styles.uploadPreviewThumb}>
                        {String(asset.mimeType || '').startsWith('video/') ? (
                          <View style={styles.uploadPreviewVideo}>
                            <FontAwesome name="video-camera" size={16} color={COLORS.gold} />
                          </View>
                        ) : (
                          <Image source={asset.uri} style={styles.uploadPreviewImage} contentFit="cover" />
                        )}
                      </View>
                    ))}
                  </ScrollView>
                ) : null}
                <TextInput style={styles.formInput} placeholder="Caption (optional)" value={uploadCaption} onChangeText={setUploadCaption} />
                <TouchableOpacity style={[styles.applyButton, (gallerySaving || !uploadAssets.length) && styles.actionDisabled]} onPress={submitUpload} disabled={gallerySaving || !uploadAssets.length}>
                  <Text style={styles.applyButtonText}>{gallerySaving ? 'Uploading...' : 'Upload for Approval'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={isFaceVisible} animationType="slide" onRequestClose={() => setIsFaceVisible(false)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.faceHeader}>
            <TouchableOpacity onPress={() => setIsFaceVisible(false)}>
              <FontAwesome name="chevron-left" size={20} color="#1d2b4b" />
            </TouchableOpacity>
            <View style={styles.faceTitleWrap}>
              <Text style={styles.faceTitle}>Face Search Results</Text>
              <Text style={styles.faceSubtitle}>Searching All Photos and Graduation</Text>
            </View>
            <View style={{ width: 20 }} />
          </View>
          <FlatList
            data={faceResults}
            keyExtractor={faceResultKey}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.faceCard}
                activeOpacity={0.88}
                onPress={() => openFaceResult(item)}
              >
                {photoUrl(item) ? <Image source={photoUrl(item)} style={styles.faceImage} /> : <View style={styles.faceImageFallback} />}
                <View style={styles.faceInfo}>
                  <Text style={styles.faceName}>{item?.student?.name || item?.name || item?.title || 'Matched photo'}</Text>
                  <Text style={styles.faceMeta}>{faceLocation(item)}</Text>
                  <Text style={styles.faceScoreText}>{faceScore(item) ? `${Math.round(faceScore(item))}% match - tap to open location` : 'Tap to open location'}</Text>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 0, backgroundColor: COLORS.background },
  topBar: { minHeight: 72, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.navy },
  compactHeader: { height: 56, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compactTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  infoButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  avatarButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  hero: { backgroundColor: '#24365f', paddingTop: 54, paddingHorizontal: 20, paddingBottom: 38, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, alignItems: 'center' },
  heroLabel: { color: COLORS.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
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
  searchShell: { backgroundColor: COLORS.card, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  searchContainer: { minHeight: 44, borderRadius: 20, backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: COLORS.navy, fontSize: 14 },
  cameraButton: { width: 44, height: 44, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  filterBar: { backgroundColor: COLORS.card, flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  galleryActionBar: { backgroundColor: COLORS.card, paddingHorizontal: 18, paddingBottom: 14, alignItems: 'flex-end' },
  galleryActionButton: { height: 40, borderRadius: 12, backgroundColor: '#fff7e6', borderWidth: 1, borderColor: 'rgba(245,166,35,0.55)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  galleryActionLocked: { backgroundColor: '#fde68a', opacity: 0.88 },
  galleryActionText: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  dropdownPill: { height: 40, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeDropdown: { flex: 1.1, backgroundColor: COLORS.gold },
  yearDropdown: { flex: 0.9, backgroundColor: COLORS.navy },
  typeDropdownLabel: { color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  typeDropdownValue: { color: COLORS.navy, fontSize: 13, fontWeight: '900', marginTop: 3 },
  yearDropdownLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  yearDropdownValue: { color: COLORS.gold, fontSize: 13, fontWeight: '900', marginTop: 3 },
  stickyFilters: { backgroundColor: '#F0F2F8', zIndex: 10, elevation: 10, paddingTop: 2, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e3e8f2' },
  galleryChipRow: { gap: 8, paddingHorizontal: 18, paddingBottom: 8 },
  galleryChip: { height: 32, borderRadius: 12, borderWidth: 1, borderColor: '#1A2547', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  galleryChipActive: { backgroundColor: '#F5A623', borderColor: '#F5A623' },
  galleryChipText: { color: '#1A2547', fontSize: 12, fontWeight: '900' },
  galleryChipTextActive: { color: '#ffffff' },
  yearPillRow: { gap: 8, paddingHorizontal: 18 },
  yearPill: { height: 30, borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#ffffff', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  yearPillActive: { backgroundColor: '#1a2744', borderColor: '#1a2744' },
  yearPillText: { color: '#64748b', fontSize: 11, fontWeight: '900' },
  yearPillTextActive: { color: '#ffffff' },
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
  sectionHeader: { paddingHorizontal: 18, marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: COLORS.navy, fontSize: 15, fontWeight: '900' },
  columnWrapper: { paddingHorizontal: 18, gap: 10 },
  albumCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, overflow: 'hidden', marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border },
  imageContainer: { position: 'relative', height: 90, backgroundColor: COLORS.thumbnail },
  albumImage: { width: '100%', height: '100%' },
  albumImageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.thumbnail },
  albumFallbackImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  albumFallbackScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(232,234,239,0.72)' },
  photoCountBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.gold, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoCountBadgeDark: { backgroundColor: COLORS.navy },
  photoCountText: { fontSize: 10, fontWeight: '900', color: COLORS.navy },
  photoCountTextDark: { color: '#FFFFFF' },
  info: { paddingHorizontal: 10, paddingVertical: 7, minHeight: 54 },
  albumTitle: { fontSize: 12, lineHeight: 15, fontWeight: '900', color: COLORS.navy, marginBottom: 5 },
  albumTime: { fontSize: 10, color: COLORS.muted },
  emptyPanel: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 52, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 18, fontWeight: '900', marginTop: 14 },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center', padding: 18 },
  viewerOverlay: { flex: 1, backgroundColor: '#ffffff' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 18, paddingBottom: 14, backgroundColor: COLORS.navy },
  closeButton: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  viewerTitle: { flex: 1, color: 'white', fontSize: 15, fontWeight: '900', textAlign: 'center', marginHorizontal: 10 },
  shareButton: { width: 44, height: 44 },
  lightboxContainer: { flex: 1, backgroundColor: '#ffffff' },
  detailContent: { paddingBottom: 30 },
  imagePreviewPanel: { minHeight: 320, overflow: 'hidden', backgroundColor: COLORS.thumbnail, position: 'relative', justifyContent: 'center' },
  detailImage: { width: '100%', height: 320 },
  mediaPlaceholder: { height: 200, backgroundColor: COLORS.thumbnail, alignItems: 'center', justifyContent: 'center' },
  coverCountBadge: { position: 'absolute', right: 12, top: 12, borderRadius: 999, backgroundColor: 'rgba(27,42,94,0.78)', paddingHorizontal: 10, paddingVertical: 5 },
  coverCountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  videoPreviewPanel: { height: 280, overflow: 'hidden', backgroundColor: '#07122D', position: 'relative', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#0f1d3d' },
  videoPreviewImage: { width: '100%', height: '100%' },
  videoPosterImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.18 },
  videoPlayer: { width: '100%', height: '100%' },
  darkPreviewBg: { flex: 1, backgroundColor: COLORS.navy },
  previewScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.35)' },
  centerPlayButton: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -26, width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  previewVideoBadge: { position: 'absolute', left: 12, bottom: 12, borderRadius: 999, backgroundColor: COLORS.gold, paddingHorizontal: 8, paddingVertical: 4 },
  previewVideoBadgeText: { color: COLORS.navy, fontSize: 9, fontWeight: '900' },
  viewTranscriptButton: { alignSelf: 'flex-start', minHeight: 40, borderRadius: 10, backgroundColor: 'rgba(253,184,19,0.16)', borderWidth: 1, borderColor: 'rgba(253,184,19,0.28)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginBottom: 14 },
  viewTranscriptText: { color: COLORS.navy, fontSize: 13, fontWeight: '900' },
  openMediaButton: { alignSelf: 'center', minHeight: 40, borderRadius: 10, backgroundColor: COLORS.gold, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  openMediaButtonText: { color: COLORS.navy, fontSize: 13, fontWeight: '900' },
  openMediaText: { color: COLORS.navy, fontSize: 13, fontWeight: '900' },
  documentPreviewPanel: { minHeight: 200, backgroundColor: '#F7F8FB', borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  documentIconBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  documentLabel: { color: COLORS.navy, fontSize: 15, fontWeight: '900' },
  detailPanel: { borderRadius: 12, backgroundColor: '#F7F8FB', padding: 12, marginHorizontal: 14, marginBottom: 14 },
  detailPanelTitle: { color: COLORS.navy, fontSize: 13, fontWeight: '900', marginBottom: 8 },
  transcriptLine: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  transcriptTime: { width: 44, color: COLORS.gold, fontSize: 11, fontWeight: '900' },
  transcriptText: { flex: 1, color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  transcriptOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 28 },
  transcriptBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,12,24,0.82)' },
  transcriptModal: { maxHeight: '88%', borderRadius: 22, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  transcriptHeader: { minHeight: 64, borderBottomWidth: 1, borderBottomColor: '#EEF2F7', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  transcriptHeaderLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  transcriptHeaderIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(253,184,19,0.12)', alignItems: 'center', justifyContent: 'center' },
  transcriptModalTitle: { color: COLORS.navy, fontSize: 14, fontWeight: '900' },
  transcriptModalSub: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginTop: 2 },
  transcriptClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  transcriptEmptyState: { minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 28 },
  transcriptEmptyTitle: { color: COLORS.navy, fontSize: 16, fontWeight: '900', marginTop: 14 },
  transcriptEmptyText: { color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 5 },
  transcriptBody: { minHeight: 420, maxHeight: 620 },
  transcriptList: { maxHeight: 124, borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
  transcriptListContent: { padding: 10, gap: 8 },
  transcriptListItem: { borderRadius: 15, padding: 10, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  transcriptListItemActive: { backgroundColor: COLORS.navy },
  transcriptListIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  transcriptListIconActive: { backgroundColor: 'rgba(253,184,19,0.2)' },
  transcriptListTitle: { color: COLORS.navy, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  transcriptListTitleActive: { color: '#FFFFFF' },
  transcriptStatusPill: { alignSelf: 'flex-start', marginTop: 6, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
  transcriptStatusText: { fontSize: 9, fontWeight: '900' },
  transcriptDetail: { flex: 1, minHeight: 296 },
  transcriptTabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingTop: 12 },
  transcriptTab: { minHeight: 34, borderRadius: 11, backgroundColor: '#F1F5F9', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  transcriptTabActive: { backgroundColor: COLORS.navy },
  transcriptTabText: { color: '#64748B', fontSize: 11, fontWeight: '900' },
  transcriptTabTextActive: { color: '#FFFFFF' },
  transcriptTextScroll: { flex: 1 },
  transcriptTextContent: { padding: 14 },
  transcriptFullText: { color: '#334155', fontSize: 12, lineHeight: 20, backgroundColor: '#F8FAFC', borderLeftWidth: 4, borderLeftColor: COLORS.gold, borderRadius: 14, padding: 14 },
  transcriptNotes: { color: '#334155', fontSize: 12, lineHeight: 20, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14 },
  transcriptMuted: { color: '#94A3B8', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  transcriptProcessing: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12 },
  transcriptActions: { borderTopWidth: 1, borderTopColor: '#EEF2F7', paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  transcriptActionPrimary: { minHeight: 36, borderRadius: 11, backgroundColor: COLORS.navy, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  transcriptActionPrimaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  transcriptActionGold: { minHeight: 36, borderRadius: 11, backgroundColor: 'rgba(253,184,19,0.16)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  transcriptActionGoldText: { color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  transcriptActionSoft: { minHeight: 36, borderRadius: 11, backgroundColor: '#F1F5F9', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  transcriptActionSoftText: { color: '#475569', fontSize: 11, fontWeight: '900' },
  panelButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  panelButtonText: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  contentsRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  contentsTitle: { flex: 1, color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  contentsPage: { color: '#94a3b8', fontSize: 12, fontWeight: '900', marginLeft: 12 },
  albumInfo: { marginBottom: 18 },
  albumMetaRow: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  photoCountBig: { color: COLORS.navy, fontSize: 15, fontWeight: '900', marginBottom: 4 },
  albumDate: { color: COLORS.muted, fontSize: 12 },
  contentTypePill: { borderRadius: 999, backgroundColor: '#F0F2F7', paddingHorizontal: 10, paddingVertical: 6 },
  contentTypePillText: { color: COLORS.muted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  viewAllBtn: { backgroundColor: COLORS.navy, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 14, marginBottom: 14 },
  viewAllBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  deleteMediaButton: { minHeight: 44, borderRadius: 12, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca', marginHorizontal: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteMediaText: { color: '#dc2626', fontSize: 12, fontWeight: '900' },
  inlinePhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, backgroundColor: '#FFFFFF' },
  inlineGridItem: { width: '32.9%', aspectRatio: 1, position: 'relative', backgroundColor: COLORS.thumbnail },
  inlineGridImage: { width: '100%', height: '100%' },
  inlineGridPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.thumbnail, alignItems: 'center', justifyContent: 'center' },
  inlineVideoBadge: { position: 'absolute', left: 5, bottom: 5, borderRadius: 999, backgroundColor: COLORS.gold, paddingHorizontal: 6, paddingVertical: 3 },
  inlineVideoBadgeText: { color: COLORS.navy, fontSize: 9, fontWeight: '900' },
  gridList: { padding: 3, backgroundColor: '#ffffff', flexGrow: 1 },
  gridItem: { flex: 1 / 3, aspectRatio: 1, padding: 1.5, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.thumbnail, alignItems: 'center', justifyContent: 'center' },
  gridPlayOverlay: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(26,39,68,0.78)', alignItems: 'center', justifyContent: 'center' },
  videoBadge: { position: 'absolute', left: 8, bottom: 8, borderRadius: 999, backgroundColor: COLORS.gold, paddingHorizontal: 7, paddingVertical: 3 },
  fileBadge: { position: 'absolute', left: 8, bottom: 8, borderRadius: 999, backgroundColor: '#1a2744', paddingHorizontal: 7, paddingVertical: 3 },
  videoBadgeText: { color: COLORS.navy, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  filterSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26, maxHeight: '82%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 999, backgroundColor: '#D1D5E0', alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: COLORS.navy, fontSize: 13, fontWeight: '900', marginBottom: 4 },
  sheetScroll: { maxHeight: 430 },
  sheetOption: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: COLORS.background },
  sheetOptionText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  optionCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5E0', alignItems: 'center', justifyContent: 'center' },
  optionCircleSelected: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  applyButton: { height: 48, borderRadius: 12, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  applyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  actionDisabled: { opacity: 0.65 },
  formInput: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', color: COLORS.navy, paddingHorizontal: 14, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  formTextArea: { minHeight: 92, paddingTop: 13 },
  filePickerButton: { minHeight: 76, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  filePickerTitle: { color: COLORS.navy, fontSize: 13, fontWeight: '900' },
  filePickerMeta: { color: '#94a3b8', fontSize: 11, lineHeight: 16, marginTop: 3 },
  uploadStepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  uploadStepPill: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  uploadStepPillDone: { backgroundColor: COLORS.navy },
  uploadStepNumber: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  uploadStepText: { color: '#94a3b8', fontSize: 11, fontWeight: '900' },
  uploadStepTextActive: { color: COLORS.navy },
  uploadSheetHeader: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  newAlbumMiniButton: { minHeight: 32, borderRadius: 12, backgroundColor: '#f1f5f9', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  newAlbumMiniText: { color: COLORS.navy, fontSize: 10, fontWeight: '900' },
  uploadAlbumList: { maxHeight: 260, marginTop: 8 },
  uploadAlbumOption: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', paddingHorizontal: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadAlbumOptionActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  uploadAlbumCopy: { flex: 1, minWidth: 0 },
  uploadAlbumTitle: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  uploadAlbumTitleActive: { color: '#ffffff' },
  uploadAlbumMeta: { color: '#94a3b8', fontSize: 10, fontWeight: '800', marginTop: 2 },
  selectedUploadAlbum: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  selectedUploadAlbumBadge: { flex: 1, minHeight: 34, borderRadius: 12, backgroundColor: '#f1f5f9', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedUploadAlbumText: { flex: 1, minWidth: 0, color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  changeAlbumText: { color: '#64748b', fontSize: 11, fontWeight: '900' },
  uploadPreviewStrip: { gap: 8, paddingBottom: 10 },
  uploadPreviewThumb: { width: 58, height: 58, borderRadius: 14, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  uploadPreviewImage: { width: '100%', height: '100%' },
  uploadPreviewVideo: { width: '100%', height: '100%', backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  faceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#ffffff' },
  faceTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  faceTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: 'bold' },
  faceSubtitle: { color: '#94a3b8', fontSize: 10, fontWeight: '800', marginTop: 2 },
  faceContent: { padding: 20 },
  faceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  faceImage: { width: 64, height: 64, borderRadius: 12, marginRight: 14 },
  faceImageFallback: { width: 64, height: 64, borderRadius: 12, marginRight: 14, backgroundColor: '#eef2ff' },
  faceInfo: { flex: 1 },
  faceName: { color: '#1C1C1E', fontSize: 16, fontWeight: 'bold' },
  faceMeta: { color: '#8E8E93', fontSize: 13, marginTop: 4 },
  faceScoreText: { color: COLORS.gold, fontSize: 12, fontWeight: '900', marginTop: 3 },
});
