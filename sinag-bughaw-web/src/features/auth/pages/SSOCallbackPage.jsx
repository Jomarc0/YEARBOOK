import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { consentApi } from '@/api/payment.api';

/**
 * SSOCallbackPage
 * Laravel redirects here after Google OAuth with ?token=xxx
 * or ?error=xxx on failure.
 */
export default function SSOCallbackPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    // ── Error states ───────────────────────────────────────────────────
    if (error === 'unauthorized_domain') {
      navigate('/login?error=unauthorized_domain', { replace: true });
      return;
    }

    if (error || !token) {
      navigate('/login?error=sso_failed', { replace: true });
      return;
    }

    // ── Store token & sync auth context ────────────────────────────────
    setToken(token);

    // ── Check consent before routing ───────────────────────────────────
    consentApi.status()
      .then(({ data }) => {
        if (data.accepted) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/consent', { replace: true });
        }
      })
      .catch(() => {
        // If consent check fails, route to dashboard anyway
        navigate('/dashboard', { replace: true });
      });

  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-['Inter']">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <img
        src="/images/NU_logo.png"
        alt="NU Lipa"
        className="h-14 object-contain mb-6 opacity-80"
      />

      <div
        className="w-10 h-10 border-4 border-[#3f51b5]/20 border-t-[#3f51b5] rounded-full mb-4"
        style={{ animation: 'spin 0.8s linear infinite' }}
      />

      <p className="text-slate-400 text-sm">Signing you in with Google...</p>
    </div>
  );
}