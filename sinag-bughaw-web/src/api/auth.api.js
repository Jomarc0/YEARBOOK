import api from './client';

export const authApi = {
  login:     (email, password) => api.post('/auth/login', { email, password }),
  register:  (data)            => api.post('/auth/register', data),
  logout:    ()                => api.post('/auth/logout'),
  me:        ()                => api.get('/auth/me'),
  sendOtp:   (email)           => api.post('/auth/otp/send', { email }),
  verifyOtp: (email, otp)      => api.post('/auth/otp/verify', { email, otp }),
};

export const consentApi = {
  accept: (version = '1.0') => api.post('/consent/accept', { version }),
  status: ()                => api.get('/consent/status'),
};