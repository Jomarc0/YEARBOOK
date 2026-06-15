import { useEffect, useRef, useState } from 'react';
import { voiceNotesApi } from '@/api/messaging.api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Link, useSearchParams } from 'react-router-dom';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function VoiceNotesPage() {
  const [searchParams] = useSearchParams();
  const [tab,      setTab]      = useState('inbox');  // 'inbox' | 'outbox'
  const [notes,    setNotes]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [playing,  setPlaying]  = useState(null);
  const audioRef = useRef({});
  const noteRefs = useRef({});
  const targetNote = searchParams.get('note');

  const load = (activeTab) => {
    setLoading(true);
    const req = activeTab === 'inbox' ? voiceNotesApi.inbox() : voiceNotesApi.outbox();
    req.then(({ data }) => setNotes(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(tab); }, [tab]);

  useEffect(() => {
    if (!targetNote || loading || notes.length === 0) return;
    const timer = window.setTimeout(() => {
      noteRefs.current[targetNote]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [targetNote, loading, notes]);

  const togglePlay = (id, url) => {
    if (playing === id) {
      audioRef.current[id]?.pause();
      setPlaying(null);
    } else {
      Object.values(audioRef.current).forEach(a => a?.pause());
      setPlaying(id);
      if (!audioRef.current[id]) {
        audioRef.current[id] = new Audio(url);
        audioRef.current[id].onended = () => setPlaying(null);
      }
      audioRef.current[id].play();
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const fmtDuration = (s) => s
    ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    : null;

  const statusBadge = (status) => {
    const map = {
      pending:  { bg: '#fff7ed', color: '#c2410c', label: 'Pending approval', icon: 'fa-clock' },
      approved: { bg: '#f0fdf4', color: '#15803d', label: 'Delivered',        icon: 'fa-check-circle' },
      rejected: { bg: '#fef2f2', color: '#b91c1c', label: 'Not approved',     icon: 'fa-times-circle' },
    };
    const s = map[status];
    if (!s) return null;
    return (
      <span style={{
        background: s.bg, color: s.color,
        fontSize: '0.7rem', fontWeight: 700,
        padding: '3px 9px', borderRadius: '20px',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
      }}>
        <i className={`fas ${s.icon}`} style={{ fontSize: '0.65rem' }} />
        {s.label}
      </span>
    );
  };

  const emptyMsg = {
    inbox:  { icon: 'fa-inbox',    title: 'No voice memories yet', sub: 'When classmates send you a voice memory it will appear here.' },
    outbox: { icon: 'fa-paper-plane', title: 'Nothing sent yet',   sub: 'Visit a classmate\'s profile to record and send them a voice memory.' },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center" style={{
        background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)',
        padding: '80px 8% 120px', borderRadius: '0 0 60px 60px',
      }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', opacity: 0.6, textTransform: 'uppercase', marginBottom: '12px' }}>Memories</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-2px', margin: '0 0 12px' }}>
          Voice <span style={{ color: '#fdb813' }}>Memories</span>
        </h1>
        <p style={{ opacity: 0.75, fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
          Audio dedications from your classmates — approved and preserved forever.
        </p>
      </header>

      <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '60px 20px 100px', width: '100%' }}>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: '#fff', borderRadius: '18px',
          boxShadow: '0 8px 24px rgba(29,43,75,0.07)',
          padding: '6px', marginBottom: '28px',
        }}>
          {[
            { key: 'inbox',  icon: 'fa-inbox',       label: 'Received' },
            { key: 'outbox', icon: 'fa-paper-plane',  label: 'Sent' },
          ].map(({ key, icon, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === key ? '#1d2b4b' : 'transparent',
              color:      tab === key ? '#fff'    : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <i className={`fas ${icon}`} />
              {label}
            </button>
          ))}
        </div>

        {/* CTA for outbox guide user to a profile */}
        {tab === 'outbox' && !loading && (
          <div style={{
            background: 'linear-gradient(135deg, #1d2b4b, #2a3d66)',
            borderRadius: '18px', padding: '20px 24px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 4px' }}>
                Send a voice memory to a classmate
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0 }}>
                Go to their profile and click "Send Voice Memory"
              </p>
            </div>
            <Link to="/directory" style={{
              background: '#fdb813', color: '#1d2b4b', borderRadius: '12px',
              padding: '10px 18px', fontWeight: 800, fontSize: '0.82rem',
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Find Classmates
            </Link>
          </div>
        )}

        {/* List */}
        {loading ? (
          <LoadingSkeleton variant="row" count={4} gridClassName="space-y-3" />
        ) : notes.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '60px 32px', textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
          }}>
            <i className={`fas ${emptyMsg[tab].icon}`} style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: '16px', display: 'block' }} />
            <h3 style={{ color: '#1d2b4b', fontWeight: 800, margin: '0 0 8px' }}>{emptyMsg[tab].title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{emptyMsg[tab].sub}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notes.map(note => {
              const other = tab === 'inbox' ? note.sender : note.recipient;
              return (
                <div key={note.id} ref={(el) => { noteRefs.current[note.id] = el; }} style={{
                  background: '#fff', borderRadius: '20px', padding: '18px 22px',
                  boxShadow: String(note.id) === String(targetNote)
                    ? '0 0 0 3px rgba(253,184,19,0.35), 0 12px 30px rgba(29,43,75,0.08)'
                    : '0 4px 16px rgba(0,0,0,0.04)',
                  border: String(note.id) === String(targetNote) ? '1px solid rgba(253,184,19,0.7)' : '1px solid rgba(0,0,0,0.02)',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  opacity: note.status === 'rejected' ? 0.6 : 1,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(29,43,75,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                    background: '#1d2b4b', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {other?.avatar_url
                      ? <img src={other.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ color: '#fdb813', fontWeight: 800 }}>{other?.name?.[0] ?? '?'}</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <p style={{ color: '#1d2b4b', fontWeight: 700, fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {note.title}
                      </p>
                      {tab === 'outbox' && statusBadge(note.status)}
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                      {tab === 'inbox' ? 'From' : 'To'}{' '}
                      <strong style={{ color: '#64748b' }}>{other?.name}</strong>
                      {' · '}{fmtDate(note.created_at)}
                      {fmtDuration(note.duration_seconds) && ` · ${fmtDuration(note.duration_seconds)}`}
                    </p>
                    {/* Waveform decoration */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '6px' }}>
                      {Array.from({ length: 20 }, (_, i) => (
                        <div key={i} style={{
                          width: '3px', borderRadius: '2px',
                          height: `${6 + Math.sin(i * 0.9) * 5}px`,
                          background: playing === note.id ? '#fdb813' : '#e2e8f0',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* Play only for approved/inbox */}
                  {(tab === 'inbox' || note.status === 'approved') && (
                    <button onClick={() => togglePlay(note.id, note.audio_url)} style={{
                      width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                      border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s',
                      background: playing === note.id ? '#fdb813' : '#1d2b4b',
                      color:      playing === note.id ? '#1d2b4b' : '#fdb813',
                    }}>
                      <i className={`fas fa-${playing === note.id ? 'pause' : 'play'}`} />
                    </button>
                  )}

                  {/* Pending icon not playable yet */}
                  {tab === 'outbox' && note.status === 'pending' && (
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                      background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="fas fa-clock" style={{ color: '#c2410c', fontSize: '1rem' }} />
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
