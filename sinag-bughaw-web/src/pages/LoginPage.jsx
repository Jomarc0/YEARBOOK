import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { consentApi } from '../services/api';
import ConsentModal from '../components/ConsentModal';

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [showConsent, setShowConsent] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);

      //  Check if user has accepted the privacy policy 
      const { data } = await consentApi.status();
      if (!data.accepted) {
        setShowConsent(true);      
      } else {
        navigate('/dashboard');   
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-['Inter']">
      <style>{`
        @keyframes fadeInLeft  { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeInRight { from{opacity:0;transform:translateX(30px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes shake       { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>

      {/* ── Consent Modal — shown if user hasn't accepted yet ──────────────── */}
      {showConsent && (
        <ConsentModal onAccepted={() => navigate('/dashboard')} />
      )}

      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12"
        style={{
          background: "linear-gradient(160deg, rgba(29,43,75,0.92), rgba(63,81,181,0.85)), url('/images/NU-building.jpg') center/cover no-repeat",
          animation: 'fadeInLeft 0.8s ease',
        }}
      >
        <div className="flex items-center gap-3">
          <img src="/images/NU_logo.png" alt="NU Lipa" className="h-12 object-contain" />
          <div>
            <p className="text-white font-black text-sm uppercase tracking-widest m-0">Sinag-Bughaw</p>
            <p className="text-[#fdb813] text-[10px] tracking-[2px] uppercase m-0">Digital Yearbook</p>
          </div>
        </div>

        <div>
          <div
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/10"
            style={{ animation: 'float 4s ease-in-out infinite' }}
          >
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

        <p className="text-white/40 text-xs">
          © 2026 National University Lipa · Sinag-Bughaw Project
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-20 bg-slate-50"
        style={{ animation: 'fadeInRight 0.8s ease' }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-[#1d2b4b] text-sm font-semibold no-underline transition mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-[#1d2b4b] group-hover:text-white transition">
            <i className="fas fa-arrow-left text-xs" />
          </div>
          Back to Home
        </Link>

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <img src="/images/NU_logo.png" alt="NU Lipa" className="h-10 object-contain" />
          <div>
            <p className="text-[#1d2b4b] font-black text-xs uppercase tracking-widest m-0">Sinag-Bughaw</p>
            <p className="text-[#fdb813] text-[9px] tracking-[2px] uppercase m-0">Digital Yearbook</p>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">

          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#3f51b5] flex items-center justify-center text-2xl mb-6 shadow-sm">
            <i className="fas fa-lock" />
          </div>

          <h1 className="text-3xl font-black text-[#1d2b4b] mb-1">Welcome Back</h1>
          <p className="text-slate-400 text-sm mb-8">
            Enter your credentials to access your account.
          </p>

          {error && (
            <div
              className="flex items-center gap-3 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-xl px-4 py-3 text-sm mb-6"
              style={{ animation: 'shake 0.4s ease-in-out' }}
            >
              <i className="fas fa-exclamation-circle shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <i className="far fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required autoFocus placeholder="student@nu-lipa.edu.ph"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[#3f51b5] text-xs font-semibold cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#3f51b5] hover:bg-[#303f9f] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 mt-2"
            >
              {loading ? (
                <>
                  Signing in...
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    style={{ animation: 'spin 0.8s linear infinite' }} />
                </>
              ) : (
                <>Sign In <i className="fas fa-arrow-right text-xs" /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#3f51b5] font-bold no-underline hover:underline">
              Register Now
            </Link>
          </p>

          <div className="mt-8 flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <i className="fas fa-shield-alt text-amber-500 text-sm mt-0.5 shrink-0" />
            <p className="text-amber-700 text-xs m-0 leading-relaxed">
              This system is monitored. Unauthorized access attempts are logged and may be reported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}