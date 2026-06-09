import api from './client';

export const paymentsApi = {
  createIntent:       (plan) => api.post('/payments/create-intent', { plan }),
  confirm:            (sessionId) => api.post('/payments/confirm', { session_id: sessionId }),
  subscriptionStatus: ()     => api.get('/payments/status'),
  history:            ()     => api.get('/payments/history'),
};

export const consentApi = {
  accept: (version) => api.post('/consent/accept', { version }),
  status: ()        => api.get('/consent/status'),
};
