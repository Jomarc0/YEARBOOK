import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState, useCallback } from "react";

import Sidebar        from "./components/layout/Sidebar";
import Topbar         from "./components/layout/Topbar";
import ToastContainer from "./components/shared/Toast";

// ── Pages ─────────────────────────────────────────────────────────────────────
import LoginPage                from "./pages/LoginPage";
import DashboardPage            from "./pages/DashboardPage";
import FacultyPage              from "./pages/FacultyPage";
import SettingsPage             from "./pages/SettingsPage";
import AnalyticsPage            from "./pages/AnalyticsPage";
import ArchivesPage             from "./pages/ArchivesPage";
import BatchManagementPage      from "./pages/BatchManagementPage";
import GraduationContentPage    from "./pages/GraduationContentPage";
import MediaModerationPage      from "./pages/MediaModerationPage"; 
import ReportsPage              from "./pages/ReportsPage";
import SubscriptionsPage        from "./pages/SubscriptionsPage";
import UsersPage                from "./pages/UsersPage";

// ── Toast hook ────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, show, dismiss };
}

// ── Auth Context (simple) ─────────────────────────────────────────────────────
import { createContext, useContext } from "react";

const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const handleLogin  = () => setAuthed(true);
  const handleLogout = () => setAuthed(false);
  return (
    <AuthContext.Provider value={{ authed, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Route Guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { authed } = useAuth();
  if (authed) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Authenticated Layout ──────────────────────────────────────────────────────
function AdminLayout({ children, toasts, onDismiss }) {
  const { handleLogout } = useAuth();
  const SIDEBAR_WIDTH = 236;
  return (
    <div style={{
      minHeight: "100vh",
      background: "#e9edf4",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <Sidebar onLogout={handleLogout} />
      <div
        style={{
          marginLeft: SIDEBAR_WIDTH,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#edf1f8",
        }}
      >
        <Topbar />
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 20px" }}>
          {children}
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={onDismiss} />
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { toasts, show: showToast, dismiss } = useToast();
  const pageProps = { showToast };

  return (
    <>
      <GlobalStyles />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes toasts={toasts} dismiss={dismiss} pageProps={pageProps} />
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

function AppRoutes({ toasts, dismiss, pageProps }) {
  const { authed } = useAuth();

  return (
    <Routes>

      {/* ── Guest ──────────────────────────────────────────────────────────── */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage onLogin={useAuth().handleLogin} />
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
          </GuestRoute>
        }
      />

      {/* ── Protected ──────────────────────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout toasts={toasts} onDismiss={dismiss}>
              <DashboardPage {...pageProps} />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Users ──────────────────────────────────────────────────────────── */}
      <Route path="/users"           element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><UsersPage {...pageProps} /></AdminLayout></ProtectedRoute>} />
      <Route path="/subscriptions"   element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><SubscriptionsPage {...pageProps} /></AdminLayout></ProtectedRoute>} />
      <Route path="/privacy-consent" element={<Navigate to="/reports" replace />} />

      {/* ── Faculty ────────────────────────────────────────────────────────── */}
      <Route path="/faculty" element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><FacultyPage {...pageProps} /></AdminLayout></ProtectedRoute>} />

      {/* ── Media & Moderation (unified) ───────────────────────────────────── */}
      {/* Both old URLs still work — they both render MediaModerationPage      */}
      <Route path="/media-library"      element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><MediaModerationPage {...pageProps} /></AdminLayout></ProtectedRoute>} />
      <Route path="/content-moderation" element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><MediaModerationPage {...pageProps} /></AdminLayout></ProtectedRoute>} />

      {/* ── Archives ───────────────────────────────────────────────────────── */}
      <Route path="/archives" element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><ArchivesPage {...pageProps} /></AdminLayout></ProtectedRoute>} />

      {/* ── Yearbook & Graduation ───────────────────────────────────────────── */}
      <Route path="/graduation" element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><GraduationContentPage {...pageProps} isAdmin={true} /></AdminLayout></ProtectedRoute>} />
      <Route path="/batches"    element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><BatchManagementPage {...pageProps} /></AdminLayout></ProtectedRoute>} />

      {/* ── Analytics & Reports ─────────────────────────────────────────────── */}
      <Route path="/analytics" element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><AnalyticsPage {...pageProps} /></AdminLayout></ProtectedRoute>} />
      <Route path="/reports"   element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><ReportsPage {...pageProps} /></AdminLayout></ProtectedRoute>} />

      {/* ── System ──────────────────────────────────────────────────────────── */}
      <Route path="/settings"   element={<ProtectedRoute><AdminLayout toasts={toasts} onDismiss={dismiss}><SettingsPage {...pageProps} /></AdminLayout></ProtectedRoute>} />

      {/* ── Redirects ───────────────────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to={authed ? "/dashboard" : "/login"} replace />} />

    </Routes>
  );
}

// ── Global CSS ────────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', system-ui, sans-serif; background: #e9edf4; }
      input, textarea, select, button { font-family: inherit; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-thumb { background: rgba(71,85,105,.22); border-radius: 3px; }
    `}</style>
  );
}