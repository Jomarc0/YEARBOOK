import { useState } from 'react';
import { consentApi } from '../services/api';

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
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ background: 'rgba(14,22,40,0.75)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease' }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      <div className="bg-white w-full overflow-hidden"
        style={{ maxWidth: '520px', borderRadius: '28px', boxShadow: '0 30px 80px rgba(0,0,0,0.25)', animation: 'slideUp 0.35s cubic-bezier(0.22,1,0.36,1)' }}>

        {/* Header */}
        <div className="text-white text-center" style={{ background: 'linear-gradient(135deg, #1d2b4b, #3f51b5)', padding: '35px 30px 30px' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(253,184,19,0.15)', border: '2px solid rgba(253,184,19,0.3)' }}>
            <i className="fas fa-shield-alt" style={{ color: 'var(--nu-yellow)', fontSize: '1.5rem' }} />
          </div>
          <h2 className="font-extrabold mb-2" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
            Privacy Policy Agreement
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
            Republic Act No. 10173 — Data Privacy Act of 2012
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '30px' }}>
          <div className="overflow-y-auto text-sm leading-relaxed mb-6"
            style={{ maxHeight: '220px', padding: '20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#475569', lineHeight: 1.8 }}>
            <p className="font-bold mb-3" style={{ color: 'var(--nu-blue)' }}>Sinag-Bughaw Digital Yearbook System</p>
            <p className="mb-3">
              By using this system, you agree that <strong>National University Lipa</strong> may collect and process your personal information
              including your name, photograph, course, and academic details for the purpose of the digital yearbook.
            </p>
            <p className="mb-3">
              Your data will be stored securely and will only be accessible to authorized users of the Sinag-Bughaw platform.
              You have the right to access, correct, or request deletion of your personal data at any time by contacting the Data Privacy Officer.
            </p>
            <p className="mb-3">
              This system is fully compliant with <strong>Republic Act No. 10173</strong> (Data Privacy Act of 2012) and the National Privacy
              Commission's implementing rules and regulations.
            </p>
            <p>
              Your participation is voluntary. Refusing consent means your profile will not appear in the yearbook directory,
              but you may still access other features of the platform.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 rounded-xl transition-all"
            style={{ background: checked ? '#eef2ff' : '#f8fafc', border: `2px solid ${checked ? 'var(--nu-blue-bright)' : '#e2e8f0'}` }}>
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
              className="mt-1 w-4 h-4 flex-shrink-0 accent-[#3f51b5]" />
            <span className="text-sm leading-relaxed" style={{ color: '#475569' }}>
              I have read and understood the Privacy Policy. I consent to the collection and processing of my personal data
              for the <strong>Sinag-Bughaw Digital Yearbook</strong> under RA 10173.
            </span>
          </label>

          {/* Button */}
          <button
            onClick={handleAccept}
            disabled={loading || !checked}
            className="w-full font-extrabold text-white border-none flex items-center justify-center gap-3 transition-all"
            style={{
              padding: '18px',
              borderRadius: '14px',
              fontSize: '1rem',
              background: !checked ? '#94a3b8' : loading ? '#3f51b5' : 'var(--nu-blue)',
              cursor: !checked || loading ? 'not-allowed' : 'pointer',
              boxShadow: checked && !loading ? '0 10px 25px rgba(29,43,75,0.2)' : 'none',
            }}
            onMouseEnter={e => { if (checked && !loading) e.currentTarget.style.background = 'var(--nu-blue-bright)'; }}
            onMouseLeave={e => { if (checked && !loading) e.currentTarget.style.background = 'var(--nu-blue)'; }}>
            {loading
              ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Processing...</>
              : <><i className="fas fa-check-circle" /> I Accept the Privacy Policy</>}
          </button>

          <p className="text-center text-xs mt-4" style={{ color: '#94a3b8' }}>
            <i className="fas fa-lock mr-1" /> Your data is protected and will never be sold to third parties.
          </p>
        </div>
      </div>
    </div>
  );
}