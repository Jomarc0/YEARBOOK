import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchCurrentUser,
  getBatchmates,
  getCurrentUser,
  getErrorMessage,
  getFeed,
  getTrending,
  imageUrl,
  paginationMeta,
  searchAll,
  tagStudentsOnPost,
  unwrap,
} from '../../lib/api';

const FILTERS = [
  { key: 'all', label: 'All posts' },
  { key: 'public', label: 'Public' },
  { key: 'batchmates', label: 'Batchmates' },
  { key: 'mine', label: 'My posts' },
];

const visibilityMap: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  public: { label: 'Public', icon: 'globe', color: '#047857', bg: '#ecfdf5' },
  batchmates: { label: 'Batchmates', icon: 'users', color: '#3f51b5', bg: '#eef2ff' },
  private: { label: 'Private', icon: 'lock', color: '#64748b', bg: '#f1f5f9' },
};

const isVideoMedia = (media: any) => {
  const path = String(media?.file_path || '');
  return media?.resource_type === 'video' || /(\.mp4|\.mov|\.webm)(\?|$)/i.test(path);
};

const getMediaUri = (media: any) => imageUrl(media?.file_path);

function Avatar({ user, size = 42 }: { user: any; size?: number }) {
  const uri = imageUrl(user?.profile_picture || user?.profile_pic);
  const letter = (user?.name?.trim?.()[0] || 'U').toUpperCase();
  const style = { width: size, height: size, borderRadius: 10 };

  if (uri) return <Image source={uri} style={[styles.avatar, style]} contentFit="cover" />;

  return (
    <View style={[styles.avatarFallback, style]}>
      <Text style={styles.avatarText}>{letter}</Text>
    </View>
  );
}

