import api from './client';

export const messagesApi = {
  conversations: ()                      => api.get('/messages/conversations'),
  unreadCount:   ()                      => api.get('/messages/unread-count'),
  thread:        (userId)                => api.get(`/messages/${userId}`),
  send:          (receiverId, body)      => api.post('/messages', { receiver_id: receiverId, body }),
  markRead:      (id)                    => api.patch(`/messages/${id}/read`),
  typing:        (receiverId, isTyping)  => api.post('/messages/typing', {
                                              receiver_id: receiverId,
                                              is_typing:   isTyping,
                                           }),
};

export const presenceApi = {
  update: (isOnline)  => api.post('/presence',      { is_online: isOnline }),
  bulk:   (userIds)   => api.post('/presence/bulk', { user_ids: userIds }),
};

export const voiceNotesApi = {
  list:   ()   => api.get('/voice-notes'),
  upload: (fd) => api.post('/voice-notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/voice-notes/${id}`),
};