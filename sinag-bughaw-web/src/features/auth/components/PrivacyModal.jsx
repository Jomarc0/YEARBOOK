import { useEffect } from 'react';

export default function PrivacyModal({ isOpen, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!isOpen) return null;

  const sections = [
    {
      icon: 'fa-database',
      title: 'Data We Collect',
      body: 'We collect your name, email address, student ID, course, profile photo, yearbook quote, and any content you upload (voice notes, gallery photos). This data is provided by you during registration and profile setup.',
    },
    {
      icon: 'fa-cogs',
      title: 'How We Use It',
      body: 'Your data is used solely to power the Sinag-Bughaw Digital Yearbook — displaying your profile in the student directory, enabling messaging between users, and generating your yearbook page.',
    },
    {
      icon: 'fa-lock',
      title: 'Data Protection',
      body: 'All data is stored on secure servers with encryption at rest and in transit. Profile photos are stored via Cloudinary with private access controls. Passwords are hashed using bcrypt and are never stored in plain text.',
    },
    {
      icon: 'fa-user-check',
      title: 'Your Rights',
      body: 'Under RA 10173, you have the right to access, correct, erase, and port your data. You may also object to processing or withdraw consent at any time by contacting the Data Privacy Officer at dpo@nu-lipa.edu.ph.',
    },
    {
      icon: 'fa-share-alt',
      title: 'Data Sharing',
      body: 'We do not sell your data to third parties. Data may be shared only with NU Lipa administrators for academic purposes, or with law enforcement when legally required.',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(14,22,40,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}
        onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full overflow-hidden flex flex-col"
          style={{ maxWidth: '580px', maxHeight: '85vh', borderRadius: '28px', boxShadow: '0 30px 80px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }}>

          {/* Header */}
          <div className="text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1d2b4b, #3f51b5)', padding: '30px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(253,184,19,0.15)', border: '1px solid rgba(253,184,19,0.3)' }}>
                  <i className="fas fa-shield-alt" style={{ color: 'var(--nu-yellow)' }} />
                </div>
                <div>
                  <h2 className="font-extrabold" style={{ fontSize: '1.2rem' }}>Privacy Policy</h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem' }}>Republic Act No. 10173 — Data Privacy Act of 2012</p>
                </div>
              </div>
              <button onClick={onClose}
                className="flex items-center justify-center border-none cursor-pointer transition-all"
                style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {/* Content (scrollable) */}
          <div className="overflow-y-auto flex-1" style={{ padding: '24px 28px' }}>
            <p className="text-sm mb-6" style={{ color: '#64748b', lineHeight: 1.7 }}>
              This Privacy Policy explains how <strong>National University Lipa</strong> collects, uses, and protects personal information
              through the <strong>Sinag-Bughaw Digital Yearbook</strong> system, effective January 2026.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sections.map(s => (
                <div key={s.title} className="p-5 rounded-2xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <h4 className="font-bold mb-2 flex items-center gap-2" style={{ fontSize: '0.9rem', color: 'var(--nu-blue)' }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: '#eef2ff', color: 'var(--nu-blue-bright)' }}>
                      <i className={`fas ${s.icon} text-xs`} />
                    </span>
                    {s.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{s.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl" style={{ background: '#eef2ff', border: '1px solid rgba(63,81,181,0.15)' }}>
              <p className="text-xs" style={{ color: '#475569', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--nu-blue)' }}>Last Updated:</strong> January 2026 ·
                <strong style={{ color: 'var(--nu-blue)' }}> Contact:</strong> dpo@nu-lipa.edu.ph ·
                <strong style={{ color: 'var(--nu-blue)' }}> NPC:</strong> privacy.gov.ph
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0" style={{ padding: '20px 28px', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose}
              className="w-full font-bold text-white border-none cursor-pointer transition-all"
              style={{ padding: '14px', borderRadius: '14px', background: 'var(--nu-blue)', fontSize: '0.9rem' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--nu-blue-bright)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--nu-blue)'}>
              <i className="fas fa-check-circle mr-2" /> I Understand — Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}