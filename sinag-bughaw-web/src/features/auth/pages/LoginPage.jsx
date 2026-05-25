import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth }             from '@/features/auth/hooks/useAuth';
import { authApi, consentApi } from '@/api/auth.api';
import ConsentModal             from '../components/ConsentModal';

export default function LoginPage() {
  const { loginCredentials, fetchUser } = useAuth();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();

  const [step,        setStep]        = useState('form');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [otp,         setOtp]         = useState(['', '', '', '', '', '']);
  const [error,       setError]       = useState(() => {
    const e = searchParams.get('error');
    if (e === 'sso_failed')          return 'Google sign-in failed. Please try again.';
    if (e === 'unauthorized_domain') return 'Please use your @nu-lipa.edu.ph Google account.';
    return '';
  });
  const [loading,     setLoading]     = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showConsent, setShowConsent] = useState(false);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginCredentials(email, password);
      await authApi.sendOtp(email);
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.verifyOtp(email, code);
      await fetchUser();
      const { data } = await consentApi.status();
      if (!data.accepted) setShowConsent(true);
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await authApi.sendOtp(email);
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      setError('');
      otpRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const handleGoogleSSO = () => {
    window.location.href = `${import.meta.env.VITE_APP_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex font-['Inter']">
      <style>{`
        @keyframes fadeInLeft  { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeInRight { from{opacity:0;transform:translateX(30px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes fadeInUp    { from{opacity:0;transform:translateY(20px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes shake       { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>

      {showConsent && <ConsentModal onAccepted={() => navigate('/dashboard')} />}

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12"
        style={{
          background: "linear-gradient(160deg, rgba(29,43,75,0.92), rgba(63,81,181,0.85)), url('/images/NU-building.jpg') center/cover no-repeat",
          animation: 'fadeInLeft 0.8s ease',
        }}>
        <div className="flex items-center gap-3">
          <img src="/images/NU_logo.png" alt="NU Lipa" className="h-12 object-contain" />
          <div>
            <p className="text-white font-black text-sm uppercase tracking-widest m-0">Sinag-Bughaw</p>
            <p className="text-[#fdb813] text-[10px] tracking-[2px] uppercase m-0">Digital Yearbook</p>
          </div>
        </div>

        <div>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/10"
            style={{ animation: 'float 4s ease-in-out infinite' }}>
            <i className="fas fa-book-open text-[#fdb813] text-4xl mb-4 block" />
            <h2 className="text-white text-2xl font-black mb-3 leading-tight">
              Your Legacy,<br />Digitally Preserved.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed m-0">
              Connect with fellow pioneers, explore memories, and celebrate your journey at National University Lipa.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '12,500+', label: 'Graduates' },
              { value: '35+',     label: 'Programs'  },
              { value: '50k+',    label: 'Photos'    },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                <p className="text-[#fdb813] font-black text-xl m-0">{value}</p>
                <p className="text-white/60 text-xs m-0 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">© 2026 National University Lipa · Sinag-Bughaw Project</p>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-20 bg-slate-50"
        style={{ animation: 'fadeInRight 0.8s ease' }}>

        {step === 'form' ? (
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#1d2b4b] text-sm font-semibold no-underline transition mb-8 group">
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-[#1d2b4b] group-hover:text-white transition">
              <i className="fas fa-arrow-left text-xs" />
            </div>
            Back to Home
          </Link>
        ) : (
          <button onClick={() => { setStep('form'); setError(''); setOtp(['','','','','','']); }}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#1d2b4b] text-sm font-semibold transition mb-8 group w-fit">
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-[#1d2b4b] group-hover:text-white transition">
              <i className="fas fa-arrow-left text-xs" />
            </div>
            Back
          </button>
        )}

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <img src="/images/NU_logo.png" alt="NU Lipa" className="h-10 object-contain" />
          <div>
            <p className="text-[#1d2b4b] font-black text-xs uppercase tracking-widest m-0">Sinag-Bughaw</p>
            <p className="text-[#fdb813] text-[9px] tracking-[2px] uppercase m-0">Digital Yearbook</p>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">

          {/* STEP 1: Login Form */}
          {step === 'form' && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#3f51b5] flex items-center justify-center text-2xl mb-6 shadow-sm">
                <i className="fas fa-lock" />
              </div>
              <h1 className="text-3xl font-black text-[#1d2b4b] mb-1">Welcome Back</h1>
              <p className="text-slate-400 text-sm mb-8">Enter your credentials to access your account.</p>

              {error && (
                <div className="flex items-center gap-3 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-xl px-4 py-3 text-sm mb-6"
                  style={{ animation: 'shake 0.4s ease-in-out' }}>
                  <i className="fas fa-exclamation-circle shrink-0" /> {error}
                </div>
              )}

              <button onClick={handleGoogleSSO}
                className="w-full flex items-center justify-center gap-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl transition shadow-sm mb-5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-slate-400 text-xs">or sign in with email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <i className="far fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required autoFocus placeholder="student@nu-lipa.edu.ph"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <Link to="/forgot-password" className="text-[#3f51b5] text-xs font-semibold no-underline hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      required placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#3f51b5] hover:bg-[#303f9f] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200">
                  {loading
                    ? <> Sending OTP... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} /></>
                    : <> Sign In <i className="fas fa-arrow-right text-xs" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#3f51b5] font-bold no-underline hover:underline">Register Now</Link>
              </p>

              <div className="mt-8 flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <i className="fas fa-shield-alt text-amber-500 text-sm mt-0.5 shrink-0" />
                <p className="text-amber-700 text-xs m-0 leading-relaxed">
                  This system is monitored. Unauthorized access attempts are logged and may be reported.
                </p>
              </div>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <div style={{ animation: 'fadeInUp 0.4s ease' }}>
              <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-2xl mb-6 shadow-sm">
                <i className="fas fa-envelope-open-text" />
              </div>
              <h1 className="text-3xl font-black text-[#1d2b4b] mb-1">Check Your Email</h1>
              <p className="text-slate-400 text-sm mb-1">We sent a 6-digit verification code to:</p>
              <p className="text-[#3f51b5] font-bold text-sm mb-8">{email}</p>

              {error && (
                <div className="flex items-center gap-3 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-xl px-4 py-3 text-sm mb-6"
                  style={{ animation: 'shake 0.4s ease-in-out' }}>
                  <i className="fas fa-exclamation-circle shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div className="flex gap-3 justify-center mb-8" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-black bg-white border-2 rounded-xl outline-none transition shadow-sm
                        ${digit ? 'border-[#3f51b5] text-[#1d2b4b]' : 'border-slate-200 text-slate-400'}
                        focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10`}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#3f51b5] hover:bg-[#303f9f] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200">
                  {loading
                    ? <> Verifying... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} /></>
                    : <> Verify & Sign In <i className="fas fa-check text-xs" /></>}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-slate-400 text-sm mb-2">Didn't receive the code?</p>
                {resendTimer > 0
                  ? <p className="text-slate-400 text-sm">Resend in <span className="font-bold text-[#3f51b5]">{resendTimer}s</span></p>
                  : <button onClick={handleResend} className="text-[#3f51b5] font-bold text-sm hover:underline">Resend Code</button>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}