import { useState } from 'react';
import { consentApi } from '@/api/payment.api';

export default function ConsentModal({ onAccepted }) {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleAccept = async () => {
    if (!checked) return;
    setLoading(true);
    try {
      await consentApi.accept('1.0');
      onAccepted();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-[#0e1628]/75 backdrop-blur-md animate-[fadeIn_0.2s_ease]"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Privacy Policy Agreement">
        <div className="bg-white w-full max-w-[500px] rounded-[26px] overflow-hidden
                        shadow-[0_32px_80px_rgba(0,0,0,0.28)] animate-[slideUp_0.35s_cubic-bezier(0.22,1,0.36,1)]">

          {/* Header */}
          <div className="bg-gradient-to-br from-[#1d2b4b] via-[#263456] to-[#3f51b5] px-8 pt-9 pb-8 text-center">
            {/* Shield icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#fdb813]/15 border-2 border-[#fdb813]/25 flex items-center justify-center mx-auto mb-5">
              <i className="fas fa-shield-alt text-[#fdb813] text-2xl" aria-hidden="true" />
            </div>
            <h2 className="text-white font-extrabold text-2xl tracking-tight mb-1.5">Privacy Agreement</h2>
            <p className="text-white/55 text-xs leading-relaxed">
              Republic Act No. 10173 — Data Privacy Act of 2012
            </p>
          </div>

          {/* Body */}
          <div className="px-7 pt-6 pb-7">

            {/* Scrollable policy text */}
            <div className="overflow-y-auto max-h-[210px] bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 mb-5 text-xs text-slate-500 leading-[1.8]
                            [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <p className="font-bold text-[#1d2b4b] mb-3">Sinag-Bughaw Digital Yearbook System</p>
              <p className="mb-3">
                By using this system, you agree that <strong>National University Lipa</strong> may collect and process your personal information —
                including your name, photograph, course, and academic details — for the purpose of the digital yearbook.
              </p>
              <p className="mb-3">
                Your data will be stored securely and accessible only to authorized platform users.
                You have the right to access, correct, or request deletion of your personal data at any time by contacting the Data Privacy Officer.
              </p>
              <p className="mb-3">
                This system complies fully with <strong>Republic Act No. 10173</strong> (Data Privacy Act of 2012) and the National Privacy Commission's implementing rules.
              </p>
              <p>
                Participation is voluntary. Refusing consent means your profile will not appear in the yearbook directory,
                but you may still access other platform features.
              </p>
            </div>

            {/* Checkbox */}
            <label className={`flex items-start gap-3.5 cursor-pointer p-4 rounded-xl border-2 transition-all mb-5
              ${checked ? 'bg-indigo-50 border-[#3f51b5]/40' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#3f51b5] cursor-pointer"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I have read and understood the Privacy Policy. I consent to the collection and processing of my personal data
                for the <strong className="text-[#1d2b4b]">Sinag-Bughaw Digital Yearbook</strong> under RA 10173.
              </span>
            </label>

            {/* Accept button */}
            <button
              onClick={handleAccept}
              disabled={loading || !checked}
              className={`w-full font-extrabold text-white py-4 rounded-xl transition-all flex items-center justify-center gap-3 text-sm border-none
                ${!checked
                  ? 'bg-slate-300 cursor-not-allowed'
                  : loading
                    ? 'bg-[#3f51b5] cursor-not-allowed'
                    : 'bg-[#1d2b4b] hover:bg-[#162038] cursor-pointer shadow-lg shadow-[#1d2b4b]/20'
                }`}
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-[spin_0.7s_linear_infinite]" /> Processing…</>
                : <><i className="fas fa-check-circle" aria-hidden="true" /> I Accept the Privacy Policy</>
              }
            </button>

            {/* Trust note */}
            <p className="text-center text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1.5">
              <i className="fas fa-lock text-slate-300" aria-hidden="true" />
              Your data is protected and will never be sold to third parties.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}