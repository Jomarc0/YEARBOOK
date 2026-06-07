import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchCurrentUser, getConversations, getErrorMessage, getMessageThread, getPresenceBulk, getStudent, imageUrl, markMessageRead, sendMessage, sendTypingStatus, updatePresence, unwrap } from '../lib/api';

const otherUser = (item: any, currentUserId?: any) => {
  if (item?.other_user) return item.other_user;
  if (item?.user) return item.user;
  if (currentUserId && item?.sender_id === currentUserId) return item?.receiver;
  if (currentUserId && item?.receiver_id === currentUserId) return item?.sender;
  return item?.receiver || item?.sender || item;
};
const personId = (item: any, currentUserId?: any) => otherUser(item, currentUserId)?.id || item?.user_id || item?.receiver_id || item?.sender_id || item?.id;
const personName = (item: any, currentUserId?: any) => otherUser(item, currentUserId)?.name || item?.name || 'Conversation';
const personPhoto = (item: any, currentUserId?: any) => imageUrl(otherUser(item, currentUserId)?.profile_picture || item?.profile_picture);
const personCourse = (item: any, currentUserId?: any) => otherUser(item, currentUserId)?.course || item?.course || 'Yearbook profile';
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';
const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function MessagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const directUserId = typeof params.userId === 'string' ? params.userId : '';
  const directName = typeof params.name === 'string' ? params.name : '';
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [thread, setThread] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [presence, setPresence] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRef = useRef<any>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((item) => personName(item, currentUser?.id).toLowerCase().includes(term));
  }, [conversations, currentUser?.id, search]);

  const loadConversations = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const user = await fetchCurrentUser().catch(() => null);
      if (user) setCurrentUser(user);
      const payload = await getConversations();
      const data = unwrap(payload);
      const nextConversations = Array.isArray(data) ? data : [];
      setConversations(nextConversations);

      const ids = Array.from(new Set(nextConversations.map((item) => personId(item, user?.id)).filter(Boolean)));
      if (ids.length) {
        const presencePayload = await getPresenceBulk(ids).catch(() => ({}));
        setPresence(presencePayload || {});
      }
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load conversations.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const refreshConversationsQuietly = useCallback(async () => {
    try {
      const payload = await getConversations();
      const data = unwrap(payload);
      const nextConversations = Array.isArray(data) ? data : [];
      setConversations(nextConversations);

      const ids = Array.from(new Set([
        ...nextConversations.map((item) => personId(item, currentUser?.id)),
        selectedRef.current ? personId(selectedRef.current, currentUser?.id) : null,
      ].filter(Boolean)));
      if (ids.length) {
        const presencePayload = await getPresenceBulk(ids).catch(() => ({}));
        setPresence(presencePayload || {});
      }
    } catch {
      // Keep the current view stable during background refresh failures.
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    updatePresence(true).catch(() => {});
    return () => {
      updatePresence(false).catch(() => {});
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const openThread = useCallback(async (conversation: any) => {
    setSelected(conversation);
    setThread([]);
    try {
      const id = personId(conversation, currentUser?.id);
      const payload = await getMessageThread(id);
      const data = unwrap(payload);
      const messages = Array.isArray(data) ? data : data?.messages || [];
      setThread(messages);
      messages
        .filter((item: any) => !item.is_read && item.receiver_id === currentUser?.id && item.id)
        .forEach((item: any) => markMessageRead(item.id).catch(() => {}));
    } catch (requestError: any) {
      Alert.alert('Thread unavailable', getErrorMessage(requestError, 'Unable to load this message thread.'));
    }
  }, [currentUser?.id]);

  const refreshThreadQuietly = useCallback(async () => {
    const conversation = selectedRef.current;
    const id = conversation ? personId(conversation, currentUser?.id) : null;
    if (!id) return;

    try {
      const payload = await getMessageThread(id);
      const data = unwrap(payload);
      const messages = Array.isArray(data) ? data : data?.messages || [];
      setThread((current) => {
        const currentIds = current.map((item) => String(item?.id));
        const nextIds = messages.map((item: any) => String(item?.id));
        const same = currentIds.length === nextIds.length && currentIds.every((item, index) => item === nextIds[index]);
        return same ? current : messages;
      });
      messages
        .filter((item: any) => !item.is_read && item.receiver_id === currentUser?.id && item.id)
        .forEach((item: any) => markMessageRead(item.id).catch(() => {}));
    } catch {
      // Avoid interrupting active chat while polling.
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      updatePresence(true).catch(() => {});
      refreshConversationsQuietly();
      refreshThreadQuietly();
    }, selected ? 4500 : 9000);

    return () => clearInterval(timer);
  }, [refreshConversationsQuietly, refreshThreadQuietly, selected]);

  useEffect(() => {
    if (!directUserId) return;
    const bootstrap = {
      other_user: {
        id: Number(directUserId),
        name: directName || 'Student',
      },
    };
    setSelected(bootstrap);
    getStudent(directUserId)
      .then((payload) => {
        const student = unwrap(payload);
        setSelected({ other_user: { ...student, id: student?.id || Number(directUserId), name: student?.name || directName || 'Student' } });
      })
      .catch(() => {});
    openThread(bootstrap);
  }, [directName, directUserId, openThread]);

  const handleMessageChange = (text: string) => {
    setMessage(text);
    const id = selected ? personId(selected, currentUser?.id) : null;
    if (!id) return;

    sendTypingStatus(id, true).catch(() => {});
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      sendTypingStatus(id, false).catch(() => {});
    }, 1500);
  };

  const handleSend = async () => {
    if (!message.trim() || !selected) return;
    const receiverId = personId(selected, currentUser?.id);
    const body = message.trim();
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUser?.id,
      receiver_id: receiverId,
      body,
      is_read: false,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    try {
      setSending(true);
      setThread((current) => [...current, optimistic]);
      setMessage('');
      if (typingTimer.current) clearTimeout(typingTimer.current);
      sendTypingStatus(receiverId, false).catch(() => {});
      const sent = await sendMessage(receiverId, body);
      const saved = unwrap(sent);
      setThread((current) => current.map((item) => item.id === optimistic.id ? saved : item));
      await loadConversations();
    } catch (requestError: any) {
      setThread((current) => current.filter((item) => item.id !== optimistic.id));
      setMessage(body);
      Alert.alert('Send failed', getErrorMessage(requestError, 'Unable to send your message.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.kicker}>SINAG-BUGHAW</Text>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerText}>Start conversations with classmates from the student directory.</Text>
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item, index) => String(personId(item, currentUser?.id) || index)}
        ListHeaderComponent={(
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={15} color="#94a3b8" />
            <TextInput style={styles.searchInput} placeholder="Search conversations..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openThread(item)}>
            <View style={styles.avatarWrap}>
              {personPhoto(item, currentUser?.id) ? <Image source={personPhoto(item, currentUser?.id)} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{initials(personName(item, currentUser?.id))}</Text></View>}
              <View style={[styles.onlineDot, presence[String(personId(item, currentUser?.id))]?.is_online && styles.onlineDotActive]} />
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{personName(item, currentUser?.id)}</Text>
                {!!item?.unread_count && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unread_count}</Text></View>}
              </View>
              <Text style={styles.preview} numberOfLines={1}>{item?.last_message?.body || item?.body || 'Open conversation'}</Text>
            </View>
            <Text style={styles.timeText}>{formatTime(item?.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={{ marginTop: 26 }} /> : (
          <View style={styles.emptyPanel}>
            <FontAwesome name="comments-o" size={42} color="#dbe3ef" />
            <Text style={styles.emptyTitle}>{error || 'No conversations yet'}</Text>
            <TouchableOpacity style={styles.findButton} onPress={() => router.push('/directory' as any)}>
              <FontAwesome name="search" size={13} color="#fdb813" />
              <Text style={styles.findButtonText}>Find Students</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConversations(); }} />}
        contentContainerStyle={styles.content}
      />

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.threadHeader}>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <FontAwesome name="chevron-left" size={20} color="#1d2b4b" />
            </TouchableOpacity>
            <View style={styles.threadTitleWrap}>
              <Text style={styles.threadTitle} numberOfLines={1}>{personName(selected, currentUser?.id)}</Text>
              <Text style={styles.threadMeta} numberOfLines={1}>
                {presence[String(personId(selected, currentUser?.id))]?.is_online ? 'Online now' : personCourse(selected, currentUser?.id)} - Live sync
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshThreadButton} onPress={refreshThreadQuietly}>
              <FontAwesome name="refresh" size={15} color="#1d2b4b" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={thread}
            keyExtractor={(item, index) => String(item?.id || index)}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item?.sender_id === currentUser?.id ? styles.mineBubble : null]}>
                <Text style={[styles.bubbleText, item?.sender_id === currentUser?.id ? styles.mineText : null]}>{item?.body || item?.message}</Text>
                <Text style={[styles.bubbleTime, item?.sender_id === currentUser?.id ? styles.mineTime : null]}>
                  {formatTime(item?.created_at)}
                  {item?.sender_id === currentUser?.id && item?.is_read ? ' · Seen' : item?._optimistic ? ' · Sending' : ''}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.threadContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No messages in this thread.</Text>}
          />
          <View style={styles.composer}>
            <TextInput style={styles.composerInput} placeholder="Write a message..." placeholderTextColor="#94a3b8" value={message} onChangeText={handleMessageChange} multiline />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
              <FontAwesome name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: { backgroundColor: '#1d2b4b', paddingHorizontal: 24, paddingTop: 26, paddingBottom: 30, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  kicker: { color: '#fdb813', fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  headerText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, marginTop: 6 },
  content: { padding: 20, paddingBottom: 40 },
  searchContainer: { height: 50, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 14 },
  searchInput: { flex: 1, color: '#1d2b4b', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, elevation: 2 },
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  onlineDot: { position: 'absolute', right: 1, bottom: 1, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: '#ffffff', backgroundColor: '#cbd5e1' },
  onlineDotActive: { backgroundColor: '#10b981' },
  avatarText: { color: '#fdb813', fontWeight: '900', fontSize: 16 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  preview: { color: '#8E8E93', fontSize: 13, marginTop: 3 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#fdb813', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#1d2b4b', fontSize: 10, fontWeight: '900' },
  timeText: { color: '#94a3b8', fontSize: 11, marginLeft: 8 },
  emptyText: { color: '#8E8E93', textAlign: 'center', padding: 24 },
  emptyPanel: { backgroundColor: '#ffffff', borderRadius: 22, alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyTitle: { color: '#1d2b4b', fontSize: 16, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  findButton: { height: 44, borderRadius: 13, backgroundColor: '#1d2b4b', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, marginTop: 18 },
  findButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  threadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  threadTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  threadTitle: { color: '#1C1C1E', fontWeight: 'bold', fontSize: 18 },
  threadMeta: { color: '#94a3b8', fontSize: 11, fontWeight: '800', marginTop: 2 },
  refreshThreadButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f4f7fe', alignItems: 'center', justifyContent: 'center' },
  threadContent: { padding: 20 },
  bubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16, marginBottom: 10, maxWidth: '82%' },
  mineBubble: { alignSelf: 'flex-end', backgroundColor: '#1d2b4b' },
  bubbleText: { color: '#1C1C1E', fontSize: 14 },
  mineText: { color: '#FFFFFF' },
  bubbleTime: { color: '#94a3b8', fontSize: 10, marginTop: 5 },
  mineTime: { color: 'rgba(255,255,255,0.55)' },
  composer: { flexDirection: 'row', padding: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  composerInput: { flex: 1, maxHeight: 110, backgroundColor: '#f4f7fe', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginRight: 10, color: '#1d2b4b' },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
});
