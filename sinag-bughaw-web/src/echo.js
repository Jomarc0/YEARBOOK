import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster:       'reverb',
    key:               import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:            import.meta.env.VITE_REVERB_HOST,
    wsPort:            import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort:           import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS:          (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https', // false locally
    enabledTransports: ['ws'],   // ← only 'ws' locally, NOT ['ws','wss']
    authEndpoint:      `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
    auth: {
        headers: {
        Authorization: `Bearer ${localStorage.getItem('sb_token') ?? ''}`,
        Accept:        'application/json',
        },
    },
});

// Call this after login to refresh the token in Echo
export function refreshEchoToken() {
  const token = localStorage.getItem('sb_token');
  if (window.Echo && token) {
    window.Echo.connector.options.auth.headers.Authorization = `Bearer ${token}`;
  }
}