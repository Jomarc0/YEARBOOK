import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useEffect, useState } from 'react';
import ConsentModal from './components/ConsentModal';

import LandingPage         from './pages/LandingPage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import DashboardPage       from './pages/DashboardPage';
import DirectoryPage       from './pages/DirectoryPage';
import ProfilePage         from './pages/ProfilePage';
import GalleryPage         from './pages/GalleryPage';
import AlbumPage           from './pages/AlbumPage';
import FacultyPage         from './pages/FacultyPage';
import SectionsPage        from './pages/SectionsPage';
import MessagesPage        from './pages/MessagesPage';
import TranscriptsPage     from './pages/TranscriptsPage';
import FlipbookPage        from './pages/FlipbookPage';
import PaymentPage         from './pages/PaymentPage';
import VoiceNotesPage      from './pages/VoiceNotesPage';
import BatchmatesPage      from './pages/BatchmatesPage';
import SettingsPage        from './pages/SettingsPage';
import AnnouncementsPage   from './pages/AnnouncementsPage';
import NotFoundPage        from './pages/NotFoundPage';
import PaymentSuccessPage  from './pages/PaymentSuccessPage';
import PaymentCancelPage   from './pages/PaymentCancelPage';

function ConsentWrapper({ children }) {
  const { user }         = useAuth();
  const [show, setShow]  = useState(false);
  useEffect(() => { if (user && !user.consent_accepted) setShow(true); }, [user]);
  return <>{show && <ConsentModal onAccepted={() => setShow(false)} />}{children}</>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f7fe' }}>
      <div>
        <div className="w-10 h-10 rounded-full border-4 mx-auto mb-3"
          style={{ borderColor: 'rgba(63,81,181,0.2)', borderTopColor: '#3f51b5', animation: 'spin 0.8s linear infinite' }} />
        <p className="text-sm text-center" style={{ color: '#94a3b8' }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  return <ConsentWrapper>{children}</ConsentWrapper>;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected */}
          <Route path="/dashboard"       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/directory"       element={<ProtectedRoute><DirectoryPage /></ProtectedRoute>} />
          <Route path="/profile/:id"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/gallery"         element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
          <Route path="/gallery/:id"     element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
          <Route path="/faculty"         element={<ProtectedRoute><FacultyPage /></ProtectedRoute>} />
          <Route path="/sections"        element={<ProtectedRoute><SectionsPage /></ProtectedRoute>} />
          <Route path="/sections/:id"    element={<ProtectedRoute><SectionsPage /></ProtectedRoute>} />
          <Route path="/messages"        element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:id"    element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/transcripts"     element={<ProtectedRoute><TranscriptsPage /></ProtectedRoute>} />
          <Route path="/flipbook"        element={<ProtectedRoute><FlipbookPage /></ProtectedRoute>} />
          <Route path="/premium"         element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/voice-notes"     element={<ProtectedRoute><VoiceNotesPage /></ProtectedRoute>} />
          <Route path="/batchmates"      element={<ProtectedRoute><BatchmatesPage /></ProtectedRoute>} />
          <Route path="/settings"        element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/announcements"   element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
          <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
          <Route path="/payment/cancel"  element={<ProtectedRoute><PaymentCancelPage /></ProtectedRoute>} />
          {/* Redirects & fallback */}
          <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
          <Route path="*"  element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}