import { useEffect, useRef, useState } from 'react';
import { voiceNotesApi } from '@/api/messaging.api';
import SendVoiceNoteModal from './SendVoiceNoteModal';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

/**
 * VoiceNotesSection
 * Drop into StudentProfileView.jsx — shows approved notes for that student
 * and a button so the viewer can send one.
 *
 * Props:
 *   profileUser  — { id, name } of the profile being viewed
 *   isOwnProfile — boolean, hides the "Send" button on your own profile
 */
export default function VoiceNotesSection({ profileUser, isOwnProfile }) {
  const [notes,       setNotes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [playing,     setPlaying]     = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const audioRef = useRef({});

  useEffect(() => {
    voiceNotesApi.forProfile(profileUser.id)
      .then(({ data }) => setNotes(data))
      .finally(()      => setLoading(false));
  }, [profileUser.id]);

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

  const fmtDuration = (s) => s
    ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
    : null;

  if (loading) return (
    <LoadingSkeleton variant="row" count={2} gridClassName="space-y-3" />
  );

  return (
    <section id="voice-notes" style={{ marginTop: '32px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(253,184,19,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fas fa-microphone" style={{ color: '#fdb813', fontSize: '0.9rem' }} />
          </div>
          <div>
            <h3 style={{ color: '#1d2b4b', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
              Voice Memories
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
              {notes.length} {notes.length === 1 ? 'memory' : 'memories'}
            </p>
          </div>
        </div>

        {/* Only show send button when viewing someone else's profile */}
        {!isOwnProfile && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#1d2b4b', color: '#fff', border: 'none',
              borderRadius: '12px', padding: '10px 18px',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
            onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}
          >
            <i className="fas fa-microphone" style={{ color: '#fdb813' }} />
            Send Voice Memory
          </button>
        )}
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div style={{
          background: '#f8fafc', borderRadius: '16px', padding: '28px',
          textAlign: 'center', border: '1px dashed #e2e8f0',
        }}>
          <i className="fas fa-microphone-slash" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '10px', display: 'block' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            {isOwnProfile
              ? 'No voice memories yet. Ask your classmates to send you one!'
              : `Be the first to send ${profileUser.name} a voice memory.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notes.map(note => (
            <div key={note.id} style={{
              background: '#fff', borderRadius: '16px', padding: '14px 18px',
              border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,43,75,0.07)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Avatar */}
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: '#1d2b4b', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {note.sender?.avatar_url
                  ? <img src={note.sender.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fdb813', fontWeight: 800, fontSize: '0.85rem' }}>
                      {note.sender?.name?.[0] ?? '?'}
                    </span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#1d2b4b', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {note.title}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                  From <strong style={{ color: '#64748b' }}>{note.sender?.name}</strong>
                  {' · '}
                  {new Date(note.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {fmtDuration(note.duration_seconds) && ` · ${fmtDuration(note.duration_seconds)}`}
                </p>
              </div>

              {/* Play button */}
              <button
                onClick={() => togglePlay(note.id, note.audio_url)}
                style={{
                  width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                  border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s',
                  background: playing === note.id ? '#fdb813' : '#1d2b4b',
                  color:      playing === note.id ? '#1d2b4b' : '#fdb813',
                }}
              >
                <i className={`fas fa-${playing === note.id ? 'pause' : 'play'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal — inline faux overlay */}
      {showModal && (
        <div style={{ marginTop: '16px' }}>
          <SendVoiceNoteModal
            recipient={profileUser}
            onClose={() => setShowModal(false)}
          />
        </div>
      )}
    </section>
  );
}
