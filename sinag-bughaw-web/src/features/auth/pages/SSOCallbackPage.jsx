import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

const STATUS_STEPS = [
  { key: 'token',   label: 'Authenticating your session…' },
  { key: 'profile', label: 'Loading your profile…'         },
  { key: 'done',    label: 'All set! Redirecting…'          },
];

export default function SSOCallbackPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { setToken, fetchUser } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error || !token) {
        navigate(`/login?error=${error ?? 'sso_failed'}`, { replace: true });
        return;
      }

      try {
        setToken(token);
        setStepIndex(1);
        await fetchUser();
        setStepIndex(2);
        setTimeout(() => navigate('/dashboard', { replace: true }), 600);
      } catch (err) {
        console.error('SSO callback error:', err);
        navigate('/login?error=sso_failed', { replace: true });
      }
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] font-sans px-4">
      <style>{`
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes fadeIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(29,43,75,0.1)] border border-slate-100 p-10 w-full max-w-sm flex flex-col items-center animate-[fadeIn_0.4s_ease]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <img src="/images/NU_logo.png" alt="NU Lipa" className="h-9 object-contain" />
          <div className="leading-tight">
            <p className="text-[#1d2b4b] font-black text-[12px] uppercase tracking-widest m-0">Sinag-Bughaw</p>
            <p className="text-[#fdb813] text-[9px] tracking-[2px] uppercase m-0 mt-0.5">Digital Yearbook</p>
          </div>
        </div>

        {/* Spinner ring */}
        <div className="relative w-20 h-20 mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          {/* Spinning arc */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3f51b5] animate-[spin_0.8s_linear_infinite]" />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <i className="fab fa-google text-[#3f51b5] text-base" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Step list */}
        <div className="w-full flex flex-col gap-2.5 mb-2">
          {STATUS_STEPS.map(({ key, label }, i) => {
            const isDone    = i < stepIndex;
            const isActive  = i === stepIndex;
            const isPending = i > stepIndex;
            return (
              <div key={key} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all
                ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'bg-transparent'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs transition-all
                  ${isDone    ? 'bg-emerald-100 text-emerald-600'
                  : isActive  ? 'bg-[#3f51b5]/10 text-[#3f51b5]'
                  : 'bg-slate-100 text-slate-300'}`}>
                  {isDone
                    ? <i className="fas fa-check text-[10px]" aria-hidden="true" />
                    : isActive
                      ? <div className="w-2.5 h-2.5 rounded-full bg-[#3f51b5] animate-[pulse_1s_ease_infinite]" />
                      : <div className="w-2 h-2 rounded-full bg-slate-300" />
                  }
                </div>
                <span className={`text-xs font-medium transition-colors
                  ${isDone ? 'text-emerald-600' : isActive ? 'text-[#1d2b4b]' : 'text-slate-300'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-slate-400 text-xs mt-6">
        Secured by NU Lipa · Sinag-Bughaw
      </p>
    </div>
  );
}