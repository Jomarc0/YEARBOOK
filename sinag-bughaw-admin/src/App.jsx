// src/App.jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState, useCallback }                  from "react";

import { AuthProvider, useAuth }                  from "./context/AuthContext";
import {
  ProtectedRoute,
  GuestRoute,
  SuperAdminRoute,
}                                                 from "./components/guards/RouteGuards";

import Sidebar        from "./components/layout/Sidebar";
import Topbar         from "./components/layout/Topbar";
import ToastContainer from "./components/shared/Toast";

// ── Pages ─────────────────────────────────────────────────────────────────────
import LoginPage             from "./pages/LoginPage";
import DashboardPage         from "./pages/DashboardPage";
import FacultyPage           from "./pages/FacultyPage";
import SettingsPage          from "./pages/SettingsPage";
import AnalyticsPage         from "./pages/AnalyticsPage";
import BatchManagementPage   from "./pages/BatchManagementPage";
import GraduationContentPage from "./pages/GraduationContentPage";
import MediaModerationPage   from "./pages/MediaModerationPage";
import TrashPage             from "./pages/TrashPage";
import ReportsPage           from "./pages/ReportsPage";
import SubscriptionsPage     from "./pages/SubscriptionsPage";
import UsersPage             from "./pages/UsersPage";
import AdminManagementPage   from "./pages/AdminManagementPage";

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

// ── Authenticated Layout ──────────────────────────────────────────────────────
function AdminLayout({ children, toasts, onDismiss }) {
  const { handleLogout } = useAuth();
  return (
    <div className="min-h-screen bg-[#e9edf4] flex font-[Inter,system-ui,sans-serif]">
      <Sidebar onLogout={handleLogout} />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden ml-[236px]">
        <Topbar />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={onDismiss} />
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { toasts, show: showToast, dismiss } = useToast();

  return (
    <>
      <GlobalStyles />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes toasts={toasts} dismiss={dismiss} showToast={showToast} />
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

function AppRoutes({ toasts, dismiss, showToast }) {
  const { authed } = useAuth();

  const Layout = ({ children }) => (
    <AdminLayout toasts={toasts} onDismiss={dismiss}>{children}</AdminLayout>
  );

  const PP = ({ children }) => (
    <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
  );

  const SA = ({ children }) => (
    <SuperAdminRoute><Layout>{children}</Layout></SuperAdminRoute>
  );

  const pp = { showToast };

  return (
    <Routes>
      {/* Guest */}
      <Route path="/login" element={
        <GuestRoute>
          <LoginPage {...pp} />
          <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </GuestRoute>
      } />

      {/* Any authenticated admin */}
      <Route path="/dashboard"          element={<PP><DashboardPage         {...pp} /></PP>} />
      <Route path="/users"              element={<PP><UsersPage              {...pp} /></PP>} />
      <Route path="/subscriptions"      element={<PP><SubscriptionsPage      {...pp} /></PP>} />
      <Route path="/faculty"            element={<PP><FacultyPage            {...pp} /></PP>} />
      <Route path="/media-library"      element={<PP><MediaModerationPage    {...pp} /></PP>} />
      <Route path="/content-moderation" element={<PP><MediaModerationPage    {...pp} /></PP>} />
      <Route path="/graduation"         element={<PP><GraduationContentPage  {...pp} isAdmin={true} /></PP>} />
      <Route path="/batches"            element={<PP><BatchManagementPage    {...pp} /></PP>} />
      <Route path="/analytics"          element={<PP><AnalyticsPage          {...pp} /></PP>} />
      <Route path="/trash"              element={<PP><TrashPage              {...pp} /></PP>} />
      <Route path="/settings"           element={<PP><SettingsPage           {...pp} /></PP>} />

      {/* Super Admin only */}
      <Route path="/reports"            element={<SA><ReportsPage            {...pp} /></SA>} />
      <Route path="/admin-management"   element={<SA><AdminManagementPage    {...pp} /></SA>} />

      {/* Redirects */}
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