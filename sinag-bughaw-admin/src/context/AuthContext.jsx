// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const raw   = localStorage.getItem("admin_user");
      const token = localStorage.getItem("admin_token");

      // If either is missing, clear both and start fresh
      if (!raw || !token) {
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_token");
        return null;
      }

      return JSON.parse(raw);
    } catch {
      localStorage.removeItem("admin_user");
      localStorage.removeItem("admin_token");
      return null;
    }
  });

  /**
   * Call after a successful POST /api/admin/login.
   * @param {object} adminData  — the `admin` object from the API response
   * @param {string} token      — the plain-text Sanctum token
   */
  const handleLogin = useCallback((adminData, token) => {
    // Always clear first to prevent bleed-over from previous session
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_user",  JSON.stringify(adminData));
    setAdmin(adminData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      admin,
      authed:       !!admin,
      isSuperAdmin: admin?.is_super_admin === true,
      isAdmin:      admin?.role === "admin" || admin?.role === "super_admin",
      handleLogin,
      handleLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}