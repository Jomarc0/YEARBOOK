import api from './client';

// ─────────────────────────────────────────────────────────────────────────────
// YEARBOOK
// ─────────────────────────────────────────────────────────────────────────────
export const yearbookApi = {
  /** GET /api/yearbook/flipbook → flat student array */
  flipbookData: () => api.get('/yearbook/flipbook'),

  /** GET /api/yearbook/export/:userId → PDF blob */
  exportStudentPdf: (userId) =>
    api.get(`/yearbook/export/${userId}`, { responseType: 'blob' }),

  /** GET /api/yearbook/certificate → PDF blob (premium) */
  exportCertificate: () =>
    api.get('/yearbook/certificate', { responseType: 'blob' }),

  /** GET /api/yearbook/meta/:batchId → { title, school, year, coverUrl, theme } */
  meta: (batchId) => api.get(`/yearbook/meta/${batchId}`),

  /** GET /api/yearbook/toc/:batchId → [{ pageIndex, label, type, icon }] */
  tableOfContents: (batchId) => api.get(`/yearbook/toc/${batchId}`),

  /** GET /api/yearbook/sections/:batchId → sections with student arrays */
  sectionPages: (batchId) => api.get(`/yearbook/sections/${batchId}`),

  /** GET /api/yearbook/galleries/:batchId → gallery spread objects */
  galleryPages: (batchId) => api.get(`/yearbook/galleries/${batchId}`),

  /** GET /api/yearbook/faculty/:batchId → faculty member array */
  facultyPage: (batchId) => api.get(`/yearbook/faculty/${batchId}`),

  /** GET /api/yearbook/search?batchId=&q= → [{ pageIndex, label, excerpt }] */
  search: (batchId, q) =>
    api.get('/yearbook/search', { params: { batchId, q } }),

  /** POST /api/yearbook/bookmark */
  addBookmark: (payload) => api.post('/yearbook/bookmark', payload),

  /** DELETE /api/yearbook/bookmark/:id */
  removeBookmark: (id) => api.delete(`/yearbook/bookmark/${id}`),

  /** GET /api/yearbook/bookmarks/:batchId → user's bookmarked pages */
  getBookmarks: (batchId) => api.get(`/yearbook/bookmarks/${batchId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY  (Visual Archive — All Photos + Face Search)
// ─────────────────────────────────────────────────────────────────────────────
export const galleryApi = {
  /** GET /api/gallery?type=&category= */
  index: (type = 'general', category = null) =>
    api.get('/gallery', { params: { type, ...(category ? { category } : {}) } }),

  /** GET /api/gallery/:albumId */
  show: (albumId) => api.get(`/gallery/${albumId}`),

  /** POST /api/gallery/face-search (premium) */
  faceSearch: (formData) =>
    api.post('/gallery/face-search', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// GRADUATION  (single source of truth for all graduation content)
// ─────────────────────────────────────────────────────────────────────────────
export const graduationApi = {
  /** GET /api/graduation?category= */
  list: (category) => api.get('/graduation', { params: { category } }),

  /** GET /api/graduation/:id */
  show: (id) => api.get(`/graduation/${id}`),

  /** POST /api/graduation/album */
  createAlbum: (data) => api.post('/graduation/album', data),

  /** POST /api/graduation/upload-photo */
  uploadPhoto: (fd) =>
    api.post('/graduation/upload-photo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** POST /api/graduation/upload-video */
  uploadVideo: (fd) =>
    api.post('/graduation/upload-video', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** POST /api/graduation/upload-program */
  uploadProgram: (fd) =>
    api.post('/graduation/upload-program', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** POST /api/graduation/upload-invitation */
  uploadInvitation: (fd) =>
    api.post('/graduation/upload-invitation', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** POST /api/graduation/upload-song */
  uploadSong: (fd) =>
    api.post('/graduation/upload-song', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** POST /api/graduation/upload-mass */
  uploadMass: (fd) =>
    api.post('/graduation/upload-mass', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** DELETE /api/graduation/:id */
  delete: (id) => api.delete(`/graduation/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSCRIPTS  (premium — Groq Whisper speeches & AI notes)
// ─────────────────────────────────────────────────────────────────────────────
export const transcriptApi = {
  /** GET /api/transcripts?q=&page=&lang=&status= */
  list: (params = {}) => api.get('/transcripts', { params }),

  /** GET /api/transcripts/:id → transcript + notes + segments */
  show: (id) => api.get(`/transcripts/${id}`),

  /** POST /api/transcripts — upload audio, queue Whisper job */
  store: (fd) =>
    api.post('/transcripts', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** DELETE /api/transcripts/:id */
  delete: (id) => api.delete(`/transcripts/${id}`),

  /** GET /api/transcripts/:id/subtitles?format=srt|vtt → blob */
  subtitles: (id, format = 'srt') =>
    api.get(`/transcripts/${id}/subtitles`, {
      params:       { format },
      responseType: 'blob',
    }),

  /** POST /api/transcripts/:id/notes — regenerate AI notes via Groq LLaMA */
  regenerateNotes: (id) => api.post(`/transcripts/${id}/notes`),
};

// Keep legacy alias so any file importing `transcriptsApi` (plural) still works
export const transcriptsApi = transcriptApi;

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA  (merged — bulk upload, video, delete, storage, bandwidth)
// ─────────────────────────────────────────────────────────────────────────────
export const mediaApi = {
  /** GET /api/profile/storage-usage */
  storageUsage: () => api.get('/profile/storage-usage'),

  /** GET /api/media/bandwidth */
  bandwidth: () => api.get('/media/bandwidth'),

  /**
   * POST /api/media/bulk-upload
   * Accepts either a pre-built FormData (from GraduationPage)
   * or (albumId, files[], onProgress) signature (from GalleryPage).
   */
  bulkUpload: (albumIdOrFd, files = null, onProgress = null) => {
    let form;
    if (albumIdOrFd instanceof FormData) {
      form = albumIdOrFd;
    } else {
      form = new FormData();
      form.append('album_id', albumIdOrFd);
      (files ?? []).forEach((f) => form.append('photos[]', f));
    }
    return api.post('/media/bulk-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },

  /**
   * POST /api/media/upload-video
   * Accepts either a pre-built FormData or (albumId, file, caption, onProgress).
   */
  uploadVideo: (albumIdOrFd, file = null, caption = '', onProgress = null) => {
    let form;
    if (albumIdOrFd instanceof FormData) {
      form = albumIdOrFd;
    } else {
      form = new FormData();
      form.append('album_id', albumIdOrFd);
      form.append('video', file);
      form.append('caption', caption);
    }
    return api.post('/media/upload-video', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },

  /** DELETE /api/media/photo/:photoId */
  deletePhoto: (photoId) => api.delete(`/media/photo/${photoId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// FACE RECOGNITION
// ─────────────────────────────────────────────────────────────────────────────
export const faceApi = {
  /** GET /api/face/students/:userId/photos */
  studentPhotos: (userId, page = 1) =>
    api.get(`/face/students/${userId}/photos`, { params: { page } }),

  /** POST /api/face/search */
  search: (formData) =>
    api.post('/face/search', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** POST /api/face/photos/:photoId/analyze */
  analyzePhoto: (photoId) => api.post(`/face/photos/${photoId}/analyze`),

  /** POST /api/face/albums/:albumId/analyze */
  analyzeAlbum: (albumId) => api.post(`/face/albums/${albumId}/analyze`),

  /** GET /api/face/photos/:photoId/tags */
  photoTags: (photoId) => api.get(`/face/photos/${photoId}/tags`),
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const profileApi = {
  /** GET /api/students/:userId/posts */
  getPosts: (userId) => api.get(`/students/${userId}/posts`),

  /** POST /api/profile/upload */
  uploadMedia: (formData, onProgress = null) =>
    api.post('/profile/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),

  /** PATCH /api/profile/posts/:photoId */
  updatePost: (photoId, payload) =>
    api.patch(`/profile/posts/${photoId}`, payload),

  /** DELETE /api/profile/posts/:photoId */
  deletePost: (photoId) => api.delete(`/profile/posts/${photoId}`),
};

export const profileSettingsApi = {
  updateVisibility: (visibility) => api.post('/profile/visibility', { visibility }),
  updateMotto:      (motto)      => api.post('/profile/motto', { motto }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const announcementsApi = {
  list:   ()     => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export const analyticsApi = {
  summary:    () => api.get('/analytics'),
  myStats:    () => api.get('/analytics/my-stats'),
  topViewed:  () => api.get('/analytics/top-viewed'),
  batchmates: () => api.get('/analytics/batchmates'),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:          ()         => api.get('/notifications'),
  registerToken: (fcmToken) => api.post('/notifications/register-token', { fcm_token: fcmToken }),
  markRead:      (id)       => api.post(`/notifications/${id}/read`),
  markAll:       ()         => api.post('/notifications/read-all'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS & FACULTY
// ─────────────────────────────────────────────────────────────────────────────
export const sectionsApi = {
  list: ()   => api.get('/sections'),
  show: (id) => api.get(`/sections/${id}`),
};

export const facultyApi = {
  list: ()   => api.get('/faculty'),
  show: (id) => api.get(`/faculty/${id}`),
};