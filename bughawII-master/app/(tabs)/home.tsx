import { ActivityIndicator, AppState, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  clearSession,
  fetchCurrentUser,
  getAppConfig,
  getBatchmates,
  getCurrentUser,
  getErrorMessage,
  getFeed,
  getMessagesUnreadCount,
  getNotifications,
  getMemoryDigest,
  getTrending,
  imageUrl,
  paginationMeta,
  recordFeedPostView,
  searchAll,
  unwrap,
} from '../../lib/api';

const NAVY = '#1B2A4A';
const AMBER = '#F5A623';
const BACKGROUND = '#F0F2F7';
const DIVIDER = '#E5E7EB';

const FEED_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'public', label: 'Public' },
  { key: 'batchmates', label: 'Batchmates' },
  { key: 'mine', label: 'My posts' },
];

const QUICK_LINKS = [
  { label: 'Directory', icon: 'users', route: '/directory' },
  { label: 'Faculty', icon: 'briefcase', route: '/faculty' },
  { label: 'Gallery', icon: 'image', route: '/gallery' },
  { label: 'Yearbook', icon: 'book', route: '/yearbook' },
];

const visibilityLabels: Record<string, { label: string; icon: any }> = {
  public: { label: 'Public', icon: 'globe' },
  batchmates: { label: 'Batchmates', icon: 'users' },
  private: { label: 'Private', icon: 'lock' },
};

