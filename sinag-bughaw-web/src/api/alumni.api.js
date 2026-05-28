import apiClient from './client';

export const alumniApi = {
  list:             (params = {})            => apiClient.get('/alumni', { params }),
  search:           (query, params = {})     => apiClient.get('/alumni/search', { params: { q: query, ...params } }),
  byBatch:          (batchId, params = {})   => apiClient.get(`/alumni/batch/${batchId}`, { params }),
  show:             (id)                     => apiClient.get(`/alumni/${id}`),
  yearbookEntry:    (id)                     => apiClient.get(`/alumni/${id}/yearbook-entry`),
  fromYearbookPage: (batchId, pageIndex)     => apiClient.get('/alumni/from-yearbook-page', { params: { batch_id: batchId, page_index: pageIndex } }),
  updateCareer:     (data)                   => apiClient.post('/alumni/career', data),
  me:               ()                       => apiClient.get('/alumni/me'),
};