import api from './client';

export const appConfigApi = {
  get: () => api.get('/app-config'),
};
