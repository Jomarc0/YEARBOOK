import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sb_token');
      window.location.href = '/login';
    }
    // Redirect free users to payment page when hitting premium features
    if (err.response?.status === 402) {
      window.location.href = '/payment';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login:     (email, password) => api.post('/auth/login', { email, password }),
  register:  (data)            => api.post('/auth/register', data),
  logout:    ()                => api.post('/auth/logout'),
  me:        ()                => api.get('/auth/me'),
  sendOtp:   (email)           => api.post('/auth/otp/send', { email }),
  verifyOtp: (email, otp)      => api.post('/auth/otp/verify', { email, otp }),
};

// Students
export const studentsApi = {
  list: (params) => api.get('/students', { params }),
  show: (id)     => api.get(`/students/${id}`),

  // Achievements
  getAchievements: (id) => api.get(`/students/${id}/achievements`),

  // Tagged Photos
  getTaggedPhotos: (id) => api.get(`/students/${id}/tagged-photos`),

  addTaggedPhoto: (formData) =>
    api.post('/students/profile/tagged-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  removeTaggedPhoto: (photoId) =>
    api.delete(`/students/profile/tagged-photos/${photoId}`),

  // Profile Updates
  updateBio: (bio) =>
    api.post('/students/profile/bio', { bio }),

  updatePhoto: (formData) =>
    api.post('/students/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updatePassword: (payload) =>
    api.put('/students/profile/password', payload),
};

// Faculty
export const facultyApi = {
  list: ()   => api.get('/faculty'),
  show: (id) => api.get(`/faculty/${id}`),
};

// Sections
export const sectionsApi = {
  list: ()   => api.get('/sections'),
  show: (id) => api.get(`/sections/${id}`),
};

// Gallery
export const galleryApi = {
  list: ()   => api.get('/gallery'),
  show: (id) => api.get(`/gallery/${id}`),
  faceSearch: (formData) => api.post('/gallery/face-search', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Search
export const searchApi = {
  search: (q, type = 'all') => api.get('/search', { params: { q, type } }),
};

// Messages
export const messagesApi = {
  conversations: ()                 => api.get('/messages/conversations'),
  thread:        (userId)           => api.get(`/messages/${userId}`),
  send:          (receiverId, body) => api.post('/messages', { receiver_id: receiverId, body }),
  markRead:      (id)               => api.patch(`/messages/${id}/read`),
};

// Transcripts
export const transcriptsApi = {
  list:   ()         => api.get('/transcripts'),
  show:   (id)       => api.get(`/transcripts/${id}`),
  upload: (formData) => api.post('/transcripts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Yearbook
export const yearbookApi = {
  flipbookData:      ()       => api.get('/yearbook/flipbook'),
  exportStudentPdf:  (userId) => api.get(`/yearbook/export/${userId}`, { responseType: 'blob' }),
  exportCertificate: ()       => api.get('/yearbook/certificate', { responseType: 'blob' }),
};

// Payments
export const paymentsApi = {
  createIntent:       (plan) => api.post('/payments/create-intent', { plan }),
  subscriptionStatus: ()     => api.get('/payments/status'),
  history:            ()     => api.get('/payments/history'),
};

// Notifications
export const notificationsApi = {
  list:          ()         => api.get('/notifications'),
  registerToken: (fcmToken) => api.post('/notifications/register-token', { fcm_token: fcmToken }),
};

export const consentApi = {
  accept: (version) => api.post('/consent/accept', { version }),
  status: ()        => api.get('/consent/status'),
};

export const profileSettingsApi = {
  updateVisibility: (visibility) => api.post('/profile/visibility', { visibility }),
  updateMotto:      (motto)      => api.post('/profile/motto', { motto }),
  trackView:        (id)         => api.post(`/students/${id}/view`),
  topViewed:        ()           => api.get('/analytics/top-viewed'),
};

export const voiceNotesApi = {
  list:    ()         => api.get('/voice-notes'),
  upload:  (formData) => api.post('/voice-notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:  (id)       => api.delete(`/voice-notes/${id}`),
};

export const announcementsApi = {
  list:   ()     => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
};

export const analyticsApi = {
  myStats:    () => api.get('/analytics/my-stats'),
  topViewed:  () => api.get('/analytics/top-viewed'),
  batchmates: () => api.get('/analytics/batchmates'),
};

export default api;