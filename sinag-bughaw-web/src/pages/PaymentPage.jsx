import { useEffect, useState } from 'react';
import { paymentsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PaymentPage() {
  const { user }          = useAuth();
  const [plan,    setPlan]    = useState('monthly');
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    paymentsApi.subscriptionStatus()
      .then(({ data }) => setStatus(data))
      .finally(()      => setLoading(false));
  }, []);

  const plans = {
    monthly: { label: 'Monthly Plan', price: '₱199', period: '/month',  savings: null,       amount: 19900  },
    yearly:  { label: 'Yearly Plan',  price: '₱1,499', period: '/year', savings: 'Save 37%', amount: 149900 },
  };

  const features = [
    { icon: 'fa-user-circle',    text: 'Full profile viewing for all students' },
    { icon: 'fa-images',         text: 'Premium media gallery access'          },
    { icon: 'fa-comment-dots',   text: 'Unlimited direct messaging'            },
    { icon: 'fa-file-pdf',       text: 'Certificate & profile PDF downloads'   },
    { icon: 'fa-face-smile',     text: 'Priority AI face search'               },
    { icon: 'fa-cloud',          text: 'Extended cloud storage quota'          },
  ];

const handleSubscribe = async () => {
    setPaying(true);
    setError('');
    try {
        const { data } = await paymentsApi.createIntent(plan);
        if (data.checkout_url) {
            window.location.href = data.checkout_url;
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
        setPaying(false);
    }
};

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '80px 8% 120px', borderRadius: '0 0 60px 60px' }}>
        <div className="inline-flex items-center gap-2 font-bold text-xs px-4 py-2 rounded-full mb-5"
          style={{ background: 'rgba(253,184,19,0.15)', color: '#fdb813', border: '1px solid rgba(253,184,19,0.3)' }}>
          <i className="fas fa-star" /> SINAG-BUGHAW PREMIUM
        </div>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Unlock the Full <span style={{ color: '#fdb813' }}>Experience</span>
        </h1>
        <p className="font-light mx-auto opacity-80" style={{ fontSize: '1rem', maxWidth: '550px' }}>
          Get full access to the digital yearbook — profiles, gallery, messaging, and more.
        </p>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px 100px', width: '100%' }}>

        {/* Status Banner */}
        {!loading && status?.is_premium && (
          <div className="text-center mb-8 font-bold"
            style={{ background: 'linear-gradient(135deg, #fdb813, #f59e0b)', color: '#1d2b4b', padding: '20px', borderRadius: '20px' }}>
            <i className="fas fa-crown text-xl mr-2" />
            Premium Active · {status.plan} plan · Expires {new Date(status.expires_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'start' }}>

          {/* Left: Features */}
          <div>
            <h2 className="font-extrabold text-xl mb-6" style={{ color: '#1d2b4b' }}>What You Get</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {features.map(f => (
                <div key={f.text} className="flex items-center gap-4 bg-white"
                  style={{ padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#eef2ff', color: '#3f51b5' }}>
                    <i className={`fas ${f.icon} text-sm`} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#1d2b4b' }}>{f.text}</p>
                  <i className="fas fa-check ml-auto text-sm" style={{ color: '#22c55e' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Plans */}
          <div className="bg-white" style={{ borderRadius: '28px', padding: '35px', boxShadow: '0 20px 40px rgba(29,43,75,0.1)' }}>
            <h2 className="font-extrabold text-xl mb-6" style={{ color: '#1d2b4b' }}>Choose a Plan</h2>

            {/* Plan buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {Object.entries(plans).map(([key, p]) => (
                <button key={key} onClick={() => setPlan(key)}
                  className="text-left border-none cursor-pointer transition-all"
                  style={{
                    padding: '20px 24px', borderRadius: '18px',
                    border: `2px solid ${plan === key ? '#fdb813' : '#e2e8f0'}`,
                    background: plan === key ? 'linear-gradient(135deg, #fffbeb, #fef9c3)' : 'white',
                    transform: plan === key ? 'scale(1.02)' : 'none',
                  }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-base" style={{ color: '#1d2b4b' }}>{p.label}</div>
                      <div className="text-sm mt-1" style={{ color: '#64748b' }}>
                        <span className="font-black text-2xl" style={{ color: plan === key ? '#fdb813' : '#1d2b4b' }}>{p.price}</span>
                        {p.period}
                      </div>
                    </div>
                    <div>
                      {p.savings && (
                        <span className="font-bold text-xs px-2 py-1 rounded-full"
                          style={{ background: '#dcfce7', color: '#16a34a' }}>{p.savings}</span>
                      )}
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-2 ml-auto"
                        style={{ borderColor: plan === key ? '#fdb813' : '#e2e8f0', background: plan === key ? '#fdb813' : 'white' }}>
                        {plan === key && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="text-sm mb-4 p-3 rounded-xl flex items-center gap-2"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}

            <button onClick={handleSubscribe} disabled={paying || status?.is_premium}
              className="w-full font-extrabold border-none cursor-pointer transition-all flex items-center justify-center gap-3"
              style={{
                padding: '18px', borderRadius: '16px', fontSize: '1rem',
                background: status?.is_premium ? '#94a3b8' : '#1d2b4b',
                color: 'white', boxShadow: '0 10px 25px rgba(29,43,75,0.2)',
                cursor: status?.is_premium ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!status?.is_premium && !paying) e.currentTarget.style.background = '#fdb813'; e.currentTarget.style.color = '#1d2b4b'; }}
              onMouseLeave={e => { if (!status?.is_premium && !paying) e.currentTarget.style.background = '#1d2b4b'; e.currentTarget.style.color = 'white'; }}>
              {status?.is_premium
                ? <><i className="fas fa-check-circle" /> Already Premium</>
                : paying
                  ? <><i className="fas fa-spinner fa-spin" /> Processing...</>
                  : <><i className="fas fa-crown" style={{ color: '#fdb813' }} /> Subscribe Now</>}
            </button>

            <div className="flex items-center justify-center gap-4 mt-5">
              {['GCash', 'Maya', 'Visa/MC'].map(m => (
                <span key={m} className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: '#f1f5f9', color: '#64748b' }}>{m}</span>
              ))}
            </div>
            <p className="text-center text-xs mt-3" style={{ color: '#94a3b8' }}>
              <i className="fas fa-shield-alt mr-1" style={{ color: '#3f51b5' }} />
              Secure payments via PayMongo
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}