const compactNumber = (value: any) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '0';
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1)}k`;
  return numeric.toLocaleString();
};

const firstNameOf = (person: any) => {
  const name = String(person?.name || person?.full_name || 'Student').trim();
  return name.split(/\s+/)[0] || 'Student';
};

const initialsOf = (person: any) => {
  const words = String(person?.name || person?.full_name || 'Student').trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0]?.slice(0, 2);
  return (letters || 'ST').toUpperCase();
};

const mediaItemsOf = (post: any) => (Array.isArray(post?.media) ? post.media.filter((item: any) => item?.file_path) : []);

const mediaUriOf = (media: any) => imageUrl(media?.file_path || media?.thumbnail_path || media?.url);
const meaningfulText = (value: any) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  const compact = text.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (text.length < 3 || compact.length < 3) return false;
  if (/^(test|asdf|qwerty|sample|lorem|abc|haha)+$/i.test(compact)) return false;
  if (/^(.)\1{2,}$/.test(compact)) return false;
  return true;
};
const shouldShowFeedPost = (post: any) => {
  const status = String(post?.status || post?.moderation_status || post?.approval_status || '').toLowerCase();
  if (['pending', 'rejected', 'unapproved', 'hidden', 'flagged'].includes(status)) return false;
  if (post?.is_approved === false || post?.approved === false || post?.is_public === false) return false;
  return mediaItemsOf(post).length > 0 || meaningfulText(post?.caption || post?.body || post?.message);
};

function DividerLine() {
  return <View style={styles.divider} />;
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

function HeaderIcon({ icon, count, onPress }: { icon: any; count: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.headerIconButton} onPress={onPress} activeOpacity={0.82}>
      <FontAwesome name={icon} size={15} color="#ffffff" />
      <Badge count={count} />
    </TouchableOpacity>
  );
}

function Avatar({ user, size = 'medium' }: { user: any; size?: 'small' | 'medium' | 'large' | 'post' }) {
  const uri = imageUrl(user?.profile_picture || user?.profile_pic || user?.avatar);
  const avatarSize =
    size === 'small' ? styles.avatarSmall :
    size === 'large' ? styles.avatarLarge :
    size === 'post' ? styles.avatarPost :
    styles.avatarMedium;
  const textSize =
    size === 'small' ? styles.avatarTextSmall :
    size === 'large' ? styles.avatarTextLarge :
    size === 'post' ? styles.avatarTextPost :
    styles.avatarTextMedium;

  if (uri) {
    return <Image source={uri} style={[styles.avatarBase, avatarSize]} contentFit="cover" />;
  }

  return (
    <View style={[styles.avatarBase, avatarSize, styles.avatarFallback]}>
      <Text style={[styles.avatarText, textSize]}>{initialsOf(user)}</Text>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.75}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function QuickLinks({ onPress }: { onPress: (route: string) => void }) {
  return (
    <FlatList
      data={QUICK_LINKS}
      keyExtractor={(item) => item.label}
      horizontal
      scrollEnabled={false}
      contentContainerStyle={styles.quickList}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.quickItem} onPress={() => onPress(item.route)} activeOpacity={0.82}>
          <View style={styles.quickIconBox}>
            <FontAwesome name={item.icon as any} size={18} color={AMBER} />
          </View>
          <Text style={styles.quickLabel} numberOfLines={1}>{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

function StatsRow({ batchmatesCount, trendingCount, memoriesCount }: { batchmatesCount: number; trendingCount: number; memoriesCount: number }) {
  const stats = [
    { key: 'batchmates', label: 'Batchmates', value: batchmatesCount, subtitle: 'Your circle', amber: false },
    { key: 'trending', label: 'Trending', value: trendingCount, subtitle: 'This week', amber: true },
    { key: 'memories', label: 'Memories', value: memoriesCount, subtitle: 'Recent posts', amber: false },
  ].filter((stat) => stat.key !== 'batchmates' || stat.value > 0);

  return (
    <View style={styles.statsRow}>
      {stats.map((stat) => (
        <View key={stat.key} style={styles.statCard}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={[styles.statValue, stat.amber && styles.statValueAmber]}>{compactNumber(stat.value)}</Text>
          <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
        </View>
      ))}
    </View>
  );
}

function SuggestedBatchmates({ students, onOpen, onSeeAll }: { students: any[]; onOpen: (student: any) => void; onSeeAll: () => void }) {
  if (!students.length) return null;

  return (
    <View style={styles.sectionBlock}>
      <SectionHeader title="Suggested Batchmates" onSeeAll={onSeeAll} />
      <FlatList
        data={students.slice(0, 12)}
        keyExtractor={(item, index) => String(item?.id || `${item?.name}-${index}`)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.batchmateItem} onPress={() => onOpen(item)} activeOpacity={0.84}>
            <Avatar user={item} size="large" />
            <Text style={styles.batchmateName} numberOfLines={1}>{firstNameOf(item)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function TrendingThisWeek({ students, onOpen, onSeeAll }: { students: any[]; onOpen: (student: any) => void; onSeeAll: () => void }) {
  if (!students.length) return null;

  return (
    <View style={styles.sectionBlock}>
      <SectionHeader title="Trending This Week" onSeeAll={onSeeAll} />
      <FlatList
        data={students.slice(0, 12)}
        keyExtractor={(item, index) => String(item?.id || `${item?.name}-${index}`)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.trendingCard} onPress={() => onOpen(item)} activeOpacity={0.84}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <Avatar user={item} size="small" />
            <View style={styles.trendingInfo}>
              <Text style={styles.trendingName} numberOfLines={1}>{firstNameOf(item)}</Text>
              <Text style={styles.trendingViews} numberOfLines={1}>
                {compactNumber(item?.views_this_week || item?.views || item?.total_views)} views
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const allowedMemoryType = (value: any) => ['on_this_day', 'appeared_in_photo', 'profile_viewed'].includes(String(value || '').toLowerCase());
const shouldShowMemory = (memory: any) => {
  const type = String(memory?.content_type || memory?.type || '').toLowerCase();
  const title = String(memory?.title || '').toLowerCase();
  if (!allowedMemoryType(type) || type === 'trending') return false;
  if (title.includes('sample') || title.includes('qa')) return false;
  return true;
};

const memoryThumb = (memory: any) => imageUrl(
  memory?.thumbnail_url ||
  memory?.thumbnail ||
  memory?.image ||
  memory?.photo_url ||
  memory?.file_path ||
  memory?.cover_url
);

const memoryIcon = (type: string) => {
  if (type === 'on_this_day') return 'history';
  if (type === 'appeared_in_photo') return 'image';
  return 'eye';
};

function MemoryDigest({
  memories,
  loading,
  error,
  onOpen,
  onRetry,
}: {
  memories: any[];
  loading: boolean;
  error: string;
  onOpen: (memory: any) => void;
  onRetry: () => void;
}) {
  const visibleMemories = memories.filter(shouldShowMemory).slice(0, 3);

  return (
    <View style={styles.memoryDigestCard}>
      <View style={styles.memoryDigestHeader}>
        <View style={styles.memoryDigestTitleRow}>
          <FontAwesome name="clock-o" size={14} color={AMBER} />
          <Text style={styles.memoryDigestTitle}>Memory Digest</Text>
        </View>
        {error ? (
          <TouchableOpacity style={styles.memoryRetryButton} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.memoryRetryText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.memoryRows}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={styles.memorySkeletonRow}>
              <View style={styles.memorySkeletonIcon} />
              <View style={styles.memorySkeletonText}>
                <View style={styles.memorySkeletonLineWide} />
                <View style={styles.memorySkeletonLineShort} />
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.memoryEmptyState}>
          <Text style={styles.memoryEmptyTitle}>Could not load memories</Text>
          <Text style={styles.memoryEmptySubtitle}>Check your connection and try again.</Text>
        </View>
      ) : visibleMemories.length ? (
        <View style={styles.memoryRows}>
          {visibleMemories.map((item, index) => {
            const type = String(item?.content_type || item?.type || '').toLowerCase();
            const thumb = type === 'appeared_in_photo' ? memoryThumb(item) : null;
            return (
              <TouchableOpacity
                key={String(item?.id || item?.photo_id || item?.content_id || `${type}-${index}`)}
                style={styles.memoryRow}
                onPress={() => onOpen(item)}
                activeOpacity={0.84}
              >
                {thumb ? (
                  <Image source={thumb} style={styles.memoryThumb} contentFit="cover" />
                ) : (
                  <View style={styles.memoryIconBox}>
                    <FontAwesome name={memoryIcon(type) as any} size={15} color={AMBER} />
                  </View>
                )}
                <View style={styles.memoryRowBody}>
                  <Text style={styles.memoryRowTitle} numberOfLines={1}>{item?.title || 'Yearbook memory'}</Text>
                  <Text style={styles.memoryRowSubtitle} numberOfLines={1}>{item?.subtitle || item?.album || 'Your highlight'}</Text>
                </View>
                <Text style={styles.memoryTimestamp} numberOfLines={1}>{item?.timestamp || item?.tagged_at || item?.taken_at || ''}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.memoryEmptyState}>
          <Text style={styles.memoryEmptyTitle}>No memories yet</Text>
          <Text style={styles.memoryEmptySubtitle}>Your highlights and appearances will show up here</Text>
        </View>
      )}
    </View>
  );
}

function AnalyticsSnapshot({ metrics }: { metrics: { key: string; label: string; icon: any; value: number; trend: number }[] }) {
  const visible = metrics.some((metric) => Number(metric.value || 0) > 0);
  if (!visible) return null;

  return (
    <View style={styles.sectionBlock}>
      <SectionHeader title="Analytics Snapshot" />
      <View style={styles.analyticsGrid}>
        {metrics.map((metric) => {
          const hasValue = Number(metric.value || 0) > 0;
          const positive = Number(metric.trend || metric.value || 0) >= 0;
          return (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <FontAwesome name={metric.icon} size={15} color={AMBER} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{hasValue ? compactNumber(metric.value) : '—'}</Text>
                {hasValue ? (
                  <Text style={[styles.metricTrend, positive ? styles.trendUp : styles.trendDown]}>
                    {positive ? '↑' : '↓'}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricWeek}>This week</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function FilterPills({ active, onChange }: { active: string; onChange: (key: string) => void }) {
  return (
    <FlatList
      data={FEED_FILTERS}
      keyExtractor={(item) => item.key}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterList}
      renderItem={({ item }) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            style={[styles.filterPill, isActive && styles.filterPillActive]}
            onPress={() => onChange(item.key)}
            activeOpacity={0.82}
          >
            <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function SearchResults({ results, onOpen }: { results: any[]; onOpen: (item: any) => void }) {
  if (!results.length) {
    return (
      <View style={styles.searchResults}>
        <Text style={styles.searchEmpty}>No results found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.searchResults}>
      {results.map((item) => (
        <TouchableOpacity key={`${item.type}-${item.id}`} style={styles.resultRow} onPress={() => onOpen(item)} activeOpacity={0.8}>
          <Avatar user={item} size="small" />
          <View style={styles.resultCopy}>
            <Text style={styles.resultName} numberOfLines={1}>{item.name || 'Result'}</Text>
            <Text style={styles.resultType}>{item.type}</Text>
          </View>
          <FontAwesome name="chevron-right" size={11} color="#CBD5E1" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AudienceBadge({ visibility }: { visibility: string }) {
  const key = visibilityLabels[visibility] ? visibility : 'private';
  const config = visibilityLabels[key];
  return (
    <View style={[styles.audienceBadge, key === 'public' && styles.audiencePublic, key === 'batchmates' && styles.audienceBatchmates]}>
      <FontAwesome name={config.icon} size={9} color={key === 'private' ? '#64748B' : NAVY} />
      <Text style={[styles.audienceText, key === 'private' && styles.audiencePrivateText]}>{config.label}</Text>
    </View>
  );
}

function FeedPost({ post, currentUser, onOpenProfile }: { post: any; currentUser: any; onOpenProfile: (user: any) => void }) {
  const media = mediaItemsOf(post);
  const [mediaIndex, setMediaIndex] = useState(0);
  const activeMedia = media[Math.min(mediaIndex, Math.max(media.length - 1, 0))];
  const mediaUri = mediaUriOf(activeMedia);
  const owner = post?.user || post?.student || currentUser;
  const taggedPeople = Array.isArray(post?.tagged_students)
    ? post.tagged_students
    : Array.isArray(post?.tagged_users)
      ? post.tagged_users
      : Array.isArray(post?.tags)
        ? post.tags
        : [];

  const tapAction = () => Haptics.selectionAsync();
  const moveMedia = (direction: 1 | -1) => {
    if (media.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMediaIndex((current) => (current + direction + media.length) % media.length);
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onOpenProfile(owner)} activeOpacity={0.82}>
          <Avatar user={owner} size="post" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postHeaderCopy} onPress={() => onOpenProfile(owner)} activeOpacity={0.82}>
          <Text style={styles.postName} numberOfLines={1}>{owner?.name || 'Yearbook user'}</Text>
          <Text style={styles.postTime} numberOfLines={1}>{post?.time_ago || post?.created_at_human || 'Recently'}</Text>
        </TouchableOpacity>
        <AudienceBadge visibility={post?.visibility || post?.audience || 'public'} />
      </View>

      {mediaUri ? (
        <View style={styles.postMediaWrap}>
          <Image source={mediaUri} style={styles.postImage} contentFit="cover" />
          {media.length > 1 ? (
            <>
              <View style={styles.mediaCounter}>
                <Text style={styles.mediaCounterText}>{mediaIndex + 1} / {media.length}</Text>
              </View>
              <TouchableOpacity style={[styles.mediaNavButton, styles.mediaNavLeft]} onPress={() => moveMedia(-1)}>
                <FontAwesome name="chevron-left" size={13} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mediaNavButton, styles.mediaNavRight]} onPress={() => moveMedia(1)}>
                <FontAwesome name="chevron-right" size={13} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.mediaDots}>
                {media.map((item: any, index: number) => (
                  <TouchableOpacity
                    key={String(item?.id || item?.file_path || index)}
                    style={[styles.mediaDot, index === mediaIndex && styles.mediaDotActive]}
                    onPress={() => setMediaIndex(index)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.postImagePlaceholder}>
          <FontAwesome name="image" size={28} color="#CBD5E1" />
        </View>
      )}

      {post?.caption ? <Text style={styles.postCaption}>{post.caption}</Text> : null}
      {taggedPeople.length ? (
        <View style={styles.taggedPeopleStrip}>
          <FontAwesome name="tag" size={12} color="#3f51b5" />
          <Text style={styles.taggedPeopleText} numberOfLines={2}>
            Tagged: {taggedPeople.map((person: any) => person?.name || person?.full_name || person?.student?.name || 'Student').join(', ')}
          </Text>
        </View>
      ) : null}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction} onPress={tapAction} activeOpacity={0.78}>
          <FontAwesome name="share" size={14} color={NAVY} />
          <Text style={styles.postActionText}>Share</Text>
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
  const [appConfig, setAppConfig] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [memories, setMemories] = useState<any[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoriesError, setMemoriesError] = useState('');
  const viewedPostIds = useRef(new Set<string>());

  const postsEnabled = appConfig?.features?.allow_student_posts !== false;
  const firstName = useMemo(() => firstNameOf(currentUser || {}), [currentUser]);
  const searchResultList = useMemo(() => {
    const faculty = Array.isArray(searchResults?.faculty) ? searchResults.faculty : [];
    const students = Array.isArray(searchResults?.students) ? searchResults.students : [];
    const postsData = Array.isArray(searchResults?.posts) ? searchResults.posts : [];
    return [
      ...students.map((item: any) => ({ ...item, type: 'Student' })),
      ...faculty.map((item: any) => ({ ...item, type: 'Faculty' })),
      ...postsData.map((item: any) => ({ ...item, type: 'Content' })),
    ].slice(0, 6);
  }, [searchResults]);

  const analyticsMetrics = useMemo(() => {
    const views = Number(currentUser?.profile_views ?? currentUser?.views_count ?? currentUser?.analytics?.profile_views ?? 0) || 0;
    const uploaded = Number(currentUser?.photos_uploaded ?? currentUser?.analytics?.photos_uploaded ?? posts.length ?? 0) || 0;
    const sent = Number(currentUser?.messages_sent ?? currentUser?.analytics?.messages_sent ?? 0) || 0;
    const rank = Number(currentUser?.trending_rank ?? currentUser?.analytics?.trending_rank ?? 0) || 0;
    return [
      { key: 'views', label: 'Profile views', icon: 'eye', value: views, trend: Number(currentUser?.profile_views_trend ?? currentUser?.analytics?.profile_views_trend ?? views) || 0 },
      { key: 'photos', label: 'Photos uploaded', icon: 'image', value: uploaded, trend: Number(currentUser?.photos_uploaded_trend ?? currentUser?.analytics?.photos_uploaded_trend ?? uploaded) || 0 },
      { key: 'messages', label: 'Messages sent', icon: 'send', value: sent, trend: Number(currentUser?.messages_sent_trend ?? currentUser?.analytics?.messages_sent_trend ?? sent) || 0 },
      { key: 'rank', label: 'Trending rank', icon: 'line-chart', value: rank, trend: Number(currentUser?.trending_rank_trend ?? currentUser?.analytics?.trending_rank_trend ?? rank) || 0 },
    ];
  }, [currentUser, posts.length]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadUser = async () => {
        const storedUser = await getCurrentUser();
        if (active && storedUser) setCurrentUser(storedUser);
        try {
          const [freshUser, configPayload] = await Promise.all([
            fetchCurrentUser(),
            getAppConfig().catch(() => null),
          ]);
          if (active) setCurrentUser(freshUser);
          if (active && configPayload) setAppConfig(unwrap(configPayload));
        } catch {}
      };

      loadUser();
      return () => { active = false; };
    }, [])
  );

  const loadBadges = useCallback(async () => {
    try {
      const [messagePayload, notificationPayload] = await Promise.allSettled([
        getMessagesUnreadCount(),
        getNotifications(),
      ]);

      if (messagePayload.status === 'fulfilled') {
        const data = unwrap(messagePayload.value);
        setUnreadMessages(Number(data?.count ?? data?.unread_count ?? data ?? 0) || 0);
      }

      if (notificationPayload.status === 'fulfilled') {
        const data = unwrap(notificationPayload.value);
        const list = Array.isArray(data) ? data : data?.data || [];
        setUnreadNotifications(list.filter((item: any) => !item?.read_at && item?.read !== true && item?.is_read !== true).length);
      }
    } catch {
      setUnreadMessages(0);
      setUnreadNotifications(0);
    }
  }, []);

  const loadFeed = useCallback(async (nextPage = 1, append = false) => {
    if (!postsEnabled) {
      setPosts([]);
      setPage(1);
      setLastPage(1);
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }

    try {
      setError('');
      if (!append && !refreshing) setLoading(true);
      const payload = await getFeed({ filter, page: nextPage, per_page: 10, q: query.trim() || undefined });
      const nextPosts = unwrap(payload);
      const meta = paginationMeta(payload);
      const visiblePosts = nextPosts.filter(shouldShowFeedPost);
      setPosts((current) => append ? [...current, ...visiblePosts] : visiblePosts);
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
  }, [filter, postsEnabled, query, refreshing]);

  const loadMemories = useCallback(async () => {
    if (!currentUser) {
      setMemories([]);
      setMemoriesCount(0);
      setMemoriesError('');
      setMemoriesLoading(false);
      return;
    }

    try {
      setMemoriesLoading(true);
      setMemoriesError('');
      const payload = await getMemoryDigest();
      const raw = unwrap(payload);
      const list = Array.isArray(raw)
        ? raw
        : raw?.memories || raw?.items || raw?.recommendations || [];
      const filtered = (Array.isArray(list) ? list : []).filter(shouldShowMemory);
      setMemories(filtered.slice(0, 3));
      setMemoriesCount(filtered.length);
    } catch (requestError: any) {
      setMemories([]);
      setMemoriesCount(0);
      setMemoriesError('Could not load memories');
      if (requestError?.response?.status === 401) {
        await clearSession();
        router.replace('/login' as any);
      }
    } finally {
      setMemoriesLoading(false);
    }
  }, [currentUser, router]);

  const loadSidebarData = useCallback(async () => {
    const [batchmatesResult, trendingResult] = await Promise.allSettled([
      getBatchmates({ per_page: 12 }),
      getTrending(),
    ]);

    if (batchmatesResult.status === 'fulfilled') setBatchmates((unwrap(batchmatesResult.value) || []).slice(0, 12));
    if (trendingResult.status === 'fulfilled') setTrending((unwrap(trendingResult.value) || []).slice(0, 12));
  }, []);

  useEffect(() => {
    loadBadges();
    const timer = setInterval(loadBadges, 45000);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') loadBadges();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [loadBadges]);

  useEffect(() => {
    loadFeed(1, false);
  }, [loadFeed]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

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
      } catch {
        if (alive) setShowSearch(false);
      }
    };
    const timer = setTimeout(run, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed(1, false);
    loadSidebarData();
    loadMemories();
    loadBadges();
  };

  const handleLoadMore = () => {
    if (loadingMore || loading || page >= lastPage) return;
    setLoadingMore(true);
    loadFeed(page + 1, true);
  };

  const changeFilter = (nextFilter: string) => {
    Haptics.selectionAsync();
    setFilter(nextFilter);
  };

  const openProfile = (user: any) => {
    if (user?.id) {
      router.push({ pathname: '/student/[id]', params: { id: String(user.id) } } as any);
      return;
    }
    if (user?.name) router.push({ pathname: '/directory', params: { q: user.name } } as any);
  };

  const openSearchResult = (item: any) => {
    setShowSearch(false);
    Haptics.selectionAsync();
    if (item.type === 'Faculty') {
      router.push('/faculty' as any);
      return;
    }
    if (item.type === 'Content') {
      router.push('/gallery' as any);
      return;
    }
    openProfile(item);
  };

  const openMemory = (memory: any) => {
    Haptics.selectionAsync();
    const type = String(memory?.content_type || memory?.type || '').toLowerCase();
    const id = memory?.content_id || memory?.id || memory?.photo_id || memory?.album_id;
    if (type === 'profile_viewed') {
      router.push('/analytics' as any);
      return;
    }
    if (type === 'appeared_in_photo') {
      router.push({
        pathname: '/gallery',
        params: {
          ...(memory?.album_id ? { albumId: String(memory.album_id) } : {}),
          ...(memory?.photo_id ? { photoId: String(memory.photo_id) } : {}),
        },
      } as any);
      return;
    }
    if (type === 'on_this_day') {
      if (memory?.album_id || memory?.photo_id) {
        router.push({
          pathname: '/gallery',
          params: {
            ...(memory?.album_id ? { albumId: String(memory.album_id) } : {}),
            ...(memory?.photo_id ? { photoId: String(memory.photo_id) } : {}),
          },
        } as any);
        return;
      }
      if (memory?.user_id) {
        router.push({ pathname: '/student/[id]', params: { id: String(memory.user_id) } } as any);
        return;
      }
    }
    if (type.includes('student') || type.includes('profile') || memory?.user_id) {
      router.push({ pathname: '/student/[id]', params: { id: String(memory?.user_id || id) } } as any);
      return;
    }
    if (type.includes('yearbook') || memory?.batch_id) {
      router.push({
        pathname: '/yearbook',
        params: {
          ...(memory?.batch_id ? { batchId: String(memory.batch_id) } : {}),
          ...(memory?.batch_id ? { view: '1' } : {}),
          ...(memory?.page_index !== undefined ? { pageIndex: String(memory.page_index) } : {}),
        },
      } as any);
      return;
    }
    router.push('/gallery' as any);
  };

  const onViewablePostsChanged = useRef(({ viewableItems }: any) => {
    viewableItems.forEach(({ item }: any) => {
      const id = item?.id || item?.photo_id;
      if (!id) return;
      const key = String(id);
      if (viewedPostIds.current.has(key)) return;
      viewedPostIds.current.add(key);
      recordFeedPostView(id).catch(() => {});
    });
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55, minimumViewTime: 650 }).current;

  const renderHeader = () => (
    <View>
      <View style={styles.hero}>
        <View style={styles.headerRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.firstName}>{firstName}</Text>
          </View>
          <View style={styles.headerActions}>
            <HeaderIcon icon="bell" count={unreadNotifications} onPress={() => router.push('/notifications' as any)} />
            <HeaderIcon icon="commenting" count={unreadMessages} onPress={() => router.push('/messages' as any)} />
          </View>
        </View>

        <View style={styles.searchBar}>
          <FontAwesome name="search" size={15} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search students, faculty, content..."
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
        </View>
        {showSearch ? <SearchResults results={searchResultList} onOpen={openSearchResult} /> : null}
      </View>

      <View style={styles.pageContent}>
        <QuickLinks onPress={(route) => router.push(route as any)} />
        <DividerLine />
        <StatsRow batchmatesCount={batchmates.length} trendingCount={trending.length} memoriesCount={memoriesCount || posts.length} />
        <DividerLine />
        {currentUser ? (
          <MemoryDigest
            memories={memories}
            loading={memoriesLoading}
            error={memoriesError}
            onOpen={openMemory}
            onRetry={loadMemories}
          />
        ) : null}
        <DividerLine />
        <SuggestedBatchmates students={batchmates} onOpen={openProfile} onSeeAll={() => router.push('/discovery' as any)} />
        <TrendingThisWeek students={trending} onOpen={openProfile} onSeeAll={() => router.push('/analytics' as any)} />
        <AnalyticsSnapshot metrics={analyticsMetrics} />
        <DividerLine />
        {postsEnabled ? <FilterPills active={filter} onChange={changeFilter} /> : null}
        {loading ? <ActivityIndicator color={NAVY} style={styles.loader} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        data={posts}
        keyExtractor={(item, index) => String(item?.id || index)}
        renderItem={({ item }) => <FeedPost post={item} currentUser={currentUser} onOpenProfile={openProfile} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyFeed}>
            <FontAwesome name={postsEnabled ? 'photo' : 'lock'} size={28} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>{postsEnabled ? 'No posts yet' : 'Posts Disabled'}</Text>
            <Text style={styles.emptyText}>{postsEnabled ? 'Your feed will appear here once memories are shared.' : 'Student posts are currently disabled by platform settings.'}</Text>
          </View>
        ) : null}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={NAVY} style={styles.footerLoader} /> : <View style={styles.feedFooter} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        onViewableItemsChanged={onViewablePostsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.feedContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  feedContent: {
    paddingBottom: 112,
  },
  hero: {
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  firstName: {
    color: AMBER,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: AMBER,
    borderWidth: 1,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: NAVY,
    fontSize: 8,
    fontWeight: '900',
  },
  searchBar: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: NAVY,
    fontSize: 14,
    marginLeft: 10,
  },
  searchResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: DIVIDER,
    overflow: 'hidden',
  },
  searchEmpty: {
    color: '#94A3B8',
    fontSize: 13,
    padding: 16,
    textAlign: 'center',
  },
  resultRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  resultCopy: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  resultName: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '900',
  },
  resultType: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  pageContent: {
    backgroundColor: BACKGROUND,
    paddingTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  quickList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  quickItem: {
    width: 72,
    alignItems: 'center',
  },
  quickIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: NAVY,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 7,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    minHeight: 104,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DIVIDER,
    padding: 12,
    justifyContent: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    color: NAVY,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 7,
  },
  statValueAmber: {
    color: AMBER,
  },
  statSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '900',
  },
  seeAll: {
    color: AMBER,
    fontSize: 12,
    fontWeight: '900',
  },
  horizontalList: {
    gap: 10,
    paddingHorizontal: 20,
  },
  batchmateItem: {
    width: 70,
    alignItems: 'center',
  },
  batchmateName: {
    color: NAVY,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
  },
  trendingCard: {
    width: 156,
    minHeight: 74,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: DIVIDER,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    borderRadius: 999,
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rankText: {
    color: AMBER,
    fontSize: 9,
    fontWeight: '900',
  },
  trendingInfo: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0,
    paddingRight: 22,
  },
  trendingName: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '900',
  },
  trendingViews: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  memoryDigestCard: {
    marginHorizontal: 20,
    marginBottom: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DIVIDER,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  memoryDigestHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  memoryDigestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  memoryDigestTitle: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '900',
  },
  memoryRetryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE7B7',
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  memoryRetryText: {
    color: AMBER,
    fontSize: 11,
    fontWeight: '900',
  },
  memoryRows: {
    gap: 10,
  },
  memoryRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  memoryThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  memoryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF7E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryRowBody: {
    flex: 1,
    minWidth: 0,
  },
  memoryRowTitle: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '900',
  },
  memoryRowSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  memoryTimestamp: {
    maxWidth: 76,
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
  memoryEmptyState: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  memoryEmptyTitle: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '900',
  },
  memoryEmptySubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  memorySkeletonRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  memorySkeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  memorySkeletonText: {
    flex: 1,
    gap: 8,
  },
  memorySkeletonLineWide: {
    width: '74%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  memorySkeletonLineShort: {
    width: '46%',
    height: 9,
    borderRadius: 999,
    backgroundColor: '#EEF2F7',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  metricCard: {
    width: '48.5%',
    minHeight: 122,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DIVIDER,
    padding: 13,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFF7E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },
  metricValue: {
    color: NAVY,
    fontSize: 22,
    fontWeight: '900',
  },
  metricTrend: {
    fontSize: 13,
    fontWeight: '900',
  },
  trendUp: {
    color: '#16A34A',
  },
  trendDown: {
    color: '#DC2626',
  },
  metricLabel: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  metricWeek: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  filterList: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  filterPill: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DIVIDER,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterPillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  loader: {
    marginVertical: 18,
  },
  footerLoader: {
    marginVertical: 18,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  avatarBase: {
    backgroundColor: '#E2E8F0',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarMedium: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarPost: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: AMBER,
    fontWeight: '900',
  },
  avatarTextSmall: {
    fontSize: 12,
  },
  avatarTextMedium: {
    fontSize: 14,
  },
  avatarTextLarge: {
    fontSize: 17,
  },
  avatarTextPost: {
    fontSize: 13,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DIVIDER,
    marginHorizontal: 20,
    marginBottom: 14,
    overflow: 'hidden',
  },
  postHeader: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  postHeaderCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  postName: {
    color: NAVY,
    fontSize: 14,
    fontWeight: '900',
  },
  postTime: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  audienceBadge: {
    minHeight: 25,
    borderRadius: 13,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  audiencePublic: {
    backgroundColor: '#FFF7E8',
  },
  audienceBatchmates: {
    backgroundColor: '#EEF2FF',
  },
  audienceText: {
    color: NAVY,
    fontSize: 10,
    fontWeight: '900',
  },
  audiencePrivateText: {
    color: '#64748B',
  },
  postMediaWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E2E8F0',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  mediaCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  mediaCounterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  mediaNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.54)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaNavLeft: {
    left: 10,
  },
  mediaNavRight: {
    right: 10,
  },
  mediaDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  mediaDotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  postImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCaption: {
    color: NAVY,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontWeight: '700',
  },
  taggedPeopleStrip: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taggedPeopleText: {
    flex: 1,
    color: '#3F51B5',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 17,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    marginTop: 12,
  },
  postAction: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  postActionText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyFeed: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DIVIDER,
    marginHorizontal: 20,
    paddingVertical: 44,
    alignItems: 'center',
  },
  emptyTitle: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 30,
  },
  feedFooter: {
    height: 18,
  },
});
