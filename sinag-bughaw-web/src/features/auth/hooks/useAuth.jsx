import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sb_token');
    if (token) {
      authApi.me()
        .then(({ data }) => setUser(data))
        .catch(()        => localStorage.removeItem('sb_token'))
        .finally(()      => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginCredentials = async (email, password) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('sb_token', data.token);
    return data;
  };

  const fetchUser = useCallback(async () => {
    const { data } = await authApi.me();
    setUser(data);
  }, []);

  const logout = async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('sb_token');
    setUser(null);
  };

  const setToken = useCallback(async (token) => {
    localStorage.setItem('sb_token', token);
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      localStorage.removeItem('sb_token');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginCredentials, fetchUser, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);