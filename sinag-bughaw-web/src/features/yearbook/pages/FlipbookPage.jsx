import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import FlipbookViewer from '../components/FlipbookViewer';
import { yearbookApi } from '@/api/yearbook.api';

export default function FlipbookPage() {
  const navigate              = useNavigate();
  const { user: currentUser } = useAuth();

  const [students,    setStudents]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await yearbookApi.flipbookData();

        // FIX: API returns a plain array directly — but handle both shapes:
        // - Plain array:       data = [{id:1,...}, {id:2,...}]
        // - Wrapped response:  data = { data: [{id:1,...}] }
        const students = Array.isArray(data) ? data : (data?.data ?? []);

        if (!cancelled) setStudents(students);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message ?? 'Failed to load yearbook.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const handleDownload = async (userId) => {
    if (downloading) return;
    setDownloading(true);

    try {
      const request  = userId
        ? yearbookApi.exportStudentPdf(userId)
        : yearbookApi.exportCertificate();

      const { data } = await request;
      const blob     = new Blob([data], { type: 'application/pdf' });
      const url      = URL.createObjectURL(blob);
      const anchor   = document.createElement('a');

      anchor.href     = url;
      anchor.download = userId
        ? `student-profile-${userId}.pdf`
        : `graduation-certificate.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(201,168,76,0.2)',
          borderTopColor: '#c9a84c',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', margin: 0 }}>
          Opening yearbook…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ fontSize: 13, color: '#e24b4a', margin: 0 }}>{error}</p>
      <button onClick={() => navigate(-1)} style={{ fontSize: 12, opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#fff' }}>
        Go back
      </button>
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────────────
  if (students.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.1em' }}>
        No students found in the yearbook yet.
      </p>
      <button onClick={() => navigate(-1)} style={{ fontSize: 12, opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#fff' }}>
        Go back
      </button>
    </div>
  );

  // ── Flipbook ──────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: '#0f0f1e', paddingTop: '1.5rem' }}>
      <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginBottom: '0.5rem' }}>
        {currentUser?.batch ?? 'Batch 2025'} · Digital Yearbook
      </p>

      <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: '1rem', marginTop: 0 }}>
        {students.length} student{students.length !== 1 ? 's' : ''} · {Math.ceil(students.length / 4)} spread{Math.ceil(students.length / 4) !== 1 ? 's' : ''}
      </p>

      <FlipbookViewer
        students={students}
        batchYear={currentUser?.graduation_year ?? new Date().getFullYear()}
        school="National University Lipa"
        currentUser={currentUser}
        onDownload={handleDownload}
      />

      {downloading && (
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: '0.75rem' }}>
          Preparing your PDF…
        </p>
      )}
    </main>
  );
}