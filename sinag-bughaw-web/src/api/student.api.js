import api from './client';

export const studentsApi = {
  list:               (params = {}) => api.get('/students',                        { params }),
  show:               (id)          => api.get(`/students/${id}`),
  updateBio:          (bio)         => api.post('/students/profile/bio',           { bio }),
  updatePhoto:        (fd)          => api.post('/students/profile/photo',     fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePassword:     (payload)     => api.put('/students/profile/password',        payload),
  addTaggedPhoto:     (fd)          => api.post('/students/profile/tagged-photos',  fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeTaggedPhoto:  (photoId)     => api.delete(`/students/profile/tagged-photos/${photoId}`),
  getAchievements:    (id)          => api.get(`/students/${id}/achievements`),
  updateAchievements: (data)        => api.put('/profile/achievements',            { achievements: data }),
  updateAcademic:     (payload)     => api.put('/profile/academic',                 payload),
  getTaggedPhotos:    (id)          => api.get(`/students/${id}/tagged-photos`),
  trackView:          (id)          => api.post(`/students/${id}/view`),
  search:             (params = {}) => api.get('/search/students',              { params }),
  suggest:            (params = {}) => api.get('/search/students/suggest',      { params }),
};