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
  // Received (approved) notes
  inbox:      ()           => client.get('/voice-notes/inbox'),
  // Sent notes (all statuses — pending/approved/rejected)
  outbox:     ()           => client.get('/voice-notes/outbox'),
  // Notes shown on a student's public profile
  forProfile: (userId)     => client.get(`/voice-notes/profile/${userId}`),
  // Send a voice note to a classmate
  send:       (formData)   => client.post('/voice-notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // Sender deletes their own note
  delete:     (id)         => client.delete(`/voice-notes/${id}`),
};