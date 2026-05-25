import api from './client';

export const searchApi = {
  search:  (q, type = 'all') => api.get('/search', { params: { q, type } }),
  students:(params = {})     => api.get('/search/students', { params }),
  suggest: (params = {})     => api.get('/search/students/suggest', { params }),
  filters: ()                => api.get('/search/students/filters'),
};