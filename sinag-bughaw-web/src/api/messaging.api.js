import api from './client';

export const messagesApi = {
  conversations: ()                     => api.get('/messages/conversations'),
  unreadCount:   ()                     => api.get('/messages/unread-count'),
  thread:        (userId)               => api.get(`/messages/${userId}`),
  send:          (receiverId, body)     => api.post('/messages', { receiver_id: receiverId, body }),
  markRead:      (id)                   => api.patch(`/messages/${id}/read`),
  typing:        (receiverId, isTyping) => api.post('/messages/typing', {
                                            receiver_id: receiverId,
                                            is_typing:   isTyping,
                                          }),
};

export const presenceApi = {
  update: (isOnline) => api.post('/presence',      { is_online: isOnline }),
  bulk:   (userIds)  => api.post('/presence/bulk', { user_ids: userIds }),
};

export const voiceNotesApi = {
  // Received (approved) notes
  inbox:      ()         => api.get('/voice-notes/inbox'),
  // Sent notes (all statuses — pending / approved / rejected)
  outbox:     ()         => api.get('/voice-notes/outbox'),
  // Notes shown on a student's public profile
  forProfile: (userId)   => api.get(`/voice-notes/profile/${userId}`),
  // Send a voice note to a classmate
  send:       (formData) => api.post('/voice-notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // Sender deletes their own note
  delete:     (id)       => api.delete(`/voice-notes/${id}`),
};

// Admin API (only used in admin panel)
export const voiceNoteAdminApi = {
  list:    (status = 'pending') => api.get('/admin/voice-notes', { params: { status } }),
  stats:   ()                   => api.get('/admin/voice-notes/stats'),
  approve: (id)                 => api.post(`/admin/voice-notes/${id}/approve`),
  reject:  (id, reason)         => api.post(`/admin/voice-notes/${id}/reject`, { reason }),
};