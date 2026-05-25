import { useState } from 'react';
import { profileSettingsApi } from '@/api/profile.api'; // ← fixed import
import { useAuth } from '@/features/auth/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SettingsPage() {
  const { user }               = useAuth();
  const [visibility, setVis]   = useState(user?.profile_visibility ?? 'public');
  const [motto,      setMotto] = useState(user?.motto ?? '');
  const [toast,      setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const saveVisibility = async () => {
    await profileSettingsApi.updateVisibility(visibility);
    showToast('Visibility saved!');
  };

  const saveMotto = async () => {
    await profileSettingsApi.updateMotto(motto);
    showToast('Motto saved!');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f2f4f7' }}>
      <Navbar />

      {toast && (
        <div className="fixed right-8 font-semibold flex items-center gap-2"
          style={{ top: '100px', background: '#2ecc71', color: 'white', padding: '15px 25px', borderRadius: '12px', zIndex: 2000, boxShadow: '0 10px 30px rgba(46,204,113,0.3)', animation: 'slideIn 0.4s ease forwards' }}>
          <i className="fas fa-check-circle" /> {toast}
        </div>
      )}

      <main style={{ maxWidth: '700px', margin: '60px auto', padding: '0 20px', width: '100%' }}>
        <h1 className="font-extrabold mb-8" style={{ fontSize: '2rem', color: 'var(--nu-blue)' }}>
          <i className="fas fa-cog mr-3" style={{ color: 'var(--nu-blue-bright)' }} />Profile Settings
        </h1>

        {/* Visibility */}
        <div className="bg-white mb-6" style={{ borderRadius: '20px', padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
          <h2 className="font-bold text-lg mb-5" style={{ color: 'var(--nu-blue)' }}>
            <i className="fas fa-eye mr-2" style={{ color: 'var(--nu-yellow)' }} />Profile Visibility
          </h2>
          <div className="space-y-3 mb-6">
            {[
              { v: 'public',      icon: 'fa-globe',          label: 'Public',      desc: 'Anyone can view your profile'          },
              { v: 'alumni_only', icon: 'fa-graduation-cap', label: 'Alumni Only', desc: 'Only logged-in users can view'          },
              { v: 'private',     icon: 'fa-lock',           label: 'Private',     desc: 'Only you can view your profile'         },
            ].map(opt => (
              <button key={opt.v} onClick={() => setVis(opt.v)}
                className="w-full text-left border-none cursor-pointer transition-all"
                style={{ padding: '16px 20px', borderRadius: '14px', border: `2px solid ${visibility === opt.v ? 'var(--nu-blue-bright)' : '#e2e8f0'}`, background: visibility === opt.v ? '#eef2ff' : 'white' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: visibility === opt.v ? 'var(--nu-blue-bright)' : '#f1f5f9', color: visibility === opt.v ? 'white' : '#64748b' }}>
                    <i className={`fas ${opt.icon}`} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--nu-blue)' }}>{opt.label}</div>
                    <div className="text-xs" style={{ color: '#94a3b8' }}>{opt.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={saveVisibility} className="w-full font-bold text-white border-none cursor-pointer transition-all"
            style={{ padding: '16px', borderRadius: '14px', background: 'var(--nu-blue)', fontSize: '0.95rem' }}
            onMouseEnter={e => e.target.style.background = 'var(--nu-blue-bright)'}
            onMouseLeave={e => e.target.style.background = 'var(--nu-blue)'}>
            Save Visibility
          </button>
        </div>

        {/* Motto */}
        <div className="bg-white mb-6" style={{ borderRadius: '20px', padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
          <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--nu-blue)' }}>
            <i className="fas fa-quote-left mr-2" style={{ color: 'var(--nu-yellow)' }} />Personal Motto
          </h2>
          <p className="text-sm mb-5" style={{ color: '#94a3b8' }}>This appears on your yearbook profile.</p>
          <textarea value={motto} onChange={e => setMotto(e.target.value)} maxLength={255} rows={3}
            placeholder="Write your personal motto or yearbook quote..."
            className="w-full resize-none outline-none text-sm mb-4"
            style={{ padding: '14px', border: '2px solid #e2e8f0', borderRadius: '14px', fontFamily: 'inherit', lineHeight: 1.6, transition: '0.3s' }}
            onFocus={e  => { e.target.style.borderColor = 'var(--nu-blue-bright)'; }}
            onBlur={e   => { e.target.style.borderColor = '#e2e8f0'; }} />
          <button onClick={saveMotto} className="w-full font-bold text-white border-none cursor-pointer transition-all"
            style={{ padding: '16px', borderRadius: '14px', background: 'var(--nu-blue)', fontSize: '0.95rem' }}
            onMouseEnter={e => e.target.style.background = 'var(--nu-blue-bright)'}
            onMouseLeave={e => e.target.style.background = 'var(--nu-blue)'}>
            Save Motto
          </button>
        </div>

        {/* Privacy Notice */}
        <div style={{ background: '#f0f4ff', border: '1px solid #dde3f5', borderRadius: '16px', padding: '20px 24px' }}>
          <p className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--nu-blue)' }}>
            <i className="fas fa-shield-alt" style={{ color: 'var(--nu-blue-bright)' }} />Data Privacy Notice
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#6c757d' }}>
            Your data is protected under <strong>Republic Act No. 10173</strong> (Data Privacy Act of 2012).
            Sinag-Bughaw is compliant with NU Lipa's data protection policies. You may request data deletion at any time.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}