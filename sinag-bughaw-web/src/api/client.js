import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const STORAGE_ROOT = import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000';

export function storageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path; 
  const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  return `${BASE}/storage/${path}`;
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('sb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('sb_token');
      window.location.href = '/login';
    }
    if (err.response?.status === 402) {
      window.location.href = '/premium';
    }
    return Promise.reject(err);
  }
);

export default api;