function VisibilityPill({ visibility }: { visibility: string }) {
  const config = visibilityMap[visibility] || visibilityMap.private;

  return (
    <View style={[styles.visibilityPill, { backgroundColor: config.bg }]}>
      <FontAwesome name={config.icon} size={9} color={config.color} />
      <Text style={[styles.visibilityText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function FeedPost({
  post,
  currentUser,
  onOpenProfile,
  onMessage,
  onTag,
}: {
  post: any;
  currentUser: any;
  onOpenProfile: (user: any) => void;
  onMessage: (user: any) => void;
  onTag: (post: any) => void;
}) {
  const media = Array.isArray(post?.media) ? post.media.filter((item: any) => item?.file_path) : [];
  const [mediaIndex, setMediaIndex] = useState(0);
  const selectedMedia = media[Math.min(mediaIndex, Math.max(media.length - 1, 0))];
  const source = getMediaUri(selectedMedia);
  const mediaCount = media.length;
  const isVideo = isVideoMedia(selectedMedia);
  const isOwn = post?.user_id === currentUser?.id;
  const canNavigateMedia = mediaCount > 1;

  const showNextMedia = (direction: 1 | -1) => {
    if (!canNavigateMedia) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMediaIndex((current) => (current + direction + mediaCount) % mediaCount);
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onOpenProfile(post?.user)}>
          <Avatar user={post?.user} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postUserInfo} onPress={() => onOpenProfile(post?.user)}>
          <View style={styles.postNameRow}>
            <Text style={styles.postName} numberOfLines={1}>{post?.user?.name || 'Yearbook user'}</Text>
            {isOwn ? <Text style={styles.youText}>(you)</Text> : null}
          </View>
          <View style={styles.postMetaRow}>
            <Text style={styles.postMeta} numberOfLines={1}>{post?.user?.course || 'Pioneer Student'}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.postMeta}>{post?.time_ago || 'Recently'}</Text>
          </View>
        </TouchableOpacity>
        <VisibilityPill visibility={post?.visibility} />
      </View>

      {source && !isVideo ? (
        <View style={styles.mediaWrap}>
          <Image source={source} style={styles.postImage} contentFit="cover" />
          {canNavigateMedia ? (
            <>
              <Text style={styles.mediaCounter}>{mediaIndex + 1} / {mediaCount}</Text>
              <TouchableOpacity style={[styles.mediaNavButton, styles.mediaNavLeft]} onPress={() => showNextMedia(-1)}>
                <FontAwesome name="chevron-left" size={12} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mediaNavButton, styles.mediaNavRight]} onPress={() => showNextMedia(1)}>
                <FontAwesome name="chevron-right" size={12} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.mediaDots}>
                {media.map((item: any, index: number) => (
                  <View key={`${item.id || item.file_path}-${index}`} style={[styles.mediaDot, index === mediaIndex && styles.mediaDotActive]} />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : source && isVideo ? (
        <View style={styles.videoPlaceholder}>
          <FontAwesome name="video-camera" size={22} color="#fdb813" />
          <Text style={styles.videoText}>Video post</Text>
          <Text style={styles.videoHint} numberOfLines={1}>{selectedMedia?.file_path?.split?.('/')?.pop?.() || 'Attached video'}</Text>
          {canNavigateMedia ? (
            <View style={styles.videoNavRow}>
              <TouchableOpacity style={styles.videoNavButton} onPress={() => showNextMedia(-1)}>
                <FontAwesome name="chevron-left" size={11} color="#fdb813" />
                <Text style={styles.videoNavText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.videoCount}>{mediaIndex + 1} / {mediaCount}</Text>
              <TouchableOpacity style={styles.videoNavButton} onPress={() => showNextMedia(1)}>
                <Text style={styles.videoNavText}>Next</Text>
                <FontAwesome name="chevron-right" size={11} color="#fdb813" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : mediaCount ? (
        <View style={styles.videoPlaceholder}>
          <FontAwesome name="video-camera" size={22} color="#fdb813" />
          <Text style={styles.videoText}>Video post</Text>
        </View>
      ) : null}

      {post?.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      {post?.tagged_students?.length ? (
        <View style={styles.tagStrip}>
          <FontAwesome name="tag" size={12} color="#3f51b5" />
          <Text style={styles.tagText} numberOfLines={2}>
            {post.tagged_students.map((student: any) => student.name).join(', ')}
          </Text>
        </View>
      ) : null}

      <View style={styles.postFooter}>
        <Text style={styles.postStat}>{Number(post?.views_count || 0).toLocaleString()} views</Text>
        <Text style={styles.postStat}>{mediaCount || 0} media</Text>
      </View>

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postActionButton} onPress={() => onOpenProfile(post?.user)}>
          <FontAwesome name="user" size={12} color="#3f51b5" />
          <Text style={styles.postActionText}>Profile</Text>
        </TouchableOpacity>
        {!isOwn ? (
          <TouchableOpacity style={styles.postActionButton} onPress={() => onMessage(post?.user)}>
            <FontAwesome name="comment" size={12} color="#3f51b5" />
            <Text style={styles.postActionText}>Message</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.postActionButton} onPress={() => onTag(post)}>
          <FontAwesome name="tag" size={12} color="#3f51b5" />
          <Text style={styles.postActionText}>Tag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [batchmates, setBatchmates] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tagPost, setTagPost] = useState<any>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagQuery, setTagQuery] = useState('');
  const [tagSaving, setTagSaving] = useState(false);
  const [tagError, setTagError] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const loadUser = async () => {
        const storedUser = await getCurrentUser();
        if (active && storedUser) setCurrentUser(storedUser);
        try {
          const freshUser = await fetchCurrentUser();
          if (active) setCurrentUser(freshUser);
        } catch {}
      };
      loadUser();
      return () => { active = false; };
    }, [])
  );

  const loadFeed = useCallback(async (nextPage = 1, append = false) => {
    try {
      setError('');
      if (!append && !refreshing) setLoading(true);
      const payload = await getFeed({ filter, page: nextPage, per_page: 10, q: query || undefined });
      const nextPosts = unwrap(payload);
      const meta = paginationMeta(payload);
      setPosts((current) => append ? [...current, ...nextPosts] : nextPosts);
      setPage(meta.currentPage);
      setLastPage(meta.lastPage);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load dashboard feed.'));
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter, query, refreshing]);

  const loadSidebarData = useCallback(async () => {
    const [batchmatesResult, trendingResult] = await Promise.allSettled([
      getBatchmates({ per_page: 10 }),
      getTrending(),
    ]);

    if (batchmatesResult.status === 'fulfilled') setBatchmates((unwrap(batchmatesResult.value) || []).slice(0, 6));
    if (trendingResult.status === 'fulfilled') setTrending((unwrap(trendingResult.value) || []).slice(0, 5));
  }, []);

  useEffect(() => {
    loadFeed(1, false);
  }, [loadFeed]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (query.trim().length < 2) {
        setShowSearch(false);
        setSearchResults(null);
        return;
      }
      try {
        const result = await searchAll(query.trim());
        if (alive) {
          setSearchResults(result?.results || result?.data?.results || result?.data || result);
          setShowSearch(true);
        }
      } catch {}
    };
    const timer = setTimeout(run, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const firstName = useMemo(() => currentUser?.name?.split?.(' ')?.[0] || 'Pioneer', [currentUser]);

  const handleLoadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    loadFeed(page + 1, true);
  };

  const openProfile = (user: any) => {
    if (!user?.name) return;
    router.push({ pathname: '/directory', params: { q: user.name } } as any);
  };

  const openMessage = (user: any) => {
    if (!user?.id) return;
    router.push({ pathname: '/messages', params: { userId: String(user.id), name: user.name || 'Student' } } as any);
  };

  const openTagModal = (post: any) => {
    setTagPost(post);
    setSelectedTagIds((post?.tagged_students || []).map((student: any) => Number(student.id)).filter(Boolean));
    setTagQuery('');
    setTagError('');
  };

  const closeTagModal = () => {
    if (tagSaving) return;
    setTagPost(null);
    setSelectedTagIds([]);
    setTagQuery('');
    setTagError('');
  };

  const saveTags = async () => {
    if (!tagPost?.id || !selectedTagIds.length) {
      setTagError('Choose at least one batchmate to tag.');
      return;
    }

    try {
      setTagSaving(true);
      setTagError('');
      const result = await tagStudentsOnPost({ photo_id: tagPost.id, student_ids: selectedTagIds });
      const taggedStudents = result?.tagged_students || result?.data?.tagged_students || [];
      setPosts((current) => current.map((post) => (
        post.id === tagPost.id ? { ...post, tagged_students: taggedStudents } : post
      )));
      setTagPost(null);
      setSelectedTagIds([]);
      setTagQuery('');
      setTagError('');
    } catch (requestError: any) {
      setTagError(getErrorMessage(requestError, 'Unable to save tags.'));
    } finally {
      setTagSaving(false);
    }
  };

  const filteredBatchmates = batchmates.filter((student: any) => {
    const needle = tagQuery.trim().toLowerCase();
    if (!needle) return true;
    return `${student?.name || ''} ${student?.course || ''}`.toLowerCase().includes(needle);
  });

  const results = [
    ...(searchResults?.faculty || []).map((item: any) => ({ ...item, type: 'Faculty' })),
    ...(searchResults?.students || []).map((item: any) => ({ ...item, type: 'Student' })),
  ].slice(0, 6);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <FlatList
        data={posts}
        keyExtractor={(item, index) => String(item?.id || index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeed(1, false); loadSidebarData(); }} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={(
          <>
            <View style={styles.topArea}>
              <Text style={styles.kicker}>Mabuhay, Pioneer!</Text>
              <View style={styles.greetingRow}>
                <View>
                  <Text style={styles.title}>Welcome back,</Text>
                  <Text style={styles.name}>{firstName}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/profile')}>
                  <Avatar user={currentUser} size={48} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBox}>
                <FontAwesome name="search" size={15} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search students, faculty, or content..."
                  placeholderTextColor="#94a3b8"
                  returnKeyType="search"
                />
              </View>

              {showSearch ? (
                <View style={styles.searchDrop}>
                  {results.length ? results.map((item: any) => (
                    <TouchableOpacity
                      key={`${item.type}-${item.id}`}
                      style={styles.resultRow}
                      onPress={() => {
                        setShowSearch(false);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(item.type === 'Faculty' ? '/faculty' : { pathname: '/directory', params: { q: item.name } } as any);
                      }}
                    >
                      <Avatar user={item} size={34} />
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.resultType}>{item.type}</Text>
                      </View>
                    </TouchableOpacity>
                  )) : <Text style={styles.emptySearch}>No results found.</Text>}
                </View>
              ) : null}
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filterButton, active && styles.filterButtonActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFilter(item.key);
                    }}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sideGrid}>
              <TouchableOpacity style={styles.sideCard} onPress={() => router.push('/directory')}>
                <Text style={styles.sideKicker}>Batchmates</Text>
                <Text style={styles.sideValue}>{batchmates.length}</Text>
                <Text style={styles.sideCopy}>People from your circle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideCardDark} onPress={() => router.push('/analytics')}>
                <Text style={styles.sideKickerGold}>Trending</Text>
                <Text style={styles.sideValueDark}>{trending.length}</Text>
                <Text style={styles.sideCopyDark}>Top viewed this week</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideCardGold} onPress={() => router.push('/analytics')}>
                <Text style={styles.sideKickerNavy}>Analytics</Text>
                <Text style={styles.sideValueGold}>View</Text>
                <Text style={styles.sideCopyNavy}>Engagement stats</Text>
              </TouchableOpacity>
            </View>

            {batchmates.length ? (
              <View style={styles.horizontalPanel}>
                <Text style={styles.panelTitle}>Suggested Batchmates</Text>
                <View style={styles.miniList}>
                  {batchmates.slice(0, 3).map((student: any) => (
                    <TouchableOpacity key={student.id} style={styles.miniItem} onPress={() => openProfile(student)}>
                      <Avatar user={student} size={34} />
                      <View style={styles.miniInfo}>
                        <Text style={styles.miniName} numberOfLines={1}>{student.name}</Text>
                        <Text style={styles.miniMeta} numberOfLines={1}>{student.course || 'Student'}</Text>
                      </View>
                      <TouchableOpacity style={styles.miniMessageButton} onPress={() => openMessage(student)}>
                        <FontAwesome name="comment" size={11} color="#3f51b5" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {trending.length ? (
              <View style={styles.horizontalPanel}>
                <View style={styles.panelTitleRow}>
                  <Text style={styles.panelTitle}>Trending This Week</Text>
                  <TouchableOpacity onPress={() => router.push('/analytics')}>
                    <Text style={styles.panelLink}>See all</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.miniList}>
                  {trending.slice(0, 3).map((student: any, index: number) => (
                    <TouchableOpacity key={student.id || `${student.name}-${index}`} style={styles.trendingRow} onPress={() => openProfile(student)}>
                      <Text style={styles.trendingRank}>#{index + 1}</Text>
                      <Avatar user={student} size={34} />
                      <View style={styles.miniInfo}>
                        <Text style={styles.miniName} numberOfLines={1}>{student.name || 'Student'}</Text>
                        <Text style={styles.miniMeta} numberOfLines={1}>
                          {Number(student.views_this_week || student.views || student.total_views || 0).toLocaleString()} views
                        </Text>
                      </View>
                      <FontAwesome name="chevron-right" size={11} color="#cbd5e1" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {loading ? <ActivityIndicator color="#1d2b4b" style={{ marginVertical: 24 }} /> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
        renderItem={({ item }) => (
          <FeedPost
            post={item}
            currentUser={currentUser}
            onOpenProfile={openProfile}
            onMessage={openMessage}
            onTag={openTagModal}
          />
        )}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyFeed}>
            <FontAwesome name="photo" size={28} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No posts here yet.</Text>
            <Text style={styles.emptyText}>{filter === 'mine' ? 'Upload your first photo in Gallery.' : 'Check back later.'}</Text>
          </View>
        ) : null}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#1d2b4b" style={{ marginVertical: 18 }} /> : <View style={{ height: 110 }} />}
        contentContainerStyle={styles.content}
      />

      <Modal visible={!!tagPost} transparent animationType="slide" onRequestClose={closeTagModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.tagModal}>
            <View style={styles.modalGrabber} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tag Batchmates</Text>
                <Text style={styles.modalSubtitle}>Add people connected to this post.</Text>
              </View>
              <TouchableOpacity style={styles.iconClose} onPress={closeTagModal}>
                <FontAwesome name="times" size={14} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearch}>
              <FontAwesome name="search" size={13} color="#94a3b8" />
              <TextInput
                style={styles.modalSearchInput}
                value={tagQuery}
                onChangeText={setTagQuery}
                placeholder="Search batchmates..."
                placeholderTextColor="#94a3b8"
              />
            </View>

            {tagError ? <Text style={styles.tagError}>{tagError}</Text> : null}

            <ScrollView style={styles.tagList} showsVerticalScrollIndicator={false}>
              {filteredBatchmates.length ? filteredBatchmates.map((student: any) => {
                const id = Number(student.id);
                const selected = selectedTagIds.includes(id);
                return (
                  <TouchableOpacity
                    key={student.id}
                    style={[styles.tagStudentRow, selected && styles.tagStudentRowActive]}
                    onPress={() => {
                      setSelectedTagIds((current) => (
                        current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
                      ));
                    }}
                  >
                    <Avatar user={student} size={36} />
                    <View style={styles.tagStudentInfo}>
                      <Text style={styles.tagStudentName} numberOfLines={1}>{student.name}</Text>
                      <Text style={styles.tagStudentMeta} numberOfLines={1}>{student.course || 'Student'}</Text>
                    </View>
                    <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
                      {selected ? <FontAwesome name="check" size={10} color="#ffffff" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              }) : (
                <View style={styles.emptyTagState}>
                  <FontAwesome name="users" size={22} color="#cbd5e1" />
                  <Text style={styles.emptyTagText}>No batchmates found.</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.selectedCount}>{selectedTagIds.length} selected</Text>
              <TouchableOpacity
                style={[styles.saveTagButton, tagSaving && styles.saveTagButtonDisabled]}
                onPress={saveTags}
                disabled={tagSaving}
              >
                {tagSaving ? <ActivityIndicator size="small" color="#1d2b4b" /> : <Text style={styles.saveTagText}>Save Tags</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  content: { paddingBottom: 0 },
  topArea: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  kicker: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 18 },
  title: { color: '#1d2b4b', fontSize: 21, fontWeight: '800' },
  name: { color: '#3f51b5', fontSize: 24, fontWeight: '900', marginTop: -2 },
  searchBox: { minHeight: 50, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  searchInput: { flex: 1, color: '#1d2b4b', fontSize: 14, marginLeft: 10 },
  searchDrop: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 8, overflow: 'hidden' },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resultInfo: { flex: 1, marginLeft: 10 },
  resultName: { color: '#1d2b4b', fontSize: 13, fontWeight: '800' },
  resultType: { color: '#94a3b8', fontSize: 11, marginTop: 1 },
  emptySearch: { color: '#94a3b8', textAlign: 'center', padding: 18 },
  avatar: { backgroundColor: '#eef2ff' },
  avatarFallback: { backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fdb813', fontWeight: '900' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 16 },
  filterButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  filterButtonActive: { backgroundColor: '#1d2b4b', borderColor: '#1d2b4b' },
  filterText: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#fdb813' },
  sideGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 18, marginBottom: 14 },
  sideCard: { flexGrow: 1, flexBasis: '30%', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14 },
  sideCardDark: { flexGrow: 1, flexBasis: '30%', backgroundColor: '#1d2b4b', borderRadius: 14, padding: 14 },
  sideCardGold: { flexGrow: 1, flexBasis: '30%', backgroundColor: '#fdb813', borderRadius: 14, padding: 14 },
  sideKicker: { color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideKickerGold: { color: 'rgba(253, 184, 19, 0.75)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideKickerNavy: { color: 'rgba(29, 43, 75, 0.72)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sideValue: { color: '#1d2b4b', fontSize: 24, fontWeight: '900', marginTop: 6 },
  sideValueDark: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 6 },
  sideValueGold: { color: '#1d2b4b', fontSize: 23, fontWeight: '900', marginTop: 6 },
  sideCopy: { color: '#64748b', fontSize: 11, marginTop: 2 },
  sideCopyDark: { color: 'rgba(255, 255, 255, 0.55)', fontSize: 11, marginTop: 2 },
  sideCopyNavy: { color: 'rgba(29, 43, 75, 0.70)', fontSize: 11, marginTop: 2 },
  horizontalPanel: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginHorizontal: 18, padding: 14, marginBottom: 14 },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  panelTitle: { color: '#1d2b4b', fontSize: 13, fontWeight: '900', marginBottom: 8 },
  panelLink: { color: '#3f51b5', fontSize: 11, fontWeight: '900' },
  miniList: { gap: 8 },
  miniItem: { flexDirection: 'row', alignItems: 'center' },
  miniInfo: { flex: 1, marginLeft: 9 },
  miniName: { color: '#1d2b4b', fontSize: 12, fontWeight: '800' },
  miniMeta: { color: '#94a3b8', fontSize: 10, marginTop: 1 },
  miniMessageButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  trendingRow: { flexDirection: 'row', alignItems: 'center', minHeight: 42 },
  trendingRank: { width: 28, color: '#cbd5e1', fontSize: 11, fontWeight: '900' },
  postCard: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginHorizontal: 18, marginBottom: 14, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  postUserInfo: { flex: 1, marginLeft: 10, minWidth: 0 },
  postNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postName: { color: '#1d2b4b', fontSize: 13, fontWeight: '900', maxWidth: '80%' },
  youText: { color: '#94a3b8', fontSize: 10 },
  postMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  postMeta: { color: '#94a3b8', fontSize: 11, maxWidth: 120 },
  dot: { color: '#cbd5e1', fontSize: 11, marginHorizontal: 5 },
  visibilityPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  visibilityText: { fontSize: 10, fontWeight: '800', marginLeft: 4 },
  mediaWrap: { backgroundColor: '#020617', position: 'relative' },
  postImage: { width: '100%', aspectRatio: 1 },
  mediaCounter: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(15, 23, 42, 0.7)', color: '#ffffff', fontSize: 11, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  mediaNavButton: { position: 'absolute', top: '46%', width: 34, height: 34, borderRadius: 999, backgroundColor: 'rgba(15, 23, 42, 0.55)', alignItems: 'center', justifyContent: 'center' },
  mediaNavLeft: { left: 10 },
  mediaNavRight: { right: 10 },
  mediaDots: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 5, backgroundColor: 'rgba(15, 23, 42, 0.45)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  mediaDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.45)' },
  mediaDotActive: { width: 12, backgroundColor: '#ffffff' },
  videoPlaceholder: { height: 180, backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  videoText: { color: '#ffffff', fontWeight: '800', marginTop: 8 },
  videoHint: { color: 'rgba(255, 255, 255, 0.55)', fontSize: 11, marginTop: 4, maxWidth: '76%' },
  videoNavRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  videoNavButton: { minHeight: 32, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(253, 184, 19, 0.35)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  videoNavText: { color: '#fdb813', fontSize: 11, fontWeight: '800' },
  videoCount: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  caption: { color: '#334155', fontSize: 13, lineHeight: 19, paddingHorizontal: 14, paddingTop: 12 },
  tagStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', marginHorizontal: 14, marginTop: 12, padding: 10, borderRadius: 10 },
  tagText: { flex: 1, color: '#3f51b5', fontSize: 12, fontWeight: '700', marginLeft: 8 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 12, marginTop: 12 },
  postStat: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  postActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  postActionButton: { flex: 1, minHeight: 38, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  postActionText: { color: '#3f51b5', fontSize: 11, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  tagModal: { maxHeight: '78%', backgroundColor: '#ffffff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24 },
  modalGrabber: { width: 44, height: 5, borderRadius: 999, backgroundColor: '#cbd5e1', alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { color: '#1d2b4b', fontSize: 18, fontWeight: '900' },
  modalSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  iconClose: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalSearch: { minHeight: 46, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
  modalSearchInput: { flex: 1, color: '#1d2b4b', fontSize: 14, marginLeft: 9 },
  tagError: { color: '#dc2626', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  tagList: { maxHeight: 330 },
  tagStudentRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 8, backgroundColor: '#ffffff' },
  tagStudentRowActive: { borderColor: '#bfdbfe', backgroundColor: '#eef2ff' },
  tagStudentInfo: { flex: 1, marginLeft: 10, minWidth: 0 },
  tagStudentName: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  tagStudentMeta: { color: '#94a3b8', fontSize: 11, marginTop: 1 },
  checkCircle: { width: 22, height: 22, borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: '#3f51b5', borderColor: '#3f51b5' },
  emptyTagState: { alignItems: 'center', paddingVertical: 34 },
  emptyTagText: { color: '#94a3b8', fontSize: 13, fontWeight: '700', marginTop: 8 },
  modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  selectedCount: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  saveTagButton: { minWidth: 126, minHeight: 42, borderRadius: 12, backgroundColor: '#fdb813', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  saveTagButtonDisabled: { opacity: 0.65 },
  saveTagText: { color: '#1d2b4b', fontSize: 13, fontWeight: '900' },
  errorText: { color: '#dc2626', marginHorizontal: 18, marginBottom: 12, fontSize: 13 },
  emptyFeed: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginHorizontal: 18, paddingVertical: 42, alignItems: 'center' },
  emptyTitle: { color: '#64748b', fontSize: 14, fontWeight: '800', marginTop: 12 },
  emptyText: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
