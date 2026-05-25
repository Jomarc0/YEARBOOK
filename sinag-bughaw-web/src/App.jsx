import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';
import ConsentModal from '@/features/auth/components/ConsentModal';

// ── Auth ──────────────────────────────────────────────────────────────────────
import LandingPage        from '@/pages/LandingPage';
import LoginPage          from '@/features/auth/pages/LoginPage';
import RegisterPage       from '@/features/auth/pages/RegisterPage';
import SSOCallbackPage    from '@/features/auth/pages/SSOCallbackPage';

// ── Dashboard ─────────────────────────────────────────────────────────────────
import DashboardPage      from '@/pages/DashboardPage';

// ── Profile ───────────────────────────────────────────────────────────────────
import ProfilePage        from '@/features/profile/pages/ProfilePage';
import SettingsPage       from '@/features/profile/pages/SettingsPage';

// ── Yearbook ──────────────────────────────────────────────────────────────────
import FlipbookPage          from '@/features/yearbook/pages/FlipbookPage';
import YearbookHomePage       from '@/features/yearbook/pages/YearbookHomePage';
import FlipbookViewerPage from "@/features/yearbook/components/flipbook/FlipbookViewer";
import GalleryPage           from '@/features/yearbook/pages/GalleryPage';
import GalleryShowPage       from '@/features/yearbook/pages/GalleryShowPage';
import GraduationPage        from '@/features/yearbook/pages/GraduationPage';
import GraduationArchivePage from '@/features/yearbook/pages/GraduationArchivePage';
import GraduationSpeechesPage from '@/features/yearbook/pages/GraduationSpeechesPage';

// ── Batch ─────────────────────────────────────────────────────────────────────
import BatchmatesPage    from '@/features/batch/pages/BatchmatesPage';
import SectionsPage      from '@/features/batch/pages/SectionsPage';
import SectionDetailPage from '@/features/batch/pages/SectionDetailPage';
import DiscoveryPage     from '@/features/batch/pages/DiscoveryPage';

// ── Messaging ─────────────────────────────────────────────────────────────────
import MessagesPage   from '@/features/messaging/pages/MessagesPage';
import VoiceNotesPage from '@/features/messaging/pages/VoiceNotesPage';

// ── Subscription / Payment ────────────────────────────────────────────────────
import PaymentPage        from '@/features/subscription/pages/PaymentPage';
import PaymentSuccessPage from '@/features/subscription/pages/PaymentSuccessPage';
import PaymentCancelPage  from '@/features/subscription/pages/PaymentCancelPage';

// ── Search ────────────────────────────────────────────────────────────────────
import DirectoryPage from '@/features/search/pages/DirectoryPage';

// ── Transcripts ───────────────────────────────────────────────────────────────
import TranscriptsPage from '@/features/transcripts/pages/TranscriptsPage';

// ── Announcements ─────────────────────────────────────────────────────────────
import AnnouncementsPage from '@/features/announcements/pages/AnnouncementsPage';

// ── Faculty ───────────────────────────────────────────────────────────────────
import FacultyPage from '@/features/faculty/pages/FacultyPage';

// ── Fallback ──────────────────────────────────────────────────────────────────
import NotFoundPage from '@/pages/NotFoundPage';

// ─────────────────────────────────────────────────────────────────────────────
// GUARDS
// ─────────────────────────────────────────────────────────────────────────────

function ConsentWrapper({ children }) {
  const { user }        = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user && !user.consent_accepted) setShow(true);
  }, [user]);

  return (
    <>
      {show && <ConsentModal onAccepted={() => setShow(false)} />}
      {children}
    </>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f7fe' }}>
      <div>
        <div
          className="w-10 h-10 rounded-full border-4 mx-auto mb-3"
          style={{
            borderColor:    'rgba(63,81,181,0.2)',
            borderTopColor: '#3f51b5',
            animation:      'spin 0.8s linear infinite',
          }}
        />
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

/**
 * SubscriberRoute — requires active premium subscription.
 * Non-premium authenticated users are redirected to /premium
 * with a paywall message instead of a hard 404.
 */
function SubscriberRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)          return <Navigate to="/login"   replace />;
  if (!user.is_premium) return <Navigate to="/premium" replace />;
  return <ConsentWrapper>{children}</ConsentWrapper>;
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public ───────────────────────────────────────────────────── */}
          <Route path="/"         element={<GuestRoute><LandingPage /></GuestRoute>} />
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* SSO callback — no guard, handles its own redirect */}
          <Route path="/sso/callback" element={<SSOCallbackPage />} />

          {/* ── Protected (authenticated) ────────────────────────────────── */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          {/* Profile */}
          <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings"    element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Search / Directory */}
          <Route path="/directory" element={<ProtectedRoute><DirectoryPage /></ProtectedRoute>} />

          {/* ── Gallery — Visual Archive (All Photos + Face Search) ───────── */}
          {/* Graduation-specific tabs deep-link into /graduation?tab=X       */}
          <Route path="/gallery"     element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
          <Route path="/gallery/:id" element={<ProtectedRoute><GalleryShowPage /></ProtectedRoute>} />

          {/* ── Graduation Hub ────────────────────────────────────────────── */}
          {/* Single source of truth for all graduation content.              */}
          {/* Tab is driven by ?tab= query param so Gallery can deep-link.   */}
          <Route path="/graduation"             element={<ProtectedRoute><GraduationPage /></ProtectedRoute>} />
          <Route path="/graduation/archive/:id" element={<ProtectedRoute><GraduationArchivePage /></ProtectedRoute>} />

          {/* ── Graduation Speeches — PREMIUM ONLY ───────────────────────── */}
          <Route path="/graduation/speeches" element={<SubscriberRoute><GraduationSpeechesPage /></SubscriberRoute>} />

          {/* Flipbook */}
          <Route path="/flipbook" element={<ProtectedRoute><FlipbookPage /></ProtectedRoute>} />
          <Route path="/yearbook"          element={<ProtectedRoute><YearbookHomePage /></ProtectedRoute>} />
          <Route path="/yearbook/:batchId" element={<ProtectedRoute><YearbookHomePage /></ProtectedRoute>} />
          <Route path="/yearbook/:batchId/view" element={<ProtectedRoute><FlipbookViewerPage /></ProtectedRoute>} />
          {/* Batch */}
          <Route path="/batchmates"   element={<ProtectedRoute><BatchmatesPage /></ProtectedRoute>} />
          <Route path="/sections"     element={<ProtectedRoute><SectionsPage /></ProtectedRoute>} />
          <Route path="/sections/:id" element={<ProtectedRoute><SectionDetailPage /></ProtectedRoute>} />
          <Route path="/discover"     element={<ProtectedRoute><DiscoveryPage /></ProtectedRoute>} />

          {/* Faculty */}
          <Route path="/faculty" element={<ProtectedRoute><FacultyPage /></ProtectedRoute>} />

          {/* Messaging */}
          <Route path="/messages"     element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/voice-notes"  element={<ProtectedRoute><VoiceNotesPage /></ProtectedRoute>} />

          {/* Announcements */}
          <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />

          {/* Payment */}
          <Route path="/premium"         element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/payment/success"  element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
          <Route path="/payment/cancel"   element={<ProtectedRoute><PaymentCancelPage /></ProtectedRoute>} />

          {/* ── Premium-only ──────────────────────────────────────────────── */}
          {/* /transcripts — standalone premium transcript manager            */}
          <Route path="/transcripts" element={<SubscriberRoute><TranscriptsPage /></SubscriberRoute>} />

          {/* ── Fallback ──────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}