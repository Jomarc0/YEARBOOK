import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import ConsentModal from '../components/ConsentModal';

const COURSES = [
  'Bachelor of Science in Computer Science',
  'Bachelor of Science in Information Technology',
  'Bachelor of Science in Civil Engineering',
  'Bachelor of Science in Mechanical Engineering',
  'Bachelor of Science in Nursing',
  'Bachelor of Science in Accountancy',
  'Bachelor of Science in Psychology',
  'Bachelor of Education',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', password_confirmation: '', course: '', student_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        course: form.course,
        student_id: form.student_id,
        consent_accepted: true, 
      };

      const { data } = await authApi.register(payload);
      localStorage.setItem('sb_token', data.token);
      setShowConsent(true);
    } catch (err) {
      const status = err.response?.status;
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message;

      if (status === 422 && errors) {
        setError(Object.values(errors).flat().join(' '));
      } else if (status === 500) {
        setError(message || 'Internal Server Error.');
      } else {
        setError(message || 'Registration failed. Please try again.');
      }
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

      {showConsent && (
        <ConsentModal onAccepted={() => navigate('/dashboard')} />
      )}

      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-2/5 relative flex-col justify-between p-12"
        style={{
          background: "linear-gradient(160deg, rgba(29,43,75,0.92), rgba(63,81,181,0.85)), url('/images/nustud.jpg') center/cover no-repeat",
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
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-6 border border-white/10"
            style={{ animation: 'float 4s ease-in-out infinite' }}
          >
            <i className="fas fa-user-graduate text-[#fdb813] text-4xl mb-4 block" />
            <h2 className="text-white text-2xl font-black mb-3 leading-tight">
              Join the Pioneer<br />Community.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed m-0">
              Create your digital profile and become part of the official NU Lipa Sinag-Bughaw yearbook archive.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: 'user', text: 'Fill in your personal details' },
              { icon: 'id-card', text: 'Enter your student ID' },
              { icon: 'check-circle', text: 'Access your digital yearbook' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-[#fdb813]/20 flex items-center justify-center shrink-0">
                  <i className={`fas fa-${icon} text-[#fdb813] text-xs`} />
                </div>
                <p className="text-white/80 text-xs m-0">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">© 2026 National University Lipa · Sinag-Bughaw Project</p>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="w-full lg:w-3/5 flex flex-col justify-center px-8 sm:px-14 lg:px-16 bg-slate-50 overflow-y-auto py-10"
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

        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <img src="/images/NU_logo.png" alt="NU Lipa" className="h-10 object-contain" />
          <div>
            <p className="text-[#1d2b4b] font-black text-xs uppercase tracking-widest m-0">Sinag-Bughaw</p>
            <p className="text-[#fdb813] text-[9px] tracking-[2px] uppercase m-0">Digital Yearbook</p>
          </div>
        </div>

        <div className="max-w-xl w-full mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#3f51b5] flex items-center justify-center text-2xl mb-5 shadow-sm">
            <i className="fas fa-user-graduate" />
          </div>

          <h1 className="text-3xl font-black text-[#1d2b4b] mb-1">Join the Yearbook</h1>
          <p className="text-slate-400 text-sm mb-7">Create your digital profile for Sinag-Bughaw.</p>

          {error && (
            <div
              className="flex items-center gap-3 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-xl px-4 py-3 text-sm mb-5"
              style={{ animation: 'shake 0.4s ease-in-out' }}
            >
              <i className="fas fa-exclamation-triangle shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'first_name', label: 'First Name', placeholder: 'Juan', icon: 'fa-user' },
                { name: 'last_name', label: 'Last Name', placeholder: 'Dela Cruz', icon: 'fa-user' },
              ].map(({ name, label, placeholder, icon }) => (
                <div key={name}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                  <div className="relative">
                    <i className={`fas ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs`} />
                    <input
                      type="text" name={name} placeholder={placeholder}
                      value={form[name]} onChange={handleChange} required
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <i className="far fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email" name="email" placeholder="student@nu-lipa.edu.ph"
                  value={form.email} onChange={handleChange} required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm"
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'password', label: 'Password', icon: 'fa-lock', placeholder: '••••••••' },
                { name: 'password_confirmation', label: 'Confirm Password', icon: 'fa-shield-alt', placeholder: '••••••••' },
              ].map(({ name, label, icon, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                  <div className="relative">
                    <i className={`fas ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs`} />
                    <input
                      type="password" name={name} placeholder={placeholder}
                      value={form[name]} onChange={handleChange} required
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Course */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course</label>
              <div className="relative">
                <i className="fas fa-graduation-cap absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none" />
                <select
                  name="course" value={form.course} onChange={handleChange}
                  className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm appearance-none cursor-pointer text-slate-700"
                >
                  <option value="" disabled>Select your course...</option>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student ID / Alumni ID</label>
              <div className="relative">
                <i className="fas fa-hashtag absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text" name="student_id" placeholder="202X-XXXX"
                  value={form.student_id} onChange={handleChange} required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#3f51b5] focus:ring-4 focus:ring-[#3f51b5]/10 transition shadow-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#1d2b4b] hover:bg-[#162038] disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg mt-2"
            >
              {loading ? (
                <>
                  Creating Account...
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    style={{ animation: 'spin 0.8s linear infinite' }} />
                </>
              ) : (
                <>Create My Account <i className="fas fa-arrow-right text-xs" /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-400">
            Already part of the community?{' '}
            <Link to="/login" className="text-[#3f51b5] font-bold no-underline hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}