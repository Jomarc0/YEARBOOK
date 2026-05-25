import { useEffect, useState } from 'react';
import { announcementsApi } from '@/api/yearbook.api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const TYPE_STYLES = {
  event:       { bg: '#eef2ff', color: '#3f51b5', icon: 'fa-calendar',     label: 'Event'       },
  reminder:    { bg: '#fffbeb', color: '#d97706', icon: 'fa-bell',         label: 'Reminder'    },
  urgent:      { bg: '#fef2f2', color: '#dc2626', icon: 'fa-exclamation',  label: 'Urgent'      },
  information: { bg: '#ecfdf5', color: '#059669', icon: 'fa-info-circle',  label: 'Information' },
};

export default function AnnouncementsPage() {
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [filter,   setFilter]  = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    announcementsApi.list()
      .then(({ data }) => setItems(data.data ?? data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const types = ['all', 'event', 'reminder', 'urgent', 'information'];
  const filtered = filter === 'all' ? items : items.filter(a => a.type === filter);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ann-card { animation: fadeInUp 0.4s ease forwards; opacity: 0; transition: box-shadow 0.3s; }
        .ann-card:hover { box-shadow: 0 20px 40px rgba(29,43,75,0.08) !important; }
      `}</style>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #3f51b5 100%)', padding: '90px 8% 120px', borderRadius: '0 0 60px 60px' }}>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          <span style={{ color: 'var(--nu-yellow)' }}>Announcements</span>
        </h1>
        <p className="font-light mx-auto" style={{ opacity: 0.8, fontSize: '1rem', maxWidth: '500px' }}>
          Stay updated with the latest news, events, and reminders from NU Lipa.
        </p>
      </header>

      {/* Filter Chips */}
      <div className="flex justify-center gap-3 flex-wrap px-8"
        style={{ paddingTop: '40px', paddingBottom: '20px', marginTop: '-50px', position: 'relative', zIndex: 20 }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="font-bold text-sm cursor-pointer border-none transition-all capitalize"
            style={{
              padding: '10px 22px', borderRadius: '14px',
              background: filter === t ? 'var(--nu-blue-bright)' : 'white',
              color: filter === t ? 'white' : 'var(--nu-blue)',
              transform: filter === t ? 'scale(1.08)' : 'none',
              boxShadow: filter === t ? '0 8px 20px rgba(63,81,181,0.25)' : '0 4px 15px rgba(0,0,0,0.05)',
            }}>
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {/* List */}
      <main style={{ padding: '20px 8% 80px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 rounded-full border-4 mx-auto mb-4"
              style={{ borderColor: 'rgba(63,81,181,0.2)', borderTopColor: '#3f51b5', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8' }}>Loading announcements...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white" style={{ borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <i className="fas fa-bell-slash text-6xl mb-5 block" style={{ color: 'rgba(29,43,75,0.06)' }} />
            <h3 className="font-extrabold text-xl mb-2" style={{ color: 'var(--nu-blue)' }}>No Announcements</h3>
            <p style={{ color: '#94a3b8' }}>Check back later for updates.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map((ann, i) => {
              const st = TYPE_STYLES[ann.type] ?? TYPE_STYLES.information;
              const isOpen = expanded === ann.id;
              return (
                <div key={ann.id} className="ann-card bg-white"
                  style={{ borderRadius: '20px', boxShadow: '0 8px 25px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)', overflow: 'hidden', animationDelay: `${i * 0.05}s` }}>

                  <div className="flex items-start gap-4 cursor-pointer"
                    style={{ padding: '24px 28px' }}
                    onClick={() => setExpanded(isOpen ? null : ann.id)}>

                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: st.bg, color: st.color }}>
                      <i className={`fas ${st.icon}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="font-bold" style={{ fontSize: '1rem', color: 'var(--nu-blue)' }}>
                          {ann.title}
                        </h4>
                        <span className="font-bold text-xs px-3 py-1 rounded-xl flex-shrink-0"
                          style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>
                        <i className="fas fa-calendar mr-1" />
                        {new Date(ann.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {ann.posted_by && <span className="ml-3"><i className="fas fa-user mr-1" />{ann.posted_by}</span>}
                      </p>
                      {!isOpen && ann.body && (
                        <p className="text-sm mt-2" style={{ color: '#64748b', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {ann.body}
                        </p>
                      )}
                    </div>

                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-sm flex-shrink-0`} style={{ color: '#94a3b8', marginTop: '4px' }} />
                  </div>

                  {isOpen && ann.body && (
                    <div style={{ padding: '0 28px 24px', borderTop: '1px solid #f1f5f9' }}>
                      <p className="text-sm leading-relaxed mt-5" style={{ color: '#475569', lineHeight: 1.8 }}>
                        {ann.body}
                      </p>
                      {ann.link && (
                        <a href={ann.link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-bold no-underline mt-4 transition-all text-sm"
                          style={{ color: 'var(--nu-blue-bright)' }}>
                          <i className="fas fa-external-link-alt" /> Learn More
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}