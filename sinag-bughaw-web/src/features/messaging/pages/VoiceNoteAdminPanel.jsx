import { useEffect, useRef, useState } from 'react';
import { voiceNoteAdminApi } from '@/api/messaging.api';

/**
 * VoiceNoteAdminPanel
 * Drop into your AdminController page / admin dashboard section.
 * Shows pending voice notes with approve / reject controls.
 */
export default function VoiceNoteAdminPanel() {
  const [tab,      setTab]      = useState('pending');
  const [notes,    setNotes]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);   // id currently being approved/rejected
  const [rejectId, setRejectId] = useState(null);   // id showing reject reason input
  const [reason,   setReason]   = useState('');
  const [playing,  setPlaying]  = useState(null);
  const audioRef = useRef({});

  const loadStats = () =>
    voiceNoteAdminApi.stats().then(({ data }) => setStats(data));

  const loadNotes = (activeTab) => {
    setLoading(true);
    voiceNoteAdminApi.list(activeTab)
      .then(({ data }) => setNotes(data.data ?? data))
      .finally(()      => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadNotes(tab); }, [tab]);

  const togglePlay = (id, url) => {
    if (playing === id) { audioRef.current[id]?.pause(); setPlaying(null); return; }
    Object.values(audioRef.current).forEach(a => a?.pause());
    setPlaying(id);
    if (!audioRef.current[id]) {
      audioRef.current[id] = new Audio(url);
      audioRef.current[id].onended = () => setPlaying(null);
    }
    audioRef.current[id].play();
  };

  const handleApprove = async (id) => {
    setActing(id);
    try {
      await voiceNoteAdminApi.approve(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      loadStats();
    } finally { setActing(null); }
  };

  const handleReject = async (id) => {
    setActing(id);
    try {
      await voiceNoteAdminApi.reject(id, reason);
      setNotes(prev => prev.filter(n => n.id !== id));
      setRejectId(null);
      setReason('');
      loadStats();
    } finally { setActing(null); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtDur  = (s) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : null;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '860px', margin: '0 auto', padding: '0 0 60px' }}>

      {/* Stats row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Pending',  value: stats.pending,  bg: '#fff7ed', color: '#c2410c' },
            { label: 'Approved', value: stats.approved, bg: '#f0fdf4', color: '#15803d' },
            { label: 'Rejected', value: stats.rejected, bg: '#fef2f2', color: '#b91c1c' },
            { label: 'Total',    value: stats.total,    bg: '#f8fafc', color: '#1d2b4b' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: '14px', padding: '16px 18px',
              border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <p style={{ color: s.color, fontSize: '1.6rem', fontWeight: 800, margin: '0 0 2px' }}>{s.value}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', background: '#fff', borderRadius: '16px',
        padding: '5px', marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
      }}>
        {['pending', 'approved', 'rejected'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
            fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem',
            cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
            background: tab === t ? '#1d2b4b' : 'transparent',
            color:      tab === t ? '#fff'    : '#94a3b8',
          }}>{t}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#3f51b5' }} />
        </div>
      ) : notes.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '48px', textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <i className="fas fa-check-double" style={{ fontSize: '2.5rem', color: '#e2e8f0', marginBottom: '12px', display: 'block' }} />
          <p style={{ color: '#94a3b8', margin: 0, fontWeight: 600 }}>No {tab} voice notes.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notes.map(note => (
            <div key={note.id} style={{
              background: '#fff', borderRadius: '18px', padding: '18px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)',
            }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                {/* Play */}
                <button onClick={() => togglePlay(note.id, note.audio_url)} style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  border: 'none', cursor: 'pointer', fontSize: '0.9rem',
                  background: playing === note.id ? '#fdb813' : '#1d2b4b',
                  color:      playing === note.id ? '#1d2b4b' : '#fdb813',
                }}>
                  <i className={`fas fa-${playing === note.id ? 'pause' : 'play'}`} />
                </button>

                {/* Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#1d2b4b', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.title}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                    <strong style={{ color: '#64748b' }}>{note.sender?.name}</strong>
                    {' → '}
                    <strong style={{ color: '#64748b' }}>{note.recipient?.name}</strong>
                    {' · '}{fmtDate(note.created_at)}
                    {fmtDur(note.duration_seconds) && ` · ${fmtDur(note.duration_seconds)}`}
                  </p>
                </div>

                {/* Actions — only for pending */}
                {tab === 'pending' && rejectId !== note.id && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleApprove(note.id)}
                      disabled={acting === note.id}
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none',
                        background: '#f0fdf4', color: '#15803d',
                        fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      {acting === note.id
                        ? <i className="fas fa-spinner fa-spin" />
                        : <><i className="fas fa-check" /> Approve</>}
                    </button>
                    <button
                      onClick={() => { setRejectId(note.id); setReason(''); }}
                      disabled={acting === note.id}
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none',
                        background: '#fef2f2', color: '#b91c1c',
                        fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      <i className="fas fa-times" /> Reject
                    </button>
                  </div>
                )}

                {/* Reviewed info for non-pending */}
                {tab !== 'pending' && note.reviewer && (
                  <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: 0, flexShrink: 0 }}>
                    by {note.reviewer.name}
                  </p>
                )}
              </div>

              {/* Reject reason input */}
              {rejectId === note.id && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 8px' }}>
                    Reason for rejection (optional — sent to the student):
                  </p>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Contains inappropriate language"
                    rows={2}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1.5px solid #e2e8f0', fontFamily: 'inherit',
                      fontSize: '0.85rem', resize: 'vertical', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleReject(note.id)}
                      disabled={acting === note.id}
                      style={{
                        padding: '9px 20px', borderRadius: '10px', border: 'none',
                        background: '#b91c1c', color: '#fff',
                        fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      }}
                    >
                      {acting === note.id ? <i className="fas fa-spinner fa-spin" /> : 'Confirm Reject'}
                    </button>
                    <button
                      onClick={() => setRejectId(null)}
                      style={{
                        padding: '9px 20px', borderRadius: '10px', border: 'none',
                        background: '#f1f5f9', color: '#64748b',
                        fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Reject reason display */}
              {tab === 'rejected' && note.reject_reason && (
                <div style={{
                  marginTop: '10px', padding: '10px 14px', background: '#fef2f2',
                  borderRadius: '10px', fontSize: '0.8rem', color: '#b91c1c',
                }}>
                  <i className="fas fa-comment-slash" style={{ marginRight: '6px' }} />
                  {note.reject_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}