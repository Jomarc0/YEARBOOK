import { useState } from 'react';
import { studentsApi } from '@/api/student.api';

export default function SettingsModal({ onClose, showToast }) {
  const [tab, setTab]               = useState('password');
  const [loading, setLoading]       = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pwForm, setPwForm] = useState({
    current_password:      '',
    password:              '',
    password_confirmation: '',
  });
  const [pwErrors, setPwErrors] = useState({});

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!pwForm.current_password)
      errs.current_password = 'Current password is required.';
    if (pwForm.password.length < 8)
      errs.password = 'New password must be at least 8 characters.';
    else if (!/[0-9]/.test(pwForm.password))
      errs.password = 'New password must contain at least one number.';
    if (pwForm.password !== pwForm.password_confirmation)
      errs.password_confirmation = 'Passwords do not match.';
    return errs;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setLoading(true);
    setPwErrors({});
    try {
      await studentsApi.updatePassword(pwForm);
      showToast('Password changed successfully!');
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      onClose();
    } catch (err) {
      const apiErrors = err.response?.data?.errors || {};
      const apiMsg    = err.response?.data?.message || 'Failed to change password.';
      setPwErrors(Object.keys(apiErrors).length ? apiErrors : { general: apiMsg });
    } finally {
      setLoading(false);
    }
  };

  // ── Reusable password input ───────────────────────────────────────────────
  const PwInput = ({ label, field, show, onToggle }) => (
    <div>
      <label className="block text-xs font-bold text-[#1d2b4b] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={pwForm[field]}
          onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
          placeholder={`Enter ${label.toLowerCase()}`}
          className={`w-full px-4 py-2.5 pr-11 border-2 rounded-xl text-sm outline-none transition
            bg-slate-50 text-[#1d2b4b] focus:ring-4 focus:ring-[#3f51b5]/10
            ${pwErrors[field] ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-[#3f51b5]'}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3f51b5] transition"
        >
          <i className={`fas fa-${show ? 'eye-slash' : 'eye'} text-sm`} />
        </button>
      </div>
      {pwErrors[field] && (
        <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1">
          <i className="fas fa-circle-exclamation text-[10px]" /> {pwErrors[field]}
        </p>
      )}
    </div>
  );

  const tabs = [
    { key: 'password', label: 'Password',  icon: 'lock' },
    { key: 'privacy',  label: 'Privacy',   icon: 'shield-alt' },
    { key: 'about',    label: 'About',     icon: 'info-circle' },
  ];

  return (
    // ── Backdrop ─────────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', animation: 'fadeIn .2s ease' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes fadeIn  { from{opacity:0}              to{opacity:1}              }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Modal Box ──────────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'slideUp .25s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1d2b4b] flex items-center justify-center">
              <i className="fas fa-cog text-white text-xs" />
            </div>
            <h2 className="font-black text-[#1d2b4b] text-base">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 gap-1 pt-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition border-b-2 -mb-px
                ${tab === t.key
                  ? 'border-[#3f51b5] text-[#3f51b5]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <i className={`fas fa-${t.icon} text-[11px]`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {/* ── Password Tab ──────────────────────────────────────────────── */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <p className="text-xs text-slate-400 mb-1">
                Use a strong password with letters and numbers.
              </p>

              {pwErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-xs flex items-center gap-2">
                  <i className="fas fa-triangle-exclamation" /> {pwErrors.general}
                </div>
              )}

              <PwInput
                label="Current Password"
                field="current_password"
                show={showCurrent}
                onToggle={() => setShowCurrent((p) => !p)}
              />
              <PwInput
                label="New Password"
                field="password"
                show={showNew}
                onToggle={() => setShowNew((p) => !p)}
              />
              <PwInput
                label="Confirm New Password"
                field="password_confirmation"
                show={showConfirm}
                onToggle={() => setShowConfirm((p) => !p)}
              />

              {/* Password strength hint */}
              {pwForm.password && (
                <div className="space-y-1">
                  {[
                    { label: 'At least 8 characters', ok: pwForm.password.length >= 8 },
                    { label: 'Contains a number',     ok: /[0-9]/.test(pwForm.password) },
                    { label: 'Contains a letter',     ok: /[a-zA-Z]/.test(pwForm.password) },
                  ].map(({ label, ok }) => (
                    <p key={label} className={`text-[11px] flex items-center gap-1.5 ${ok ? 'text-green-500' : 'text-slate-400'}`}>
                      <i className={`fas fa-${ok ? 'check-circle' : 'circle'} text-[10px]`} /> {label}
                    </p>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#1d2b4b] hover:bg-[#162038] text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin" /> Saving...</>
                  : <><i className="fas fa-lock" /> Change Password</>}
              </button>
            </form>
          )}

          {/* ── Privacy Tab ───────────────────────────────────────────────── */}
          {tab === 'privacy' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Control who can see your profile information.</p>
              {[
                { label: 'Show profile in directory', desc: 'Your profile appears in the student directory.' },
                { label: 'Allow photo tagging',       desc: 'Other students can tag you in photos.'         },
                { label: 'Show academic info',        desc: 'Course and year level visible to others.'      },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-[#1d2b4b]">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-checked:bg-[#3f51b5] rounded-full transition peer-focus:ring-2 peer-focus:ring-[#3f51b5]/20" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-4 shadow" />
                  </label>
                </div>
              ))}
              <p className="text-[10px] text-slate-300 text-center pt-1">
                Privacy settings sync with the next page load.
              </p>
            </div>
          )}

          {/* ── About Tab ─────────────────────────────────────────────────── */}
          {tab === 'about' && (
            <div className="space-y-3 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-[#1d2b4b] flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-book-open text-[#fdb813] text-2xl" />
              </div>
              <h3 className="font-black text-[#1d2b4b] text-base">Sinag-Bughaw</h3>
              <p className="text-xs text-slate-400">Digital Yearbook System</p>
              <p className="text-[11px] text-slate-400">NU Lipa &bull; Capstone Project 2026</p>
              <div className="border-t border-slate-100 pt-3 space-y-1">
                {[
                  ['Version',   '1.0.0'],
                  ['Platform',  'Laravel 12 + React.js'],
                  ['Database',  'MySQL'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs px-2">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-bold text-[#1d2b4b]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}