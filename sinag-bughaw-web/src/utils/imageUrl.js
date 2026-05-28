const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE}/storage/${path}`;
}

export function avatarUrl(name = '') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d2b4b&color=fdb813&bold=true&size=400`;
}