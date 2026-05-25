import api from './client';

export const yearbookApi = {
  flipbookData:      ()       => api.get('/yearbook/flipbook'),
  exportStudentPdf:  (userId) => api.get(`/yearbook/export/${userId}`, { responseType: 'blob' }),
  exportCertificate: ()       => api.get('/yearbook/certificate', { responseType: 'blob' }),
};

export const graduationApi = {
  list:          (category) => api.get('/graduation', { params: { category } }),
  show:          (id)       => api.get(`/graduation/${id}`),
  createAlbum:   (data)     => api.post('/graduation/album', data),
  uploadPhoto:   (fd)       => api.post('/graduation/upload-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadVideo:   (fd)       => api.post('/graduation/upload-video', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadProgram: (fd)       => api.post('/graduation/upload-program', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:        (id)       => api.delete(`/graduation/${id}`),
};

export const mediaApi = {
  bulkUpload:  (fd) => api.post('/media/bulk-upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadVideo: (fd) => api.post('/media/upload-video', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: (id) => api.delete(`/media/photo/${id}`),
};

export const announcementsApi = {
  list:   ()     => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
};

export const analyticsApi = {
  summary:    () => api.get('/analytics'),
  myStats:    () => api.get('/analytics/my-stats'),
  topViewed:  () => api.get('/analytics/top-viewed'),
  batchmates: () => api.get('/analytics/batchmates'),
};

export const notificationsApi = {
  list:          ()         => api.get('/notifications'),
  registerToken: (fcmToken) => api.post('/notifications/register-token', { fcm_token: fcmToken }),
  markRead:      (id)       => api.post(`/notifications/${id}/read`),
  markAll:       ()         => api.post('/notifications/read-all'),
};

export const profileSettingsApi = {
  updateVisibility: (visibility) => api.post('/profile/visibility', { visibility }),
  updateMotto:      (motto)      => api.post('/profile/motto', { motto }),
};

export const transcriptsApi = {
  list:   ()   => api.get('/transcripts'),
  show:   (id) => api.get(`/transcripts/${id}`),
  upload: (fd) => api.post('/transcripts', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const sectionsApi = {
  list: ()   => api.get('/sections'),
  show: (id) => api.get(`/sections/${id}`),
};

export const facultyApi = {
  list: ()   => api.get('/faculty'),
  show: (id) => api.get(`/faculty/${id}`),
};