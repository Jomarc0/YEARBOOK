import { useEffect, useRef, useState } from 'react';

export function useWebSocket(channelName, events = {}) {
  const [connected, setConnected] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!channelName || !window.Echo) return;

    const channel = window.Echo.private(channelName);
    channelRef.current = channel;
    setConnected(true);

    Object.entries(events).forEach(([event, handler]) => {
      channel.listen(event, handler);
    });

    return () => {
      window.Echo.leave(channelName);
      setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  return { connected, channel: channelRef.current };
}

// Convenience hook for chat channel
export function useChatChannel(userId, onMessage) {
  return useWebSocket(
    userId ? `chat.${userId}` : null,
    { '.message.sent': onMessage }
  );
}

// Convenience hook for notifications channel
export function useNotificationChannel(userId, onNotification) {
  return useWebSocket(
    userId ? `notifications.${userId}` : null,
    { '.notification.sent': onNotification }
  );
}