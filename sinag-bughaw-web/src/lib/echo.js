import Echo  from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

function getToken() {
  return (
    localStorage.getItem('token')       ??
    localStorage.getItem('auth_token')  ??
    sessionStorage.getItem('token')     ??
    ''
  );
}

const echo = new Echo({
  broadcaster:       'reverb',
  key:               import.meta.env.VITE_REVERB_APP_KEY,
  wsHost:            import.meta.env.VITE_REVERB_HOST   ?? '127.0.0.1',
  wsPort:            Number(import.meta.env.VITE_REVERB_PORT  ?? 8080),
  wssPort:           Number(import.meta.env.VITE_REVERB_PORT  ?? 8080),
  forceTLS:          (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint:      '/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept:        'application/json',
    },
  },
});

window.Echo = echo;
export default echo;