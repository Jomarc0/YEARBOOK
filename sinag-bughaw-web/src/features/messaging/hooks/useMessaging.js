import { useCallback, useEffect, useRef, useState } from 'react';
import echo                              from '@/lib/echo';
import { messagesApi, presenceApi }      from '@/api/messaging.api';
import { useAuth }                       from '@/features/auth/hooks/useAuth';

const TYPING_DEBOUNCE_MS = 1500;

export function useMessaging(recipientId = null) {
  const { user }                            = useAuth();
  const [conversations, setConversations]   = useState([]);
  const [thread,        setThread]          = useState([]);
  const [loading,       setLoading]         = useState(false);
  const [error,         setError]           = useState(null);
  const [isTyping,      setIsTyping]        = useState(false);   // remote user typing
  const [onlineUsers,   setOnlineUsers]     = useState(new Set());
  const [unreadTotal,   setUnreadTotal]     = useState(0);

  const typingTimerRef  = useRef(null);
  const iAmTypingRef    = useRef(false);   // throttle outbound typing events

  // ── Conversations ──────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await messagesApi.conversations();
      setConversations(data);
    } catch (err) {
      setError(err);
    }
  }, []);

  // ── Thread ─────────────────────────────────────────────────────────────────

  const fetchThread = useCallback(async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await messagesApi.thread(id);
      // API returns paginated — grab the data array
      setThread(Array.isArray(data) ? data : (data.data ?? []));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Send ───────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (receiverId, body) => {
    // Optimistic update
    const optimistic = {
      id:          `opt-${Date.now()}`,
      sender_id:   user?.id,
      receiver_id: receiverId,
      body,
      is_read:     false,
      created_at:  new Date().toISOString(),
      _optimistic: true,
    };
    setThread(prev => [...prev, optimistic]);

    try {
      const { data } = await messagesApi.send(receiverId, body);
      // Replace optimistic message with real one
      setThread(prev => prev.map(m => m._optimistic ? data : m));
      // Refresh conversation list to update last message preview
      fetchConversations();
      return data;
    } catch (err) {
      // Roll back optimistic on error
      setThread(prev => prev.filter(m => !m._optimistic));
      throw err;
    }
  }, [user?.id, fetchConversations]);

  // ── Mark read ──────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id) => {
    await messagesApi.markRead(id);
    setThread(prev =>
      prev.map(m => m.id === id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m)
    );
  }, []);

  // ── Unread count ───────────────────────────────────────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await messagesApi.unreadCount();
      setUnreadTotal(data.unread_count ?? 0);
    } catch {}
  }, []);

  // ── Typing ─────────────────────────────────────────────────────────────────

  /**
   * Call this on every keystroke in the input box.
   * Sends "is_typing: true" immediately, then "is_typing: false"
   * after TYPING_DEBOUNCE_MS of silence — without spamming the server.
   */
  const onKeystroke = useCallback((receiverId) => {
    if (!iAmTypingRef.current) {
      iAmTypingRef.current = true;
      messagesApi.typing(receiverId, true).catch(() => {});
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      iAmTypingRef.current = false;
      messagesApi.typing(receiverId, false).catch(() => {});
    }, TYPING_DEBOUNCE_MS);
  }, []);

  // ── WebSocket: private chat channel ───────────────────────────────────────

  useEffect(() => {
      if (!user?.id) return;

      const channel = echo.private(`chat.${user.id}`);

  // New message arrives
  channel.listen('.message.sent', (payload) => {
    const msg = payload;

    if (String(msg.sender_id) === String(recipientId)) {
      setThread(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      messagesApi.markRead(msg.id).catch(() => {});
    }

    fetchConversations();
    fetchUnreadCount();

    window.dispatchEvent(new Event('messaging:unread-updated'));
  });

    // Typing indicator from the other user
    channel.listen('.user.typing', (payload) => {
      if (String(payload.sender_id) === String(recipientId)) {
        setIsTyping(payload.is_typing);
        // Auto-clear after 3s in case the server event is missed
        if (payload.is_typing) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    return () => {
      echo.leave(`chat.${user.id}`);
    };
  }, [user?.id, recipientId, fetchConversations, fetchUnreadCount]);

  // ── WebSocket: presence channel ───────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return;

    const presenceChannel = echo.join('online-users')
      .here((members) => {
        setOnlineUsers(new Set(members.map(m => m.id)));
      })
      .joining((member) => {
        setOnlineUsers(prev => new Set([...prev, member.id]));
      })
      .leaving((member) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(member.id);
          return next;
        });
      });

    // Mark self as online
    presenceApi.update(true).catch(() => {});

    // Mark offline on tab close
    const handleUnload = () => presenceApi.update(false).catch(() => {});
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      echo.leave('online-users');
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user?.id]);

  // ── Initial data load ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, [fetchConversations, fetchUnreadCount]);

  // Load thread when recipientId changes (replaces the old polling)
  useEffect(() => {
    if (recipientId) fetchThread(recipientId);
  }, [recipientId, fetchThread]);

  return {
    conversations,
    thread,
    loading,
    error,
    isTyping,
    onlineUsers,
    unreadTotal,
    sendMessage,
    markRead,
    onKeystroke,
    fetchConversations,
    fetchThread,
    fetchUnreadCount,
  };
}